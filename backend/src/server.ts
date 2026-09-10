import { createServer } from "http";
import { app } from "./app";
import { env } from "./config/env";
import { attachLiveMatchesWebSocket } from "./websocket/liveMatches";

const server = createServer(app);
attachLiveMatchesWebSocket(server);

server.listen(env.port, "0.0.0.0", () => {
  console.log(`🚀 API prête sur http://0.0.0.0:${env.port}`);
  console.log(`🔌 WebSocket matchs en direct sur ws://0.0.0.0:${env.port}/ws/matches`);
});
