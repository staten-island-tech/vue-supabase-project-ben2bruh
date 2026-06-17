export interface Gen1Species {
  id: number;
  name: string;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  evolutionLevel?: number;
  evolvesInto?: number;
  spriteUrl: string;
}

export const gen1Pokemon: Record<number, Gen1Species> = {
  1: {
    id: 1,
    name: "Bulbasaur",
    types: ["grass", "poison"],
    baseStats: {
      hp: 45,
      attack: 49,
      defense: 49,
      spAtk: 65,
      spDef: 65,
      speed: 45,
    },
    evolutionLevel: 16,
    evolvesInto: 2,
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
  },
  2: {
    id: 2,
    name: "Ivysaur",
    types: ["grass", "poison"],
    baseStats: {
      hp: 60,
      attack: 62,
      defense: 63,
      spAtk: 80,
      spDef: 80,
      speed: 60,
    },
    evolutionLevel: 32,
    evolvesInto: 3,
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png",
  },
  3: {
    id: 3,
    name: "Venusaur",
    types: ["grass", "poison"],
    baseStats: {
      hp: 80,
      attack: 82,
      defense: 83,
      spAtk: 100,
      spDef: 100,
      speed: 80,
    },
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png",
  },
  4: {
    id: 4,
    name: "Charmander",
    types: ["fire"],
    baseStats: {
      hp: 39,
      attack: 52,
      defense: 43,
      spAtk: 60,
      spDef: 50,
      speed: 65,
    },
    evolutionLevel: 16,
    evolvesInto: 5,
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png",
  },
  5: {
    id: 5,
    name: "Charmeleon",
    types: ["fire"],
    baseStats: {
      hp: 58,
      attack: 64,
      defense: 58,
      spAtk: 80,
      spDef: 65,
      speed: 80,
    },
    evolutionLevel: 36,
    evolvesInto: 6,
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/5.png",
  },
  6: {
    id: 6,
    name: "Charizard",
    types: ["fire", "flying"],
    baseStats: {
      hp: 78,
      attack: 84,
      defense: 78,
      spAtk: 109,
      spDef: 85,
      speed: 100,
    },
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png",
  },
  7: {
    id: 7,
    name: "Squirtle",
    types: ["water"],
    baseStats: {
      hp: 44,
      attack: 48,
      defense: 65,
      spAtk: 50,
      spDef: 64,
      speed: 43,
    },
    evolutionLevel: 16,
    evolvesInto: 8,
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png",
  },
  8: {
    id: 8,
    name: "Wartortle",
    types: ["water"],
    baseStats: {
      hp: 59,
      attack: 63,
      defense: 80,
      spAtk: 65,
      spDef: 80,
      speed: 58,
    },
    evolutionLevel: 36,
    evolvesInto: 9,
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/8.png",
  },
  9: {
    id: 9,
    name: "Blastoise",
    types: ["water"],
    baseStats: {
      hp: 79,
      attack: 83,
      defense: 100,
      spAtk: 85,
      spDef: 105,
      speed: 78,
    },
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png",
  },
  25: {
    id: 25,
    name: "Pikachu",
    types: ["electric"],
    baseStats: {
      hp: 35,
      attack: 55,
      defense: 40,
      spAtk: 50,
      spDef: 50,
      speed: 90,
    },
    evolutionLevel: 30,
    evolvesInto: 26,
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
  },
  26: {
    id: 26,
    name: "Raichu",
    types: ["electric"],
    baseStats: {
      hp: 60,
      attack: 90,
      defense: 55,
      spAtk: 90,
      spDef: 80,
      speed: 100,
    },
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/26.png",
  },
  27: {
    id: 27,
    name: "Sandshrew",
    types: ["ground"],
    baseStats: {
      hp: 50,
      attack: 75,
      defense: 85,
      spAtk: 20,
      spDef: 30,
      speed: 40,
    },
    evolutionLevel: 22,
    evolvesInto: 28,
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/27.png",
  },
  28: {
    id: 28,
    name: "Sandslash",
    types: ["ground"],
    baseStats: {
      hp: 75,
      attack: 100,
      defense: 110,
      spAtk: 45,
      spDef: 55,
      speed: 65,
    },
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/28.png",
  },
  41: {
    id: 41,
    name: "Zubat",
    types: ["poison", "flying"],
    baseStats: {
      hp: 40,
      attack: 45,
      defense: 35,
      spAtk: 30,
      spDef: 40,
      speed: 55,
    },
    evolutionLevel: 22,
    evolvesInto: 42,
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/41.png",
  },
  42: {
    id: 42,
    name: "Golbat",
    types: ["poison", "flying"],
    baseStats: {
      hp: 75,
      attack: 80,
      defense: 70,
      spAtk: 65,
      spDef: 75,
      speed: 90,
    },
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/42.png",
  },
  133: {
    id: 133,
    name: "Eevee",
    types: ["normal"],
    baseStats: {
      hp: 55,
      attack: 55,
      defense: 50,
      spAtk: 45,
      spDef: 65,
      speed: 55,
    },
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png",
  },
  134: {
    id: 134,
    name: "Vaporeon",
    types: ["water"],
    baseStats: {
      hp: 130,
      attack: 65,
      defense: 60,
      spAtk: 110,
      spDef: 95,
      speed: 65,
    },
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/134.png",
  },
  135: {
    id: 135,
    name: "Jolteon",
    types: ["electric"],
    baseStats: {
      hp: 65,
      attack: 65,
      defense: 60,
      spAtk: 110,
      spDef: 95,
      speed: 130,
    },
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/135.png",
  },
  136: {
    id: 136,
    name: "Flareon",
    types: ["fire"],
    baseStats: {
      hp: 65,
      attack: 130,
      defense: 60,
      spAtk: 95,
      spDef: 110,
      speed: 65,
    },
    spriteUrl:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/136.png",
  },
};

export const eeveeSpecies = gen1Pokemon[133];

export const eeveeEvolutions: Record<string, Gen1Species> = {
  vaporeon: gen1Pokemon[134],
  jolteon: gen1Pokemon[135],
  flareon: gen1Pokemon[136],
};

export function getSpeciesById(id: number): Gen1Species | null {
  return gen1Pokemon[id] ?? null;
}

export const starters = [gen1Pokemon[1], gen1Pokemon[4], gen1Pokemon[7]];

export function getWildPokemonPool(floor: number): Gen1Species[] {
  const allPokemon = Object.values(gen1Pokemon);

  if (floor <= 5) {
    return allPokemon.filter(
      (p) => p.baseStats.hp + p.baseStats.attack + p.baseStats.defense <= 150,
    );
  } else if (floor <= 10) {
    return allPokemon.filter(
      (p) => p.baseStats.hp + p.baseStats.attack + p.baseStats.defense <= 250,
    );
  } else {
    return allPokemon;
  }
}

export function calculateStat(
  baseStat: number,
  level: number,
  isHp = false,
): number {
  return baseStat + level * (isHp ? 5 : 2);
}

export function getPokemonStats(species: Gen1Species, level: number) {
  return {
    hp: calculateStat(species.baseStats.hp, level, true),
    attack: calculateStat(species.baseStats.attack, level),
    defense: calculateStat(species.baseStats.defense, level),
    spAtk: calculateStat(species.baseStats.spAtk, level),
    spDef: calculateStat(species.baseStats.spDef, level),
    speed: calculateStat(species.baseStats.speed, level),
  };
}
