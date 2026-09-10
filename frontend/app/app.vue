<script setup lang="ts">
import { onMounted } from "vue";
import { useRuntimeConfig } from "#imports";
import { configureApi } from "@/api/client";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";

configureApi(useRuntimeConfig().public.apiBase);

const auth = useAuthStore();
const theme = useThemeStore();

onMounted(() => {
  theme.apply();
  auth.checkSession();
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
