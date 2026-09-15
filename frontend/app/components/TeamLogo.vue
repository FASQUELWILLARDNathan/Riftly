<script setup lang="ts">
interface Props {
  name: string;
  logourl?: string | null;
  logodarkurl?: string | null;
  textlesslogourl?: string | null;
  textlesslogodarkurl?: string | null;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), { size: 40 });

const theme = useThemeStore();

// Les variantes sans texte sont préférées pour garder un logo compact.
const src = computed(() => {
  if (theme.theme === "dark") {
    return props.textlesslogodarkurl || props.textlesslogourl || props.logodarkurl || props.logourl;
  }
  return props.textlesslogourl || props.textlesslogodarkurl || props.logourl || props.logodarkurl;
});

// Pas de variante dark disponible pour cette équipe : on ne touche JAMAIS
// aux couleurs du logo (pas d'invert, pas de filtre). On pose simplement
// une pastille de fond clair derrière, comme le ferait n'importe quel site
// esport pro, pour que les éléments noirs du logo restent visibles.
const needsChip = computed(
  () =>
    theme.theme === "dark" &&
    !props.textlesslogodarkurl &&
    !props.logodarkurl &&
    !!(props.textlesslogourl || props.logourl),
);
</script>

<template>
  <div class="team-logo" :class="{ chip: needsChip }" :style="{ width: `${size}px`, height: `${size}px` }">
    <img v-if="src" :src="src" :alt="name" />
    <span v-else class="placeholder font-display">{{ name.charAt(0) }}</span>
  </div>
</template>

<style scoped>
.team-logo {
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.team-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Fond clair neutre et fixe (pas lié aux tokens de thème) : le but est
   justement d'offrir un fond constant et lisible peu importe le thème
   actif, sans jamais recolorer le logo lui-même. */
.team-logo.chip {
  background: #f4f5f3;
  padding: 15%;
  border-radius: var(--radius-sm);
  box-sizing: border-box;
}

.placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: var(--bg-surface-raised);
  color: var(--color-gold);
  font-weight: 700;
  border-radius: var(--radius-sm);
}
</style>