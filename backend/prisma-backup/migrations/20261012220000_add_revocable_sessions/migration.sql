CREATE TABLE "web_sessions" (
    "sid" VARCHAR(64) NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(6),
    CONSTRAINT "web_sessions_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX "web_sessions_user_id_idx" ON "web_sessions"("user_id");
CREATE INDEX "web_sessions_expires_at_idx" ON "web_sessions"("expires_at");

ALTER TABLE "web_sessions" ADD CONSTRAINT "web_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "web_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
