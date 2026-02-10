// This file assumes 'reply-all-consts.js' has already been imported.
// Engine helpers are intentionally DOM-free. Provide state/context explicitly.
(function initReplyAllEngine(global) {
  const ReplyAllEngine = {};

  // ---------- RNG + Streams ----------
  function hashSeed(base, label) {
    let h = 2166136261;
    const s = `${base}:${label}`;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function createRng(seed) {
    let t = seed >>> 0;
    return {
      next() {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), t | 1);
        r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      },
      get state() {
        return t >>> 0;
      },
      set state(value) {
        t = (value >>> 0) || 0;
      },
    };
  }

  function ensureSeed(state) {
    if (!state.seed) state.seed = Date.now() >>> 0;
    if (!state.rngStates) state.rngStates = {};
  }

  function createRngStore() {
    const streams = {};
    return {
      reset() {
        Object.keys(streams).forEach((k) => delete streams[k]);
      },
      getStream(state, key) {
        ensureSeed(state);
        if (!streams[key]) {
          const seed = hashSeed(state.seed, key);
          const rng = createRng(seed);
          if (state.rngStates[key] != null) {
            rng.state = state.rngStates[key];
          }
          streams[key] = rng;
        }
        return streams[key];
      },
      next(state, key) {
        const rng = this.getStream(state, key);
        const value = rng.next();
        state.rngStates[key] = rng.state;
        return value;
      },
      int(state, key, max) {
        return Math.floor(this.next(state, key) * max);
      },
      missionKey(state, missions, kind) {
        const mission = (missions || [])[state.currentMissionIndex] || {};
        const cycle = state.missionCycle || 0;
        return `mission:${mission.id || state.currentMissionIndex}:${cycle}:${kind}`;
      },
      shopKey(state) {
        const idx = state.shopVisitIndex || 0;
        return `shop:${idx}`;
      },
      randomString(state, key, length = 5) {
        let out = "";
        for (let i = 0; i < length; i++) {
          const val = this.int(state, key, 36);
          out += val.toString(36);
        }
        return out;
      },
    };
  }

  ReplyAllEngine.rng = {
    hashSeed,
    createRng,
    createRngStore,
  };

  // ---------- Stat Math Helpers ----------
  function computeUnitStats(ctx, unit, turnOverride = null) {
    const { getUnitStatBlocks, getSalutationWindowStats, getSalutationPersistentStats,
      getSignoffPersistentStats, getUnitWinScaleStats } = ctx;
    const stats = Object.fromEntries(STAT_FIELDS.map((f) => [f, 0]));
    if (!unit) return stats;

    (getUnitStatBlocks ? getUnitStatBlocks(unit) : []).forEach((block) => {
      if (!block) return;
      STAT_FIELDS.forEach((field) => {
        const value = block[field];
        if (typeof value === "number") stats[field] += value;
      });
    });

    if (unit.threadBonuses) {
      STAT_FIELDS.forEach((field) => {
        const value = unit.threadBonuses[field];
        if (typeof value === "number") stats[field] += value;
      });
    }

    if (unit.salutation && Array.isArray(unit.salutation.scalers)) {
      const ccCount = Array.isArray(unit.buffs)
        ? unit.buffs.filter((b) => b.usedBy === unit.name).length
        : 0;
      const sigCount = Array.isArray(unit.signatures) ? unit.signatures.length : 0;
      const counts = { cc: ccCount, sig: sigCount };
      unit.salutation.scalers.forEach((s) => {
        if (!s || !s.source || !s.stat) return;
        const count = counts[s.source] || 0;
        if (!count) return;
        const per = typeof s.per === "number" ? s.per : 0;
        stats[s.stat] = (stats[s.stat] || 0) + per * count;
      });
    }

    const salutationWindowStats = getSalutationWindowStats
      ? getSalutationWindowStats(unit, turnOverride)
      : null;
    if (salutationWindowStats) {
      STAT_FIELDS.forEach((field) => {
        const value = salutationWindowStats[field];
        if (typeof value === "number") stats[field] += value;
      });
    }

    const salutationPersistentStats = getSalutationPersistentStats
      ? getSalutationPersistentStats(unit)
      : null;
    if (salutationPersistentStats) {
      STAT_FIELDS.forEach((field) => {
        const value = salutationPersistentStats[field];
        if (typeof value === "number") stats[field] += value;
      });
    }

    const signoffPersistentStats = getSignoffPersistentStats
      ? getSignoffPersistentStats(unit)
      : null;
    if (signoffPersistentStats) {
      STAT_FIELDS.forEach((field) => {
        const value = signoffPersistentStats[field];
        if (typeof value === "number") stats[field] += value;
      });
    }

    const winScaleStats = getUnitWinScaleStats ? getUnitWinScaleStats(unit) : null;
    if (winScaleStats) {
      STAT_FIELDS.forEach((field) => {
        const value = winScaleStats[field];
        if (typeof value === "number") stats[field] += value;
      });
    }

    return stats;
  }

  function getUnitDamage(ctx, unit, type, turnOverride = null) {
    const stats = computeUnitStats(ctx, unit, turnOverride);
    const fieldMap = {
      single: { dmg: "singleDmg", mult: "singleDmgMult" },
      escalate: { dmg: "escalateDmg", mult: "escalateDmgMult" },
    };
    if (type === "replyAll") {
      const replyAllBase = 20;
      const singleBase = stats.singleDmg || 0;
      const escalateBase = stats.escalateDmg || 0;
      const singleMult = 1 + (stats.singleDmgMult || 0);
      const escalateMult = 1 + (stats.escalateDmgMult || 0);
      const globalFlat = stats.globalDmg || 0;
      const total =
        replyAllBase +
        (singleBase * singleMult) / 4 +
        (escalateBase * escalateMult) / 2 +
        globalFlat;
      return Math.floor(total);
    }
    const fields = fieldMap[type] || fieldMap.single;
    const base = stats[fields.dmg] || 0;
    const flat = stats.globalDmg || 0;
    const mult = 1 + (stats.globalDmgMult || 0) + (stats[fields.mult] || 0);
    let total = Math.floor((base + flat) * mult);
    if (type === "escalate" && unit && unit.signOff?.addSingleToEscalate) {
      const singleBase = stats.singleDmg || 0;
      const singleMult = 1 + (stats.singleDmgMult || 0);
      const singleComponent = Math.floor(singleBase * singleMult);
      total += singleComponent;
    }
    return total;
  }

  function getUnitDeflectReduce(ctx, unit) {
    const stats = computeUnitStats(ctx, unit);
    return stats.deflect || 0;
  }

  function getUnitDeflectReflect(ctx, unit) {
    const stats = computeUnitStats(ctx, unit);
    return stats.retaliation || 0;
  }

  function getUnitFlatDef(ctx, unit) {
    return computeUnitStats(ctx, unit).defFlat;
  }

  function getUnitTotalHeal(ctx, unit) {
    return computeUnitStats(ctx, unit).heal;
  }

  function getUnitSelfPromoteHeal(ctx, unit, base) {
    const stats = computeUnitStats(ctx, unit);
    return (base || 0) + (stats.selfPromoteHeal || 0);
  }

  function getUnitFollowUpChance(ctx, unit) {
    const chance = computeUnitStats(ctx, unit).followUpChance;
    return Math.max(0, chance || 0);
  }

  function getUnitEscalateRecover(ctx, unit) {
    return computeUnitStats(ctx, unit).escalateRecoverPerHit;
  }

  function getUnitAddressLimit(ctx, unit) {
    const limit = computeUnitStats(ctx, unit).addressLimit;
    return Math.max(0, Math.floor(limit));
  }

  ReplyAllEngine.stats = {
    computeUnitStats,
    getUnitDamage,
    getUnitDeflectReduce,
    getUnitDeflectReflect,
    getUnitFlatDef,
    getUnitTotalHeal,
    getUnitSelfPromoteHeal,
    getUnitFollowUpChance,
    getUnitEscalateRecover,
    getUnitAddressLimit,
  };

  // ----------- Phase 3 core -----------

  // 3.1 Engine State Shape & Init
  function createInitialRunState(config) {
    return {
      seed: config?.seed ?? null,
      rngStates: {},
      playerName: config?.playerName ?? "Employee",
      departmentId: config?.departmentId ?? null,
      prestigeId: config?.prestigeId ?? null,
      currentMissionIndex: 0,
      missionCycle: 0,
      shopVisitIndex: 0,
      missionActive: false,
      gameOver: false,
      gameWon: false,
      winReason: null,
      lossReason: null,
      opponents: [],
      player: null,
      shop: {
        directItems: [],
        packs: [],
        rerollCount: 0,
      },
      packsOpen: {},
      logs: [],
      // TODO: add additional runtime fields
    };
  }

  function initRun(config) {
    return createInitialRunState(config);
  }

  function rehydrateRunState(serialized) {
    return createInitialRunState(serialized || {});
  }

  // 3.2 Mission Lifecycle
  function buildOpponentsForMission(state, mission, data, helpers = {}) {
    const employees = data?.employees || [];
    const opponentBaseStats = mission?.opponentBaseStats || {};
    const missionLinesOnly = !!mission?.onlyMissionLines;
    const opponents = (mission?.opponents || []).map((missionOpponent) => {
      const employee = employees.find((e) => e.id === missionOpponent.employeeId);
      const clone = {
        ...(employee ? JSON.parse(JSON.stringify(employee)) : {}),
        ...JSON.parse(JSON.stringify(opponentBaseStats)),
        ...JSON.parse(JSON.stringify(missionOpponent)),
      };
      if (helpers.applyUnitDefaults) helpers.applyUnitDefaults(clone);
      if (employee?.id) clone.employeeId = employee.id;
      clone.hp = clone.maxHp;
      clone.buffs = [];
      clone.deflectCharge = 0;
      clone.deflectChargeReflect = 0;
      clone.deflectChargeReduce = 0;
      clone.threadBonuses = {};
      clone._lineBags = {};
      const lines = Array.isArray(employee?.lines) ? employee.lines : [];
      clone.attacks = lines
        .filter((l) =>
          missionLinesOnly
            ? l.missionId === mission?.id
            : l.missionId === null || l.missionId === mission?.id,
        )
        .map((l) => l.text);
      return clone;
    });
    return opponents;
  }

  function startMission(state, missionId, data, helpers = {}) {
    const missions = data?.missions || [];
    const missionIndex =
      missionId != null
        ? missions.findIndex((m) => m.id === missionId)
        : state.currentMissionIndex || 0;
    state.currentMissionIndex =
      missionIndex >= 0 ? missionIndex : state.currentMissionIndex || 0;
    const mission = missions[state.currentMissionIndex] || missions[0] || null;

    state.gameOver = false;
    state.gameWon = false;
    state.lossReason = null;
    state.winReason = null;
    state.missionActive = true;
    state.turn = 0;
    state.isProcessing = false;
    state.roundEndUpgrades = {};
    state.expenseReportActive = false;
    state.threadEffectFlags = {};

    const p = state.player;
    if (p) {
      if (helpers.applyUnitDefaults) helpers.applyUnitDefaults(p);
      p._lineBags = {};
      p.ult = 0;
      p.buffs = [];
      p.deflectCharge = 0;
      p.deflectChargeReflect = 0;
      p.deflectChargeReduce = 0;
      p.threadBonuses = {};
      if (helpers.computeUnitStats) {
        const baseStats = helpers.computeUnitStats(p);
        p.hp = baseStats?.maxHp ?? p.hp;
        p.currentWins = Math.max(0, Math.floor(baseStats?.wins || 0));
      } else {
        p.hp = p.maxHp ?? p.hp;
        p.currentWins = Math.max(0, Math.floor(p.wins || 0));
      }
    }

    if (helpers.resetContactUsage && Array.isArray(data?.contacts)) {
      helpers.resetContactUsage(data.contacts);
    }

    if (helpers.runUnitEffects && p) {
      helpers.runUnitEffects(p, "thread_start", {});
    }

    state.opponents = buildOpponentsForMission(state, mission, data, helpers);
    state.removedTotal = state.opponents.length;
    state.removedByPlayer = 0;
    state.targetId = state.opponents[0]?.id || null;

    return state;
  }

  function startRound(state, helpers = {}) {
    state.roundEndUpgrades = {};
    if (helpers.onRoundStart) helpers.onRoundStart(state);
    return state;
  }

  function endRound(state, helpers = {}) {
    if (helpers.onRoundEnd) helpers.onRoundEnd(state);
    return state;
  }

  // 3.3 Action Resolution
  function planAiActions(state) {
    return {};
  }

  function applyPlayerAction(state, action, targetId) {
    return state;
  }

  function resolveTurn(state) {
    return state;
  }

  function resolveAction(state, action) {
    return state;
  }

  function resolveDamage(state, attacker, target, amount, options = {}) {
    return { dmg: 0, blocked: 0, reflected: 0 };
  }

  function resolveDeflect(state, unit) {
    return state;
  }

  function resolveFollowUps(state, attacker, target, baseDamage) {
    return [];
  }

  // 3.4 Effect Engine Hooks
  function runUnitEffects(state, unit, event, payload = {}) {
    return [];
  }

  function applyEffect(state, unit, effect, payload = {}) {
    return null;
  }

  function getEffectHandlers() {
    return {};
  }

  function getRngStore(state) {
    if (!state._rngStore) state._rngStore = ReplyAllEngine.rng.createRngStore();
    return state._rngStore;
  }

  function getRarityWeight(rarity) {
    if (rarity === "rare") return 1;
    if (rarity === "uncommon") return 4;
    return 10;
  }

  function getItemCostByType(rarity, type) {
    const table = {
      contact: { common: 3, uncommon: 4, rare: 6 },
      signature: { common: 3, uncommon: 4, rare: 6 },
      salutation: { common: 3, uncommon: 5, rare: 8 },
      signoff: { common: 3, uncommon: 5, rare: 8 },
      bcc: { common: 2, uncommon: 3, rare: 4 },
      dev: { common: 0, uncommon: 0, rare: 0 },
    };
    const row = table[type] || table.contact;
    return row[rarity] ?? row.common;
  }

  function getRerollCost(state) {
    const count = state.shop?.rerollCount || 0;
    return 2 + count;
  }

  function canAcquireItem(state, item, helpers = {}) {
    if (!item) return { ok: false, reason: "missing" };
    const p = state.player || {};
    if (item.itemType === "contact") {
      if ((p.addressBook || []).includes(item.id)) return { ok: false, reason: "owned" };
      let limit = p.addressLimit ?? 0;
      const statCtx = helpers.statCtx || state._statCtx;
      if (statCtx && ReplyAllEngine.stats?.computeUnitStats) {
        const stats = ReplyAllEngine.stats.computeUnitStats(statCtx, p);
        if (stats && typeof stats.addressLimit === "number") limit = stats.addressLimit;
      }
      if ((p.addressBook || []).length >= limit) return { ok: false, reason: "limit" };
    } else if (item.itemType === "signature") {
      if ((p.signatures || []).some((s) => s.id === item.id)) return { ok: false, reason: "owned" };
      const limit = p?.title?.sigLimit ?? p.sigLimit ?? p.signatureLimit ?? 0;
      if ((p.signatures || []).length >= limit) return { ok: false, reason: "limit" };
    } else if (item.itemType === "salutation") {
      // always allowed (replace)
    } else if (item.itemType === "signoff") {
      // always allowed (replace)
    } else if (item.itemType === "bcc") {
      let limit = p.bccLimit ?? 0;
      const statCtx = helpers.statCtx || state._statCtx;
      if (statCtx && ReplyAllEngine.stats?.computeUnitStats) {
        const stats = ReplyAllEngine.stats.computeUnitStats(statCtx, p);
        if (stats && typeof stats.bccLimit === "number") limit = stats.bccLimit;
      }
      const list = p.bccContacts || p.bccs || [];
      if (list.length >= limit) return { ok: false, reason: "limit" };
    }
    return { ok: true };
  }

  function applyCoachingBoosts(player, stats) {
    if (!player || !stats) return;
    if (!player.coachingBoosts) player.coachingBoosts = {};
    Object.keys(stats).forEach((key) => {
      const value = stats[key];
      if (typeof value !== "number") return;
      player.coachingBoosts[key] = (player.coachingBoosts[key] || 0) + value;
    });
  }

  function applyItemToState(state, item, source, helpers = {}) {
    const p = state.player || {};
    if (item.itemType === "contact") {
      p.addressBook = p.addressBook || [];
      if (!p.addressBook.includes(item.id)) p.addressBook.push(item.id);
    } else if (item.itemType === "signature") {
      p.signatures = p.signatures || [];
      if (!p.signatures.some((s) => s.id === item.id)) p.signatures.push(item);
    } else if (item.itemType === "salutation") {
      p.salutation = item;
    } else if (item.itemType === "signoff") {
      p.signOff = item;
    } else if (item.itemType === "bcc") {
      p.bccContacts = p.bccContacts || p.bccs || [];
      p.bccContacts.push(item);
    } else if (item.itemType === "dev") {
      const stats = item.stats || item;
      applyCoachingBoosts(p, stats);
    }
  }

  function pickWeighted(items, count, rngKey, state) {
    const pool = [];
    items.forEach((item) => {
      const weight = getRarityWeight(item.rarity || "common");
      for (let i = 0; i < weight; i++) pool.push(item);
    });
    if (pool.length === 0) return [];
    const results = [];
    const rngStore = getRngStore(state);
    for (let i = 0; i < count; i++) {
      if (pool.length === 0) break;
      const idx = rngStore.int(state, rngKey, pool.length);
      const selected = pool[idx];
      results.push(selected);
      const itemId = selected.id;
      for (let j = pool.length - 1; j >= 0; j--) {
        if (pool[j].id === itemId) pool.splice(j, 1);
      }
    }
    return results;
  }

  function pickWeightedType(weightMap, options, rngKey, state) {
    const pool = [];
    options.forEach((type) => {
      const weight = weightMap[type] || 0;
      for (let i = 0; i < weight; i++) pool.push(type);
    });
    if (pool.length === 0) return options[0] || null;
    const rngStore = getRngStore(state);
    return pool[rngStore.int(state, rngKey, pool.length)];
  }

  function buildTrainingUpgrades() {
    return TRAINING_UPGRADE_STATS.map((entry) => ({
      id: entry.id,
      name: entry.name,
      ...entry.stats,
    }));
  }

  function buildDirectPools(state) {
    const p = state.player || {};
    const contactPool = CONTACTS.filter(
      (c) => !(p.addressBook || []).includes(c.id) && !c.noShop,
    ).map((c) => ({ ...c, itemType: "contact" }));
    const sigPool = SIGNATURES.filter(
      (s) => !(p.signatures || []).some((sig) => sig.id === s.id),
    ).map((s) => ({ ...s, itemType: "signature" }));
    const salPool = SALUTATIONS.filter(
      (s) => !p.salutation || p.salutation.id !== s.id,
    ).map((s) => ({ ...s, itemType: "salutation" }));
    const offPool = SIGNOFFS.filter(
      (s) => !p.signOff || p.signOff.id !== s.id,
    ).map((s) => ({ ...s, itemType: "signoff" }));
    const bccPool = BCC_CONTACTS.map((b) => ({ ...b, itemType: "bcc" }));
    const devPool = buildTrainingUpgrades().map((u) => ({
      ...u,
      itemType: "dev",
    }));

    return {
      contact: contactPool,
      signature: sigPool,
      salutation: salPool,
      signoff: offPool,
      bcc: bccPool,
      dev: devPool,
    };
  }

  function generateDirectItems(directPools, rngKey, excludedIds, state) {
    const pools = {};
    for (const type in directPools) {
      pools[type] = directPools[type].filter((item) => !excludedIds.has(item.id));
    }
    const directItems = [];
    for (let i = 0; i < 2; i++) {
      const availableTypes = Object.keys(pools).filter(
        (type) => pools[type].length > 0,
      );
      if (availableTypes.length === 0) break;
      const pickedType = pickWeightedType(
        SHOP_DIRECT_TYPE_WEIGHTS,
        availableTypes,
        rngKey,
        state,
      );
      if (!pickedType) break;
      const selected = pickWeighted(pools[pickedType], 1, rngKey, state)[0];
      if (!selected) break;
      directItems.push({ ...selected, purchased: false });
      excludedIds.add(selected.id);
      pools[pickedType] = pools[pickedType].filter(
        (item) => item.id !== selected.id,
      );
    }
    return directItems;
  }

  function generatePack(type, tier, excludedIds, state) {
    const tiers = {
      small: { cost: 3, options: 2, picks: 1 },
      medium: { cost: 5, options: 3, picks: 1 },
      large: { cost: 7, options: 3, picks: 2 },
    };
    const rngStore = getRngStore(state);
    const shopKey = rngStore.shopKey(state);
    const t = tiers[tier];
    let pool = [];
    let typedPools = null;
    if (type === "contact") {
      pool = CONTACTS.filter(
        (c) => !(state.player?.addressBook || []).includes(c.id) && !c.noShop && !excludedIds.has(c.id),
      ).map((c) => ({ ...c, itemType: "contact" }));
    } else if (type === "email") {
      const sals = SALUTATIONS.filter(
        (s) =>
          (!state.player?.salutation || state.player.salutation.id !== s.id) &&
          !excludedIds.has(s.id),
      ).map((s) => ({ ...s, itemType: "salutation" }));
      const offs = SIGNOFFS.filter(
        (s) =>
          (!state.player?.signOff || state.player.signOff.id !== s.id) &&
          !excludedIds.has(s.id),
      ).map((s) => ({ ...s, itemType: "signoff" }));
      const sigs = SIGNATURES.filter(
        (s) =>
          !(state.player?.signatures || []).some((sig) => sig.id === s.id) &&
          !excludedIds.has(s.id),
      ).map((s) => ({ ...s, itemType: "signature" }));
      typedPools = { salutation: sals, signoff: offs, signature: sigs };
    } else if (type === "dev") {
      pool = buildTrainingUpgrades()
        .filter((u) => !excludedIds.has(u.id))
        .map((u) => ({ ...u, itemType: "dev" }));
    } else if (type === "bcc") {
      pool = BCC_CONTACTS.filter((b) => !excludedIds.has(b.id)).map((b) => ({
        ...b,
        itemType: "bcc",
      }));
    }

    const packNames = {
      contact: {
        small: "Personnel Mixer",
        medium: "Recruitment Drive",
        large: "Executive Search",
      },
      email: {
        small: "Comms Tune-up",
        medium: "Messaging Workshop",
        large: "Branding Overhaul",
      },
      dev: {
        small: "Lunch & Learn",
        medium: "Daily Professional Course",
        large: "Annual Conference",
      },
      bcc: {
        small: "Help Desk Onboarding",
        medium: "Tier 1 Support Ticket",
        large: "Priority Escalation Bundle",
      },
    };

    let options = [];
    if (type === "email" && typedPools) {
      for (let i = 0; i < t.options; i++) {
        const availableTypes = Object.keys(typedPools).filter(
          (key) => typedPools[key].length > 0,
        );
        if (availableTypes.length === 0) break;
        const pickedType = pickWeightedType(
          SHOP_DIRECT_TYPE_WEIGHTS,
          availableTypes,
          shopKey,
          state,
        );
        if (!pickedType) break;
        const picked = pickWeighted(typedPools[pickedType], 1, shopKey, state)[0];
        if (!picked) break;
        options.push(picked);
        excludedIds.add(picked.id);
        typedPools[pickedType] = typedPools[pickedType].filter(
          (item) => item.id !== picked.id,
        );
      }
    } else {
      options = pickWeighted(pool, t.options, shopKey, state);
      options.forEach((o) => excludedIds.add(o.id));
    }

    return {
      id: `pack_${type}_${tier}_${state.shopVisitIndex || 0}_${rngStore.int(state, shopKey, 1000000000)}`,
      type,
      tier,
      name: packNames[type]?.[tier] || `${tier.toUpperCase()} ${type.toUpperCase()} PACK`,
      description: `Pick ${t.picks} of ${t.options} ${type} options.`,
      cost: t.cost,
      options: options.map((o) => ({ ...o })),
      picks: t.picks,
      purchased: false,
    };
  }

  function generateShopItems(state) {
    const rngStore = getRngStore(state);
    const shopKey = rngStore.shopKey(state);
    const directPools = buildDirectPools(state);
    const excludedIds = new Set();
    state.shop.directItems = generateDirectItems(
      directPools,
      shopKey,
      excludedIds,
      state,
    );
    state.shop.packs = [];
    for (let i = 0; i < 2; i++) {
      const packTypePools = {
        contact: directPools.contact.filter((c) => !excludedIds.has(c.id)),
        email: [...directPools.salutation, ...directPools.signoff].filter(
          (e) => !excludedIds.has(e.id),
        ),
        dev: buildTrainingUpgrades().filter((d) => !excludedIds.has(d.id)),
        bcc: directPools.bcc.filter((b) => !excludedIds.has(b.id)),
      };
      const eligiblePackTypes = Object.keys(packTypePools).filter(
        (type) => packTypePools[type].length > 0,
      );
      if (eligiblePackTypes.length === 0) break;
      const type = pickWeightedType(
        SHOP_PACK_TYPE_WEIGHTS,
        eligiblePackTypes,
        shopKey,
        state,
      );
      if (!type) break;
      const tier = PACK_TIERS[rngStore.int(state, shopKey, PACK_TIERS.length)];
      state.shop.packs.push(generatePack(type, tier, excludedIds, state));
    }
  }

  // 3.5 Shop + Packs
  function enterShop(state) {
    if (!state.shop) {
      state.shop = { directItems: [], packs: [], rerollCount: 0 };
    }
    state.shop.rerollCount = 0;
    generateShopItems(state);
    return state;
  }

  function rerollShop(state) {
    if (!state.shop) {
      state.shop = { directItems: [], packs: [], rerollCount: 0 };
    }
    const cost = getRerollCost(state);
    if ((state.player?.reputation || 0) < cost) {
      return { ok: false, reason: "rep", cost };
    }
    state.player.reputation -= cost;
    state.shop.rerollCount = (state.shop.rerollCount || 0) + 1;
    const directPools = buildDirectPools(state);
    const excludedIds = new Set();
    if (Array.isArray(state.shop.packs)) {
      state.shop.packs.forEach((pack) => {
        (pack.options || []).forEach((opt) => excludedIds.add(opt.id));
      });
    }
    state.shop.directItems = generateDirectItems(
      directPools,
      "misc",
      excludedIds,
      state,
    );
    return { ok: true, cost, state };
  }

  function buyItem(state, item, helpers = {}) {
    if (!item) return { ok: false, reason: "missing" };
    const cost = item.cost || getItemCostByType(item.rarity || "common", item.itemType);
    if ((state.player?.reputation || 0) < cost) {
      return { ok: false, reason: "rep", cost };
    }
    if (item.purchased) return { ok: false, reason: "purchased" };
    const eligibility = canAcquireItem(state, item, helpers);
    if (!eligibility.ok) {
      return { ok: false, reason: eligibility.reason || "ineligible", cost };
    }
    state.player.reputation -= cost;
    item.purchased = true;
    applyItemToState(state, item, "shop", helpers);
    return { ok: true, cost, state };
  }

  function openPack(state, pack) {
    if (!pack) return { ok: false, reason: "missing" };
    if (pack.purchased) return { ok: false, reason: "purchased" };
    const cost = pack.cost || 0;
    if ((state.player?.reputation || 0) < cost) {
      return { ok: false, reason: "rep", cost };
    }
    state.player.reputation -= cost;
    pack.purchased = true;
    if (!state.packsOpen) state.packsOpen = {};
    state.packsOpen[pack.id] = {
      packId: pack.id,
      options: (pack.options || []).map((o) => o.id),
      picksLeft: pack.picks || 0,
    };
    state.activePackId = pack.id;
    return { ok: true, cost, state };
  }

  function selectPackItem(state, packId, itemId, helpers = {}) {
    const pack = (state.shop?.packs || []).find((p) => p.id === packId);
    if (!pack) return { ok: false, reason: "missing" };
    const open = state.packsOpen?.[packId];
    if (!open) return { ok: false, reason: "not_open" };
    if (open.picksLeft <= 0) return { ok: false, reason: "no_picks" };
    const item = (pack.options || []).find((o) => o.id === itemId);
    if (!item) return { ok: false, reason: "missing_item" };
    const eligibility = canAcquireItem(state, item, helpers);
    if (!eligibility.ok) {
      return { ok: false, reason: eligibility.reason || "ineligible" };
    }
    applyItemToState(state, item, "pack", helpers);
    open.picksLeft -= 1;
    pack.options = (pack.options || []).filter((o) => o.id !== itemId);
    open.options = (open.options || []).filter((id) => id !== itemId);
    if (open.picksLeft <= 0) {
      closePack(state, packId);
    }
    return { ok: true, state };
  }

  function closePack(state, packId) {
    if (state.packsOpen && state.packsOpen[packId]) {
      delete state.packsOpen[packId];
    }
    if (state.activePackId === packId) state.activePackId = null;
    return state;
  }

  // 3.6 Progression + Promotions
  function advanceQuarter(state) {
    return state;
  }

  function advanceMission(state) {
    return state;
  }

  function checkPromotion(state) {
    return null;
  }

  function applyPromotion(state, promotionId) {
    return state;
  }

  function checkWinLoss(state) {
    return { gameOver: state.gameOver, gameWon: state.gameWon };
  }

  // 3.7 Serialization
  function serializeRun(state) {
    return JSON.parse(JSON.stringify(state));
  }

  function deserializeRun(data) {
    return rehydrateRunState(data);
  }

  function serializeMeta(meta) {
    return JSON.parse(JSON.stringify(meta || {}));
  }

  function deserializeMeta(meta) {
    return JSON.parse(JSON.stringify(meta || {}));
  }

  ReplyAllEngine.core = {
    createInitialRunState,
    initRun,
    rehydrateRunState,
    applyCoachingBoosts,
    startMission,
    buildOpponentsForMission,
    startRound,
    endRound,
    planAiActions,
    applyPlayerAction,
    resolveTurn,
    resolveAction,
    resolveDamage,
    resolveDeflect,
    resolveFollowUps,
    runUnitEffects,
    applyEffect,
    getEffectHandlers,
    enterShop,
    rerollShop,
    buyItem,
    openPack,
    selectPackItem,
    closePack,
    advanceQuarter,
    advanceMission,
    checkPromotion,
    applyPromotion,
    checkWinLoss,
    serializeRun,
    deserializeRun,
    serializeMeta,
    deserializeMeta,
  };
  global.ReplyAllEngine = ReplyAllEngine;
})(typeof window !== "undefined" ? window : globalThis);
