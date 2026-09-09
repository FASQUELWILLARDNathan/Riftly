# Rift Data — Plateforme esport League of Legends

Site web statistique et prédictif, construit autour de la base de données
Postgres déjà utilisée par le bot Discord existant. Le bot **n'est pas
remplacé** : il continue de tourner sur le VPS, indépendamment de ce site,
et partage simplement la même base.

## Architecture

```
lol-esports-platform/
  backend/     API Express + TypeScript + Prisma (lecture/écriture sur ta base existante)
  frontend/    Vue 3 + TypeScript, thème clair/sombre
  docker-compose.yml
```

- **Aucune nouvelle base créée.** `backend/prisma/schema.prisma` mappe les
  tables `matches`, `team`, `players` telles qu'elles existent déjà (mêmes
  noms de colonnes, via `@map`/`@@map`). Trois tables sont ajoutées
  (`web_users`, `web_favorites`, `web_predictions`) pour le site, sans
  toucher aux tables utilisées par le bot.
- **Le temps réel** (matchs terminés en direct) réutilise le même canal
  PostgreSQL `LISTEN/NOTIFY` (`match_update`) que celui déjà déclenché par
  `match_update_trigger` sur la table `matches` — le bot et le site sont
  deux auditeurs indépendants du même signal.
- **La prédiction statistique** (`backend/src/modules/predictions`) est
  une généralisation de la logique auparavant codée en dur autour de
  "Karmine Corp" dans le bot : winrate récent, historique de confrontations
  directes, dynamique de forme (séries en cours), pondérés et expliqués.

## Prérequis

- Node.js 20+
- Accès réseau à ta base Postgres du VPS (celle du bot Discord)
- Docker (optionnel, pour lancer via docker-compose)

## Démarrage — sans Docker

### 1. Backend

```bash
cd backend
cp ../.env.example .env
# édite .env : renseigne DATABASE_URL avec les identifiants de TA base VPS existante
npm install
npx prisma db pull      # vérifie/complète le schéma face à ta vraie base (guild_configs, prediction notamment)
npx prisma generate
npm run dev              # démarre sur http://localhost:4000
```

⚠️ `prisma db pull` ne modifie jamais ta base — il lit sa structure pour
que le schéma Prisma colle exactement à ce qui existe déjà. Vérifie le
diff sur `guild_configs` et `prediction` avant de continuer : ces deux
modèles ont été reconstruits à partir de leur usage dans `bot.py`, pas
d'un `\d` réel.

### 2. Frontend

```bash
cd frontend
cp ../.env.example .env   # seules les variables VITE_* sont utilisées ici
npm install
npm run dev                # démarre sur http://localhost:5173
```

## Démarrage — avec Docker

```bash
cp .env.example .env   # renseigne DATABASE_URL (ta base VPS)
docker compose up --build
```

- Backend : http://localhost:4000
- Frontend : http://localhost:5173

## Ce qui est déjà fonctionnel dans ce squelette

- **Matchs** : liste (live / à venir / terminés), filtrage par équipe/région, page détail avec confrontations directes et forme récente
- **Équipes** : recherche, page détail avec effectif, winrate, historique
- **Joueurs** : recherche, page détail avec matchs récents de son équipe
- **Prédictions statistiques** : génération automatique par match (`GET /api/predictions/:matchId`), affichée avec les raisons + et −
- **Comptes utilisateurs** : inscription, connexion (JWT), profil, favoris, vote de pronostic et stats personnelles de réussite
- **Temps réel** : relais WebSocket branché sur le trigger Postgres existant
- **Thème clair/sombre** avec persistance locale

## Prochaines étapes (suite de la roadmap)

1. Lancer `prisma db pull` en conditions réelles et ajuster `guild_configs` / `prediction` si les colonnes diffèrent de ce qui a été déduit de `bot.py`
2. Page joueur (vue dédiée `PlayerDetailView.vue`, pas encore créée — même structure que `TeamDetailView.vue`)
3. Remplacer le mapping région par string-matching par une vraie table de référence `league`
4. Ajouter un cache (Redis ou en mémoire) sur les endpoints de stats/prédiction si la charge augmente
5. Déploiement : reverse proxy (Caddy/Nginx) devant le VPS, HTTPS, variables d'environnement de prod
