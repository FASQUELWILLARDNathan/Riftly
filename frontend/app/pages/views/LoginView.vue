<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const mode = ref<"login" | "register">("login");
const email = ref("");
const username = ref("");
const password = ref("");
const error = ref<string | null>(null);
const loading = ref(false);

const auth = useAuthStore();
const router = useRouter();

async function submit() {
  error.value = null;
  loading.value = true;
  try {
    if (mode.value === "login") {
      await auth.login(email.value, password.value);
    } else {
      await auth.register(email.value, username.value, password.value);
    }
    router.push("/");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="form-wrap">
    <h1 class="font-display">{{ mode === "login" ? "Connexion" : "Créer un compte" }}</h1>

    <form @submit.prevent="submit" class="form">
      <label>
        Email
        <input v-model="email" type="email" required />
      </label>
      <label v-if="mode === 'register'">
        Nom d'utilisateur
        <input v-model="username" type="text" required minlength="3" />
      </label>
      <label>
        Mot de passe
        <input v-model="password" type="password" required minlength="8" />
      </label>

      <p v-if="error" class="error">{{ error }}</p>

      <button type="submit" :disabled="loading">
        {{ loading ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte" }}
      </button>
    </form>

    <button class="switch" @click="mode = mode === 'login' ? 'register' : 'login'">
      {{ mode === "login" ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter" }}
    </button>
  </div>
</template>

<style scoped>
.form-wrap {
  max-width: 380px;
  margin: 40px auto;
}
h1 {
  font-size: 24px;
  margin-bottom: 24px;
  text-align: center;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}
input {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  color: var(--text-primary);
  font-size: 14px;
}
input:focus {
  border-color: var(--accent);
}
button[type="submit"] {
  margin-top: 8px;
  padding: 11px;
  background: var(--accent);
  color: var(--accent-contrast);
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}
button[type="submit"]:hover {
  background: var(--accent-strong);
}
button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: default;
}
.switch {
  display: block;
  margin: 18px auto 0;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
}
.switch:hover {
  color: var(--accent);
}
.error {
  color: var(--color-loss);
  font-size: 13px;
  margin: 0;
}
</style>
