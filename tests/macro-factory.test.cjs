const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DB, createWorld, inventory, build, route, setRecipe, dismantle, tick } = require('../site/games/demos/macro-factory-engine.js');
const run = (state, count) => { for (let i = 0; i < count; i++) tick(state); };

// Fixed randomness keeps deposits reproducible without bypassing game logic.
const world = () => createWorld(() => .5);

test('given a new world, when deposits spawn, then only raw resources appear and starter ores are nearby', () => {
  const state = world();
  assert.equal(state.nodes.length, 95);
  assert.deepEqual(state.nodes.slice(0, 2).map(node => node.resourceId), ['iron_ore', 'copper_ore']);
  assert.ok(state.nodes.every(node => ['iron_ore', 'copper_ore', 'titanium', 'uranium'].includes(node.resourceId)));
});

test('given a new building, when selected by its ID, then its stored entity resolves', () => {
  const state = world();
  const { building } = build(state, 'miner_0', -150, 100);
  assert.equal(state.buildings[building.id], building);
  assert.equal(inventory(state).iron_plate, 40);
});

test('given limited storage, when construction repeats or overlaps, then invalid builds spend nothing', () => {
  const state = world();
  assert.ok(build(state, 'factory_0', 0, 0).error);
  assert.equal(inventory(state).iron_plate, 50);
  assert.ok(build(state, 'miner_0', 300, 0).error);
  build(state, 'factory_0', 100, 0);
  build(state, 'factory_0', 200, 0);
  assert.ok(build(state, 'factory_0', 300, 0).error);
  assert.equal(inventory(state).iron_plate, 10);
  assert.equal(Object.keys(state.buildings).length, 3);
});

test('given iron production routes, when simulation advances, then mined ore becomes stored plates', () => {
  const state = world();
  const miner = build(state, 'miner_0', -150, 100).building;
  const factory = build(state, 'factory_0', -100, 0).building;
  assert.equal(setRecipe(state, factory.id, 'smelt_iron'), true);
  assert.equal(route(state, miner.id, factory.id), null);
  assert.equal(route(state, factory.id, 'hub'), null);
  run(state, 101);
  assert.equal(inventory(state).iron_plate, 24);
  assert.equal(factory.outputs.iron_plate, 0);
});

test('given routing, when a duplicate, self-link or invalid destination is chosen, then it is rejected', () => {
  const state = world();
  const miner = build(state, 'miner_0', -150, 100).building;
  const factory = build(state, 'factory_0', -100, 0).building;
  assert.ok(route(state, 'hub', 'hub'));
  assert.ok(route(state, 'hub', miner.id));
  assert.ok(route(state, miner.id, factory.id));
  assert.ok(route(state, miner.id, 'missing'));
  assert.equal(route(state, miner.id, 'hub'), null);
  assert.ok(route(state, miner.id, 'hub'));
  assert.equal(state.connections.length, 1);
});

test('given unequal input stock, when a circuit factory receives materials, then both inputs arrive without draining storage', () => {
  const state = world();
  const factory = build(state, 'factory_0', 100, 0).building;
  state.buildings.hub.outputs.iron_plate = 1000;
  setRecipe(state, factory.id, 'craft_circuit');
  route(state, 'hub', factory.id);
  route(state, factory.id, 'hub');
  run(state, 90);
  assert.ok(inventory(state).circuit >= 2);
  assert.ok(factory.inputs.iron_plate <= 2);
  assert.ok(factory.inputs.copper_wire <= 4);
  assert.ok(inventory(state).iron_plate > 990);
});

test('given active production, when recipes change or machines are dismantled, then ingredients and costs return', () => {
  const state = world();
  const factory = build(state, 'factory_0', 100, 0).building;
  setRecipe(state, factory.id, 'craft_circuit');
  route(state, 'hub', factory.id);
  run(state, 10);
  assert.ok(factory.progress > 0);
  assert.equal(setRecipe(state, factory.id, 'craft_quantum'), false);
  setRecipe(state, factory.id, 'smelt_iron');
  assert.equal(inventory(state).iron_plate, 30);
  assert.equal(inventory(state).copper_wire, 40);
  assert.deepEqual(factory.inputs, {});
  assert.equal(dismantle(state, factory.id), true);
  assert.equal(inventory(state).iron_plate, 50);
  assert.equal(inventory(state).copper_wire, 50);
  assert.equal(state.connections.length, 0);
  assert.equal(dismantle(state, 'hub'), false);
});

test('given tier entry costs, when resources unlock in order, then every recipe is reachable without circular prerequisites', () => {
  const available = new Set();
  const built = new Set(['hub']);
  let changed = true;
  while (changed) {
    changed = false;
    for (const type of Object.values(DB.BUILDINGS)) {
      // Initial stock can bootstrap micro machines; later tiers need manufactured inputs.
      const costAvailable = Object.keys(type.cost).every(id => available.has(id) || (type.scale === 0 && ['iron_plate', 'copper_wire'].includes(id)));
      if (built.has(type.id) || !costAvailable) continue;
      built.add(type.id); changed = true;
      if (type.type === 'miner') {
        for (const node of world().nodes.filter(node => node.scale === type.extracts)) available.add(node.resourceId);
      }
    }
    for (const recipe of Object.values(DB.RECIPES)) {
      if (!built.has(recipe.buildingType) || !Object.keys(recipe.inputs).every(id => available.has(id))) continue;
      for (const id of Object.keys(recipe.outputs)) {
        if (!available.has(id)) { available.add(id); changed = true; }
      }
    }
  }
  assert.ok(available.has('quantum_core'));
  assert.equal(built.size, Object.keys(DB.BUILDINGS).length);
});
