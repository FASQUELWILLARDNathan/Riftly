import { createServer } from "http";
import { app } from "./app";
import { env } from "./config/env";
import { attachLiveMatchesWebSocket } from "./websocket/liveMatches";

const server = createServer(app);
attachLiveMatchesWebSocket(server);

server.listen(env.port, "127.0.0.1", () => {
  console.log(`🚀 API prête sur http://localhost:${env.port}`);
  console.log(`🔌 WebSocket matchs en direct sur ws://localhost:${env.port}/ws/matches`);
});
