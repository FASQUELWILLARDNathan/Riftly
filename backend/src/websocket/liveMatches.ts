import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { Client } from "pg";
import { env } from "../config/env";

/**
 * Relais temps réel pour le site : on écoute le MÊME canal PostgreSQL
 * (`match_update`) que le bot Discord écoute déjà via LISTEN/NOTIFY
 * (voir `match_update_trigger` sur la table `matches`).
 *
 * Aucun changement côté base de données : le bot et le site sont deux
 * consommateurs indépendants de la même notification Postgres.
 */
export function attachLiveMatchesWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/matches" });

  const clients = new Set<WebSocket>();

  wss.on("connection", (socket) => {
    clients.add(socket);
    socket.on("close", () => clients.delete(socket));
  });

  function broadcast(payload: unknown) {
    const message = JSON.stringify(payload);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  async function startListener() {
    const pgClient = new Client({ connectionString: env.databaseUrl });

    try {
      await pgClient.connect();
      await pgClient.query("LISTEN match_update");
      console.log("🔔 WebSocket relay connecté au canal Postgres match_update");

      pgClient.on("notification", (msg) => {
        if (!msg.payload) return;
        try {
          const data = JSON.parse(msg.payload);
          broadcast({ type: "match_update", data });
        } catch {}
      });

      pgClient.on("error", () => {
        setTimeout(startListener, 10_000);
      });
    } catch (err) {
      setTimeout(startListener, 10_000);
    }
  }

  startListener();

  return wss;
}
