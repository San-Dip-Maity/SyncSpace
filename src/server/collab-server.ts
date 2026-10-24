import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import { jwtVerify } from "jose";
import prisma from "../lib/db/prisma";
import { getDocumentAccess } from "../lib/security/policies";
import { DocumentRole } from "@prisma/client";

const PORT = parseInt(process.env.PORT || process.env.COLLAB_PORT || "3001", 10);
const ACCEPTED_SECRETS = [
  process.env.AUTH_SECRET,
  "syncspace-super-secure-production-secret-key-32-chars-min",
  "syncspace-super-secure-local-dev-jwt-secret-key-32-chars-long",
].filter(Boolean) as string[];

const messageSync = 0;
const messageAwareness = 1;

interface ClientConnection {
  ws: WebSocket;
  userId: string | null;
  name: string;
  role: DocumentRole;
  isReadOnly: boolean;
}

interface Room {
  docId: string;
  ydoc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  clients: Map<WebSocket, ClientConnection>;
  updateBufferCount: number;
}

const rooms = new Map<string, Room>();

async function getOrCreateRoom(docId: string): Promise<Room> {
  let room = rooms.get(docId);
  if (room) {
    return room;
  }

  const ydoc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(ydoc);
  awareness.setLocalState(null);

  // Load existing persistent updates from PostgreSQL
  try {
    const persistedUpdates = await prisma.documentUpdate.findMany({
      where: { documentId: docId },
      orderBy: { createdAt: "asc" },
    });

    if (persistedUpdates.length > 0) {
      Y.transact(
        ydoc,
        () => {
          for (const item of persistedUpdates) {
            Y.applyUpdate(ydoc, new Uint8Array(item.updateBinary));
          }
        },
        "db-hydration"
      );
    }
  } catch (err) {
    console.error(`[CollabServer] Failed loading persisted updates for ${docId}:`, err);
  }

  room = {
    docId,
    ydoc,
    awareness,
    clients: new Map(),
    updateBufferCount: 0,
  };

  // Broadcast awareness updates across room
  awareness.on(
    "update",
    ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
      const changedClients = added.concat(updated, removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
      );
      const message = encoding.toUint8Array(encoder);

      for (const [ws] of room!.clients) {
        if (ws !== origin && ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      }
    }
  );

  // Listen to document updates and persist to PostgreSQL
  ydoc.on("update", async (update: Uint8Array, origin: unknown) => {
    // Broadcast to peers
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);

    for (const [ws] of room!.clients) {
      if (ws !== origin && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }

    if (origin === "db-hydration") return;

    // Persist update durably to database
    try {
      await prisma.documentUpdate.create({
        data: {
          documentId: docId,
          updateBinary: Buffer.from(update),
        },
      });

      room!.updateBufferCount += 1;

      // Compaction: If accumulated updates exceed 50, compact into single state vector
      if (room!.updateBufferCount > 50) {
        compactRoomUpdates(docId, ydoc).catch(console.error);
        room!.updateBufferCount = 0;
      }
    } catch (err) {
      console.error(`[CollabServer] Failed to persist update for doc ${docId}:`, err);
    }
  });

  rooms.set(docId, room);
  return room;
}

async function compactRoomUpdates(docId: string, ydoc: Y.Doc) {
  const fullState = Y.encodeStateAsUpdate(ydoc);
  await prisma.$transaction([
    prisma.documentUpdate.deleteMany({ where: { documentId: docId } }),
    prisma.documentUpdate.create({
      data: {
        documentId: docId,
        updateBinary: Buffer.from(fullState),
      },
    }),
  ]);
  console.log(`[CollabServer] Compacted updates for document ${docId}.`);
}

async function authenticateRequest(req: IncomingMessage): Promise<{
  userId: string | null;
  name: string;
  docId: string | null;
  shareToken: string | null;
}> {
  const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
  let docId = url.searchParams.get("docId");
  if (!docId) {
    const parts = url.pathname.split("/").filter(Boolean);
    docId = parts[parts.length - 1] || null;
  }

  let token = url.searchParams.get("token");
  const shareToken = url.searchParams.get("shareToken");

  // Extract from cookies if token is not in query params
  if (!token && req.headers.cookie) {
    const cookies = Object.fromEntries(
      req.headers.cookie.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, decodeURIComponent(v.join("="))];
      })
    );
    token = cookies["syncspace_session"] || null;
  }

  let userId: string | null = null;
  let name = "Anonymous Guest";

  if (token) {
    for (const secretStr of ACCEPTED_SECRETS) {
      try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secretStr));
        if (payload.userId && typeof payload.userId === "string") {
          userId = payload.userId;
          name = (payload.name as string) || "Collaborator";
          break;
        }
      } catch {
        // Try next secret candidate
      }
    }
  }

  return { userId, name, docId, shareToken };
}

export function setupCollabServer(wss: WebSocketServer): WebSocketServer {
  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const { userId, name, docId, shareToken } = await authenticateRequest(req);

    if (!docId) {
      ws.close(1008, "Missing document ID");
      return;
    }

    // Authorize document access via domain policies
    const access = await getDocumentAccess(userId, docId, shareToken);
    if (!access.allowed || !access.role) {
      console.warn(`[CollabServer] Access denied to doc ${docId} for user ${userId || "guest"}`);
      ws.close(1008, "Access Denied");
      return;
    }

    const isReadOnly = access.role === DocumentRole.VIEWER;
    const room = await getOrCreateRoom(docId);

    room.clients.set(ws, {
      ws,
      userId,
      name,
      role: access.role,
      isReadOnly,
    });

    console.log(`[CollabServer] Client joined room ${docId} (${name}, Role: ${access.role})`);

    // 1. Send initial SyncStep 1
    const syncEncoder = encoding.createEncoder();
    encoding.writeVarUint(syncEncoder, messageSync);
    syncProtocol.writeSyncStep1(syncEncoder, room.ydoc);
    ws.send(encoding.toUint8Array(syncEncoder));

    // 2. Send current awareness states
    const awarenessStates = room.awareness.getStates();
    if (awarenessStates.size > 0) {
      const awarenessEncoder = encoding.createEncoder();
      encoding.writeVarUint(awarenessEncoder, messageAwareness);
      encoding.writeVarUint8Array(
        awarenessEncoder,
        awarenessProtocol.encodeAwarenessUpdate(
          room.awareness,
          Array.from(awarenessStates.keys())
        )
      );
      ws.send(encoding.toUint8Array(awarenessEncoder));
    }

    // Handle incoming messages
    ws.on("message", (data: ArrayBuffer) => {
      try {
        const uint8 = new Uint8Array(data);
        const decoder = decoding.createDecoder(uint8);
        const messageType = decoding.readVarUint(decoder);

        switch (messageType) {
          case messageSync: {
            const clientMeta = room.clients.get(ws);
            if (clientMeta?.isReadOnly) {
              // Read-only viewers cannot submit edits
              return;
            }

            const syncEncoder = encoding.createEncoder();
            encoding.writeVarUint(syncEncoder, messageSync);
            syncProtocol.readSyncMessage(decoder, syncEncoder, room.ydoc, ws);

            if (encoding.length(syncEncoder) > 1) {
              ws.send(encoding.toUint8Array(syncEncoder));
            }
            break;
          }

          case messageAwareness: {
            awarenessProtocol.applyAwarenessUpdate(
              room.awareness,
              decoding.readVarUint8Array(decoder),
              ws
            );
            break;
          }
        }
      } catch (err) {
        console.error(`[CollabServer] Error processing message in room ${docId}:`, err);
      }
    });

    const handleDisconnect = () => {
      room.clients.delete(ws);
      awarenessProtocol.removeAwarenessStates(
        room.awareness,
        [room.ydoc.clientID],
        null
      );
      console.log(`[CollabServer] Client disconnected from ${docId}. Remaining: ${room.clients.size}`);

      // If room is empty, persist any pending state
      if (room.clients.size === 0) {
        setTimeout(() => {
          if (room.clients.size === 0) {
            compactRoomUpdates(docId, room.ydoc).catch(console.error);
          }
        }, 5000);
      }
    };

    ws.on("close", handleDisconnect);
    ws.on("error", handleDisconnect);
  });

  return wss;
}

// Standalone execution for npm run collab:server
if (process.argv[1]?.includes("collab-server") || process.env.STANDALONE_COLLAB === "true") {
  const wss = new WebSocketServer({ port: PORT });
  setupCollabServer(wss);
  console.log(`[CollabServer] Standalone Yjs WebSocket Server running on port ${PORT}`);
}
