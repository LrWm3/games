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

  global.ReplyAllEngine = ReplyAllEngine;
})(typeof window !== "undefined" ? window : globalThis);
