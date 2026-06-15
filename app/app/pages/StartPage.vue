<template>
  <div class="scene">
    <div class="sky">
      <div class="sky-lines"></div>

      <div class="logo">
        <span class="logo-text">PokéRoGue</span>
      </div>
    </div>

    <div class="grass">
      <div class="grass-lines"></div>

      <div class="panel">
        <div class="left-column">
          <div v-if="confirmedPokemon" class="preview-content">
            <img
              :src="confirmedPokemon.sprite_url"
              class="preview-sprite"
            />

            <h2 class="poke-name">
              {{ confirmedPokemon.name }}
            </h2>

            <div class="stats-box">
              <div class="stat-row">
                <span>HP</span>
                <span>{{ confirmedPokemon.base_stats.hp }}</span>
              </div>

              <div class="stat-row">
                <span>ATK</span>
                <span>{{ confirmedPokemon.base_stats.attack }}</span>
              </div>

              <div class="stat-row">
                <span>DEF</span>
                <span>{{ confirmedPokemon.base_stats.defense }}</span>
              </div>

              <div class="stat-row">
                <span>SPATK</span>
                <span>{{ confirmedPokemon.base_stats.sp_atk }}</span>
              </div>

              <div class="stat-row">
                <span>SPDEF</span>
                <span>{{ confirmedPokemon.base_stats.sp_def }}</span>
              </div>

              <div class="stat-row">
                <span>SPEED</span>
                <span>{{ confirmedPokemon.base_stats.speed }}</span>
              </div>
            </div>
          </div>

          <div v-else class="preview-placeholder">
            Confirm a starter to preview its stats
          </div>
        </div>

        <div class="right-column">
          <div class="starter-grid">
            <button
                v-for="p in starters"
                :key="p.api_id"
                type="button"
                class="starter-card"
                :class="{
                    selected: selectedPokemon?.api_id === p.api_id,
                    confirmed: confirmedPokemon?.api_id === p.api_id
                }"
                :aria-pressed="selectedPokemon?.api_id === p.api_id"
                @click="selectStarter(p)"
>
                <img
                    :src="p.sprite_url"
                    class="starter-sprite"
                    :alt="p.name"
                />
              <p class="starter-name">
                {{ p.name }}
              </p>
            </button>
          </div>

          <button
            type="button"
            class="select-btn poke-btn"
            :disabled="!selectedPokemon"
            @click="confirmStarter"
          >
            {{
              confirmedPokemon
                ? `Selected: ${confirmedPokemon.name}`
                : selectedPokemon
                ? `Confirm ${selectedPokemon.name}`
                : "Confirm Starter"
            }}
          </button>
        </div>
      </div>
    </div>

    <div class="ground-bar"></div>
    <div class="footer-bar"></div>
    <div class="footer-bar-bottom"></div>

    <div class="start-run-container">
      <button
        class="poke-btn"
        :disabled="!confirmedPokemon || creatingRun"
        @click="startRun"
      >
        {{ creatingRun ? "Starting..." : "Start Run" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
type BaseStats = {
  hp: number
  attack: number
  defense: number
  sp_atk: number
  sp_def: number
  speed: number
}

type Pokemon = {
  api_id: number
  name: string
  sprite_url: string
  type1: string | null
  type2: string | null
  base_stats: BaseStats
}

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const starters = ref<Pokemon[]>([])
const selectedPokemon = ref<Pokemon | null>(null)
const confirmedPokemon = ref<Pokemon | null>(null)
const creatingRun = ref(false)

onMounted(async () => {
  const { data, error } = await supabase
    .from("pokemon_species")
    .select("*")
    .in("api_id", [1, 4, 7])

  if (error || !data) return

    starters.value = data as Pokemon[]
  console.log("Fetched starters:", starters.value)
})

const selectStarter = (pokemon: Pokemon) => {
    selectedPokemon.value = pokemon
  console.log("Selected starter:", pokemon.name)
}

const confirmStarter = () => {
  if (!selectedPokemon.value) return

    confirmedPokemon.value = selectedPokemon.value
  console.log("Confirmed starter:", selectedPokemon.value.name)
}

const startRun = async () => {
  if (creatingRun.value) return

  const uid = user.value?.id

  if (!uid) return
  if (!confirmedPokemon.value) return

  creatingRun.value = true

  try {
    const { data: existingRun } = await supabase
      .from("runs")
      .select("run_id")
      .eq("account_id", uid)
      .eq("status", "active")
      .maybeSingle()

    if (existingRun) {
      await navigateTo(`/run/${existingRun.run_id}`)
      return
    }

    const { data: run, error } = await supabase
      .from("runs")
      .insert({
        account_id: uid,
        current_floor: 1,
        money: 0,
        status: "active"
      })
      .select()
      .single()

    if (error || !run) return

    const starterHp =
      confirmedPokemon.value.base_stats.hp

    await supabase
      .from("player_pokemon")
      .insert({
        run_id: run.run_id,
        pokemon_api_id: confirmedPokemon.value.api_id,
        level: 5,
        current_hp: starterHp,
        max_hp: starterHp,
        experience: 0,
        team_slot: 1,
        is_fainted: false
      })

    await navigateTo(`/run/${run.run_id}`)
  } catch (err) {
    console.error(err)
  } finally {
    creatingRun.value = false
  }
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap");

.scene {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: "Fredoka One", cursive;
  overflow: hidden;
  position: relative;
}

.sky {
  flex: 2;
  background: #7ec8e3;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sky-lines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    180deg,
    transparent 0px,
    transparent 7px,
    rgba(255, 255, 255, 0.12) 7px,
    rgba(255, 255, 255, 0.12) 8px
  );
  pointer-events: none;
}

.logo {
  position: relative;
  z-index: 3;
}

.logo-text {
  font-size: clamp(36px, 8vw, 64px);
  color: #c0392b;
  text-shadow:
    3px 3px 0 #7b1a11,
    -2px -2px 0 #2c3e7a,
    2px -2px 0 #2c3e7a,
    -2px 2px 0 #2c3e7a,
    0 4px 0 #000;
  letter-spacing: 2px;
}

.grass {
  flex: 3;
  position: relative;
  background: #3a9e4f;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grass::before {
  display: none !important;
}

.grass-lines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    180deg,
    transparent 0px,
    transparent 5px,
    rgba(0, 0, 0, 0.08) 5px,
    rgba(0, 0, 0, 0.08) 6px
  );
  pointer-events: none;
  z-index: 0;
}

.ground-bar {
  height: 18px;
  background: #8b1a11;
  border-top: 3px solid #c0392b;
  position: relative;
}

.ground-bar::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #5a0e0e;
}

.footer-bar {
  background: #111122;
  padding: 1rem 2rem;
  text-align: center;
}

.footer-bar-bottom {
  height: 8px;
  background: #8b1a11;
  border-top: 2px solid #c0392b;
}

.panel {
  position: relative;
  z-index: 3;
  width: 85%;
  max-width: 1200px;
  display: flex;
  gap: 2rem;
  padding: 2rem;
  background: transparent;
}

.left-column,
.right-column {
  flex: 1;
  background: #1a1a2e;
  border: 4px solid #c0392b;
  box-shadow:
    0 0 0 2px #000,
    inset 0 0 0 2px #000;
  padding: 1.5rem;
  position: relative;
  min-height: 350px;
  display: flex;
  flex-direction: column;
}

.left-column::before,
.right-column::before {
  content: "";
  position: absolute;
  inset: 3px;
  border: 2px solid #8b1a11;
}

.preview-content {
  text-align: center;
  animation: fadeIn 0.18s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.preview-placeholder {
  color: #f0e6c8;
  font-size: 26px;
  text-align: center;
  margin-top: auto;
  margin-bottom: auto;
}

.preview-sprite {
  width: 280px;
  height: 280px;
  object-fit: contain;
  image-rendering: pixelated;
  display: block;
  margin: 0 auto;
}

.poke-name {
  color: #f0e6c8;
  margin-top: 1rem;
  font-size: 28px;
  text-align: center;
}

.stats-box {
  margin-top: 1.5rem;
  background: #2a1a0e;
  border: 3px solid #c0392b;
  box-shadow:
    0 0 0 2px #000,
    inset 0 0 0 2px #000;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  color: #f0e6c8;
  font-size: 18px;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.starter-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  overflow-y: auto;
  padding-right: 4px;
  flex: 1;
}

.starter-card {
  appearance: none;
  -webkit-appearance: none;

  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  font-size: 20px;
  padding: 1rem 1.4rem;
  cursor: pointer;

  font-family: "Fredoka One", cursive;
  border-radius: 1rem;
  text-align: center;
}

.starter-card:hover {
  background: #3a2510;
  border-color: #e74c3c;
}

.starter-card:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #8b1a11;
}

.starter-card:focus-visible {
  outline: 3px solid rgba(240, 230, 200, 0.75);
  outline-offset: 4px;
}

.starter-card.selected {
  background: #7b5d35;
  border-color: #ffb26b;
  box-shadow:
    0 4px 0 #8b1a11,
    inset 0 0 14px rgba(255, 191, 143, 0.28);
}

.starter-card.selected:hover {
  background: #7b5d35;
  border-color: #ffb26b;
}

.starter-card.confirmed {
  background: #b6884f;
  border-color: #ffdd9d;
  box-shadow:
    0 4px 0 #8b1a11,
    inset 0 0 18px rgba(255, 215, 170, 0.35);
}

.starter-card.confirmed:hover {
  background: #b6884f;
  border-color: #ffdd9d;
}

.poke-btn,
.select-btn,
.starter-card {
  font-family: "Fredoka One", cursive;
  font-size: 24px;
  padding: 14px 40px;
  background: #2a1a0e;
  color: #f0e6c8;
  border: 3px solid #c0392b;
  border-radius: 1rem;
  box-shadow: 0 4px 0 #8b1a11;
  cursor: pointer;
  letter-spacing: 1px;
  transition:
    transform 0.08s,
    box-shadow 0.08s,
    background 0.08s,
    border-color 0.08s;
}

.starter-card {
  font-size: 20px;
  padding: 1rem 1.4rem;
}

.poke-btn:hover,
.select-btn:hover,
.starter-card:hover {
  background: #3a2510;
  border-color: #e74c3c;
}

.poke-btn:active,
.select-btn:active,
.starter-card:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #8b1a11;
}

.select-btn:disabled {
  opacity: 1;
  cursor: default;
}

.starter-sprite {
  width: 150px;
  height: 150px;
  object-fit: contain;
  image-rendering: pixelated;
  display: block;
  margin: 0 auto;
}

.starter-name {
  color: #f0e6c8;
  margin-top: 0.5rem;
  font-size: 20px;
}

.start-run-container {
  position: fixed;
  bottom: 20px;
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 10;
}

.left-column::before,
.right-column::before {
  pointer-events: none;
}
</style>
