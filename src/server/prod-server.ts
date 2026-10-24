import { createServer } from "http";
import next from "next";
import { WebSocketServer } from "ws";
import { setupCollabServer } from "./collab-server";

const dev = false;
const port = parseInt(process.env.PORT || process.env.COLLAB_PORT || "10000", 10);
const hostname = "0.0.0.0";

const app = next({ dev, hostname, port, dir: process.cwd() });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const wss = new WebSocketServer({ noServer: true });
    setupCollabServer(wss);

    const server = createServer((req, res) => {
      // Fast health probe for Render / Uptime monitors
      if (req.url === "/health" || req.url === "/api/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "healthy",
            service: "syncspace",
            mode: "unified",
            timestamp: new Date().toISOString(),
          })
        );
        return;
      }
      handle(req, res);
    });

    server.on("upgrade", (req, socket, head) => {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    });

    server.listen(port, hostname, () => {
      console.log(
        `[SyncSpace] Unified Production Server (Next.js App + Yjs WebSocket Hub) running on http://${hostname}:${port}`
      );
    });
  })
  .catch((err) => {
    console.error("[SyncSpace] Failed starting unified production server:", err);
    process.exit(1);
  });
