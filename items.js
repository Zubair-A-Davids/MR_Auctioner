// Predefined item types for Mirage Realms
// Each item has a name, description, base stats, and a placeholder image
// Images can be replaced with actual item icons/screenshots

const ITEM_TYPES = [
// Weapons - Swords
  {
    id: 'Primitive-Sword',
    name: 'Primitive Sword',
    description: 'Req. Melee Lv15. Max Stats: 3melee or 2/2',
    type: 'Sword',
    baseStats: { damage: 4, weight: 20 },
    image: 'Items/Swords/Primitive_Sword.png'
  },
  {
    id: 'Spiked-Sword',
    name: 'Spiked Sword',
    description: 'Req. Melee Lv20. Max Stats: 6melee or 4/4',
    type: 'Sword',
    baseStats: { damage: 5, weight: 20 },
    image: 'Items/Swords/Spiked_Sword.png'
  },
  {
    id: 'Knight-Sword',
    name: 'Knight Sword',
    description: 'Req. Melee Lv30. Max Stats: 9melee or 6/6',
    type: 'Sword',
    baseStats: { damage: 6, weight: 20 },
    image: 'Items/Swords/Knight_Sword.png'
  },
  {
    id: 'Elven-Sword',
    name: 'Elven Sword',
    description: 'Req. Melee Lv40. Max Stats: 12melee or 8/8',
    type: 'Sword',
    baseStats: { damage: 7, weight: 20 },
    image: 'Items/Swords/Elven_Sword.png'
  },
  {
    id: 'Paladin-Sword',
    name: 'Paladin Sword',
    description: 'Req. Melee Lv50. Max Stats: 15melee or 10/10',
    type: 'Sword',
    baseStats: { damage: 8, weight: 20 },
    image: 'Items/Swords/Paladin_Sword.png'
  },
  {
    id: 'Talon',
    name: 'Talon',
    description: 'Req. Melee Lv60. Max Stats: 18melee or 12/12',
    type: 'Sword',
    baseStats: { damage: 9, weight: 20 },
    image: 'Items/Swords/Talon.png'
  },
  {
    id: 'Vindicator',
    name: 'Vindicator',
    description: 'Req. Melee Lv70. Max Stats: 21melee or 14/14',
    type: 'Sword',
    baseStats: { damage: 10, weight: 20 },
    image: 'Items/Swords/Vindicator.png'
  },
  {
    id: 'Banisher',
    name: 'Banisher',
    description: 'Req. Melee Lv80. Max Stats: 24melee or 16/16',
    type: 'Sword',
    baseStats: { damage: 11, weight: 20 },
    image: 'Items/Swords/Banisher.png'
  },
  {
    id: 'Midnight',
    name: 'Midnight',
    description: 'Req. Melee Lv90. Max Stats: 27melee or 18/18',
    type: 'Sword',
    baseStats: { damage: 12, weight: 20 },
    image: 'Items/Swords/Midnight.png'
  },
  {
    id: 'Armageddon',
    name: 'Armageddon',
    description: 'Req. Melee Lv100. Max Stats: 30melee or 20/20',
    type: 'Sword',
    baseStats: { damage: 13, weight: 20 },
    image: 'Items/Swords/Armageddon.png'
  },

// Weapons - Axes
  {
    id: 'Steel-Axe',
    name: 'Steel Axe',
    description: 'Req. Melee Lv15. Max Stats: 8melee with -20defence or 6/6',
    type: 'Axe',
    baseStats: { damage: 5, weight: 20 },
    image: 'Items/Axes/Steel_Axe.png'
  },
  {
    id: 'Harvest-Scythe',
    name: 'Harvest Scythe',
    description: 'Req. Melee Lv20. Max Stats: 16melee with -24defence or 12/12',
    type: 'Axe',
    baseStats: { damage: 6, weight: 20 },
    image: 'Items/Axes/Harvest_Scythe.png'
  },
  {
    id: 'Executioner',
    name: 'Executioner',
    description: 'Req. Melee Lv30. Max Stats: 24melee with -28defence or 18/18',
    type: 'Axe',
    baseStats: { damage: 7, weight: 20 },
    image: 'Items/Axes/Executioner.png'
  },
  {
    id: 'Imperial-Axe',
    name: 'Imperial Axe',
    description: 'Req. Melee Lv40. Max Stats: 32melee with -32defence or 24/24',
    type: 'Axe',
    baseStats: { damage: 8, weight: 20 },
    image: 'Items/Axes/Imperial_Axe.png'
  },
  {
    id: 'Forest-Axe',
    name: 'Forest Axe',
    description: 'Req. Melee Lv50. Max Stats: 40melee with -36defence or 30/30',
    type: 'Axe',
    baseStats: { damage: 9, weight: 20 },
    image: 'Items/Axes/Forest_Axe.png'
  },
  {
    id: 'Warlord-Axe',
    name: 'Warlord Axe',
    description: 'Req. Melee Lv60. Max Stats: 48melee with -40defence or 36/36',
    type: 'Axe',
    baseStats: { damage: 10, weight: 20 },
    image: 'Items/Axes/Warlord_Axe.png'
  },
  {
    id: 'Ancient-Axe',
    name: 'Ancient Axe',
    description: 'Req. Melee Lv70. Max Stats: 56melee with -44defence or 42/42',
    type: 'Axe',
    baseStats: { damage: 11, weight: 20 },
    image: 'Items/Axes/Ancient_Axe.png'
  },
  {
    id: 'Retribution',
    name: 'Retribution',
    description: 'Req. Melee Lv80. Max Stats: 64melee with -48defence or 48/48',
    type: 'Axe',
    baseStats: { damage: 12, weight: 20 },
    image: 'Items/Axes/Retribution.png'
  },
  {
    id: 'Pacifier',
    name: 'Pacifier',
    description: 'Req. Melee Lv90. Max Stats: 72melee with -52defence or 54/54',
    type: 'Axe',
    baseStats: { damage: 13, weight: 20 },
    image: 'Items/Axes/Pacifier.png'
  },
  {
    id: 'Nullifier',
    name: 'Nullifier',
    description: 'Req. Melee Lv100. Max Stats: 80melee with -56defence or 60/60',
    type: 'Axe',
    baseStats: { damage: 14, weight: 20 },
    image: 'Items/Axes/Nullifier.png'
  },

// Weapons - Rods
  {
    id: 'Cracked-Rod',
    name: 'Cracked Rod',
    description: 'Req. Magic Lv0. Max Stats: 0magic',
    type: 'Rod',
    baseStats: { damage: 3, weight: 20 },
    image: 'Items/Rods/Cracked_Rod.png'
  },
  {
    id: 'Nature-Rod',
    name: 'Nature Rod',
    description: 'Req. Magic Lv15. Max Stats: 3stamina or 2/1',
    type: 'Rod',
    baseStats: { damage: 4, weight: 20 },
    image: 'Items/Rods/Nature_Rod.png'
  },
  {
    id: 'Earth-Rod',
    name: 'Earth Rod',
    description: 'Req. Magic Lv20. Max Stats: 6stamina or 4/2',
    type: 'Rod',
    baseStats: { damage: 5, weight: 20 },
    image: 'Items/Rods/Earth_Rod.png'
  },
  {
    id: 'Jungle-Rod',
    name: 'Jungle Rod',
    description: 'Req. Magic Lv30. Max Stats: 9stamina or 6/3',
    type: 'Rod',
    baseStats: { damage: 6, weight: 20 },
    image: 'Items/Rods/Jungle_Rod.png'
  },
  {
    id: 'Dead-Rod',
    name: 'Dead Rod',
    description: 'Req. Magic Lv40. Max Stats: 12stamina or 8/4',
    type: 'Rod',
    baseStats: { damage: 7, weight: 20 },
    image: 'Items/Rods/Dead_Rod.png'
  },
  {
    id: 'Emerald-Rod',
    name: 'Emerald Rod',
    description: 'Req. Magic Lv50. Max Stats: 15stamina or 10/5',
    type: 'Rod',
    baseStats: { damage: 8, weight: 20 },
    image: 'Items/Rods/Emerald_Rod.png'
  },
  {
    id: 'Life-Rod',
    name: 'Life Rod',
    description: 'Req. Magic Lv60. Max Stats: 18stamina or 12/6',
    type: 'Rod',
    baseStats: { damage: 9, weight: 20 },
    image: 'Items/Rods/Life_Rod.png'
  },
  {
    id: 'Holy-Rod',
    name: 'Holy Rod',
    description: 'Req. Magic Lv70. Max Stats: 21stamina or 14/7',
    type: 'Rod',
    baseStats: { damage: 10, weight: 20 },
    image: 'Items/Rods/Holy_Rod.png'
  },
  {
    id: 'Shade',
    name: 'Shade',
    description: 'Req. Magic Lv80. Max Stats: 24stamina or 16/8',
    type: 'Rod',
    baseStats: { damage: 11, weight: 20 },
    image: 'Items/Rods/Shade.png'
  },
  {
    id: 'Daylight',
    name: 'Daylight',
    description: 'Req. Magic Lv90. Max Stats: 27stamina or 18/9',
    type: 'Rod',
    baseStats: { damage: 12, weight: 20 },
    image: 'Items/Rods/Daylight.png'
  },
  {
    id: 'Peace',
    name: 'Peace',
    description: 'Req. Magic Lv100. Max Stats: 30stamina or 20/10',
    type: 'Rod',
    baseStats: { damage: 13, weight: 20 },
    image: 'Items/Rods/Peace.png'
  },

// Weapons - Staves
  {
    id: 'Training-Staff',
    name: 'Training Staff',
    description: 'Req. Magic Lv0. Max Stats: 0magic',
    type: 'Staff',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Staves/Training_Staff.png'
  },
  {
    id: 'Warped-Staff',
    name: 'Warped Staff',
    description: 'Req. Magic Lv0. Max Stats: 0magic',
    type: 'Staff',
    baseStats: { damage: 3, weight: 20 },
    image: 'Items/Staves/Warped_Staff.png'
  },
  {
    id: 'Amber-Staff',
    name: 'Amber Staff',
    description: 'Req. Magic Lv15. Max Stats: 2magic or 2/1',
    type: 'Staff',
    baseStats: { damage: 4, weight: 20 },
    image: 'Items/Staves/Amber_Staff.png'
  },
  {
    id: 'Crystal-Staff',
    name: 'Crystal Staff',
    description: 'Req. Magic Lv20. Max Stats: 6magic or 4/2',
    type: 'Staff',
    baseStats: { damage: 5, weight: 20 },
    image: 'Items/Staves/Crystal_Staff.png'
  },
  {
    id: 'Spirit-Staff',
    name: 'Spirit Staff',
    description: 'Req. Magic Lv30. Max Stats: 9magic or 6/3',
    type: 'Staff',
    baseStats: { damage: 6, weight: 20 },
    image: 'Items/Staves/Spirit_Staff.png'
  },
  {
    id: 'Fire-Staff',
    name: 'Fire Staff',
    description: 'Req. Magic Lv40. Max Stats: 12magic or 8/4',
    type: 'Staff',
    baseStats: { damage: 7, weight: 20 },
    image: 'Items/Staves/Fire_Staff.png'
  },
  {
    id: 'Golden-Staff',
    name: 'Golden Staff',
    description: 'Req. Magic Lv50. Max Stats: 15magic or 10/5',
    type: 'Staff',
    baseStats: { damage: 8, weight: 20 },
    image: 'Items/Staves/Golden_Staff.png'
  },
  {
    id: 'Nightmare-Staff',
    name: 'Nightmare Staff',
    description: 'Req. Magic Lv60. Max Stats: 18magic or 12/6',
    type: 'Staff',
    baseStats: { damage: 9, weight: 20 },
    image: 'Items/Staves/Nightmare_Staff.png'
  },
  {
    id: 'Mana-Staff',
    name: 'Mana Staff',
    description: 'Req. Magic Lv70. Max Stats: 21magic or 14/7',
    type: 'Staff',
    baseStats: { damage: 10, weight: 20 },
    image: 'Items/Staves/Mana_Staff.png'
  },
  {
    id: 'Truth',
    name: 'Truth',
    description: 'Req. Magic Lv80. Max Stats: 24magic or 16/8',
    type: 'Staff',
    baseStats: { damage: 11, weight: 20 },
    image: 'Items/Staves/Truth.png'
  },
  {
    id: 'Purity',
    name: 'Purity',
    description: 'Req. Magic Lv90. Max Stats: 27magic or 18/9',
    type: 'Staff',
    baseStats: { damage: 12, weight: 20 },
    image: 'Items/Staves/Purity.png'
  },
  {
    id: 'Creation',
    name: 'Creation',
    description: 'Req. Magic Lv100. Max Stats: 30magic or 20/10',
    type: 'Staff',
    baseStats: { damage: 13, weight: 20 },
    image: 'Items/Staves/Creation.png'
  },

// Weapons - Tomes
  {
    id: 'Novice\'s-Notes',
    name: 'Novice\'s Notes',
    description: 'Req. Magic Lv0. Max Stats: 9magic or 6/3',
    type: 'Tome',
    baseStats: { damage: 0, weight: 20 },
    image: 'Items/Tomes/Novice\'s_Notes.png'
  },
  {
    id: 'Old-Spellbook',
    name: 'Old Spellbook',
    description: 'Req. Magic Lv15. Max Stats: 12magic or 8/4',
    type: 'Tome',
    baseStats: { damage: 0, weight: 20 },
    image: 'Items/Tomes/Old_Spellbook.png'
  },
  {
    id: 'Fire-Tome',
    name: 'Fire Tome',
    description: 'Req. Magic Lv20. Max Stats: 15magic or 10/5',
    type: 'Tome',
    baseStats: { damage: 0, weight: 20 },
    image: 'Items/Tomes/Fire_Tome.png'
  },
  {
    id: 'Molten-Tome',
    name: 'Molten Tome',
    description: 'Req. Magic Lv30. Max Stats: 18magic or 12/6',
    type: 'Tome',
    baseStats: { damage: 0, weight: 20 },
    image: 'Items/Tomes/Molten_Tome.png'
  },
  {
    id: 'Forest-Tome',
    name: 'Forest Tome',
    description: 'Req. Magic Lv40. Max Stats: 21magic or 14/7',
    type: 'Tome',
    baseStats: { damage: 0, weight: 20 },
    image: 'Items/Tomes/Forest_Tome.png'
  },
  {
    id: 'Spirit-Tome',
    name: 'Spirit Tome',
    description: 'Req. Magic Lv50. Max Stats: 24magic or 16/8',
    type: 'Tome',
    baseStats: { damage: 0, weight: 20 },
    image: 'Items/Tomes/Spirit_Tome.png'
  },
  {
    id: 'Mana-Tome',
    name: 'Mana Tome',
    description: 'Req. Magic Lv60. Max Stats: 27magic or 18/9',
    type: 'Tome',
    baseStats: { damage: 0, weight: 20 },
    image: 'Items/Tomes/Mana_Tome.png'
  },
  {
    id: 'Poison-Tome',
    name: 'Poison Tome',
    description: 'Req. Magic Lv70. Max Stats: 30magic or 20/20',
    type: 'Tome',
    baseStats: { damage: 0, weight: 20 },
    image: 'Items/Tomes/Poison_Tome.png'
  },
  {
    id: 'Ice-Tome',
    name: 'Ice Tome',
    description: 'Req. Magic Lv80. Max Stats: 33magic or 22/11',
    type: 'Tome',
    baseStats: { damage: 0, weight: 20 },
    image: 'Items/Tomes/Ice_Tome.png'
  },
  {
    id: 'Thunder-Tome',
    name: 'Thunder Tome',
    description: 'Req. Magic Lv90. Max Stats: 36magic or 24/12',
    type: 'Tome',
    baseStats: { damage: 0, weight: 20 },
    image: 'Items/Tomes/Thunder_Tome.png'
  },
  {
    id: 'Creation-Tome',
    name: 'Creation tome',
    description: 'Req. Magic Lv100. Max Stats: 39magic or 26/13',
    type: 'Tome',
    baseStats: { damage: 0, weight: 20 },
    image: 'Items/Tomes/Creation_Tome.png'
  },

// Shields
  {
    id: 'Wooden-Shield',
    name: 'Wooden Shield',
    description: 'Req. Defence Lv0. Max Stats: 0defence',
    type: 'Shield',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Shields/Wooden_Shield.png'
  },
  {
    id: 'Reinforced-Shield',
    name: 'Reinforced Shield',
    description: 'Req. Defence Lv15. Max Stats: 6defence or 4/1',
    type: 'Shield',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Shields/Reinforced_Shield.png'
  },
  {
    id: 'Copper-Shield',
    name: 'Copper Shield',
    description: 'Req. Defence Lv20. Max Stats: 12defence or 8/2',
    type: 'Shield',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Shields/Copper_Shield.png'
  },
  {
    id: 'Plate-Shield',
    name: 'Plate Shield',
    description: 'Req. Defence Lv30. Max Stats: 18defence or 12/3',
    type: 'Shield',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Shields/Plate_Shield.png'
  },
  {
    id: 'Soldier-Shield',
    name: 'Soldier Shield',
    description: 'Req. Defence Lv40. Max Stats: 24defence or 16/4',
    type: 'Shield',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Shields/Soldier_Shield.png'
  },
  {
    id: 'Silver-Shield',
    name: 'Silver Shield',
    description: 'Req. Defence Lv50. Max Stats: 30defence or 20/5',
    type: 'Shield',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Shields/Silver_Shield.png'
  },
  {
    id: 'Platinum-Shield',
    name: 'Platinum Shield',
    description: 'Req. Defence Lv60. Max Stats: 36defence or 24/6',
    type: 'Shield',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Shields/Platinum_Shield.png'
  },
  {
    id: 'Emerald-Shield',
    name: 'Emerald Shield',
    description: 'Req. Defence Lv70. Max Stats: 42defence or 28/7',
    type: 'Shield',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Shields/Emerald_Shield.png'
  },
  {
    id: 'Granite-Shield',
    name: 'Granite Shield',
    description: 'Req. Defence Lv80. Max Stats: 48defence or 32/8',
    type: 'Shield',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Shields/Granite_Shield.png'
  },
  {
    id: 'Golden-Shield',
    name: 'Golden Shield',
    description: 'Req. Defence Lv90. Max Stats: 54defence or 36/9',
    type: 'Shield',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Shields/Golden_Shield.png'
  },
  {
    id: 'Chaos-Shield',
    name: 'Chaos Shield',
    description: 'Req. Defence Lv100. Max Stats: 60defence or 40/10',
    type: 'Shield',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Shields/Chaos_Shield.png'
  },

// Weapons - Bows
  {
    id: 'Training-Bow',
    name: 'Training Bow',
    description: 'Req. Distance Lv0. Max Stats: 0distance',
    type: 'Bow',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Bows/Training_Bow.png'
  },
  {
    id: 'Wooden-Bow',
    name: 'Wooden Bow',
    description: 'Req. Distance Lv0. Max Stats: 0distance',
    type: 'Bow',
    baseStats: { damage: 3, weight: 20 },
    image: 'Items/Bows/Wooden_Bow.png'
  },
  {
    id: 'Primitive-Bow',
    name: 'Primitive Bow',
    description: 'Req. Distance Lv15. Max Stats: 3distance or 2/1',
    type: 'Bow',
    baseStats: { damage: 4, weight: 20 },
    image: 'Items/Bows/Primitive_Bow.png'
  },
  {
    id: 'Soldier-Bow',
    name: 'Soldier Bow',
    description: 'Req. Distance Lv20. Max Stats: 6distance or 4/2',
    type: 'Bow',
    baseStats: { damage: 5, weight: 20 },
    image: 'Items/Bows/Soldier_Bow.png'
  },
  {
    id: 'Elven-Bow',
    name: 'Elven Bow',
    description: 'Req. Distance Lv30. Max Stats: 9distance or 6/3',
    type: 'Bow',
    baseStats: { damage: 6, weight: 20 },
    image: 'Items/Bows/Elven_Bow.png'
  },
  {
    id: 'Skeletal-Bow',
    name: 'Skeletal Bow',
    description: 'Req. Distance Lv40. Max Stats: 12distance or 8/4',
    type: 'Bow',
    baseStats: { damage: 7, weight: 20 },
    image: 'Items/Bows/Skeletal_Bow.png'
  },
  {
    id: 'Orcish-Bow',
    name: 'Orcish Bow',
    description: 'Req. Distance Lv50. Max Stats: 15distance or 10/5',
    type: 'Bow',
    baseStats: { damage: 8, weight: 20 },
    image: 'Items/Bows/Orcish_Bow.png'
  },
  {
    id: 'Demon-Bow',
    name: 'Demon Bow',
    description: 'Req. Distance Lv60. Max Stats: 18distance or 9/6',
    type: 'Bow',
    baseStats: { damage: 9, weight: 20 },
    image: 'Items/Bows/Demon_Bow.png'
  },
  {
    id: 'Pearl-Bow',
    name: 'Pearl Bow',
    description: 'Req. Distance Lv70. Max Stats: 21distance or 14/7',
    type: 'Bow',
    baseStats: { damage: 10, weight: 20 },
    image: 'Items/Bows/Pearl_Bow.png'
  },
  {
    id: 'Tempest',
    name: 'Tempest',
    description: 'Req. Distance Lv80. Max Stats: 24distance or 16/8',
    type: 'Bow',
    baseStats: { damage: 11, weight: 20 },
    image: 'Items/Bows/Tempest.png'
  },
  {
    id: 'Ironbark',
    name: 'Ironbark',
    description: 'Req. Distance Lv90. Max Stats: 27distance or 18/9',
    type: 'Bow',
    baseStats: { damage: 12, weight: 20 },
    image: 'Items/Bows/Ironbark.png'
  },
  {
    id: 'Silence',
    name: 'Silence',
    description: 'Req. Distance Lv100. Max Stats: 30distance or 20/10',
    type: 'Bow',
    baseStats: { damage: 13, weight: 20 },
    image: 'Items/Bows/Silence.png'
  },

// Ranger - Arrows
  {
    id: 'Wooden-Arrow',
    name: 'Wooden Arrow',
    description: 'Req. Distance Lv0. +0 Distance',
    type: 'Arrow',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Arrows/Wooden_Arrow.png'
  },
  {
    id: 'Stone-Arrow',
    name: 'Stone Arrow',
    description: 'Req. Distance Lv20. +5 Distance',
    type: 'Arrow',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Arrows/Stone_Arrow.png'
  },
  {
    id: 'Flint-Arrow',
    name: 'Flint Arrow',
    description: 'Req. Distance Lv30. +10 Distance',
    type: 'Arrow',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Arrows/Flint_Arrow.png'
  },
  {
    id: 'Tin-Arrow',
    name: 'Tin Arrow',
    description: 'Req. Distance Lv40. +15 Distance',
    type: 'Arrow',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Arrows/Tin_Arrow.png'
  },
  {
    id: 'Iron-Arrow',
    name: 'Iron Arrow',
    description: 'Req. Distance Lv50. +20 Distance',
    type: 'Arrow',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Arrows/Iron_Arrow.png'
  },
  {
    id: 'Elven-Arrow',
    name: 'Elven Arrow',
    description: 'Req. Distance Lv60. +25 Distance',
    type: 'Arrow',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Arrows/Elven_Arrow.png'
  },
  {
    id: 'Pearl-Arrow',
    name: 'Pearl Arrow',
    description: 'Req. Distance Lv70. +30 Distance',
    type: 'Arrow',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Arrows/Pearl_Arrow.png'
  },
  {
    id: 'Chaos-Arrow',
    name: 'Chaos Arrow',
    description: 'Req. Distance Lv75. +200 Distance',
    type: 'Arrow',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Arrows/Chaos_Arrow.png'
  },
  {
    id: 'Spiked-Arrow',
    name: 'Spiked Arrow',
    description: 'Req. Distance Lv80. +35 Distance',
    type: 'Arrow',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Arrows/Spiked_Arrow.png'
  },
  {
    id: 'Mythril-Arrow',
    name: 'Mythril Arrow',
    description: 'Req. Distance Lv90. +40 Distance',
    type: 'Arrow',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Arrows/Mythril_Arrow.png'
  },
  {
    id: 'Diamond-Arrow',
    name: 'Diamond Arrow',
    description: 'Req. Distance Lv100. +45 Distance',
    type: 'Arrow',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Arrows/Diamond_Arrow.png'
  },
  {
    id: 'Royal-Arrow',
    name: 'Royal Arrow',
    description: 'Req. Distance Lv110. +50 Distance',
    type: 'Arrow',
    baseStats: { damage: 1, weight: 20 },
    image: 'Items/Arrows/Royal_Arrow.png'
  },

// Runes
  {
    id: 'Light-Mana-Missile',
    name: 'Light Mana Missile',
    description: '[Em Minima] Req. Magic Lv25. (0.5x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Light_Mana_Missile.png'
  },
  {
    id: 'Mana-Missile',
    name: 'Mana Missile',
    description: '[Em] Req. Magic Lv50. (1x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Mana_Missile.png'
  },
  {
    id: 'Heavy-Mana-Missile',
    name: 'Heavy Mana Missile',
    description: '[Em Gravis] Req. Magic Lv75. (1.5x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Heavy_Mana_Missile.png'
  },
  {
    id: 'Light-Ice-Missile',
    name: 'Light Ice Missile',
    description: '[Glacio Minima] Req. Magic Lv25. (0.5x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Light_Ice_Missile.png'
  },
  {
    id: 'Ice-Missile',
    name: 'Ice Missile',
    description: '[Glacio] Req. Magic Lv50. (1x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Ice_Missile.png'
  },
  {
    id: 'Heavy-Ice-Missile',
    name: 'Heavy Ice Missile',
    description: '[Glacio Gravis] Req. Magic Lv75. (1.5x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Heavy_Ice_Missile.png'
  },
  {
    id: 'Light-Fire-Missile',
    name: 'Light Fire Missile',
    description: '[Ignis Minima] Req. Magic Lv25. (0.5x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Light_Fire_Missile.png'
  },
  {
    id: 'Fire-Missile',
    name: 'Fire Missile',
    description: '[Ignis] Req. Magic Lv50. (1x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Fire_Missile.png'
  },
  {
    id: 'Heavy-Fire-Missile',
    name: 'Heavy Fire Missile',
    description: '[Ignis Gravis] Req. Magic Lv75. (1.5x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Heavy_Fire_Missile.png'
  },
  {
    id: 'Light-Nature-Missile',
    name: 'Light Nature Missile',
    description: '[Fel Minima] Req. Magic Lv25. (0.5x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Light_Nature_Missile.png'
  },
  {
    id: 'Nature-Missile',
    name: 'Nature Missile',
    description: '[Fel] Req. Magic Lv50. (1x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Nature_Missile.png'
  },
  {
    id: 'Heavy-Nature-Missile',
    name: 'Heavy Nature Missile',
    description: '[Fel Gravis] Req. Magic Lv75. (1.5x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Heavy_Nature_Missile.png'
  },
  {
    id: 'Light-Energy-Missile',
    name: 'Light Energy Missile',
    description: '[Vis Minima] Req. Magic Lv25. (0.5x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Light_Energy_Missile.png'
  },
  {
    id: 'Energy-Missile',
    name: 'Energy Missile',
    description: '[Vis] Req. Magic Lv50. (1x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Energy_Missile.png'
  },
  {
    id: 'Heavy-Energy-Missile',
    name: 'Heavy Energy Missile',
    description: '[Vis Gravis] Req. Magic Lv75. (1.5x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Heavy_Energy_Missile.png'
  },
  {
    id: 'Light-Death-Missile',
    name: 'Light Death Missile',
    description: '[Nex Minima] Req. Magic Lv25. (2x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Light_Death_Missile.png'
  },
  {
    id: 'Death-Missile',
    name: 'Death Missile',
    description: '[Nex] Req. Magic Lv50. (3x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Death_Missile.png'
  },
  {
    id: 'Heavy-Death-Missile',
    name: 'Heavy Death Missile',
    description: '[Nex Gravis] Req. Magic Lv75. (4x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Heavy_Death_Missile.png'
  },
  {
    id: 'Light-Physical-Missile',
    name: 'Light Physical Missile',
    description: '[Petram Minima] Req. Magic Lv25. (0.5x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Light_Physical_Missile.png'
  },
  {
    id: 'Physical-Missile',
    name: 'Physical Missile',
    description: '[Petram] Req. Magic Lv50. (1x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Physical_Missile.png'
  },
  {
    id: 'Heavy-Physical-Missile',
    name: 'Heavy Physical Missile',
    description: '[Petram Gravis] Req. Magic Lv75. (1.5x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Heavy_Physical_Missile.png'
  },
  {
    id: 'Light-Heal',
    name: 'Light Heal',
    description: '[Sana] Req. Magic Lv15. (Heals the target for 350 + user\'s total Magic Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Light_Heal.png'
  },
  {
    id: 'Heal',
    name: 'Heal',
    description: '[Consano] Req. Magic Lv30. (Heals the target for 750 + user\'s total Magic Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Heal.png'
  },
  {
    id: 'Heavy-Heal',
    name: 'Heavy Heal',
    description: '[Percuro] Req. Magic Lv70. (Heals the target for 1500 + user\'s total Magic Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Heavy_Heal.png'
  },
  {
    id: 'Light-Holy-Missile',
    name: 'Light Holy Missile',
    description: '[Sanctus Minima] Req. Magic Lv25. (0.5x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Light_Holy_Missile.png'
  },
  {
    id: 'Holy-Missile',
    name: 'Holy Missile',
    description: '[Sanctus] Req. Magic Lv50. (1x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Holy_Missile.png'
  },
    {
    id: 'Heavy-Holy-Missile',
    name: 'Heavy Holy Missile',
    description: '[Sanctus Gravis] Req. Magic Lv75. (1.5x Attack Power)',
    type: 'Rune',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Runes/Heavy_Holy_Missile.png'
  },

// Food
  {
    id: 'Cheese',
    name: 'Cheese',
    description: '2 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Cheese.png'
  },
  {
    id: 'Apple',
    name: 'Apple',
    description: '2 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Apple.png'
  },
  {
    id: 'Carrot',
    name: 'Carrot',
    description: '2 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Carrot.png'
  },
  {
    id: 'Banana',
    name: 'Banana',
    description: '2 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Banana.png'
  },
  {
    id: 'Cherries',
    name: 'Cherries',
    description: '2 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Cherries.png'
  },
  {
    id: 'Egg',
    name: 'Egg',
    description: '2 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Egg.png'
  },
  {
    id: 'Grapes',
    name: 'Grapes',
    description: '2 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Grapes.png'
  },
  {
    id: 'Tomato',
    name: 'Tomato',
    description: '2 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Tomato.png'
  },
  {
    id: 'Mushroom',
    name: 'Mushroom',
    description: '2 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Mushroom.png'
  },
  {
    id: 'Candy-Cane',
    name: 'Candy Cane',
    description: '3 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Candy_Cane.png'
  },
  {
    id: 'Tough-Meat',
    name: 'Tough Meat',
    description: '5 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Tough_Meat.png'
  },
  {
    id: 'Turnip',
    name: 'Turnip',
    description: '7 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Turnip.png'
  },
  {
    id: 'Biscot',
    name: 'Biscot',
    description: '7 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Biscot.png'
  },
  {
    id: 'Tough-Meat',
    name: 'Tough Meat',
    description: '8 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Tough_Meat.png'
  },
  {
    id: 'Pie',
    name: 'Pie',
    description: '30 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Pie.png'
  },
  {
    id: 'Magic-Candy',
    name: 'Magic Candy',
    description: '100 Nourishment',
    type: 'Food',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Food/Magic_Candy.png'
  },

// Armour - Knight
  {
    id: 'Platinum-Armour',
    name: 'Platinum Armour',
    description: 'Req Lv.60. Max Stats: 21melee or 14/14',
    type: 'Armour',
    baseStats: { damage: 4, weight: 20 },
    image: 'Items/Armour/Platinum_Armour.png'
  },

  // Materials
  {
    id: 'Blue-Ear',
    name: 'Blue Ear',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Blue-ear.png'
  },
  {
    id: 'Blue-Goo',
    name: 'Blue Goo',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Blue-goo.png'
  },
  {
    id: 'Blue-Tail',
    name: 'Blue Tail',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Blue-tail.png'
  },
  {
    id: 'Bone',
    name: 'Bone',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Bone.png'
  },
  {
    id: 'Branch',
    name: 'Branch',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Branch.png'
  },
  {
    id: 'Broken-Staff',
    name: 'Broken Staff',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Broken-staff.png'
  },
  {
    id: 'Chaos-Fragments',
    name: 'Chaos Fragments',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Chaos-fragments.png'
  },
  {
    id: 'Chaos-Shard',
    name: 'Chaos Shard',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Chaos-shard.png'
  },
  {
    id: 'Crab-Claw',
    name: 'Crab Claw',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Crab-claw.png'
  },
  {
    id: 'Cursed-Eye',
    name: 'Cursed Eye',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Cursed-eye.png'
  },
  {
    id: 'Cursed-Teeth',
    name: 'Cursed Teeth',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Cursed-teeth.png'
  },
  {
    id: 'Demon-Bone',
    name: 'Demon Bone',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Demon-bone.png'
  },
  {
    id: 'Ectoplasm',
    name: 'Ectoplasm',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Ectoplasm.png'
  },
  {
    id: 'Giant-Eye',
    name: 'Giant Eye',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Giant-eye.png'
  },
  {
    id: 'Giant-Horn',
    name: 'Giant Horn',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Giant-horn.png'
  },
  {
    id: 'Giant-Toe',
    name: 'Giant Toe',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Giant-toe.png'
  },
  {
    id: 'Green-Goo',
    name: 'Green Goo',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Green-goo.png'
  },
  {
    id: 'Green-Leather',
    name: 'Green Leather',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Green-leather.png'
  },
  {
    id: 'Hoof',
    name: 'Hoof',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Hoof.png'
  },
  {
    id: 'Human-Ear',
    name: 'Human Ear',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Human-ear.png'
  },
  {
    id: 'Ice-Shard',
    name: 'Ice Shard',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Ice-shard.png'
  },
  {
    id: 'Mandible',
    name: 'Mandible',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Mandible.png'
  },
  {
    id: 'Metal-Plate',
    name: 'Metal Plate',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Metal-plate.png'
  },
  {
    id: 'Minotaur-Horn',
    name: 'Minotaur Horn',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Minotaur-horn.png'
  },
  {
    id: 'Molten-Core',
    name: 'Molten Core',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Molten-core.png'
  },
  {
    id: 'Ponytail',
    name: 'Ponytail',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Ponytail.png'
  },
  {
    id: 'Razor-Claws',
    name: 'Razor Claws',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Razor-claws.png'
  },
  {
    id: 'Red-Goo',
    name: 'Red Goo',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Red-goo.png'
  },
  {
    id: 'Red-Scales',
    name: 'Red Scales',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Red-scales.png'
  },
  {
    id: 'Red-Tail',
    name: 'Red Tail',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Red-tail.png'
  },
  {
    id: 'Skull',
    name: 'Skull',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Skull.png'
  },
  {
    id: 'Spider-Leg',
    name: 'Spider Leg',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Spider-leg.png'
  },
  {
    id: 'Troll-Fur',
    name: 'Troll Fur',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Troll-fur.png'
  },
  {
    id: 'Wasp-Stinger',
    name: 'Wasp Stinger',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Wasp-stinger.png'
  },
  {
    id: 'Wasp-Wing',
    name: 'Wasp Wing',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Wasp-wing.png'
  },
  {
    id: 'Widow-Leg',
    name: 'Widow Leg',
    description: 'NONE',
    type: 'Material',
    baseStats: { damage: 0, weight: 0 },
    image: 'Items/Mats/Widow-leg.png'
  },
];

// Build fast lookup map for item types (O(1) retrieval)
const ITEM_TYPE_MAP = (() => {
  const map = Object.create(null);
  for (const it of ITEM_TYPES) map[it.id] = it;
  return map;
})();

// Helper to get item by ID (constant time)
function getItemType(itemId) {
  return ITEM_TYPE_MAP[itemId] || null;
}

// Helper to get all items of a type
function getItemsByType(type) {
  return ITEM_TYPES.filter(item => item.type === type);
}

// Get unique item types/categories
function getItemCategories() {
  return [...new Set(ITEM_TYPES.map(item => item.type))];
}
