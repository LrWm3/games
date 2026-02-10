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
  function decideAiAction(state, ai, alive, player, helpers = {}) {
    if (!ai || !player) return null;
    const rngStore = getRngStore(state);
    const combatKey =
      helpers.combatKey || rngStore.missionKey(state, MISSIONS, "combat");
    const playerTarget = {
      id: "player",
      name: player.name,
      email: player.email,
      departmentId: player.departmentId,
    };
    const pool = [...alive.filter((o) => o.id !== ai.id), playerTarget];
    const weights = pool.map((t) => {
      if (t.id === "player") {
        return t.departmentId === ai.departmentId ? 0.5 : 1.5;
      }
      if (t.departmentId === ai.departmentId) return 0;
      return 1.0;
    });
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    let random = rngStore.next(state, combatKey) * totalWeight;
    let target = pool[0];
    for (let i = 0; i < pool.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        target = pool[i];
        break;
      }
    }

    const roll = rngStore.next(state, combatKey);
    const statCtx = state._statCtx || helpers.statCtx;
    const maxHp =
      helpers.getUnitMaxHp?.(ai) ??
      (statCtx && ReplyAllEngine.stats?.computeUnitStats
        ? ReplyAllEngine.stats.computeUnitStats(statCtx, ai).maxHp
        : ai.maxHp ?? ai.hp);
    const aiHpBeforePassive = ai.hp;
    const totalHeal =
      helpers.getUnitTotalHeal?.(ai) ??
      (ReplyAllEngine.stats?.getUnitTotalHeal
        ? ReplyAllEngine.stats.getUnitTotalHeal(statCtx, ai)
        : 0);
    ai.hp = Math.min(maxHp, ai.hp + totalHeal);
    if (helpers.logPassiveHeal) {
      helpers.logPassiveHeal(state, ai, aiHpBeforePassive, ai.hp, "ai_turn_start");
    }

    const promoteHeal =
      helpers.getUnitSelfPromoteHeal?.(ai, 15) ??
      (ReplyAllEngine.stats?.getUnitSelfPromoteHeal
        ? ReplyAllEngine.stats.getUnitSelfPromoteHeal(statCtx, ai, 15)
        : 15);
    const defFlat =
      helpers.getUnitFlatDef?.(ai) ??
      (ReplyAllEngine.stats?.getUnitFlatDef
        ? ReplyAllEngine.stats.getUnitFlatDef(statCtx, ai)
        : 0);
    const defReduce = ai.deflectChargeReduce || 0;
    const playerSingle =
      helpers.getUnitDamage?.(player, "single") ??
      (ReplyAllEngine.stats?.getUnitDamage
        ? ReplyAllEngine.stats.getUnitDamage(statCtx, player, "single")
        : 0);
    const playerEscalate =
      helpers.getUnitDamage?.(player, "escalate") ??
      (ReplyAllEngine.stats?.getUnitDamage
        ? ReplyAllEngine.stats.getUnitDamage(statCtx, player, "escalate")
        : 0);
    const dmgSingle = Math.max(0, playerSingle - defFlat - defReduce);
    const dmgEscalate = Math.max(0, playerEscalate - defFlat - defReduce);
    const inOneHitRange = dmgSingle >= ai.hp || dmgEscalate >= ai.hp;
    const canUseFullPromote = promoteHeal > 0 && ai.hp + promoteHeal <= maxHp;
    const selfPromoteEligible =
      ai.hp < maxHp && ai.wins > 0 && inOneHitRange && canUseFullPromote;

    const isContactInLoop = helpers.isContactInLoop || (() => false);
    const isContactImplicated = helpers.isContactImplicated || (() => false);
    const availFromBook = (ai.addressBook || [])
      .map((id) => CONTACTS.find((con) => con.id === id))
      .filter((c) => c && !isContactInLoop(c.id) && !isContactImplicated(c));
    if (roll < 0.15 && availFromBook.length > 0) {
      const numPicks =
        helpers.computeUnitStats?.(ai)?.numCCperCCaction ??
        (statCtx && ReplyAllEngine.stats?.computeUnitStats
          ? ReplyAllEngine.stats.computeUnitStats(statCtx, ai).numCCperCCaction
          : 1);
      const picks = [];
      for (let p = 0; p < numPicks; p++) {
        const currentAvail = (ai.addressBook || [])
          .map((id) => CONTACTS.find((con) => con.id === id))
          .filter((c) => c && !isContactInLoop(c.id) && !isContactImplicated(c));
        if (currentAvail.length === 0) break;
        picks.push(currentAvail[rngStore.int(state, combatKey, currentAvail.length)]);
      }
      if (picks.length) {
        return { type: "cc", target, ccTargets: picks };
      }
    }
    if (roll < 0.3 && selfPromoteEligible) {
      return { type: "promote", target, promoteHeal, maxHp };
    }

    const actionRoll = rngStore.next(state, combatKey);
    if (
      actionRoll < 0.15 &&
      ai.deflectChargeReduce <= 0 &&
      ai.deflectChargeReflect <= 0
    ) {
      return { type: "deflect", target };
    }
    if (actionRoll < 0.35) return { type: "escalate", target };
    return { type: "attack", target };
  }

  function planAiActions(state, helpers = {}) {
    const alive = (state.opponents || []).filter((o) => o.hp > 0);
    const plans = {};
    alive.forEach((a) => {
      plans[a.id] = decideAiAction(state, a, alive, state.player, helpers);
    });
    state.aiPlannedActions = plans;
    if (helpers.logPlans) helpers.logPlans(plans, alive);
    return plans;
  }

  function applyPlayerAction(state, action, targetId) {
    return state;
  }

  function resolveTurn(state, playerAction, aiActions = [], helpers = {}) {
    const actions = Array.isArray(aiActions) ? aiActions : [];
    // Pre-resolve AI deflects before player action.
    actions.forEach((a) => {
      if (a.type !== "DEFLECT") return;
      const unit = (state.opponents || []).find((o) => o.id === a.actorId);
      if (!unit) return;
      if ((unit.deflectChargeReduce || 0) > 0 || (unit.deflectChargeReflect || 0) > 0)
        return;
      resolveDeflect(state, unit, helpers);
    });

    if (playerAction) {
      resolveAction(state, playerAction, helpers);
    }

    actions.forEach((a) => {
      resolveAction(state, a, helpers);
    });

    return state;
  }

  function resolveAction(state, action, helpers = {}) {
    if (!action || !action.type) return { ok: false, reason: "invalid" };
    const actor =
      action.actorId === "player"
        ? state.player
        : (state.opponents || []).find((o) => o.id === action.actorId);
    if (!actor) return { ok: false, reason: "missing_actor" };

    const statCtx = state._statCtx || helpers.statCtx;
    const damageType =
      action.type === "ATTACK" ? "single" :
      action.type === "ESCALATE" ? "escalate" :
      action.type === "ULT" ? "replyAll" : null;

    if (action.type === "DEFLECT") {
      resolveDeflect(state, actor, helpers);
      return { ok: true, action };
    }

    if (action.type === "PROMOTE") {
      const stats = statCtx && ReplyAllEngine.stats?.computeUnitStats
        ? ReplyAllEngine.stats.computeUnitStats(statCtx, actor)
        : actor;
      const maxHp = stats?.maxHp ?? actor.maxHp ?? actor.hp;
      const heal = ReplyAllEngine.stats?.getUnitSelfPromoteHeal
        ? ReplyAllEngine.stats.getUnitSelfPromoteHeal(statCtx, actor, 20)
        : 20;
      actor.currentWins = Math.max(0, (actor.currentWins || 0) - 1);
      const before = actor.hp;
      actor.hp = Math.min(maxHp, (actor.hp || 0) + heal);
      return { ok: true, action, heal, before, after: actor.hp };
    }

    if (damageType) {
      if (action.type === "ESCALATE" || action.type === "ULT") {
        const targets = (state.opponents || []).filter((o) => o.hp > 0);
        const results = targets.map((t) =>
          resolveDamage(
            state,
            actor,
            t,
            ReplyAllEngine.stats.getUnitDamage(statCtx, actor, damageType),
            { ignoreDefense: action.type === "ESCALATE" || action.type === "ULT" },
          ),
        );
        if (action.type === "ULT") actor.ult = 0;
        return { ok: true, action, results };
      }

      const target =
        (state.opponents || []).find((o) => o.id === action.targetId) ||
        (action.targetId === "player" ? state.player : null);
      if (!target) return { ok: false, reason: "missing_target" };
      const result = resolveDamage(
        state,
        actor,
        target,
        ReplyAllEngine.stats.getUnitDamage(statCtx, actor, damageType),
        { ignoreDefense: false },
      );
      return { ok: true, action, result };
    }

    return { ok: false, reason: "unhandled" };
  }

  function resolveDamage(state, attacker, target, amount, options = {}) {
    if (!target) return { dmg: 0, blocked: 0, reflected: 0 };
    const statCtx = state._statCtx;
    let dmg = Math.max(0, Math.floor(amount || 0));
    if (!options.ignoreDefense && ReplyAllEngine.stats?.getUnitFlatDef && statCtx) {
      const flatDef = ReplyAllEngine.stats.getUnitFlatDef(statCtx, target);
      dmg = Math.max(0, dmg - flatDef);
    }
    let blocked = 0;
    if ((target.deflectChargeReduce || 0) > 0 && dmg > 0) {
      const reducedBy = Math.min(target.deflectChargeReduce, dmg);
      dmg -= reducedBy;
      blocked += reducedBy;
    }
    const targetHpBefore = target.hp;
    target.hp -= dmg;
    let reflected = 0;
    if (!options.ignoreReflect && (target.deflectChargeReflect || 0) > 0 && attacker) {
      reflected = target.deflectChargeReflect;
      blocked += reflected;
      if (attacker.id === "player") {
        state.player.hp -= reflected;
      } else if (attacker.hp != null) {
        attacker.hp -= reflected;
      }
    }
    return {
      dmg,
      blocked,
      reflected,
      targetHpBefore,
      targetHpAfter: target.hp,
    };
  }

  function resolveDeflect(state, unit) {
    if (!unit) return state;
    const statCtx = state._statCtx;
    if (statCtx && ReplyAllEngine.stats?.getUnitDeflectReflect) {
      unit.deflectChargeReflect =
        ReplyAllEngine.stats.getUnitDeflectReflect(statCtx, unit);
      unit.deflectChargeReduce =
        ReplyAllEngine.stats.getUnitDeflectReduce(statCtx, unit);
    }
    return state;
  }

  function resolveFollowUps(state, attacker, target, baseDamage) {
    return [];
  }

  // 3.4 Effect Engine Hooks
  function getEffectHandlers(helpers = {}) {
    return {
      add_random_cc_bonus: (state, unit, effect) => {
        if (unit.id !== "player") return;
        const count = effect.count || 1;
        for (let i = 0; i < count; i++) {
          const picked = helpers.applyRandomCcBoost?.(
            state.player,
            effect.stats || {},
            true,
          );
          if (picked && helpers.recordEndRoundUpgrade) {
            helpers.recordEndRoundUpgrade(picked.id);
          }
        }
      },
      add_cc_bonus: (state, unit, effect, ctx) => {
        if (unit.id !== "player") return;
        if (!ctx.contact) return;
        helpers.applyContactPermanentBoost?.(
          state.player,
          ctx.contact.id,
          effect.stats || {},
        );
        if (helpers.recordEndRoundUpgrade) {
          helpers.recordEndRoundUpgrade(ctx.contact.id);
        }
      },
      add_signoff_bonus: (state, unit, effect, owner) => {
        helpers.applyUnitPermanentBoost?.(unit, owner.id, effect.stats || {});
      },
      add_salutation_bonus: (state, unit, effect, owner) => {
        helpers.applySalutationPermanentBoost?.(unit, owner.id, effect.stats || {});
      },
      add_thread_bonus: (state, unit, effect, owner, contactEffectBoosts) => {
        const stats = { ...(effect.stats || {}) };
        if (contactEffectBoosts) {
          Object.keys(contactEffectBoosts).forEach((key) => {
            const value = contactEffectBoosts[key];
            if (typeof value !== "number") return;
            stats[key] = (stats[key] || 0) + value;
          });
        }
        helpers.applyUnitThreadBonus?.(unit, stats);
      },
      grow_sig_stat: (state, unit, effect, owner) => {
        if (owner && owner.itemType === "signature") {
          owner[effect.stat] = (owner[effect.stat] || 0) + effect.amount;
        }
      },
      gain_rep: (state, unit, effect) => {
        if (unit.id !== "player") return;
        state.player.reputation += effect.amount || 0;
      },
      add_thread_bonus_scaled: (state, unit, effect, owner, contactEffectBoosts, ctx) => {
        const step = effect.step || 1;
        let base = 0;
        if (effect.scaleBy === "wins_remaining")
          base = typeof unit.currentWins === "number" ? unit.currentWins : 0;
        if (effect.scaleBy === "hp") base = unit.hp || 0;
        if (effect.scaleBy === "overflow") base = ctx.overflow || 0;
        const steps = Math.floor(base / step);
        if (steps > 0) {
          const combinedStats = { ...(effect.stats || {}) };
          if (contactEffectBoosts) {
            Object.keys(contactEffectBoosts).forEach((key) => {
              const value = contactEffectBoosts[key];
              if (typeof value !== "number") return;
              combinedStats[key] = (combinedStats[key] || 0) + value;
            });
          }
          const scaled = {};
          Object.keys(combinedStats).forEach((key) => {
            const value = combinedStats[key];
            if (typeof value !== "number") return;
            scaled[key] = value * steps;
          });
          helpers.applyUnitThreadBonus?.(unit, scaled);
        }
      },
      add_bcc: (state, unit, effect) => {
        if (unit.id !== "player") return;
        helpers.addRandomBccs?.(state.player, effect.count || 1);
      },
      duplicate_bcc: (state, unit, effect) => {
        if (unit.id !== "player") return;
        helpers.duplicateRandomOwnedBccs?.(state.player, effect.count || 1);
      },
      add_signoff_bonus_scaled: (state, unit, effect, owner, _boosts, ctx) => {
        const step = effect.step || 1;
        let base = 0;
        if (effect.scaleBy === "hp") base = unit.hp || 0;
        if (effect.scaleBy === "wins_remaining")
          base = typeof unit.currentWins === "number" ? unit.currentWins : 0;
        if (effect.scaleBy === "overflow") base = ctx.overflow || 0;
        const steps = Math.floor(base / step);
        if (steps > 0) {
          const scaled = {};
          Object.keys(effect.stats || {}).forEach((key) => {
            const value = effect.stats[key];
            if (typeof value !== "number") return;
            scaled[key] = value * steps;
          });
          helpers.applyUnitPermanentBoost?.(unit, owner.id, scaled);
        }
      },
      add_random_cc_bonus_scaled: (state, unit, effect, _owner, _boosts, ctx) => {
        if (unit.id !== "player") return;
        const step = effect.step || 1;
        let base = 0;
        if (effect.scaleBy === "wins_remaining")
          base = typeof unit.currentWins === "number" ? unit.currentWins : 0;
        if (effect.scaleBy === "hp") base = unit.hp || 0;
        if (effect.scaleBy === "overflow")
          base = typeof ctx.overflow === "number" ? ctx.overflow : 0;
        if (effect.scaleBy === "active_cc_count")
          base = Array.isArray(unit.buffs)
            ? unit.buffs.filter((b) => b.usedBy === unit.name).length
            : 0;
        if (base <= 0) return;
        const count = Math.floor(base / step);
        if (count <= 0) return;
        const scaled = {};
        Object.keys(effect.stats || {}).forEach((key) => {
          const value = effect.stats[key];
          if (typeof value !== "number") return;
          scaled[key] = value;
        });
        const limit =
          effect.threadLimit != null ? Math.max(0, effect.threadLimit) : null;
        const countToApply = limit != null ? Math.min(count, limit) : count;
        const picked = helpers.applyRandomCcBoostMultiple?.(
          state.player,
          scaled,
          countToApply,
        );
        if (helpers.recordEndRoundUpgrade && Array.isArray(picked)) {
          picked.forEach((p) => p?.id && helpers.recordEndRoundUpgrade(p.id));
        }
      },
      add_all_cc_bonus: (state, unit, effect) => {
        if (unit.id !== "player") return;
        const scope = effect.scope || "thread";
        const ids =
          scope === "addressBook"
            ? state.player.addressBook
            : state.player.buffs
                .filter((b) => b.usedBy === state.player.name)
                .map((b) => b.id);
        ids.forEach((cid) => {
          helpers.applyContactPermanentBoost?.(
            state.player,
            cid,
            effect.stats || {},
          );
          if (helpers.recordEndRoundUpgrade) {
            helpers.recordEndRoundUpgrade(cid);
          }
          const buff = state.player.buffs.find(
            (b) => b.id === cid && b.usedBy === state.player.name,
          );
          if (buff) {
            helpers.applyBuffStats?.(buff, effect.stats || {});
            const originalContact = CONTACTS.find((c) => c.id === cid);
            if (originalContact && originalContact.eff) {
              helpers.applyBuffStats?.(buff, originalContact.eff);
            }
            const upgrade =
              state.player.contactUpgrades &&
              state.player.contactUpgrades[cid];
            if (upgrade && upgrade.eff) {
              helpers.applyBuffStats?.(buff, upgrade.eff);
            }
            const deptScalerBonus = helpers.getDeptScalerBonusForContact?.(
              state.player,
              cid,
            );
            if (deptScalerBonus) {
              helpers.applyBuffStats?.(buff, deptScalerBonus);
            }
          }
        });
      },
      add_cc_bonus_by_dept_pairs: (state, unit, effect) => {
        if (unit.id !== "player") return;
        const playerCcs = state.player.buffs.filter(
          (b) => b.usedBy === state.player.name,
        );
        const countsByDept = {};
        playerCcs.forEach((b) => {
          const dept = b.departmentId || "unknown";
          countsByDept[dept] = (countsByDept[dept] || 0) + 1;
        });
        let totalPairs = 0;
        Object.values(countsByDept).forEach((count) => {
          if (count >= 2) totalPairs += Math.floor((count * (count - 1)) / 2);
        });
        if (totalPairs <= 0) return;
        const scaled = {};
        Object.keys(effect.stats || {}).forEach((key) => {
          const value = effect.stats[key];
          if (typeof value !== "number") return;
          scaled[key] = value * totalPairs;
        });
        playerCcs.forEach((b) => {
          helpers.applyContactPermanentBoost?.(state.player, b.id, scaled);
          if (helpers.recordEndRoundUpgrade) {
            helpers.recordEndRoundUpgrade(b.id);
          }
          helpers.applyBuffStats?.(b, scaled);
          const originalContact = CONTACTS.find((c) => c.id === b.id);
          if (originalContact && originalContact.eff) {
            helpers.applyBuffStats?.(b, originalContact.eff);
          }
          const upgrade =
            state.player.contactUpgrades && state.player.contactUpgrades[b.id];
          if (upgrade && upgrade.eff) {
            helpers.applyBuffStats?.(b, upgrade.eff);
          }
          const deptScalerBonus = helpers.getDeptScalerBonusForContact?.(
            state.player,
            b.id,
          );
          if (deptScalerBonus) {
            helpers.applyBuffStats?.(b, deptScalerBonus);
          }
        });
      },
      add_signoff_bonus_by_dept_pairs: (state, unit, effect, owner) => {
        const playerCcs = state.player.buffs.filter(
          (b) => b.usedBy === state.player.name,
        );
        const countsByDept = {};
        playerCcs.forEach((b) => {
          const dept = b.departmentId || "unknown";
          countsByDept[dept] = (countsByDept[dept] || 0) + 1;
        });
        let pairs = 0;
        Object.values(countsByDept).forEach((count) => {
          if (count >= 2) pairs += Math.floor((count * (count - 1)) / 2);
        });
        if (pairs > 0) {
          const scaled = {};
          Object.keys(effect.stats || {}).forEach((key) => {
            const value = effect.stats[key];
            if (typeof value !== "number") return;
            scaled[key] = value * pairs;
          });
          helpers.applyUnitPermanentBoost?.(unit, owner.id, scaled);
        }
      },
      rep_scale_salutation: (state, unit, effect, owner, _boosts, ctx) => {
        const rep = typeof ctx.rep === "number" ? ctx.rep : 0;
        const step = effect.step || 1;
        const target = Math.floor(rep / step);
        if (target <= 0) return;
        const scaled = {};
        Object.keys(effect.stats || {}).forEach((key) => {
          const value = effect.stats[key];
          if (typeof value !== "number") return;
          scaled[key] = value * target;
        });
        helpers.setSalutationBonus?.(unit, owner.id, scaled);
      },
      rep_half_to_cc_escalate: (state, unit, effect, _owner, _boosts, ctx, results) => {
        if (!ctx.summary) return;
        const total = ctx.summary.totalRep || 0;
        const repAward = Math.floor(total / 2);
        const missed = total - repAward;
        const step = effect.step || 1;
        const steps = Math.floor(missed / step);
        if (steps > 0) {
          const scaled = {};
          Object.keys(effect.stats || {}).forEach((key) => {
            const value = effect.stats[key];
            if (typeof value !== "number") return;
            scaled[key] = value;
          });
          const limit =
            effect.threadLimit != null ? Math.max(0, effect.threadLimit) : null;
          const countToApply = limit != null ? Math.min(steps, limit) : steps;
          helpers.applyRandomCcBoostMultiple?.(state.player, scaled, countToApply);
        }
        if (results) results.repAward = repAward;
      },
    };
  }

  function applyEffect(state, unit, effect, owner, context, contactEffectBoosts, results, handlers) {
    const handler = handlers?.[effect.type];
    if (handler) {
      handler(state, unit, effect, owner, contactEffectBoosts, context, results);
    }
  }

  function runUnitEffectsPure(state, unit, event, context = {}, helpers = {}) {
    if (!unit) return {};
    const results = {};
    const sources = [];
    if (unit.salutation && Array.isArray(unit.salutation.effects))
      sources.push({ owner: unit.salutation, id: unit.salutation.id });
    if (unit.signOff && Array.isArray(unit.signOff.effects))
      sources.push({ owner: unit.signOff, id: unit.signOff.id });
    if (Array.isArray(unit.signatures)) {
      unit.signatures.forEach((sig) => {
        if (Array.isArray(sig.effects))
          sources.push({ owner: sig, id: sig.id });
      });
    }
    if (Array.isArray(unit.buffs)) {
      unit.buffs
        .filter((b) => b.usedBy === unit.name && Array.isArray(b.effects))
        .forEach((b) => sources.push({ owner: b, id: b.id }));
    }
    const handlers = getEffectHandlers(helpers);
    sources.forEach(({ owner, id }) => {
      owner.effects.forEach((effect) => {
        if (!effect || effect.event !== event) return;
        const contactEffectBoosts =
          unit.id === "player" &&
          owner &&
          owner.id &&
          owner.id.startsWith("cc_") &&
          state.player.contactEffectBoosts
            ? state.player.contactEffectBoosts[owner.id]
            : null;
        if (effect.requiresPackType && context.pack) {
          if (context.pack.type !== effect.requiresPackType) return;
        }
        if (effect.requiresFullLeverage && unit.ult < LEVERAGE_MAX) return;
        if (effect.requiresHpFull && unit.hp < (helpers.getUnitMaxHp?.(unit) ?? unit.maxHp ?? unit.hp))
          return;
        if (effect.chance != null) {
          const key = helpers.rngKeyForContext?.(state, context) || "misc";
          const rngStore = getRngStore(state);
          if (rngStore.next(state, key) > effect.chance) return;
        }
        if (effect.threadLimit != null) {
          if (!state.threadEffectFlags) state.threadEffectFlags = {};
          const key = `${event}:${id}:${effect.type}`;
          const used = state.threadEffectFlags[key] || 0;
          if (used >= effect.threadLimit) return;
          state.threadEffectFlags[key] = used + 1;
        }
        if (helpers.logEffectTrigger) {
          let effectSnapshot = null;
          try {
            effectSnapshot = JSON.parse(JSON.stringify(effect));
          } catch (err) {
            effectSnapshot = { type: effect.type, event: effect.event };
          }
          const effectContext = {};
          if (context.contact) effectContext.contactId = context.contact.id || null;
          if (context.pack) {
            effectContext.packId = context.pack.id || null;
            effectContext.packType = context.pack.type || null;
          }
          if (context.summary)
            effectContext.summary = {
              totalRep: context.summary.totalRep,
              baseRep: context.summary.baseRep,
              bonusRep: context.summary.bonusRep,
              interestRep: context.summary.interestRep,
              winsRep: context.summary.winsRep,
            };
          helpers.logEffectTrigger({
            event,
            effectType: effect.type,
            effect: effectSnapshot,
            ownerId: owner.id || null,
            ownerName: owner.name || null,
            ownerItemType: owner.itemType || null,
            unitId: unit.id || null,
            unitName: unit.name || null,
            context: effectContext,
            handled: !!handlers?.[effect.type],
          });
        }
        applyEffect(state, unit, effect, owner, context, contactEffectBoosts, results, handlers);
      });
    });
    return results;
  }

  function runUnitEffects(state, unit, event, context = {}, helpers = {}) {
    const auto = state?._effectHelpers || {};
    const mergedHelpers = {
      ...auto,
      ...helpers,
    };
    if (!mergedHelpers.addRandomBccs)
      mergedHelpers.addRandomBccs = (player, count) =>
        addRandomBccs(state, player, count);
    if (!mergedHelpers.duplicateRandomOwnedBccs)
      mergedHelpers.duplicateRandomOwnedBccs = (player, count) =>
        duplicateRandomOwnedBccs(state, player, count);
    if (!mergedHelpers.applyContactPermanentBoost)
      mergedHelpers.applyContactPermanentBoost = (player, contactId, stats) =>
        applyContactPermanentBoost(state, player, contactId, stats);
    if (!mergedHelpers.applyBuffStats)
      mergedHelpers.applyBuffStats = (buff, stats) => applyBuffStats(buff, stats);
    if (!mergedHelpers.applyRandomCcBoost)
      mergedHelpers.applyRandomCcBoost = (player, stats, applyImmediate) =>
        applyRandomCcBoost(state, player, stats, applyImmediate);
    if (!mergedHelpers.applyRandomCcBoostMultiple)
      mergedHelpers.applyRandomCcBoostMultiple = (player, stats, count) =>
        applyRandomCcBoostMultiple(state, player, stats, count);
    if (!mergedHelpers.getDeptScalerBonusForContact)
      mergedHelpers.getDeptScalerBonusForContact = (player, contactId) =>
        getDeptScalerBonusForContact(state, player, contactId);
    if (!mergedHelpers.applyUnitPermanentBoost)
      mergedHelpers.applyUnitPermanentBoost = (unit, sourceId, stats) =>
        applyUnitPermanentBoost(unit, sourceId, stats);
    if (!mergedHelpers.applyUnitThreadBonus)
      mergedHelpers.applyUnitThreadBonus = (unit, stats) =>
        applyUnitThreadBonus(unit, stats);
    if (!mergedHelpers.applySalutationPermanentBoost)
      mergedHelpers.applySalutationPermanentBoost = (unit, sourceId, stats) =>
        applySalutationPermanentBoost(unit, sourceId, stats);
    if (!mergedHelpers.setSalutationBonus)
      mergedHelpers.setSalutationBonus = (unit, sourceId, stats) =>
        setSalutationBonus(unit, sourceId, stats);
    if (!mergedHelpers.getUnitMaxHp && state?._statCtx) {
      mergedHelpers.getUnitMaxHp = (u) =>
        ReplyAllEngine.stats.computeUnitStats(state._statCtx, u).maxHp;
    }
    if (!mergedHelpers.rngKeyForContext) {
      mergedHelpers.rngKeyForContext = (s, ctx) => {
        if (ctx?.pack) return getRngStore(s).shopKey(s);
        return "misc";
      };
    }
    return runUnitEffectsPure(state, unit, event, context, mergedHelpers);
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

  function addRandomBccs(state, player, count) {
    if (!player || !count) return [];
    const statCtx = state._statCtx;
    let limit = player.bccLimit ?? 0;
    if (statCtx && ReplyAllEngine.stats?.computeUnitStats) {
      const stats = ReplyAllEngine.stats.computeUnitStats(statCtx, player);
      if (stats && typeof stats.bccLimit === "number") limit = stats.bccLimit;
    }
    const list = player.bccContacts || player.bccs || [];
    const slots = Math.max(0, limit - list.length);
    if (slots <= 0) return [];
    const owned = new Set(list.map((b) => b.id));
    const pool = BCC_CONTACTS.filter((b) => !owned.has(b.id));
    const picks = Math.min(count, slots, pool.length);
    if (picks <= 0) return [];
    const picked = pickWeighted(pool, picks, "bcc_create", state);
    picked.forEach((b) => list.push({ ...b }));
    return picked;
  }

  function duplicateRandomOwnedBccs(state, player, count) {
    if (!player || !count) return [];
    const statCtx = state._statCtx;
    let limit = player.bccLimit ?? 0;
    if (statCtx && ReplyAllEngine.stats?.computeUnitStats) {
      const stats = ReplyAllEngine.stats.computeUnitStats(statCtx, player);
      if (stats && typeof stats.bccLimit === "number") limit = stats.bccLimit;
    }
    const list = player.bccContacts || player.bccs || [];
    const slots = Math.max(0, limit - list.length);
    if (slots <= 0) return [];
    if (!list.length) return [];
    const picks = Math.min(count, slots);
    const added = [];
    const rngStore = getRngStore(state);
    for (let i = 0; i < picks; i++) {
      const picked = list[rngStore.int(state, "bcc_create", list.length)];
      if (picked) {
        const clone = { ...picked };
        list.push(clone);
        added.push(clone);
      }
    }
    return added;
  }

  function applyContactPermanentBoost(state, player, contactId, stats) {
    if (!player || !contactId || !stats) return;
    if (!player.contactPermanentBoosts) player.contactPermanentBoosts = {};
    if (!player.contactEffectBoosts) player.contactEffectBoosts = {};
    if (!player.contactTrainingCount) player.contactTrainingCount = {};

    const currentCount = player.contactTrainingCount[contactId] || 0;
    const statCtx = state._statCtx;
    let trainingLimit = 3;
    if (statCtx && ReplyAllEngine.stats?.computeUnitStats) {
      const s = ReplyAllEngine.stats.computeUnitStats(statCtx, player);
      if (s && s.contactTrainingLimit != null) trainingLimit = s.contactTrainingLimit;
    }
    if (currentCount >= trainingLimit) return;
    player.contactTrainingCount[contactId] = currentCount + 1;

    const current = player.contactPermanentBoosts[contactId] || {};
    const next = { ...current };
    Object.keys(stats).forEach((key) => {
      const value = stats[key];
      if (typeof value !== "number") return;
      next[key] = (next[key] || 0) + value;
    });

    const contact = CONTACTS.find((c) => c.id === contactId);
    if (contact && contact.eff) {
      Object.keys(contact.eff).forEach((key) => {
        const value = contact.eff[key];
        if (typeof value !== "number") return;
        next[key] = (next[key] || 0) + value;
      });
    }
    if (contact && Array.isArray(contact.effects)) {
      contact.effects.forEach((effect) => {
        if (
          !effect ||
          (effect.type !== "add_thread_bonus" &&
            effect.type !== "add_thread_bonus_scaled")
        )
          return;
        if (!effect.stats) return;
        const currentEffect = player.contactEffectBoosts[contactId] || {};
        const nextEffect = { ...currentEffect };
        Object.keys(effect.stats).forEach((key) => {
          const value = effect.stats[key];
          if (typeof value !== "number") return;
          nextEffect[key] = (nextEffect[key] || 0) + value;
        });
        player.contactEffectBoosts[contactId] = nextEffect;
      });
    }
    const upgrade = player.contactUpgrades && player.contactUpgrades[contactId];
    if (upgrade && upgrade.eff) {
      Object.keys(upgrade.eff).forEach((key) => {
        const value = upgrade.eff[key];
        if (typeof value !== "number") return;
        next[key] = (next[key] || 0) + value;
      });
    }
    const deptScalerBonus = getDeptScalerBonusForContact(state, player, contactId);
    if (deptScalerBonus) {
      Object.keys(deptScalerBonus).forEach((key) => {
        const value = deptScalerBonus[key];
        if (typeof value !== "number") return;
        next[key] = (next[key] || 0) + value;
      });
    }

    player.contactPermanentBoosts[contactId] = next;
  }

  function applyBuffStats(buff, stats) {
    if (!buff || !stats) return;
    buff.eff = { ...(buff.eff || {}) };
    Object.keys(stats).forEach((key) => {
      const value = stats[key];
      if (typeof value !== "number") return;
      buff.eff[key] = (buff.eff[key] || 0) + value;
    });
  }

  function applyRandomCcBoost(state, player, stats, applyImmediate = true) {
    if (!player) return null;
    const statCtx = state._statCtx;
    let trainingLimit = 3;
    if (statCtx && ReplyAllEngine.stats?.computeUnitStats) {
      const s = ReplyAllEngine.stats.computeUnitStats(statCtx, player);
      if (s && s.contactTrainingLimit != null) trainingLimit = s.contactTrainingLimit;
    }
    const pool = (player.buffs || [])
      .filter(
        (b) =>
          b.usedBy === player.name &&
          !b.noTraining &&
          (player.contactTrainingCount?.[b.id] || 0) < trainingLimit,
      )
      .sort((a, b) => (a.id || "").localeCompare(b.id || ""));
    if (pool.length === 0) return null;
    const rngStore = getRngStore(state);
    const key = rngStore.missionKey(state, MISSIONS, "cc_upgrades");
    const picked = pool[rngStore.int(state, key, pool.length)];
    applyContactPermanentBoost(state, player, picked.id, stats);
    if (applyImmediate) {
      applyBuffStats(picked, stats);
      const originalContact = CONTACTS.find((c) => c.id === picked.id);
      if (originalContact && originalContact.eff) {
        applyBuffStats(picked, originalContact.eff);
      }
      const upgrade = player.contactUpgrades && player.contactUpgrades[picked.id];
      if (upgrade && upgrade.eff) {
        applyBuffStats(picked, upgrade.eff);
      }
      const deptScalerBonus = getDeptScalerBonusForContact(state, player, picked.id);
      if (deptScalerBonus) {
        applyBuffStats(picked, deptScalerBonus);
      }
    }
    return picked;
  }

  function applyRandomCcBoostMultiple(state, player, stats, count) {
    if (!player || !stats || !count) return [];
    const pool = (player.buffs || [])
      .filter((b) => b.usedBy === player.name && !b.noTraining)
      .sort((a, b) => (a.id || "").localeCompare(b.id || ""));
    if (pool.length === 0) return [];
    const picked = [];
    const rngStore = getRngStore(state);
    const key = rngStore.missionKey(state, MISSIONS, "cc_upgrades");
    for (let i = 0; i < count; i++) {
      const target = pool[rngStore.int(state, key, pool.length)];
      applyContactPermanentBoost(state, player, target.id, stats);
      applyBuffStats(target, stats);
      const originalContact = CONTACTS.find((c) => c.id === target.id);
      if (originalContact && originalContact.eff) {
        applyBuffStats(target, originalContact.eff);
      }
      const upgrade = player.contactUpgrades && player.contactUpgrades[target.id];
      if (upgrade && upgrade.eff) {
        applyBuffStats(target, upgrade.eff);
      }
      const deptScalerBonus = getDeptScalerBonusForContact(state, player, target.id);
      if (deptScalerBonus) {
        applyBuffStats(target, deptScalerBonus);
      }
      picked.push(target);
    }
    return picked;
  }

  function getDeptScalerBonusForContact(state, player, contactId) {
    if (!player || !contactId || !Array.isArray(player.signatures)) return null;
    const contact = CONTACTS.find((c) => c.id === contactId);
    if (!contact || !contact.departmentId) return null;
    const deptCounts = {};
    if (Array.isArray(player.addressBook)) {
      player.addressBook.forEach((id) => {
        const entry = CONTACTS.find((c) => c.id === id);
        if (!entry || !entry.departmentId) return;
        deptCounts[entry.departmentId] =
          (deptCounts[entry.departmentId] || 0) + 1;
      });
    }
    const count = deptCounts[contact.departmentId] || 0;
    if (!count) return null;
    const bonus = {};
    player.signatures.forEach((s) => {
      if (!Array.isArray(s.deptScalers)) return;
      s.deptScalers.forEach((scaler) => {
        if (!scaler || !scaler.departmentId || !scaler.stat) return;
        if (scaler.departmentId !== contact.departmentId) return;
        const per = typeof scaler.per === "number" ? scaler.per : 0;
        if (!per) return;
        const step =
          typeof scaler.step === "number" && scaler.step > 0 ? scaler.step : 1;
        const times = Math.floor(count / step);
        if (!times) return;
        bonus[scaler.stat] = (bonus[scaler.stat] || 0) + per * times;
      });
    });
    return Object.keys(bonus).length ? bonus : null;
  }

  function applyUnitPermanentBoost(unit, sourceId, stats) {
    if (!unit || !sourceId || !stats) return;
    if (!unit.signoffBonuses) unit.signoffBonuses = {};
    const current = unit.signoffBonuses[sourceId] || {};
    const next = { ...current };
    Object.keys(stats).forEach((key) => {
      const value = stats[key];
      if (typeof value !== "number") return;
      next[key] = (next[key] || 0) + value;
    });
    unit.signoffBonuses[sourceId] = next;
  }

  function applyUnitThreadBonus(unit, stats) {
    if (!unit || !stats) return;
    if (!unit.threadBonuses) unit.threadBonuses = {};
    Object.keys(stats).forEach((key) => {
      const value = stats[key];
      if (typeof value !== "number") return;
      unit.threadBonuses[key] = (unit.threadBonuses[key] || 0) + value;
    });
  }

  function applySalutationPermanentBoost(unit, sourceId, stats) {
    if (!unit || !sourceId || !stats) return;
    if (!unit.salutationBonuses) unit.salutationBonuses = {};
    const current = unit.salutationBonuses[sourceId] || {};
    const next = { ...current };
    Object.keys(stats).forEach((key) => {
      const value = stats[key];
      if (typeof value !== "number") return;
      next[key] = (next[key] || 0) + value;
    });
    unit.salutationBonuses[sourceId] = next;
  }

  function setSalutationBonus(unit, sourceId, stats) {
    if (!unit || !sourceId || !stats) return;
    if (!unit.salutationBonuses) unit.salutationBonuses = {};
    const next = { ...(unit.salutationBonuses[sourceId] || {}) };
    Object.keys(stats).forEach((key) => {
      const value = stats[key];
      if (typeof value !== "number") return;
      if (next[key] == null || value > next[key]) next[key] = value;
    });
    unit.salutationBonuses[sourceId] = next;
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
    const year = state.player?.year ?? 0;
    if (year >= TITLES.length) return null;
    const idx = Math.min(year, TITLES.length - 1);
    return TITLES[idx] || null;
  }

  function applyPromotion(state, promotionId) {
    let nextTitle = null;
    if (promotionId) {
      nextTitle = TITLES.find((t) => t.id === promotionId) || null;
    }
    if (!nextTitle) {
      nextTitle = checkPromotion(state);
    }
    if (nextTitle) {
      state.player.title = nextTitle;
    }
    return nextTitle;
  }

  function checkWinLoss(state, data) {
    if (state.gameOver) {
      return { gameOver: true, gameWon: !!state.gameWon, reason: state.lossReason || null };
    }
    if (state.gameWon || state.winGame) {
      state.gameOver = true;
      state.gameWon = true;
      return { gameOver: true, gameWon: true, reason: "win" };
    }
    if (state.lossReason) {
      state.gameOver = true;
      return { gameOver: true, gameWon: false, reason: state.lossReason };
    }
    const opponentsAlive = (state.opponents || []).some((o) => o.hp > 0);
    const missions = data?.missions || [];
    if (!opponentsAlive && state.missionActive) {
      if (state.currentMissionIndex >= missions.length - 1) {
        state.gameOver = true;
        state.gameWon = true;
        return { gameOver: true, gameWon: true, reason: "win" };
      }
    }
    return { gameOver: false, gameWon: false, reason: null };
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

  // 3.8 Logging helpers (UI-agnostic)
  function logEvent(state, type, data = {}) {
    if (!state?.analytics) return;
    const mission = MISSIONS[state.currentMissionIndex] || {};
    const event = {
      ts: Date.now(),
      type,
      turn: state.turn,
      quarter: state.player?.quarter,
      year: state.player?.year,
      missionId: mission.id || null,
      ...data,
    };
    state.analytics.events.push(event);
  }

  function snapshotItemEffects(item, options = {}) {
    if (!item) return null;
    const { otherFields = [], statFields = [] } = options;
    const snapshot = {};
    if (item.effects)
      snapshot.effects = JSON.parse(JSON.stringify(item.effects));
    if (item.eff) snapshot.eff = JSON.parse(JSON.stringify(item.eff));
    if (item.statWindows)
      snapshot.statWindows = JSON.parse(JSON.stringify(item.statWindows));
    if (item.scalers)
      snapshot.scalers = JSON.parse(JSON.stringify(item.scalers));
    if (item.deptScalers)
      snapshot.deptScalers = JSON.parse(JSON.stringify(item.deptScalers));
    const stats = {};
    statFields.forEach((field) => {
      if (typeof item[field] === "number") stats[field] = item[field];
    });
    otherFields.forEach((field) => {
      if (item[field] !== undefined) snapshot[field] = item[field];
    });
    if (Object.keys(stats).length) snapshot.stats = stats;
    return Object.keys(snapshot).length ? snapshot : null;
  }

  function logInventorySnapshot(state, source) {
    const p = state.player || {};
    logEvent(state, "inventory_snapshot", {
      source,
      reputation: p.reputation,
      addressBook: [...(p.addressBook || [])],
      signatures: (p.signatures || []).map((s) => s.id),
      salutation: p.salutation ? p.salutation.id : null,
      signOff: p.signOff ? p.signOff.id : null,
      bccs: (p.bccContacts || p.bccs || []).map((b) => b.id),
    });
  }

  function logResolvedPlayerSheet(state, source, totals, sources) {
    logEvent(state, "player_sheet", {
      source,
      totals,
      sources,
    });
  }

  function logPassiveHeal(state, unit, hpBefore, hpAfter, trigger) {
    if (!unit) return;
    const amount = Math.max(0, (hpAfter || 0) - (hpBefore || 0));
    if (amount <= 0) return;
    logEvent(state, "healing", {
      source: "passive",
      trigger: trigger || null,
      unitId: unit.id || null,
      unitName: unit.name || null,
      amount,
      hpBefore,
      hpAfter,
    });
  }

  function logBccGains(state, added, reason, extra = {}) {
    if (!added || !added.length) return;
    const snapshotOptions = extra.snapshotOptions || {};
    logEvent(state, "bcc_gain", {
      reason,
      bccs: added.map((b) => ({
        id: b.id,
        name: b.name || null,
        rarity: b.rarity || null,
        effects: snapshotItemEffects(b, snapshotOptions),
      })),
      ...extra,
    });
  }

  function snapshotContactStats(state, contact, usedBy) {
    if (!contact || !state?.player) return null;
    const baseEff = contact.eff ? { ...contact.eff } : null;
    const boosts =
      state.player.contactPermanentBoosts &&
      state.player.contactPermanentBoosts[contact.id]
        ? { ...state.player.contactPermanentBoosts[contact.id] }
        : null;
    const upgrades =
      state.player.contactUpgrades && state.player.contactUpgrades[contact.id]
        ? state.player.contactUpgrades[contact.id]
        : null;
    const upgradeEff = upgrades && upgrades.eff ? { ...upgrades.eff } : null;
    const trainingCount =
      (state.player.contactTrainingCount &&
        state.player.contactTrainingCount[contact.id]) ||
      0;
    const deptScalerBonus =
      usedBy === state.player.name
        ? getDeptScalerBonusForContact(state, state.player, contact.id)
        : null;
    const effective = {};
    const mergeInto = (target, stats) => {
      if (!stats) return;
      Object.keys(stats).forEach((key) => {
        const value = stats[key];
        if (typeof value !== "number") return;
        target[key] = (target[key] || 0) + value;
      });
    };
    mergeInto(effective, baseEff);
    mergeInto(effective, boosts);
    mergeInto(effective, upgradeEff);
    mergeInto(effective, deptScalerBonus);
    return {
      baseEff,
      boosts,
      upgradeEff,
      deptScalerBonus,
      trainingCount,
      effective,
    };
  }

  ReplyAllEngine.log = {
    logEvent,
    snapshotItemEffects,
    snapshotContactStats,
    getStatBlockFromObject: (obj, statFields = []) => {
      if (!obj) return null;
      const stats = {};
      let hasAny = false;
      statFields.forEach((field) => {
        const value = obj[field];
        if (typeof value === "number" && value !== 0) {
          stats[field] = value;
          hasAny = true;
        }
      });
      return hasAny ? stats : null;
    },
    getStatSources: (state, unit, ctx = {}) => {
      const {
        statFields = [],
        getSalutationWindowStats,
        getSalutationPersistentStats,
        getSignoffPersistentStats,
        getUnitWinScaleStats,
        getUnitRemainingWins,
        isSetActive,
      } = ctx;
      const sources = [];
      const pushSource = (label, obj) => {
        const stats = ReplyAllEngine.log.getStatBlockFromObject(obj, statFields);
        if (stats) sources.push({ label, stats });
      };
      if (!unit) return sources;
      pushSource("Base", unit);
      if (unit.title) pushSource(`Title: ${unit.title.name}`, unit.title);
      if (unit.salutation)
        pushSource(`Greeting: ${unit.salutation.name}`, unit.salutation);
      if (unit.salutation && Array.isArray(unit.salutation.scalers)) {
        const ccCount = Array.isArray(unit.buffs)
          ? unit.buffs.filter((b) => b.usedBy === unit.name).length
          : 0;
        const sigCount = Array.isArray(unit.signatures)
          ? unit.signatures.length
          : 0;
        const counts = { cc: ccCount, sig: sigCount };
        const scalerStats = {};
        unit.salutation.scalers.forEach((s) => {
          if (!s || !s.source || !s.stat) return;
          const count = counts[s.source] || 0;
          if (!count) return;
          const per = typeof s.per === "number" ? s.per : 0;
          if (!per) return;
          scalerStats[s.stat] = (scalerStats[s.stat] || 0) + per * count;
        });
        if (Object.keys(scalerStats).length) {
          sources.push({
            label: `Greeting scaling (${ccCount} CC, ${sigCount} sig)`,
            stats: scalerStats,
          });
        }
      }
      if (getSalutationWindowStats) {
        const salutationWindowStats = getSalutationWindowStats(unit);
        if (salutationWindowStats && unit.salutation) {
          sources.push({
            label: `Greeting window: ${unit.salutation.name}`,
            stats: salutationWindowStats,
          });
        }
      }
      if (getSalutationPersistentStats) {
        const salutationPersistentStats = getSalutationPersistentStats(unit);
        if (salutationPersistentStats && unit.salutation) {
          sources.push({
            label: `Greeting progress: ${unit.salutation.name}`,
            stats: salutationPersistentStats,
          });
        }
      }
      if (getUnitWinScaleStats) {
        const winScaleStats = getUnitWinScaleStats(unit);
        if (winScaleStats) {
          const remaining = getUnitRemainingWins
            ? getUnitRemainingWins(unit)
            : undefined;
          sources.push({
            label:
              remaining != null
                ? `Win scaling (${remaining} remaining)`
                : "Win scaling",
            stats: winScaleStats,
          });
        }
      }
      if (unit.signOff) pushSource(`Sign-off: ${unit.signOff.name}`, unit.signOff);
      if (getSignoffPersistentStats) {
        const signoffPersistentStats = getSignoffPersistentStats(unit);
        if (signoffPersistentStats && unit.signOff) {
          sources.push({
            label: `Sign-off progress: ${unit.signOff.name}`,
            stats: signoffPersistentStats,
          });
        }
      }
      if (Array.isArray(unit.signatures)) {
        unit.signatures.forEach((s) => pushSource(`Signature: ${s.name}`, s));
      }
      if (unit.coachingBoosts && Object.keys(unit.coachingBoosts).length) {
        pushSource("Coaching", unit.coachingBoosts);
      }
      if (unit.threadBonuses && Object.keys(unit.threadBonuses).length) {
        sources.push({ label: "Thread bonuses", stats: unit.threadBonuses });
      }
      if (Array.isArray(unit.buffs)) {
        unit.buffs.forEach((b) => {
          const name = b.name || b.id || "Contact";
          pushSource(`Contact: ${name}`, b.eff ? b.eff : b);
        });
      }
      if (typeof isSetActive === "function") {
        SET_DEFS.forEach((set) => {
          if (isSetActive(unit, set)) pushSource(`Set: ${set.name}`, set.effect);
        });
      }
      return sources;
    },
    logInventorySnapshot,
    logResolvedPlayerSheet,
    logPassiveHeal,
    logBccGains,
  };

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
    decideAiAction,
    runUnitEffectsPure,
    runUnitEffects,
    applyEffect,
    getEffectHandlers,
    addRandomBccs,
    duplicateRandomOwnedBccs,
    applyContactPermanentBoost,
    applyBuffStats,
    applyRandomCcBoost,
    applyRandomCcBoostMultiple,
    getDeptScalerBonusForContact,
    applyUnitPermanentBoost,
    applyUnitThreadBonus,
    applySalutationPermanentBoost,
    setSalutationBonus,
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
