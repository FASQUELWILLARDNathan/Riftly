import { createServer } from "http";
import { app } from "./app";
import { env } from "./config/env";
import { attachLiveMatchesWebSocket } from "./websocket/liveMatches";
import { purgeExpiredSessions } from "./modules/auth/auth.service";

const server = createServer(app);
attachLiveMatchesWebSocket(server);

server.listen(env.port, env.host, () => {
  console.log(`🚀 API prête sur ${env.apiUrl}`);
  console.log(`🔌 WebSocket matchs en direct sur ${env.wsUrl}`);
});

const sessionCleanup = setInterval(() => {
  purgeExpiredSessions().catch(() => {
    console.error("Impossible de nettoyer les sessions expirées");
  });
}, 60 * 60 * 1000);
sessionCleanup.unref();
