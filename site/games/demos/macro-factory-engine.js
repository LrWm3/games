/* MacroFactory simulation. One tick represents 100 ms. */
(function (root) {
"use strict";

const DB = {
  // Zoom scales define the physical size multipliers and zoom visibility
  SCALES: {
    0: { id: 0, name: "Micro", size: 1, nodeRadius: 40, mapSpread: 3000, count: 50 },
    1: { id: 1, name: "Macro", size: 10, nodeRadius: 400, mapSpread: 25000, count: 30 },
    2: { id: 2, name: "Mega", size: 100, nodeRadius: 4000, mapSpread: 150000, count: 15 },
  },

  RESOURCES: {
    'iron_ore':    { id: 'iron_ore', name: 'Iron Ore', color: '#a39b8e', scale: 0, icon: 'stone' },
    'copper_ore':  { id: 'copper_ore', name: 'Copper Ore', color: '#b87333', scale: 0, icon: 'stone' },
    'iron_plate':  { id: 'iron_plate', name: 'Iron Plate', color: '#cfcfcf', scale: 0, icon: 'plate' },
    'copper_wire': { id: 'copper_wire', name: 'Copper Wire', color: '#d98a55', scale: 0, icon: 'wire' },
    'circuit':     { id: 'circuit', name: 'Circuit', color: '#2ecc71', scale: 0, icon: 'chip' },
    'titanium':    { id: 'titanium', name: 'Titanium Ore', color: '#8e44ad', scale: 1, icon: 'stone' },
    'plasteel':    { id: 'plasteel', name: 'Plasteel', color: '#95a5a6', scale: 1, icon: 'plate' },
    'microchip':   { id: 'microchip', name: 'Microchip', color: '#3498db', scale: 1, icon: 'chip' },
    'uranium':     { id: 'uranium', name: 'Uranium', color: '#27ae60', scale: 2, icon: 'stone' },
    'quantum_core':{ id: 'quantum_core', name: 'Quantum Core', color: '#f1c40f', scale: 2, icon: 'chip' },
  },

  RECIPES: {
    'smelt_iron':    { id: 'smelt_iron', name: 'Smelt Iron', inputs: {'iron_ore': 1}, outputs: {'iron_plate': 1}, time: 20, buildingType: 'factory_0' },
    'smelt_copper':  { id: 'smelt_copper', name: 'Smelt Copper', inputs: {'copper_ore': 1}, outputs: {'copper_wire': 2}, time: 20, buildingType: 'factory_0' },
    'craft_circuit': { id: 'craft_circuit', name: 'Basic Circuit', inputs: {'iron_plate': 1, 'copper_wire': 2}, outputs: {'circuit': 1}, time: 40, buildingType: 'factory_0' },
    
    'smelt_titanium':{ id: 'smelt_titanium', name: 'Forge Plasteel', inputs: {'titanium': 2, 'iron_plate': 2}, outputs: {'plasteel': 1}, time: 60, buildingType: 'factory_1' },
    'craft_micro':   { id: 'craft_micro', name: 'Adv. Microchip', inputs: {'circuit': 4, 'plasteel': 1}, outputs: {'microchip': 1}, time: 80, buildingType: 'factory_1' },
    
    'craft_quantum': { id: 'craft_quantum', name: 'Quantum Core', inputs: {'uranium': 5, 'microchip': 5}, outputs: {'quantum_core': 1}, time: 150, buildingType: 'factory_2' },
  },

  BUILDINGS: {
    'hub': { id: 'hub', name: 'Central Command', type: 'depot', scale: 0, size: 60, color: '#34495e', cost: {} },
    
    'miner_0':   { id: 'miner_0', name: 'Micro Miner', type: 'miner', scale: 0, size: 30, color: '#e67e22', cost: {'iron_plate': 10}, extracts: 0 },
    'factory_0': { id: 'factory_0', name: 'Micro Assembler', type: 'factory', scale: 0, size: 35, color: '#e74c3c', cost: {'iron_plate': 20, 'copper_wire': 10} },
    'depot_0':   { id: 'depot_0', name: 'Micro Depot', type: 'depot', scale: 0, size: 40, color: '#2c3e50', cost: {'iron_plate': 30} },

    'miner_1':   { id: 'miner_1', name: 'Macro Extractor', type: 'miner', scale: 1, size: 300, color: '#d35400', cost: {'iron_plate': 100, 'circuit': 50}, extracts: 1 },
    'factory_1': { id: 'factory_1', name: 'Macro Foundry', type: 'factory', scale: 1, size: 350, color: '#c0392b', cost: {'iron_plate': 150, 'circuit': 100} },
    'depot_1':   { id: 'depot_1', name: 'Macro Depot', type: 'depot', scale: 1, size: 400, color: '#1a252f', cost: {'plasteel': 150} },

    'miner_2':   { id: 'miner_2', name: 'Mega Drill', type: 'miner', scale: 2, size: 3000, color: '#8e44ad', cost: {'plasteel': 100, 'microchip': 100}, extracts: 2 },
    'factory_2': { id: 'factory_2', name: 'Mega Forge', type: 'factory', scale: 2, size: 3500, color: '#9b59b6', cost: {'plasteel': 150, 'microchip': 150} },
  }
};

const RAW_RESOURCES = { 0: ['iron_ore', 'copper_ore'], 1: ['titanium'], 2: ['uranium'] };
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function createWorld(random = Math.random) {
  // Starter deposits stay visible from Central Command on small screens, too.
  const nodes = [
    { id: 'node_0', resourceId: 'iron_ore', scale: 0, x: -150, y: 100, radius: 40 },
    { id: 'node_1', resourceId: 'copper_ore', scale: 0, x: 150, y: 100, radius: 40 },
  ];
  for (const scale of Object.values(DB.SCALES)) {
    const resources = RAW_RESOURCES[scale.id];
    for (let i = scale.id === 0 ? 2 : 0; i < scale.count; i++) {
      const angle = random() * Math.PI * 2;
      const radius = (random() * 0.8 + 0.2) * scale.mapSpread;
      nodes.push({
        id: `node_${nodes.length}`, resourceId: resources[Math.floor(random() * resources.length)],
        scale: scale.id, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius,
        radius: scale.nodeRadius,
      });
    }
  }
  return {
    nodes, nextId: 1, connections: [],
    buildings: {
      hub: { id: 'hub', typeId: 'hub', x: 0, y: 0, inputs: {},
        outputs: { iron_plate: 50, copper_wire: 50 }, activeRecipe: null, progress: 0 },
    },
    camera: { x: 0, y: 0, zoom: 1 },
  };
}

function inventory(state) {
  const result = {};
  for (const building of Object.values(state.buildings)) {
    if (DB.BUILDINGS[building.typeId].type !== 'depot') continue;
    for (const [resource, amount] of Object.entries(building.outputs)) {
      result[resource] = (result[resource] || 0) + amount;
    }
  }
  return result;
}

function canAfford(state, cost) {
  const stock = inventory(state);
  return Object.entries(cost).every(([resource, amount]) => (stock[resource] || 0) >= amount);
}

function depositFor(state, type, position) {
  return state.nodes.find(node => node.scale === type.extracts && distance(position, node) <= node.radius);
}

function placementError(state, typeId, x, y) {
  const type = DB.BUILDINGS[typeId];
  if (!type || typeId === 'hub') return 'Choose a construction template.';
  if (!Number.isFinite(x) || !Number.isFinite(y)) return 'Choose a point on the map.';
  if (type.type === 'miner' && !depositFor(state, type, { x, y })) {
    return `Place on a ${DB.SCALES[type.extracts].name} resource deposit.`;
  }
  for (const other of Object.values(state.buildings)) {
    const clearance = (type.size + DB.BUILDINGS[other.typeId].size) / 2 + 8;
    if (Math.abs(x - other.x) < clearance && Math.abs(y - other.y) < clearance) {
      return 'Leave space between buildings.';
    }
  }
  if (!canAfford(state, type.cost)) return 'Not enough resources in network storage.';
  return null;
}

function build(state, typeId, x, y) {
  const error = placementError(state, typeId, x, y);
  if (error) return { error };
  const remaining = { ...DB.BUILDINGS[typeId].cost };
  for (const building of Object.values(state.buildings)) {
    if (DB.BUILDINGS[building.typeId].type !== 'depot') continue;
    for (const resource of Object.keys(remaining)) {
      const take = Math.min(building.outputs[resource] || 0, remaining[resource]);
      if (take > 0) building.outputs[resource] -= take;
      remaining[resource] -= take;
    }
  }
  const id = `building_${state.nextId++}`;
  state.buildings[id] = { id, typeId, x, y, inputs: {}, outputs: {}, activeRecipe: null, progress: 0 };
  return { building: state.buildings[id] };
}

function route(state, from, to) {
  const source = state.buildings[from];
  const target = state.buildings[to];
  if (!source || !target || from === to) return 'Choose another building.';
  const type = DB.BUILDINGS[target.typeId];
  if (type.type === 'miner') return 'Miners only send resources. Choose a factory or depot.';
  if (type.type === 'factory' && !target.activeRecipe) return 'Choose a destination recipe first.';
  if (state.connections.some(link => link.from === from && link.to === to)) return 'Route already exists.';
  state.connections.push({ from, to, cursor: 0 });
  return null;
}

function returnInputs(state, building) {
  const stock = state.buildings.hub.outputs;
  if (building.progress > 0 && building.activeRecipe) {
    for (const [resource, amount] of Object.entries(DB.RECIPES[building.activeRecipe].inputs)) {
      stock[resource] = (stock[resource] || 0) + amount;
    }
  }
  for (const [resource, amount] of Object.entries(building.inputs)) {
    stock[resource] = (stock[resource] || 0) + amount;
  }
  building.inputs = {};
  building.progress = 0;
}

function setRecipe(state, id, recipeId) {
  const building = state.buildings[id];
  const recipe = DB.RECIPES[recipeId];
  if (!building || !recipe || recipe.buildingType !== building.typeId) return false;
  if (building.activeRecipe === recipeId) return true;
  returnInputs(state, building);
  building.activeRecipe = recipeId;
  return true;
}

function dismantle(state, id) {
  const building = state.buildings[id];
  if (!building || id === 'hub') return false;
  returnInputs(state, building);
  const stock = state.buildings.hub.outputs;
  for (const amounts of [DB.BUILDINGS[building.typeId].cost, building.outputs]) {
    for (const [resource, amount] of Object.entries(amounts)) {
      stock[resource] = (stock[resource] || 0) + amount;
    }
  }
  state.connections = state.connections.filter(link => link.from !== id && link.to !== id);
  delete state.buildings[id];
  return true;
}

function tick(state) {
  for (const building of Object.values(state.buildings)) {
    const type = DB.BUILDINGS[building.typeId];
    if (type.type === 'miner') {
      const node = depositFor(state, type, building);
      if (node && ++building.progress >= 20) {
        building.outputs[node.resourceId] = (building.outputs[node.resourceId] || 0) + 1;
        building.progress = 0;
      }
    }
    if (type.type === 'factory' && building.activeRecipe) {
      const recipe = DB.RECIPES[building.activeRecipe];
      if (building.progress === 0) {
        if (Object.entries(recipe.inputs).every(([resource, amount]) => (building.inputs[resource] || 0) >= amount)) {
          for (const [resource, amount] of Object.entries(recipe.inputs)) building.inputs[resource] -= amount;
          building.progress = 1;
        }
      } else if (++building.progress >= recipe.time) {
        for (const [resource, amount] of Object.entries(recipe.outputs)) {
          building.outputs[resource] = (building.outputs[resource] || 0) + amount;
        }
        building.progress = 0;
      }
    }
  }

  for (const link of state.connections) {
    const source = state.buildings[link.from];
    const target = state.buildings[link.to];
    if (!source || !target) continue;
    const storage = DB.BUILDINGS[target.typeId].type === 'depot';
    const recipe = DB.RECIPES[target.activeRecipe];
    const resources = Object.keys(source.outputs);
    // Rotate resource priority; cap factory buffers so one input cannot starve the rest.
    for (let offset = 0; offset < resources.length; offset++) {
      const index = (link.cursor + offset) % resources.length;
      const resource = resources[index];
      if (source.outputs[resource] <= 0) continue;
      if (!storage && (!recipe?.inputs[resource] || (target.inputs[resource] || 0) >= recipe.inputs[resource] * 2)) continue;
      const destination = storage ? target.outputs : target.inputs;
      source.outputs[resource]--;
      destination[resource] = (destination[resource] || 0) + 1;
      link.cursor = (index + 1) % resources.length;
      break;
    }
  }
}

const api = { DB, createWorld, inventory, canAfford, placementError, build, route, setRecipe, dismantle, tick };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else root.MacroFactory = api;
})(globalThis);
