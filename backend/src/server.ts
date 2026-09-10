import { createServer } from "http";
import { app } from "./app";
import { env } from "./config/env";
import { attachLiveMatchesWebSocket } from "./websocket/liveMatches";

const server = createServer(app);
attachLiveMatchesWebSocket(server);

server.listen(env.port, env.host, () => {
  console.log(`🚀 API prête sur ${env.apiUrl}`);
  console.log(`🔌 WebSocket matchs en direct sur ${env.wsUrl}`);
});
