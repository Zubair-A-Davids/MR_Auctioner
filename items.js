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
// Armour - Ranger
  {
    id: 'Spiked-Armour',
    name: 'Spiked Armour',
    description: 'Req Lv.70. Max Stats: 24distance or 16/16',
    type: 'Armour',
    baseStats: { damage: 5, weight: 20 },
    image: 'Items/Armour/Spiked_Armour.png'
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
];

// Helper to get item by ID
function getItemType(itemId) {
  return ITEM_TYPES.find(item => item.id === itemId);
}

// Helper to get all items of a type
function getItemsByType(type) {
  return ITEM_TYPES.filter(item => item.type === type);
}

// Get unique item types/categories
function getItemCategories() {
  return [...new Set(ITEM_TYPES.map(item => item.type))];
}
