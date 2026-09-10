<script setup lang="ts">
import { onMounted } from "vue";
import { useRuntimeConfig } from "#imports";
import { configureApi } from "@/api/client";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";

configureApi(useRuntimeConfig().public.apiBase);

const auth = useAuthStore();
const theme = useThemeStore();

useHead({
  htmlAttrs: { lang: "fr" },
  meta: [
    { name: "theme-color", content: "#0b0e14" },
    { property: "og:site_name", content: "RiftData" },
    { property: "og:locale", content: "fr_FR" },
  ],
});

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
