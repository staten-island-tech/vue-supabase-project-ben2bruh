<template>
  <div class="modal-overlay">
    <div class="modal">
      <h2>Choose Eevee's Evolution</h2>
      <p>{{ eevee.name }} has reached the evolution level!</p>

      <div class="evolution-grid">
        <button
          v-for="(evolution, key) in evolutions"
          :key="key"
          class="evolution-option"
          @click="$emit('choose', key)"
        >
          <img :src="evolution.spriteUrl" :alt="evolution.name" />
          <div class="evo-name">{{ evolution.name }}</div>
          <div v-for="type in evolution.types" :key="type" class="type-tag">
            {{ type }}
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { eeveeEvolutions } from '../utils/gen1-pokemon'

interface Props {
  eevee: {
    name: string
    level: number
  }
}

interface Evolutions {
  vaporeon: typeof eeveeEvolutions.vaporeon
  jolteon: typeof eeveeEvolutions.jolteon
  flareon: typeof eeveeEvolutions.flareon
}

defineProps<Props>()

const emit = defineEmits<{
  choose: ['vaporeon' | 'jolteon' | 'flareon']
}>()

const evolutions: Evolutions = {
  vaporeon: eeveeEvolutions.vaporeon,
  jolteon: eeveeEvolutions.jolteon,
  flareon: eeveeEvolutions.flareon,
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #2a1a0e;
  border: 4px solid #c0392b;
  border-radius: 8px;
  padding: 20px;
  max-width: 500px;
  color: #f0e6c8;
  font-family: 'Fredoka One', cursive;
}

.modal h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  text-align: center;
}

.modal p {
  margin: 0 0 16px 0;
  text-align: center;
  opacity: 0.9;
}

.evolution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.evolution-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: #1a1a2e;
  border: 2px solid #666;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #f0e6c8;
  font-family: inherit;
}

.evolution-option:hover {
  border-color: #c0392b;
  background: #2a1a3e;
  transform: translateY(-2px);
}

.evolution-option img {
  width: 80px;
  height: 80px;
  image-rendering: pixelated;
}

.evo-name {
  font-weight: bold;
  font-size: 12px;
  text-align: center;
}

.type-tag {
  font-size: 9px;
  padding: 1px 4px;
  background: #c0392b;
  border-radius: 2px;
  text-transform: uppercase;
}
</style>
