-- CreateTable
CREATE TABLE "guild_configs" (
    "guild_id" BIGINT NOT NULL,
    "notifications_channel_id" BIGINT NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "watched_team" VARCHAR(255),
    "match_update_notifications" BOOLEAN DEFAULT true,

    CONSTRAINT "guild_configs_pkey" PRIMARY KEY ("guild_id")
);

-- CreateTable
CREATE TABLE "matches" (
    "pageid" BIGINT NOT NULL,
    "pagename" TEXT,
    "namespace" INTEGER,
    "objectname" TEXT NOT NULL,
    "match2id" TEXT,
    "match2bracketid" TEXT,
    "status" TEXT,
    "winner" TEXT,
    "walkover" TEXT,
    "resulttype" TEXT,
    "finished" BOOLEAN,
    "mode" TEXT,
    "type" TEXT,
    "section" TEXT,
    "game" TEXT,
    "patch" TEXT,
    "links" JSONB,
    "bestof" INTEGER,
    "date" TIMESTAMP(6),
    "dateexact" BOOLEAN,
    "stream" JSONB,
    "vod" TEXT,
    "tournament" TEXT,
    "parent" TEXT,
    "tickername" TEXT,
    "shortname" TEXT,
    "series" TEXT,
    "icon" TEXT,
    "iconurl" TEXT,
    "icondark" TEXT,
    "icondarkurl" TEXT,
    "liquipediatier" TEXT,
    "liquipediatiertype" TEXT,
    "publishertier" TEXT,
    "extradata" JSONB,
    "match2bracketdata" JSONB,
    "match2games" JSONB,
    "match2opponents" JSONB,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("objectname")
);

-- CreateTable
CREATE TABLE "players" (
    "pageid" BIGINT NOT NULL,
    "pagename" TEXT NOT NULL,
    "namespace" INTEGER NOT NULL,
    "objectname" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "alternateid" TEXT,
    "name" TEXT NOT NULL,
    "localizedname" TEXT,
    "type" TEXT,
    "nationality" TEXT,
    "nationality2" TEXT,
    "nationality3" TEXT,
    "region" TEXT,
    "birthdate" DATE,
    "deathdate" DATE,
    "teampagename" TEXT,
    "teamtemplate" TEXT,
    "links" JSONB,
    "status" TEXT,
    "earnings" DECIMAL,
    "earningsbyyear" JSONB,
    "extradata" JSONB,
    "game" VARCHAR(50),
    "pageidteam" INTEGER,

    CONSTRAINT "players_pkey" PRIMARY KEY ("pageid")
);

-- CreateTable
CREATE TABLE "prediction" (
    "user_id" BIGINT NOT NULL,
    "match_id" TEXT NOT NULL,
    "choix" INTEGER NOT NULL,
    "jeu" TEXT NOT NULL,
    "username" TEXT,
    "vote_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prediction_pkey" PRIMARY KEY ("user_id","match_id")
);

-- CreateTable
CREATE TABLE "team" (
    "pageid" INTEGER NOT NULL,
    "pagename" VARCHAR(255) NOT NULL,
    "namespace" INTEGER,
    "objectname" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "locations" JSON,
    "region" VARCHAR(100),
    "logo" VARCHAR(255),
    "logourl" VARCHAR(255),
    "logodark" VARCHAR(255),
    "logodarkurl" VARCHAR(255),
    "textlesslogourl" VARCHAR(255),
    "textlesslogodarkurl" VARCHAR(255),
    "status" VARCHAR(50),
    "createdate" DATE,
    "disbanddate" DATE,
    "earnings" DECIMAL(15,2),
    "earningsbyyear" JSON,
    "template" VARCHAR(255),
    "links" JSON,
    "extradata" JSON,

    CONSTRAINT "team_pkey" PRIMARY KEY ("pageid")
);

-- CreateTable
CREATE TABLE "web_favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "team_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "web_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_predictions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "match_objectname" TEXT NOT NULL,
    "predicted_winner" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "web_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "web_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unique_objectname" ON "matches"("objectname" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "web_favorites_user_id_team_id_key" ON "web_favorites"("user_id" ASC, "team_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "web_predictions_user_id_match_objectname_key" ON "web_predictions"("user_id" ASC, "match_objectname" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "web_users_email_key" ON "web_users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "web_users_username_key" ON "web_users"("username" ASC);

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "fk_pageidteam" FOREIGN KEY ("pageidteam") REFERENCES "team"("pageid") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "web_favorites" ADD CONSTRAINT "web_favorites_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("pageid") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "web_favorites" ADD CONSTRAINT "web_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "web_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "web_predictions" ADD CONSTRAINT "web_predictions_match_objectname_fkey" FOREIGN KEY ("match_objectname") REFERENCES "matches"("objectname") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "web_predictions" ADD CONSTRAINT "web_predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "web_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
