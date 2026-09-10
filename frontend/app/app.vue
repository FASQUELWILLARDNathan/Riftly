<script setup lang="ts">
import { useRuntimeConfig } from "#imports";
import { configureApi } from "@/api/client";

configureApi(useRuntimeConfig().public.apiBase);
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
