import EmbeddedPostgres from "embedded-postgres";
import net from "net";
import path from "path";
import fs from "fs";

const PORT = 54329;
const DB_USER = "syncspace_user";
const DB_PASS = "syncspace_password";
const DB_NAME = "syncspace_db";
const DB_DIR = path.resolve(process.cwd(), ".local-db");

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once("listening", () => {
      server.close();
      resolve(false);
    });
    server.listen(port, "127.0.0.1");
  });
}

async function startDb() {
  const inUse = await isPortInUse(PORT);
  if (inUse) {
    console.log(`[db-service] PostgreSQL is already running and accessible on port ${PORT}.`);
    return;
  }

  console.log(`[db-service] Initializing embedded PostgreSQL on port ${PORT}...`);
  const pg = new EmbeddedPostgres({
    port: PORT,
    databaseDir: DB_DIR,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    persistent: true,
  });

  if (!fs.existsSync(DB_DIR)) {
    console.log("[db-service] First-time setup: initializing database cluster...");
    await pg.initialise();
  }

  await pg.start();
  console.log(`[db-service] Embedded PostgreSQL started successfully on localhost:${PORT}.`);

  const cleanup = async () => {
    console.log("[db-service] Shutting down embedded PostgreSQL cleanly...");
    try {
      await pg.stop();
      console.log("[db-service] Embedded PostgreSQL stopped.");
    } catch {
      // ignore
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);

  // Keep process alive if run directly
  if (process.argv[2] === "daemon" || process.argv[2] === "start") {
    console.log("[db-service] PostgreSQL daemon running. Press Ctrl+C to stop.");
    await new Promise(() => {});
  }
}

startDb().catch((err) => {
  console.error("[db-service] Database error:", err);
  process.exit(1);
});
