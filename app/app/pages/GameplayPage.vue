<template>
  <div class="gameplay-container">
    <div v-if="!runStore.activeRun" class="loading">
      <p>Loading run...</p>
    </div>

    <div v-else class="game-layout">
      <!-- Top bar: floor, money, team info -->
      <div class="top-bar">
        <div class="floor-display">Floor {{ runStore.currentFloor }}</div>
        <div class="money-display">💰 {{ runStore.money }}</div>
        <div class="team-status">
          <span
            v-for="(p, idx) in runStore.team"
            :key="idx"
            class="team-indicator"
            :class="p.status_condition"
          >
            {{ p.name[0] }}
          </span>
        </div>
      </div>

      <!-- Main game area -->
      <div class="main-area">
        <!-- If in battle -->
        <div v-if="runStore.inBattle" class="battle-area">
          <BattleView
            :player="activePlayerPokemon"
            :team="runStore.team"
            :run-id="runStore.activeRun.id"
            :floor-number="runStore.currentFloor"
            @end="handleBattleEnd"
            @cancel="runStore.setInBattle(false)"
          />
        </div>

        <!-- Encounter view (pre-battle) -->
        <div
          v-else-if="wildEncounter && !runStore.inBattle"
          class="encounter-view"
        >
          <div class="encounter-scene">
            <div class="encounter-title">
              Wild {{ wildEncounter.name }} appeared!
            </div>

            <div class="encounter-pokemon">
              <img :src="wildEncounter.sprite" :alt="wildEncounter.name" />
              <div class="encounter-stats">
                <div>{{ wildEncounter.name }}</div>
                <div>Lv {{ wildEncounter.level }}</div>
                <div class="hp-bar">
                  <div class="hp-fill" :style="{ width: '100%' }"></div>
                </div>
              </div>
            </div>

            <div class="action-buttons">
              <button
                class="action-btn primary"
                @click="startBattle"
                :disabled="!activePlayerPokemon"
              >
                Fight
              </button>
              <button class="action-btn danger" @click="fleeEncounter">
                Flee
              </button>
            </div>
          </div>

          <div class="team-side">
            <TeamView :team="runStore.team" @select="selectTeamPokemon" />
          </div>
        </div>

        <!-- Floor cleared / no encounter view -->
        <div v-else class="floor-view">
          <div class="floor-message">
            <p v-if="!hasLoadedEncounter">Loading next encounter...</p>
            <p v-else>No encounter available. Explore the floor.</p>
          </div>

          <div class="action-buttons">
            <button
              class="action-btn primary"
              @click="generateEncounter"
              :disabled="!runStore.hasActivePokemon"
            >
              Start Battle
            </button>
            <button class="action-btn danger" @click="endRun">End Run</button>
          </div>

          <div class="team-side">
            <TeamView :team="runStore.team" />
          </div>
        </div>
      </div>

      <!-- Eevee evolution chooser -->
      <EeveeEvolutionChooser
        v-if="showEeveeChoice"
        :eevee="{ name: 'Eevee', level: activePlayerPokemon?.level ?? 1 }"
        @choose="handleEeveeEvolution"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useRunStore } from "../stores/runStore";
import {
  checkEvolution,
  evolveToSpecies,
  evolveEevee,
} from "../composables/useEvolution";
import {
  calculateXpGain,
  applyXp,
  updatePokemonStats,
} from "../composables/useXP";
import BattleView from "../components/BattleView.vue";
import TeamView from "../components/TeamView.vue";
import EeveeEvolutionChooser from "../components/EeveeEvolutionChooser.vue";

const router = useRouter();
const route = useRoute();
const supabase = useSupabaseClient();
const runStore = useRunStore();

const wildEncounter = ref<any | null>(null);
const hasLoadedEncounter = ref(false);
const showEeveeChoice = ref(false);
const pendingEvolutionPokemon = ref<any | null>(null);
const selectedTeamIndex = ref(0);

const activePlayerPokemon = computed(() => {
  const active = runStore.activeTeamPokemon;
  return active.length > 0 ? active[0] : null;
});

onMounted(async () => {
  try {
    const runId = route.query.run_id as string;
    if (!runId) {
      router.push("/");
      return;
    }

    // Load run and team
    const { data: runData } = await supabase
      .from("runs")
      .select("*")
      .eq("id", runId)
      .single();

    if (!runData) {
      router.push("/");
      return;
    }

    runStore.setRun(runData);

    // Load team
    const { data: teamData } = await supabase
      .from("player_pokemon")
      .select("*")
      .eq("run_id", runId)
      .order("team_slot", { ascending: true });

    if (teamData) {
      runStore.setTeam(teamData as any);
    }

    if (runStore.hasActivePokemon) {
      runStore.setInBattle(true);
      hasLoadedEncounter.value = true;
    }
  } catch (err) {
    console.error("Failed to load run:", err);
    router.push("/");
  }
});

async function generateEncounter() {
  if (!runStore.hasActivePokemon) return;
  runStore.setInBattle(true);
  hasLoadedEncounter.value = true;
}

function startBattle() {
  if (!activePlayerPokemon.value) return;
  runStore.setInBattle(true);
}

function fleeEncounter() {
  wildEncounter.value = null;
  hasLoadedEncounter.value = false;
}

async function handleBattleEnd(result: any) {
  if (!result?.continued) {
    runStore.setInBattle(false);
  }

  const resultPlayer = getResultTeamPokemon(result?.player);

  if (result?.result === "win" && resultPlayer) {
    const xpGain = calculateXpGain(
      resultPlayer.level,
      result.enemy?.level ?? 1,
    );

    // Update player Pokémon with XP
    applyXp(resultPlayer, xpGain);

    // Persist to database
    try {
      await supabase
        .from("player_pokemon")
        .update({
          level: resultPlayer.level,
          experience: resultPlayer.experience,
          max_hp: resultPlayer.max_hp,
          current_hp: resultPlayer.current_hp,
        })
        .eq("id", resultPlayer.id);
    } catch (err) {
      console.error("Failed to persist Pokémon state:", err);
    }

    // Check for evolution
    const evoCheck = checkEvolution(resultPlayer, resultPlayer.species_id);
    if (evoCheck.canEvolve) {
      if (evoCheck.eeveeChoice) {
        pendingEvolutionPokemon.value = resultPlayer;
        showEeveeChoice.value = true;
      } else if (evoCheck.evolvesInto) {
        evolveToSpecies(resultPlayer, evoCheck.evolvesInto);
        await supabase
          .from("player_pokemon")
          .update({ species_id: evoCheck.evolvesInto })
          .eq("id", resultPlayer.id);
      }
    }

    if (!result?.continued) {
      wildEncounter.value = null;
      hasLoadedEncounter.value = false;
    }
  } else if (result?.result === "loss") {
    // Mark Pokémon as fainted
    if (resultPlayer) {
      resultPlayer.status_condition = "fainted";
      resultPlayer.current_hp = 0;

      try {
        await supabase
          .from("player_pokemon")
          .update({
            status_condition: "fainted",
            current_hp: 0,
          })
          .eq("id", resultPlayer.id);
      } catch (err) {
        console.error("Failed to mark Pokémon as fainted:", err);
      }
    }

    // Check if team is all fainted
    if (!runStore.hasActivePokemon) {
      endRun();
    } else if (!result?.continued) {
      wildEncounter.value = null;
      hasLoadedEncounter.value = false;
    }
  }
}

function getResultTeamPokemon(resultPlayer: any) {
  if (!resultPlayer) return activePlayerPokemon.value;
  return (
    runStore.team.find((member) => member.id === resultPlayer.id) ??
    activePlayerPokemon.value
  );
}

async function handleEeveeEvolution(
  evolutionName: "vaporeon" | "jolteon" | "flareon",
) {
  const pokemonToEvolve =
    pendingEvolutionPokemon.value ?? activePlayerPokemon.value;

  if (pokemonToEvolve) {
    evolveEevee(pokemonToEvolve, evolutionName);

    // Get evolved species ID
    const evolutionIds = { vaporeon: 134, jolteon: 135, flareon: 136 };
    const newSpeciesId = evolutionIds[evolutionName];

    try {
      await supabase
        .from("player_pokemon")
        .update({ species_id: newSpeciesId })
        .eq("id", pokemonToEvolve.id);
    } catch (err) {
      console.error("Failed to evolve Eevee:", err);
    }
  }

  showEeveeChoice.value = false;
  pendingEvolutionPokemon.value = null;
}

function selectTeamPokemon(index: number) {
  selectedTeamIndex.value = index;
}

async function endRun() {
  if (runStore.activeRun) {
    try {
      await supabase
        .from("runs")
        .update({ status: "completed", current_floor: runStore.currentFloor })
        .eq("id", runStore.activeRun.id);
    } catch (err) {
      console.error("Failed to end run:", err);
    }
  }

  runStore.clearRun();
  router.push("/");
}
</script>

<style scoped>
.gameplay-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #3a9e4f;
  font-family: "Fredoka One", cursive;
  color: #f0e6c8;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 18px;
}

.game-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1a1a2e;
  border-bottom: 3px solid #c0392b;
  padding: 12px 20px;
  gap: 20px;
}

.floor-display,
.money-display {
  font-size: 16px;
  font-weight: bold;
}

.team-status {
  display: flex;
  gap: 6px;
}

.team-indicator {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2ecc71;
  border-radius: 50%;
  font-size: 10px;
  font-weight: bold;
  color: #000;
}

.team-indicator.fainted {
  background: #e74c3c;
  color: #fff;
}

.main-area {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
}

.battle-area {
  flex: 1;
}

.encounter-view,
.floor-view {
  flex: 1;
  display: flex;
  gap: 20px;
}

.encounter-scene,
.floor-message {
  background: #2a1a0e;
  border: 3px solid #c0392b;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.encounter-title {
  font-size: 20px;
  font-weight: bold;
  text-shadow: 2px 2px 0 #7b1a11;
}

.encounter-pokemon {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #1a1a2e;
  padding: 16px;
  border-radius: 6px;
}

.encounter-pokemon img {
  width: 128px;
  height: 128px;
  image-rendering: pixelated;
}

.encounter-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hp-bar {
  width: 100px;
  height: 16px;
  background: #000;
  border: 2px solid #c0392b;
  border-radius: 2px;
}

.hp-fill {
  height: 100%;
  background: #2ecc71;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  padding: 12px 20px;
  background: #2a1a0e;
  color: #f0e6c8;
  border: 2px solid #c0392b;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #3a2a1e;
  border-color: #e74c3c;
  transform: translateY(-2px);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.primary {
  border-color: #2ecc71;
}

.action-btn.primary:hover:not(:disabled) {
  border-color: #27ae60;
  background: #1a3a1e;
}

.action-btn.danger {
  border-color: #e74c3c;
}

.action-btn.danger:hover:not(:disabled) {
  border-color: #c0392b;
  background: #3a1a1a;
}

.team-side {
  flex: 0 0 300px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 8px;
}

.floor-message {
  text-align: center;
  flex: 1;
}
</style>
