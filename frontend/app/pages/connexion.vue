<script setup lang="ts">
import { computed, ref } from "vue";
import { ApiError } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
useSeoMeta({
  title: "Connexion - RiftData",
  description: "Connecte-toi a ton espace RiftData pour retrouver tes pronostics et ton profil.",
  robots: "noindex, nofollow",
});
const mode = ref<"login" | "register">(route.query.mode === "register" ? "register" : "login");
const email = ref("");
const username = ref("");
const password = ref("");
const error = ref<string | null>(null);
const loading = ref(false);

const title = computed(() => (mode.value === "login" ? "Connexion" : "Créer un compte"));
const submitLabel = computed(() => (mode.value === "login" ? "Se connecter" : "Créer mon compte"));

function switchMode(nextMode: "login" | "register") {
  mode.value = nextMode;
  error.value = null;
  router.replace({ query: nextMode === "register" ? { mode: "register" } : {} });
}

async function submit() {
  error.value = null;
  loading.value = true;

  try {
    if (mode.value === "login") {
      await auth.login(email.value, password.value);
    } else {
      await auth.register(email.value, username.value, password.value);
    }
    await router.push("/");
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401) {
      error.value = "Email ou mot de passe incorrect.";
    } else if (cause instanceof ApiError && cause.status === 409) {
      error.value = "Cet email ou ce nom d'utilisateur existe déjà.";
    } else {
      error.value = "Impossible de terminer l'authentification pour le moment.";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="auth-intro">
      <div class="intro-mark" aria-hidden="true"><span>R</span></div>
      <p class="eyebrow font-mono">RIFT<span>DATA</span> / ESPORT INTELLIGENCE</p>
      <h1 class="font-display">Reviens au coeur de la compétition<span class="accent">.</span></h1>
      <p class="intro-copy">Retrouve tes pronostics, tes statistiques et ton profil au même endroit.</p>
      <div class="intro-rule" aria-hidden="true"><span></span></div>
      <p class="intro-note font-mono">DONNÉES · FORME · PRÉDICTIONS</p>
    </div>

    <div class="auth-panel">
      <div class="panel-head">
        <span class="panel-kicker font-mono">RIFT<span>DATA</span></span>
        <span class="status-dot">ESPACE MEMBRE</span>
      </div>
      <div class="mode-switch" role="tablist" aria-label="Type d'authentification">
        <button type="button" :class="{ active: mode === 'login' }" @click="switchMode('login')">Connexion</button>
        <button type="button" :class="{ active: mode === 'register' }" @click="switchMode('register')">Inscription</button>
      </div>

      <h2 class="font-display">{{ title }}</h2>
      <form class="form" @submit.prevent="submit">
        <label>
          Email
          <input v-model="email" type="email" autocomplete="email" required />
        </label>
        <label v-if="mode === 'register'">
          Nom d'utilisateur
          <input v-model="username" type="text" autocomplete="username" minlength="3" maxlength="32" required />
        </label>
        <label>
          Mot de passe
          <input v-model="password" type="password" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" minlength="8" required />
        </label>

        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button class="submit" type="submit" :disabled="loading">
          {{ loading ? "Connexion..." : submitLabel }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.auth-page { display: grid; grid-template-columns: minmax(0, 1fr) minmax(340px, 410px); gap: clamp(48px, 8vw, 112px); align-items: center; max-width: 1000px; min-height: 640px; margin: 0 auto; }
.auth-intro { max-width: 500px; animation: rise-in 500ms ease both; }
.intro-mark { display: grid; place-items: center; width: 42px; height: 42px; margin-bottom: 28px; border: 1px solid var(--color-gold); color: var(--color-gold); font-family: var(--font-display); font-size: 25px; font-weight: 700; transform: skew(-8deg); }
.intro-mark span { transform: skew(8deg); }
.eyebrow { color: var(--color-gold); font-size: 11px; letter-spacing: 0.14em; }
.eyebrow span, .panel-kicker span { color: var(--accent); }
.auth-intro h1 { max-width: 10ch; margin: 18px 0; font-size: clamp(42px, 5vw, 66px); line-height: 0.94; }
.accent { color: var(--accent); }
.intro-copy { max-width: 38ch; margin: 0; color: var(--text-secondary); line-height: 1.65; }
.intro-rule { width: 150px; height: 1px; margin: 34px 0 14px; background: var(--border-strong); }
.intro-rule span { display: block; width: 48px; height: 1px; background: var(--color-gold); }
.intro-note { margin: 0; color: var(--text-tertiary); font-size: 10px; letter-spacing: 0.13em; }
.auth-panel { position: relative; padding: 30px; overflow: hidden; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); box-shadow: var(--shadow-card); animation: rise-in 500ms 80ms ease both; }
.auth-panel::before { content: ""; position: absolute; inset: 0 0 auto; height: 2px; background: linear-gradient(90deg, var(--color-gold), var(--accent)); }
.panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 26px; }
.panel-kicker { color: var(--text-primary); font-size: 13px; font-weight: 600; letter-spacing: 0.08em; }
.status-dot { display: inline-flex; align-items: center; gap: 6px; color: var(--text-tertiary); font-size: 9px; letter-spacing: 0.08em; }
.status-dot::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent); }
.mode-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 30px; padding: 4px; background: var(--bg-base); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); }
.mode-switch button { padding: 9px; border: 0; border-radius: 4px; background: transparent; color: var(--text-tertiary); cursor: pointer; font: inherit; font-size: 12px; font-weight: 600; }
.mode-switch button.active { background: var(--bg-hover); color: var(--text-primary); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18); }
.auth-panel h2 { margin: 0 0 22px; font-size: 30px; line-height: 1; }
.form { display: flex; flex-direction: column; gap: 17px; }
.form label { display: flex; flex-direction: column; gap: 8px; color: var(--text-secondary); font-size: 12px; font-weight: 500; }
.form input { width: 100%; padding: 12px 13px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: var(--bg-base); color: var(--text-primary); font: inherit; transition: border-color var(--transition-fast), box-shadow var(--transition-fast); }
.form input:hover { border-color: var(--border-strong); }
.form input:focus { border-color: var(--accent); outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent); }
.submit { margin-top: 5px; padding: 12px; border: 0; border-radius: var(--radius-sm); background: var(--accent); color: var(--accent-contrast); font-weight: 700; cursor: pointer; transition: background var(--transition-fast), transform var(--transition-fast); }
.submit:hover { background: var(--accent-strong); transform: translateY(-1px); }
.submit:disabled { cursor: wait; opacity: 0.65; transform: none; }
.error { margin: 0; padding: 10px 12px; border-left: 2px solid var(--color-loss); background: color-mix(in srgb, var(--color-loss) 8%, transparent); color: var(--color-loss); font-size: 13px; }
@keyframes rise-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 760px) { .auth-page { grid-template-columns: 1fr; gap: 34px; min-height: auto; padding: 34px 0 52px; } .auth-intro h1 { max-width: 12ch; font-size: 46px; } .auth-panel { padding: 24px; } }
</style>
