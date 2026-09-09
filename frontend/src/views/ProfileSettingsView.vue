<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();

// Formulaire profil
const username = ref("");
const email = ref("");
const profileLoading = ref(false);
const profileMessage = ref<string | null>(null);
const profileError = ref<string | null>(null);

// Formulaire mot de passe
const currentPassword = ref("");
const newPassword = ref("");
const passwordLoading = ref(false);
const passwordMessage = ref<string | null>(null);
const passwordError = ref<string | null>(null);

onMounted(async () => {
  if (!auth.isAuthenticated) {
    router.push("/connexion");
    return;
  }
  try {
    const { data } = await api.users.me();
    username.value = data.username;
    email.value = data.email;
  } catch {
    // silencieux, les champs resteront vides si l'appel échoue
  }
});

async function submitProfile() {
  profileLoading.value = true;
  profileMessage.value = null;
  profileError.value = null;
  try {
    const { data } = await api.users.updateProfile({ username: username.value, email: email.value });
    auth.setUser({ id: data.id, username: data.username, email: data.email });
    profileMessage.value = "Profil mis à jour.";
  } catch (e: any) {
    profileError.value = e.message;
  } finally {
    profileLoading.value = false;
  }
}

async function submitPassword() {
  passwordLoading.value = true;
  passwordMessage.value = null;
  passwordError.value = null;
  try {
    await api.users.changePassword(currentPassword.value, newPassword.value);
    passwordMessage.value = "Mot de passe mis à jour.";
    currentPassword.value = "";
    newPassword.value = "";
  } catch (e: any) {
    passwordError.value = e.message;
  } finally {
    passwordLoading.value = false;
  }
}
</script>

<template>
  <h1 class="font-display">Gestion du profil</h1>

  <section class="card">
    <h2 class="font-display">Informations du compte</h2>
    <form @submit.prevent="submitProfile" class="form">
      <label>
        Nom d'utilisateur
        <input v-model="username" type="text" required minlength="3" maxlength="32" />
      </label>
      <label>
        Email
        <input v-model="email" type="email" required />
      </label>

      <p v-if="profileError" class="error">{{ profileError }}</p>
      <p v-if="profileMessage" class="success">{{ profileMessage }}</p>

      <button type="submit" :disabled="profileLoading">
        {{ profileLoading ? "…" : "Enregistrer" }}
      </button>
    </form>
  </section>

  <section class="card">
    <h2 class="font-display">Changer le mot de passe</h2>
    <form @submit.prevent="submitPassword" class="form">
      <label>
        Mot de passe actuel
        <input v-model="currentPassword" type="password" required />
      </label>
      <label>
        Nouveau mot de passe
        <input v-model="newPassword" type="password" required minlength="8" />
      </label>

      <p v-if="passwordError" class="error">{{ passwordError }}</p>
      <p v-if="passwordMessage" class="success">{{ passwordMessage }}</p>

      <button type="submit" :disabled="passwordLoading">
        {{ passwordLoading ? "…" : "Mettre à jour le mot de passe" }}
      </button>
    </form>
  </section>
</template>

<style scoped>
h1 {
  font-size: 24px;
  margin: 0 0 24px;
}

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 24px;
  margin-bottom: 20px;
  max-width: 440px;
}
.card h2 {
  font-size: 16px;
  margin: 0 0 18px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}
input {
  background: var(--bg-surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 9px 12px;
  color: var(--text-primary);
  font-size: 14px;
}
input:focus {
  border-color: var(--accent);
}

button[type="submit"] {
  margin-top: 4px;
  padding: 10px;
  background: var(--accent);
  color: var(--accent-contrast);
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
  align-self: flex-start;
  padding-left: 20px;
  padding-right: 20px;
}
button[type="submit"]:hover {
  background: var(--accent-strong);
}
button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: default;
}

.error {
  color: var(--color-loss);
  font-size: 13px;
  margin: 0;
}
.success {
  color: var(--color-win);
  font-size: 13px;
  margin: 0;
}
</style>
