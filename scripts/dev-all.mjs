import { spawn } from "child_process";

console.log("[SyncSpace] Starting Next.js Web App and Realtime Collaboration Server...");

// Start Yjs WebSocket Collaboration Server
const collabProcess = spawn("npx", ["tsx", "src/server/collab-server.ts"], {
  stdio: "inherit",
  shell: true,
});

// Start Next.js Development Server
const nextProcess = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  shell: true,
});

function cleanup() {
  collabProcess.kill();
  nextProcess.kill();
  process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
