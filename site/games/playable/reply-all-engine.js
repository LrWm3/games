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

  // ---------- Start / Induction Helpers ----------
  const DEFAULT_START_CONFIG = {
    departmentId: "executive",
    prestige: 0,
    seedInput: "",
  };

  const DEFAULT_START_UNLOCKS = {
    executive: 0,
    it: 0,
    finance: 0,
  };

  const DEFAULT_DEPARTMENT_UNLOCKS = {
    executive: true,
    it: false,
    finance: false,
  };

  function sanitizeMetaState(metaState) {
    const next = metaState && typeof metaState === "object" ? { ...metaState } : {};
    if (!Array.isArray(next.discoveredSets)) next.discoveredSets = [];
    next.startUnlocks = {
      ...DEFAULT_START_UNLOCKS,
      ...(next.startUnlocks || {}),
    };
    next.departmentUnlocks = {
      ...DEFAULT_DEPARTMENT_UNLOCKS,
      ...(next.departmentUnlocks || {}),
    };
    return next;
  }

  function ensureStartState(state, metaState) {
    const safeMeta = sanitizeMetaState(metaState);
    const baseState = state && typeof state === "object" ? { ...state } : {};
    const nextStartConfig = {
      ...DEFAULT_START_CONFIG,
      ...(baseState.startConfig || {}),
    };
    const nextState = {
      ...baseState,
      startConfig: nextStartConfig,
      startUnlocks: { ...safeMeta.startUnlocks },
      messageLogEntries: Array.isArray(baseState.messageLogEntries)
        ? [...baseState.messageLogEntries]
        : [],
    };
    if (nextState.player && !nextState.player.coachingBoosts) {
      nextState.player = { ...nextState.player, coachingBoosts: {} };
    }
    return { state: nextState, metaState: safeMeta };
  }

  function getDisplayName(name) {
    const trimmed = typeof name === "string" ? name.trim() : "";
    return trimmed || "eke vdh";
  }

  function getEmailFromName(name) {
    return `${getDisplayName(name).toLowerCase().replace(/\s+/g, ".")}@gov.org`;
  }

  function parseSeedInput(input) {
    if (!input) return null;
    const trimmed = String(input).trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) return Number(trimmed) >>> 0;
    return hashSeed(trimmed, "user");
  }

  function getBasePlayerState(name, email) {
    return {
      id: "player",
      name,
      email,
      hp: 50,
      maxHp: 50,
      ult: 0,
      wins: 3,
      currentWins: 3,
      buffs: [],
      reputation: 4,
      year: 1,
      quarter: "Q3",
      title: TITLES[0],
      addressBook: [],
      signatures: [],
      salutation: null,
      signOff: null,
      bccContacts: [],
      departmentId: "executive_council_office",
      singleDmg: 10,
      escalateDmg: 5,
      globalDmg: 0,
      singleDmgMult: 0,
      escalateDmgMult: 0,
      globalDmgMult: 0,
      retaliation: 5,
      deflect: 0,
      selfPromoteHeal: 5,
      deflectCharge: 0,
      deflectChargeReflect: 0,
      deflectChargeReduce: 0,
      followUpChance: 0,
      escalateRecoverPerHit: 0,
      bccLimit: 2,
      contactTrainingLimit: 3,
      contactUpgrades: {},
      contactPermanentBoosts: {},
      contactTrainingCount: {},
      coachingBoosts: {},
      salutationBonuses: {},
      signoffBonuses: {},
      ...DEFAULT_PLAYER_LINES,
      discoveredSets: [],
      _lineBags: {},
    };
  }

  function applyStartConfigToPlayer(state, metaState, config) {
    const safeMeta = sanitizeMetaState(metaState);
    const nextState = state && typeof state === "object" ? { ...state } : {};
    if (!nextState.player) return nextState;
    const nextPlayer = { ...nextState.player };
    const nextConfig = {
      ...DEFAULT_START_CONFIG,
      ...(config || nextState.startConfig || {}),
    };
    const dept = START_DEPARTMENTS.find((d) => d.id === nextConfig.departmentId);
    if (!dept) {
      return {
        ...nextState,
        startConfig: nextConfig,
        player: nextPlayer,
      };
    }
    const start = dept.start || {};
    const baseWins = nextPlayer.wins || 0;
    const winsDelta = typeof start.winsDelta === "number" ? start.winsDelta : 0;
    const nextWins = Math.max(0, baseWins + winsDelta);

    nextPlayer.wins = nextWins;
    nextPlayer.currentWins = nextWins;
    if (typeof start.reputation === "number") nextPlayer.reputation = start.reputation;
    nextPlayer.departmentId = start.departmentId || nextPlayer.departmentId;
    nextPlayer.addressBook = Array.isArray(start.addressBook)
      ? [...start.addressBook]
      : [];
    nextPlayer.signatures = Array.isArray(start.signatureIds)
      ? start.signatureIds
          .map((id) => SIGNATURES.find((s) => s.id === id))
          .filter(Boolean)
      : [];
    nextPlayer.salutation = start.salutationId
      ? SALUTATIONS.find((s) => s.id === start.salutationId) || null
      : null;
    nextPlayer.signOff = start.signOffId
      ? SIGNOFFS.find((s) => s.id === start.signOffId) || null
      : null;
    nextPlayer.discoveredSets = [...safeMeta.discoveredSets];

    return {
      ...nextState,
      startConfig: nextConfig,
      player: nextPlayer,
    };
  }

  function getDepartmentIndex(departmentId) {
    const idx = START_DEPARTMENTS.findIndex((d) => d.id === departmentId);
    return idx >= 0 ? idx : 0;
  }

  function rotateDepartment(departmentId, dir) {
    const idx = getDepartmentIndex(departmentId);
    const step = Number.isFinite(dir) ? dir : 1;
    const nextIdx =
      (idx + step + START_DEPARTMENTS.length) % START_DEPARTMENTS.length;
    return START_DEPARTMENTS[nextIdx]?.id || START_DEPARTMENTS[0]?.id || "executive";
  }

  function isDepartmentUnlocked(metaState, departmentId) {
    if (departmentId === "executive") return true;
    const safeMeta = sanitizeMetaState(metaState);
    return !!safeMeta.departmentUnlocks[departmentId];
  }

  function getMaxPrestigeForDepartment(state, departmentId) {
    const unlocks = state?.startUnlocks || DEFAULT_START_UNLOCKS;
    const value = unlocks[departmentId];
    return typeof value === "number" && value >= 0 ? value : 0;
  }

  function canSelectPrestige(state, metaState, departmentId, prestige) {
    if (!isDepartmentUnlocked(metaState, departmentId)) return false;
    const p = Number.isFinite(prestige) ? prestige : -1;
    if (p < 0) return false;
    return p <= getMaxPrestigeForDepartment(state, departmentId);
  }

  function applyDepartmentUnlocks(state, metaState) {
    const safeMeta = sanitizeMetaState(metaState);
    const reputation = state?.player?.reputation || 0;
    if (!safeMeta.departmentUnlocks.finance && reputation >= 30) {
      return {
        metaState: {
          ...safeMeta,
          departmentUnlocks: {
            ...safeMeta.departmentUnlocks,
            finance: true,
          },
        },
        changed: true,
      };
    }
    return { metaState: safeMeta, changed: false };
  }

  function mergeMetaProgress(metaState, state) {
    const safeMeta = sanitizeMetaState(metaState);
    const nextMeta = {
      ...safeMeta,
      startUnlocks: { ...safeMeta.startUnlocks },
      discoveredSets: [...safeMeta.discoveredSets],
    };
    if (state?.startUnlocks && typeof state.startUnlocks === "object") {
      Object.keys(state.startUnlocks).forEach((key) => {
        const current = nextMeta.startUnlocks[key] ?? 0;
        const incoming = state.startUnlocks[key] ?? 0;
        if (incoming > current) nextMeta.startUnlocks[key] = incoming;
      });
    }
    if (Array.isArray(state?.player?.discoveredSets)) {
      state.player.discoveredSets.forEach((setId) => {
        if (!nextMeta.discoveredSets.includes(setId)) {
          nextMeta.discoveredSets.push(setId);
        }
      });
    }
    return nextMeta;
  }

  function prepareRunFromInduction(baseState, metaState, nameInput) {
    const { state: normalizedState, metaState: safeMeta } = ensureStartState(
      baseState,
      metaState,
    );
    const name = getDisplayName(nameInput);
    const email = getEmailFromName(name);
    let nextState = {
      ...normalizedState,
      _rngStore: null,
      aiPlannedActions: {},
      seed: null,
      rngStates: {},
      opponents: [],
      shopVisitIndex: 0,
      missionCycle: 0,
      currentMissionIndex: 0,
      turn: 0,
      lossReason: null,
      isProcessing: false,
      gameOver: false,
      missionActive: false,
      removedByPlayer: 0,
      removedTotal: 0,
      postPromotionScreen: null,
      ccPicksTaken: 0,
      ccPicksLeft: 0,
      shop: { directItems: [], packs: [], rerollCount: 0 },
      pendingTraining: null,
      roundEndUpgrades: {},
      expenseReportActive: false,
      messageLogEntries: [],
      player: getBasePlayerState(name, email),
    };
    const parsedSeed = parseSeedInput(nextState.startConfig?.seedInput);
    nextState.seed = parsedSeed != null ? parsedSeed : Date.now() >>> 0;
    nextState = applyStartConfigToPlayer(
      nextState,
      safeMeta,
      nextState.startConfig,
    );
    return { state: nextState, metaState: safeMeta };
  }

  function loadMeta(helpers = {}) {
    if (helpers.onLoadMeta) return helpers.onLoadMeta();
    if (helpers.onLoadMetaState) return helpers.onLoadMetaState();
    return null;
  }

  function saveMeta(metaState, helpers = {}) {
    if (helpers.onSaveMeta) return helpers.onSaveMeta(metaState);
    if (helpers.onSaveMetaState) return helpers.onSaveMetaState(metaState);
    return undefined;
  }

  function loadSave(helpers = {}) {
    if (helpers.onLoadSave) return helpers.onLoadSave();
    if (helpers.onLoadGamePayload) return helpers.onLoadGamePayload();
    return null;
  }

  function clearSave(helpers = {}) {
    if (helpers.onClearSave) return helpers.onClearSave();
    if (helpers.onClearSavedGame) return helpers.onClearSavedGame();
    return undefined;
  }

  function getUiScreenFromSave(activeScreen) {
    const map = {
      "induction-screen": "induction",
      "inbox-screen": "inbox",
      "game-ui": "game",
      "summary-screen": "summary",
      "shop-screen": "shop",
      "promotion-screen": "promotion",
      "campaign-complete-screen": "campaign-complete",
    };
    return map[activeScreen] || "inbox";
  }

  function getSaveScreenFromUi(uiScreen) {
    const map = {
      induction: "induction-screen",
      inbox: "inbox-screen",
      game: "game-ui",
      summary: "summary-screen",
      shop: "shop-screen",
      promotion: "promotion-screen",
      "campaign-complete": "campaign-complete-screen",
    };
    return map[uiScreen] || "inbox-screen";
  }

  ReplyAllEngine.start = {
    DEFAULT_START_CONFIG,
    DEFAULT_START_UNLOCKS,
    DEFAULT_DEPARTMENT_UNLOCKS,
    sanitizeMetaState,
    ensureStartState,
    getDisplayName,
    getEmailFromName,
    parseSeedInput,
    getBasePlayerState,
    applyStartConfigToPlayer,
    getDepartmentIndex,
    rotateDepartment,
    isDepartmentUnlocked,
    getMaxPrestigeForDepartment,
    canSelectPrestige,
    applyDepartmentUnlocks,
    mergeMetaProgress,
    prepareRunFromInduction,
    loadMeta,
    saveMeta,
    loadSave,
    clearSave,
    getUiScreenFromSave,
    getSaveScreenFromUi,
  };

  // ---------- Item Copy / Text Helpers ----------
  function getItemTypeLabel(itemType) {
    const entry = ITEM_TYPE_LABELS[itemType];
    return entry ? entry.label : itemType;
  }

  function formatMultiplier(value, opts = {}) {
    const prefix = opts.prefix == null ? "adds" : opts.prefix;
    const decimals = Number.isFinite(opts.decimals) ? opts.decimals : 2;
    const mult = 1 + (value || 0);
    const label = `x${mult.toFixed(decimals)}`;
    return prefix ? `${prefix} ${label}` : label;
  }

  function formatThreadLimitLabel(limit) {
    const labels = {
      1: "once per thread",
      2: "twice per thread",
      3: "thrice per thread",
      4: "4x per thread",
    };
    return labels[limit] || `up to ${limit}x per thread`;
  }

  function formatStatsText(stats) {
    if (!stats) return "";
    const parts = [];
    if (stats.globalDmg) parts.push(`+${stats.globalDmg} all messages`);
    if (stats.singleDmg) parts.push(`+${stats.singleDmg} reply to`);
    if (stats.escalateDmg) parts.push(`+${stats.escalateDmg} escalate`);
    if (stats.maxHp) parts.push(`+${stats.maxHp} max cred`);
    if (stats.repBonus) parts.push(`+${stats.repBonus} REP`);
    if (stats.endRep) parts.push(`+${stats.endRep} end REP`);
    if (stats.defFlat) parts.push(`+${stats.defFlat} defense`);
    if (stats.deflect) parts.push(`+${stats.deflect} deflect`);
    if (stats.retaliation) parts.push(`+${stats.retaliation} retaliation`);
    if (stats.heal) parts.push(`+${stats.heal} cred/turn`);
    if (stats.selfPromoteHeal) parts.push(`Self-Promote +${stats.selfPromoteHeal}`);
    if (stats.wins) parts.push(`+${stats.wins} wins`);
    if (stats.globalDmgMult) parts.push(`${formatMultiplier(stats.globalDmgMult)} all messages`);
    if (stats.singleDmgMult) parts.push(`${formatMultiplier(stats.singleDmgMult)} reply to`);
    if (stats.escalateDmgMult) parts.push(`${formatMultiplier(stats.escalateDmgMult)} escalate`);
    if (stats.levMult) parts.push(`${formatMultiplier(stats.levMult)} leverage`);
    if (stats.followUpChance) parts.push(`+${Math.round(stats.followUpChance * 100)}% follow-up`);
    if (stats.dodge) parts.push(`+${Math.round(stats.dodge * 100)}% distraction`);
    if (stats.addressLimit) parts.push(`+${stats.addressLimit} address limit`);
    if (stats.escalateRecoverPerHit) parts.push(`Escalate recover +${stats.escalateRecoverPerHit}`);
    if (stats.bccLimit) parts.push(`+${stats.bccLimit} Internal Services limit`);
    if (stats.numCCperCCaction) parts.push(`+${stats.numCCperCCaction} CC per action`);
    if (stats.contactTrainingLimit) parts.push(`+${stats.contactTrainingLimit} training limit`);
    if (stats.levGainReply) parts.push(`Reply to +${stats.levGainReply} leverage`);
    if (stats.levGainEscalate) parts.push(`Escalate +${stats.levGainEscalate} leverage`);
    if (stats.levGainDeflect) parts.push(`Deflect +${stats.levGainDeflect} leverage`);
    if (stats.levGainPromote) parts.push(`Self-Promote +${stats.levGainPromote} leverage`);
    return parts.join(", ");
  }

  function formatDeptScalersText(deptScalers) {
    if (!Array.isArray(deptScalers) || deptScalers.length === 0) return "";
    return deptScalers
      .map((s) => {
        if (!s || !s.departmentId || !s.stat) return "";
        const dept = DEPARTMENT_BY_ID?.[s.departmentId]?.name || s.departmentId;
        const per = typeof s.per === "number" ? s.per : 0;
        if (!per) return "";
        const step = typeof s.step === "number" && s.step > 0 ? s.step : 1;
        const statText = formatStatsText({ [s.stat]: per });
        if (!statText) return "";
        const stepLabel = step === 1 ? "contact" : `${step} contacts`;
        return `When upgrading a ${dept} contact: ${statText} per ${dept} ${stepLabel}`;
      })
      .filter(Boolean)
      .join(", ");
  }

  function describeEffect(effect) {
    if (!effect) return "";
    const parts = [];
    if (effect.special) parts.push(effect.special);
    const statText = formatStatsText(effect);
    if (statText) parts.push(statText);
    if (effect.retaliation) parts.push(`Retaliation +${effect.retaliation}`);
    if (effect.deflect) parts.push(`Deflect reduce +${effect.deflect}`);
    if (effect.selfPromoteHeal) parts.push(`Self-Promote +${effect.selfPromoteHeal}`);
    if (effect.replyDeptCleave) parts.push("Reply to hits entire target department");
    if (effect.replySecondaryHalf) parts.push("Reply to hits a random secondary for half damage");
    if (Array.isArray(effect.scalers) && effect.scalers.length) {
      const buckets = {};
      effect.scalers.forEach((s) => {
        if (!s || !s.source || !s.stat) return;
        const key = s.source;
        if (!buckets[key]) buckets[key] = {};
        buckets[key][s.stat] = (buckets[key][s.stat] || 0) + (s.per || 0);
      });
      Object.entries(buckets).forEach(([source, stats]) => {
        const label = source === "cc" ? "Per CC" : "For each signature you have";
        const chunks = [];
        if (stats.singleDmg) chunks.push(`${stats.singleDmg} reply to`);
        if (stats.escalateDmg) chunks.push(`${stats.escalateDmg} escalate`);
        if (stats.maxHp) chunks.push(`${stats.maxHp} Max Cred`);
        if (stats.selfPromoteHeal) chunks.push(`${stats.selfPromoteHeal} self-promote`);
        if (stats.deflect) chunks.push(`${stats.deflect} deflect reduce`);
        if (stats.retaliation) chunks.push(`${stats.retaliation} retaliation`);
        if (chunks.length) {
          const formatted = chunks.map((chunk) =>
            chunk.trim().startsWith("-") ? chunk : `+${chunk}`,
          );
          parts.push(`${label}, ${formatted.join(", ")}`);
        }
      });
    }
    if (effect.deflectBoostSingle || effect.deflectBoostEscalate) {
      parts.push(`On Deflect: +${effect.deflectBoostSingle || 0} reply to, +${effect.deflectBoostEscalate || 0} escalate`);
    }
    if (effect.defFlat) parts.push(`Reduce damage by ${effect.defFlat}`);
    if (effect.followUpChance) parts.push(`Follow-up +${Math.round(effect.followUpChance * 100)}%`);
    if (effect.escalateRecoverPerHit) parts.push(`Escalate recover +${effect.escalateRecoverPerHit}`);
    if (effect.heal) parts.push(`+${effect.heal} Cred/turn`);
    return parts.join(", ");
  }

  function formatEffect(effect, opts = {}) {
    if (!effect) return "";
    const includeLimit = !!opts.includeLimit;
    const contactNoun = opts.contactNoun || "CC";
    const upgradeVerb = opts.upgradeVerb || "upgrade";
    const eventLabels = {
      thread_start: "On thread start",
      thread_end: "On thread end",
      reply_to: "On Reply to",
      reply_all: "On Reply All",
      escalate: "On Escalate",
      shop_enter: "On shop enter",
      bcc_use: "On BCC",
      deflect_action: "On Deflect",
      deflect_proc: "On Being Hit While Deflecting",
      remove_stakeholder: "On stakeholder removed",
      cc_add: "On Contact added",
      pack_purchase: "On pack purchase",
      promote_overflow: "On self-promote overflow",
      rep_adjust: "On REP adjust",
      rep_tick: "On REP update",
      stakeholder_opt_out: "On stakeholder removed",
      stakeholder_opt_out_other: "On other stakeholder removed",
    };
    const eventText = eventLabels[effect.event] || "On event";
    const statsText = formatStatsText(effect.stats || {});
    let result = "";
    if (effect.type === "add_random_cc_bonus") {
      const count = effect.count || 1;
      const countLabel = count > 1 ? `${count} random ${contactNoun}s` : `a random ${contactNoun}`;
      const verb = count > 1 ? "gain" : "gains";
      result = statsText ? `${eventText}: ${countLabel} ${verb} ${statsText}` : `${eventText}: ${upgradeVerb} ${countLabel}`;
    } else if (effect.type === "add_cc_bonus") {
      result = statsText ? `${eventText}: ${contactNoun} gains ${statsText}` : `${eventText}: ${upgradeVerb} that ${contactNoun}`;
    } else if (effect.type === "add_signoff_bonus") {
      const cleaned = statsText.replace(/adds\s+(x[\d.]+)/gi, "$1");
      result = `${eventText}: gain ${cleaned} permanently`;
    } else if (effect.type === "add_salutation_bonus") {
      const cleaned = statsText.replace(/adds\s+(x[\d.]+)/gi, "$1");
      result = `${eventText}: gain ${cleaned} permanently`;
    } else if (effect.type === "add_thread_bonus") {
      const eventLabel = eventText.replace("On ", "On '") + "'";
      const statsLabel = statsText
        .replace(/\+(\d+)\s+reply to/gi, "+$1 Reply To")
        .replace(/\+(\d+)\s+escalate/gi, "+$1 Escalate")
        .replace(/\+(\d+)\s+all messages/gi, "+$1 to your messages");
      let onceText = "";
      if (effect.threadLimit != null) {
        onceText = ` (${formatThreadLimitLabel(effect.threadLimit)})`;
      }
      result = `${eventLabel}${onceText}, gain ${statsLabel} until the end of this thread`;
    } else if (effect.type === "add_bcc") {
      const count = effect.count || 1;
      result = `${eventText}: gain ${count} Help Desk contact${count === 1 ? "" : "s"}`;
    } else if (effect.type === "duplicate_bcc") {
      const count = effect.count || 1;
      result = `${eventText}: duplicate ${count} Help Desk contact${count === 1 ? "" : "s"}`;
    } else if (effect.type === "add_all_cc_bonus") {
      result = statsText
        ? `${eventText}: all ${contactNoun}s gain ${statsText}`
        : `${eventText}: ${upgradeVerb} all ${contactNoun}s`;
    } else if (effect.type === "gain_rep") {
      const amount = effect.amount || 0;
      result = `${eventText}: gain ${amount} REP`;
    } else if (effect.type === "grow_sig_stat") {
      const stat = effect.stat || "";
      const amount = effect.amount || 0;
      const statLabel = STAT_METADATA?.[stat]?.label || stat || "signature stat";
      const sign = amount >= 0 ? "+" : "";
      result = `${eventText}: this signature gains ${sign}${amount} ${statLabel}`;
    } else if (effect.type === "rep_scale_salutation") {
      const stat = effect.stat || "singleDmg";
      const step = effect.step || 1;
      const perStep = effect.amount || 1;
      const statLabel = STAT_METADATA?.[stat]?.label || stat;
      result = `${eventText}: every ${step} REP grants +${perStep} ${statLabel} to your greeting`;
    } else {
      result = statsText || describeEffect(effect) || "Effect";
    }

    if (includeLimit && effect.threadLimit != null && !/per thread|up to/i.test(result)) {
      result += ` (${formatThreadLimitLabel(effect.threadLimit)})`;
    }
    if (effect.requiresHpFull) result += " (requires full credibility)";
    return result;
  }

  function getDisplayEffect(item, opts = {}) {
    if (!item) return "";
    if (Array.isArray(item.effects) && item.effects.length) {
      const isSignoff = item.itemType === "signoff";
      return item.effects
        .map((effect) =>
          formatEffect(effect, {
            includeLimit: isSignoff,
            contactNoun: isSignoff ? "Contact" : "CC",
            upgradeVerb: isSignoff ? "train" : "upgrade",
            ...opts,
          }),
        )
        .join(" • ");
    }
    const parts = [];
    const statsText = formatStatsText(item);
    if (statsText) parts.push(statsText);
    if (item.eff && typeof item.eff === "object") {
      const effText = formatStatsText(item.eff);
      if (effText) parts.push(effText);
    }
    const deptScalerText = formatDeptScalersText(item.deptScalers);
    if (deptScalerText) parts.push(deptScalerText);
    if (parts.length) return parts.join(" • ");
    if (
      item.scalers ||
      item.statWindows ||
      item.replyDeptCleave ||
      item.replySecondaryHalf ||
      item.deflectBoostSingle ||
      item.deflectBoostEscalate ||
      item.disableReplyTo ||
      item.addSingleToEscalate ||
      item.replyAllPerActive ||
      item.escalatePerActive
    ) {
      const desc = describeEffect(item);
      if (desc) return desc;
    }
    if (item.bonus) return item.bonus;
    if (typeof item.getBonusText === "function") return item.getBonusText();
    return "No listed effect.";
  }

  function getItemBonusText(item, opts = {}) {
    return getDisplayEffect(item, opts);
  }

  function getTrainingStatPreview(player, item) {
    if (!player || !item || item.itemType !== "dev") return [];
    const source = item.stats && typeof item.stats === "object" ? item.stats : item;
    const rows = [];
    (STAT_FIELDS || []).forEach((field) => {
      const delta = source[field];
      if (typeof delta !== "number" || delta === 0) return;
      const before = typeof player[field] === "number" ? player[field] : 0;
      rows.push({
        field,
        label: STAT_METADATA?.[field]?.label || field,
        before,
        after: before + delta,
        delta,
      });
    });
    return rows;
  }

  ReplyAllEngine.copy = {
    getItemTypeLabel,
    formatMultiplier,
    formatThreadLimitLabel,
    formatStatsText,
    formatDeptScalersText,
    describeEffect,
    formatEffect,
    getDisplayEffect,
    getItemBonusText,
    getTrainingStatPreview,
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

  function getUnitMaxHp(ctx, unit, turnOverride = null) {
    if (!unit) return 0;
    const stats = computeUnitStats(ctx, unit, turnOverride);
    return stats.maxHp ?? unit.maxHp ?? unit.hp ?? 0;
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
    getUnitMaxHp,
    getUnitFlatDef,
    getUnitTotalHeal,
    getUnitSelfPromoteHeal,
    getUnitFollowUpChance,
    getUnitEscalateRecover,
    getUnitAddressLimit,
  };

  function getStatCtx(state) {
    return state?._statCtx || null;
  }

  function applyUnitDefaults(u) {
    if (!u) return;
    if (u.singleDmg == null) u.singleDmg = 10;
    if (u.escalateDmg == null) u.escalateDmg = 5;
    if (u.globalDmg == null) u.globalDmg = 0;
    if (u.singleDmgMult == null) u.singleDmgMult = 0;
    if (u.escalateDmgMult == null) u.escalateDmgMult = 0;
    if (u.globalDmgMult == null) u.globalDmgMult = 0;
    if (u.maxHp == null) u.maxHp = 0;
    if (u.wins == null) u.wins = 0;
    if (u.retaliation == null) u.retaliation = 5;
    if (u.deflect == null || u.deflect === 0) u.deflect = 5;
    if (u.deflectCharge == null) u.deflectCharge = 0;
    if (u.deflectChargeReflect == null) u.deflectChargeReflect = 0;
    if (u.deflectChargeReduce == null) u.deflectChargeReduce = 0;
    if (u.followUpChance == null) u.followUpChance = 0;
    if (u.escalateRecoverPerHit == null) u.escalateRecoverPerHit = 0;
    if (u.selfPromoteHeal == null) u.selfPromoteHeal = 0;
    if (u.defFlat == null) u.defFlat = 0;
    if (u.heal == null) u.heal = 0;
    if (u.levMult == null) u.levMult = 0;
    if (u.levGainReply == null) u.levGainReply = 0;
    if (u.levGainEscalate == null) u.levGainEscalate = 0;
    if (u.levGainDeflect == null) u.levGainDeflect = 0;
    if (u.levGainPromote == null) u.levGainPromote = 0;
    if (u.repBonus == null) u.repBonus = 0;
    if (u.endRep == null) u.endRep = 0;
    if (u.addressLimit == null) u.addressLimit = 0;
    if (u.numCCperCCaction == null) u.numCCperCCaction = 1;
    if (u.bccLimit == null) u.bccLimit = 0;
    if (u.contactTrainingLimit == null) u.contactTrainingLimit = 3;
    if (!Array.isArray(u.deflectLines) || u.deflectLines.length === 0) {
      u.deflectLines = [
        "I'm pausing to document this thread before responding further.",
      ];
    }
  }

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
      applyUnitDefaults(clone);
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
      applyUnitDefaults(p);
      p._lineBags = {};
      p.ult = 0;
      p.buffs = [];
      p.deflectCharge = 0;
      p.deflectChargeReflect = 0;
      p.deflectChargeReduce = 0;
      p.threadBonuses = {};
      const statCtx = getStatCtx(state);
      const baseStats = statCtx
        ? ReplyAllEngine.stats.computeUnitStats(statCtx, p)
        : p;
      p.hp = baseStats?.maxHp ?? p.maxHp ?? p.hp;
      p.currentWins = Math.max(0, Math.floor(baseStats?.wins || 0));
    }

    CONTACTS.forEach((c) => (c.usedBy = null));
    if (p) runUnitEffects(state, p, "thread_start", {}, helpers);

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
    const combatKey = rngStore.missionKey(state, MISSIONS, "combat");
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
    const statCtx = getStatCtx(state);
    const maxHp = statCtx
      ? ReplyAllEngine.stats.getUnitMaxHp(statCtx, ai)
      : ai.maxHp ?? ai.hp;
    const aiHpBeforePassive = ai.hp;
    const totalHeal = statCtx
      ? ReplyAllEngine.stats.getUnitTotalHeal(statCtx, ai)
      : 0;
    ai.hp = Math.min(maxHp, ai.hp + totalHeal);
    if (helpers.logPassiveHeal) {
      helpers.logPassiveHeal(state, ai, aiHpBeforePassive, ai.hp, "ai_turn_start");
    }

    const promoteHeal = statCtx
      ? ReplyAllEngine.stats.getUnitSelfPromoteHeal(statCtx, ai, 15)
      : 15;
    const defFlat = statCtx
      ? ReplyAllEngine.stats.getUnitFlatDef(statCtx, ai)
      : 0;
    const defReduce = ai.deflectChargeReduce || 0;
    const playerSingle = statCtx
      ? ReplyAllEngine.stats.getUnitDamage(statCtx, player, "single")
      : 0;
    const playerEscalate = statCtx
      ? ReplyAllEngine.stats.getUnitDamage(statCtx, player, "escalate")
      : 0;
    const dmgSingle = Math.max(0, playerSingle - defFlat - defReduce);
    const dmgEscalate = Math.max(0, playerEscalate - defFlat - defReduce);
    const inOneHitRange = dmgSingle >= ai.hp || dmgEscalate >= ai.hp;
    const canUseFullPromote = promoteHeal > 0 && ai.hp + promoteHeal <= maxHp;
    const selfPromoteEligible =
      ai.hp < maxHp && ai.wins > 0 && inOneHitRange && canUseFullPromote;

    const availFromBook = (ai.addressBook || [])
      .map((id) => CONTACTS.find((con) => con.id === id))
      .filter((c) => c && !isContactInLoop(state, c.id) && !isContactImplicated(state, c));
    if (roll < 0.15 && availFromBook.length > 0) {
      const numPicks = statCtx
        ? ReplyAllEngine.stats.computeUnitStats(statCtx, ai).numCCperCCaction
        : 1;
      const picks = [];
      for (let p = 0; p < numPicks; p++) {
        const currentAvail = (ai.addressBook || [])
          .map((id) => CONTACTS.find((con) => con.id === id))
          .filter((c) => c && !isContactInLoop(state, c.id) && !isContactImplicated(state, c));
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

  function isContactInLoop(state, contactId) {
    if (!state?.player || !contactId) return false;
    if (state.player.buffs?.some((b) => b.id === contactId)) return true;
    for (const opp of state.opponents || []) {
      if (opp?.hp > 0 && opp.buffs?.some((b) => b.id === contactId))
        return true;
    }
    return false;
  }

  function isContactImplicated(state, contact) {
    if (!state?.opponents || !contact || !contact.employeeId) return false;
    return state.opponents.some(
      (o) => o.hp > 0 && o.employeeId === contact.employeeId,
    );
  }

  function isPlannedActionValid(state, ai, plan, helpers = {}) {
    if (!plan || !ai || ai.hp <= 0) return false;
    const target =
      plan.target &&
      (plan.target.id === "player"
        ? { id: "player" }
        : (state.opponents || []).find((o) => o.id === plan.target.id));
    const contactInLoop = (id) => isContactInLoop(state, id);
    const contactImplicated = (c) => isContactImplicated(state, c);
    if (plan.type === "cc") {
      const available = (ai.addressBook || [])
        .map((id) => CONTACTS.find((con) => con.id === id))
        .filter((c) => c && !contactInLoop(c.id) && !contactImplicated(c));
      if (!available.length) return false;
      const plannedIds = (plan.ccTargets || []).map((c) => c.id);
      return plannedIds.some((id) => available.some((c) => c.id === id));
    }
    if (plan.type === "attack") return !!target && target.id != null;
    if (plan.type === "escalate") return true;
    if (plan.type === "deflect")
      return ai.deflectChargeReduce <= 0 && ai.deflectChargeReflect <= 0;
    if (plan.type === "promote") return ai.wins > 0;
    return false;
  }

  function getContactUsedBy(state, contactId) {
    if (!state?.player || !contactId) return null;
    const playerBuff = state.player.buffs?.find((b) => b.id === contactId);
    if (playerBuff) return playerBuff.usedBy || state.player.name;
    for (const opp of state.opponents || []) {
      const buff = (opp.buffs || []).find((b) => b.id === contactId);
      if (buff) return buff.usedBy || opp.name;
    }
    return null;
  }

  function getPlayerLeverageGain(state, actionType, base, helpers = {}) {
    const p = state.player;
    const statCtx = getStatCtx(state);
    const stats = statCtx
      ? ReplyAllEngine.stats.computeUnitStats(statCtx, p)
      : p;
    const bonusMap = {
      reply_to: stats.levGainReply || 0,
      escalate: stats.levGainEscalate || 0,
      deflect: stats.levGainDeflect || 0,
      promote: stats.levGainPromote || 0,
    };
    const bonus = bonusMap[actionType] || 0;
    const totalBase = base + bonus;
    return totalBase * (1 + (stats.levMult || 0));
  }

  function pickRandomItem(state, list, fallback, rngKey = "misc") {
    if (!Array.isArray(list) || list.length === 0) return fallback;
    const rngStore = getRngStore(state);
    return list[rngStore.int(state, rngKey, list.length)];
  }

  function shuffle(state, array, rngKey = "misc") {
    const rngStore = getRngStore(state);
    for (let i = array.length - 1; i > 0; i--) {
      const j = rngStore.int(state, rngKey, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function drawFromLineBag(state, holder, key, source, fallback, rngKey = "misc") {
    if (!holder) return fallback;
    if (!holder._lineBags) holder._lineBags = {};
    let bag = holder._lineBags[key];
    if (!Array.isArray(bag) || bag.length === 0) {
      const fresh = Array.isArray(source) ? [...source] : [];
      if (fresh.length === 0) return fallback;
      bag = shuffle(state, fresh, rngKey);
    }
    const next = bag.pop();
    holder._lineBags[key] = bag;
    return next == null ? fallback : next;
  }

  function getPlayerLineBagKey(action, missionId, titleId) {
    return `player:${action}:${missionId || "default"}:${titleId || "base"}`;
  }

  function getPlayerActionLines(state, action, missionId) {
    const p = state.player || {};
    const titleId = p.title ? p.title.id : null;
    const byMission = (p[`${action}LinesByMission`] || {})[missionId] || [];
    const byTitle = (p[`${action}LinesByTitle`] || {})[titleId] || [];
    let base = [];
    if (action === "attack") base = p.attacks || [];
    else if (action === "selfPromote") base = p.selfPromoteLines || [];
    else if (action === "replyAll") base = p.replyAllLines || [];
    else if (action === "escalate") base = p.escalateLines || [];
    else if (action === "deflect") base = p.deflectLines || [];
    return [...base, ...byMission, ...byTitle];
  }

  function getUnitSelfPromoteLines(unit) {
    if (Array.isArray(unit?.selfPromoteLines) && unit.selfPromoteLines.length)
      return unit.selfPromoteLines;
    if (unit?.selfPromote) return [unit.selfPromote];
    return [];
  }

  function getDepartmentName(departmentId) {
    if (!departmentId) return "";
    return DEPARTMENT_BY_ID[departmentId]?.name || departmentId;
  }

  function formatLoopInText(contact, fallback) {
    if (!contact || !contact.loopInText) return fallback;
    const departmentName = getDepartmentName(contact.departmentId);
    return contact.loopInText
      .replace(/{name}/g, contact.name || "")
      .replace(/{title}/g, contact.title || "")
      .replace(/{department}/g, departmentName);
  }

  function addContactBuff(state, target, contact, usedBy, helpers = {}) {
    if (!target || !contact) return null;
    const buff = JSON.parse(JSON.stringify(contact));
    buff.usedBy = usedBy;
    if (usedBy === state.player?.name) {
      runUnitEffects(state, state.player, "cc_add", { contact: buff }, helpers);
      const permanentBoost =
        state.player.contactPermanentBoosts &&
        state.player.contactPermanentBoosts[buff.id];
      if (permanentBoost) {
        const baseEff = buff.eff || {};
        buff.eff = { ...baseEff };
        Object.keys(permanentBoost).forEach((key) => {
          const value = permanentBoost[key];
          if (typeof value !== "number") return;
          buff.eff[key] = (buff.eff[key] || 0) + value;
        });
      }
    }
    if (usedBy === state.player?.name && state.player.contactUpgrades) {
      const upgrade = state.player.contactUpgrades[buff.id];
      if (upgrade && upgrade.eff) {
        applyBuffStats(buff, upgrade.eff);
        buff.subtitle = upgrade.subtitle || buff.subtitle;
      }
    }
    if (ReplyAllEngine.log?.logEvent) {
      ReplyAllEngine.log.logEvent(state, "cc_added", {
        actor: usedBy,
        contactId: buff.id,
        contactName: buff.name || null,
        targetId: target.id || null,
        targetName: target.name || null,
        statsSnapshot: ReplyAllEngine.log.snapshotContactStats(
          state,
          buff,
          usedBy,
        ),
      });
    }
    target.buffs = target.buffs || [];
    target.buffs.push(buff);
    if (buff.eff && buff.eff.maxHp) {
      const statCtx = getStatCtx(state);
      const maxHp = statCtx
        ? ReplyAllEngine.stats.getUnitMaxHp(statCtx, target)
        : target.maxHp ?? target.hp;
      target.hp = Math.min(maxHp, target.hp + buff.eff.maxHp);
    }
    if (helpers.onBuffAdded) helpers.onBuffAdded(buff, target, usedBy);

    if (
      contact.id === "cc_andrew_legal" ||
      contact.id === "cc_megan_legal"
    ) {
      const hasAndrew = target.buffs.some(
        (b) => b.id === "cc_andrew_legal" && b.usedBy === usedBy,
      );
      const hasMegan = target.buffs.some(
        (b) => b.id === "cc_megan_legal" && b.usedBy === usedBy,
      );
      const hasElsie = target.buffs.some(
        (b) => b.id === "cc_elsie" && b.usedBy === usedBy,
      );
      if (hasAndrew && hasMegan && !hasElsie) {
        const elsie = CONTACTS.find((c) => c.id === "cc_elsie");
        if (elsie) {
          addContactBuff(state, target, elsie, usedBy, helpers);
          if (helpers.onAutoAdd) {
            helpers.onAutoAdd(elsie, "elsie", usedBy);
          }
        }
      }
    }

    if (
      contact.id === "cc_anneke_executive_council_office" ||
      contact.id === "cc_willy_boy_information_technology"
    ) {
      const hasAnneke = target.buffs.some(
        (b) => b.id === "cc_anneke_executive_council_office" && b.usedBy === usedBy,
      );
      const hasWill = target.buffs.some(
        (b) => b.id === "cc_willy_boy_information_technology" && b.usedBy === usedBy,
      );
      const hasTater = target.buffs.some(
        (b) => b.id === "cc_tater_the_dog" && b.usedBy === usedBy,
      );
      if (hasAnneke && hasWill && !hasTater) {
        const tater = CONTACTS.find((c) => c.id === "cc_tater_the_dog");
        if (tater) {
          addContactBuff(state, target, tater, usedBy, helpers);
          if (helpers.onAutoAdd) {
            helpers.onAutoAdd(tater, "tater", usedBy);
          }
        }
      }
    }

    return buff;
  }

  function clearDeflectCharges(unit) {
    if (!unit) return;
    unit.deflectChargeReduce = 0;
    unit.deflectChargeReflect = 0;
  }

  function clearOpponentDeflects(state) {
    (state.opponents || []).forEach((o) => clearDeflectCharges(o));
  }

  function startQuarterState(state, mission, data = {}, helpers = {}) {
    state.gameOver = false;
    state.missionActive = true;
    state.turn = 0;
    state.lossReason = null;
    state.isProcessing = false;
    state.roundEndUpgrades = {};
    state.expenseReportActive = false;
    state.threadEffectFlags = {};

    const p = state.player;
    if (p) {
      applyUnitDefaults(p);
      p._lineBags = {};
      p.ult = 0;
      p.buffs = [];
      p.deflectCharge = 0;
      p.deflectChargeReflect = 0;
      p.deflectChargeReduce = 0;
      p.threadBonuses = {};
      const statCtx = getStatCtx(state);
      const baseStats = statCtx
        ? ReplyAllEngine.stats.computeUnitStats(statCtx, p)
        : p;
      const maxHp = baseStats?.maxHp ?? p.maxHp ?? p.hp;
      p.hp = maxHp;
      p.currentWins = Math.max(0, Math.floor(baseStats?.wins || 0));
    }

    if (state.analytics) {
      state.analytics.lastRoundRep = state.player?.reputation;
    }

    CONTACTS.forEach((c) => (c.usedBy = null));

    if (p) {
      runUnitEffects(state, p, "thread_start", {}, helpers);
    }

    const opponents = buildOpponentsForMission(state, mission, data, helpers);
    state.opponents = opponents;
    state.removedTotal = opponents.length;
    state.removedByPlayer = 0;
    state.targetId = opponents[0]?.id || null;

    return state;
  }

  function endQuarterState(state) {
    state.isProcessing = true;
    state.missionActive = false;
    state.shopVisitIndex = (state.shopVisitIndex || 0) + 1;
    return state;
  }

  function applyRoundEndState(state) {
    clearDeflectCharges(state.player);
    state.isProcessing = false;
    const repAfter = state.player?.reputation ?? 0;
    const repBefore =
      state.analytics && typeof state.analytics.lastRoundRep === "number"
        ? state.analytics.lastRoundRep
        : repAfter;
    if (state.analytics) state.analytics.lastRoundRep = repAfter;
    return {
      repBefore,
      repAfter,
      repDelta: repAfter - repBefore,
      opponentsRemaining: (state.opponents || []).filter((o) => o.hp > 0).length,
    };
  }

  function triggerTimeoutLoss(state) {
    if (state.gameOver) return state;
    state.gameOver = true;
    state.missionActive = false;
    state.lossReason = "timeout";
    return state;
  }

  function isMissionOverdue(state, mission) {
    const turns = mission && typeof mission.turns === "number" ? mission.turns : 0;
    return state.turn > turns;
  }

  function saveGameState(state, helpers = {}) {
    if (helpers.onSaveGame) helpers.onSaveGame(state);
  }

  function saveMetaState(metaState, helpers = {}) {
    if (helpers.onSaveMetaState) helpers.onSaveMetaState(metaState);
  }

  function getMetaState(helpers = {}) {
    if (helpers.onLoadMetaState) return helpers.onLoadMetaState();
    return null;
  }

  function serializePlayer(player) {
    if (!player) return player;
    return {
      ...player,
      titleId: player.title ? player.title.id : null,
      salutationId: player.salutation ? player.salutation.id : null,
      signOffId: player.signOff ? player.signOff.id : null,
      signatureIds: player.signatures ? player.signatures.map((s) => s.id) : [],
      bccIds: player.bccContacts ? player.bccContacts.map((b) => b.id) : [],
      discoveredSets: player.discoveredSets || [],
    };
  }

  function hydratePlayer(saved) {
    if (!saved) return saved;
    const title = TITLES.find((t) => t.id === saved.titleId) || TITLES[0];
    const salutation = saved.salutationId
      ? SALUTATIONS.find((s) => s.id === saved.salutationId) || null
      : null;
    const signOff = saved.signOffId
      ? SIGNOFFS.find((s) => s.id === saved.signOffId) || null
      : null;
    const signatures = Array.isArray(saved.signatureIds)
      ? saved.signatureIds
          .map((id) => SIGNATURES.find((s) => s.id === id))
          .filter(Boolean)
      : [];
    const bccContacts = Array.isArray(saved.bccIds)
      ? saved.bccIds
          .map((id) => BCC_CONTACTS.find((b) => b.id === id))
          .filter(Boolean)
      : [];
    const player = {
      ...saved,
      title,
      salutation,
      signOff,
      signatures,
      bccContacts,
      discoveredSets: saved.discoveredSets || [],
      contactTrainingCount: saved.contactTrainingCount || {},
      coachingBoosts: saved.coachingBoosts || {},
    };
    applyUnitDefaults(player);
    return player;
  }

  function serializeShop(shop) {
    const mapItem = (item) => ({
      id: item.id,
      purchased: !!item.purchased,
      itemType: item.itemType,
    });
    return {
      directItems: (shop.directItems || []).map(mapItem),
      packs: (shop.packs || []).map((p) => ({
        ...p,
        options: (p.options || []).map(mapItem),
      })),
    };
  }

  function hydrateShop(savedShop) {
    if (!savedShop) return { directItems: [], packs: [] };
    const getItem = (s) => {
      let source = [];
      if (s.itemType === "contact") source = CONTACTS;
      else if (s.itemType === "signature") source = SIGNATURES;
      else if (s.itemType === "salutation") source = SALUTATIONS;
      else if (s.itemType === "signoff") source = SIGNOFFS;
      else if (s.itemType === "bcc") source = BCC_CONTACTS;
      else if (s.itemType === "dev") source = buildTrainingUpgrades();
      const found = source.find((item) => item.id === s.id);
      if (!found) return null;
      return { ...found, purchased: !!s.purchased, itemType: s.itemType };
    };
    return {
      directItems: (savedShop.directItems || []).map(getItem).filter(Boolean),
      packs: (savedShop.packs || []).map((p) => ({
        ...p,
        options: (p.options || []).map(getItem).filter(Boolean),
      })),
    };
  }

  function buildSavePayload(state, opponents, activeScreen) {
    const savedState = {
      ...state,
      player: serializePlayer(state.player),
      shop: serializeShop(state.shop || {}),
    };
    // Runtime-only caches should never be persisted.
    delete savedState._statCtx;
    delete savedState._rngStore;
    return {
      state: savedState,
      opponents: Array.isArray(opponents) ? opponents : [],
      activeScreen,
    };
  }

  function saveGame(state, opponents, activeScreen, helpers = {}) {
    const payload = buildSavePayload(state, opponents, activeScreen);
    if (helpers.onSaveGamePayload) helpers.onSaveGamePayload(payload);
    else if (helpers.onSaveGame) helpers.onSaveGame(payload);
    return payload;
  }

  function getSavedGame(helpers = {}) {
    if (helpers.onLoadGamePayload) return helpers.onLoadGamePayload();
    return null;
  }

  function clearSavedGame(helpers = {}) {
    if (helpers.onClearSavedGame) helpers.onClearSavedGame();
  }

  function applySavedGame(save, helpers = {}) {
    if (!save || !save.state) return null;
    const nextState = {
      ...save.state,
      player: hydratePlayer(save.state.player),
      shop: hydrateShop(save.state.shop),
    };
    if (helpers.onApplySavedGame) helpers.onApplySavedGame(nextState, save);
    return { state: nextState, opponents: save.opponents || [] };
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

    const statCtx = getStatCtx(state);
    const damageType =
      action.type === "ATTACK" ? "single" :
      action.type === "ESCALATE" ? "escalate" :
      action.type === "ULT" ? "replyAll" : null;

    if (action.type === "DEFLECT") {
      resolveDeflect(state, actor, helpers);
      return { ok: true, action };
    }

    if (action.type === "PROMOTE") {
      const stats = statCtx
        ? ReplyAllEngine.stats.computeUnitStats(statCtx, actor)
        : actor;
      const maxHp = stats?.maxHp ?? actor.maxHp ?? actor.hp;
      const heal = statCtx
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
            statCtx
              ? ReplyAllEngine.stats.getUnitDamage(statCtx, actor, damageType)
              : 0,
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
        statCtx
          ? ReplyAllEngine.stats.getUnitDamage(statCtx, actor, damageType)
          : 0,
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
    const attackerHpBefore =
      attacker && attacker.hp != null ? attacker.hp : null;
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
    const attackerHpAfter =
      attacker && attacker.hp != null ? attacker.hp : null;
    return {
      dmg,
      blocked,
      reflected,
      targetHpBefore,
      targetHpAfter: target.hp,
      attackerHpBefore,
      attackerHpAfter,
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

  function applyDamage(state, attacker, target, rawDamage, options = {}, helpers = {}) {
    if (!target) return { dmg: 0, blocked: 0, reflected: 0 };
    const result = resolveDamage(state, attacker, target, rawDamage, options);
    if (result.blocked > 0 && target?.salutation) {
      runUnitEffects(state, target, "deflect_proc", {
        attacker,
        target,
        blocked: result.blocked,
      }, helpers);
    }
    return result;
  }

  function applyDepartmentCleave(state, attacker, target, damage, helpers = {}) {
    if (!damage || !target || !target.departmentId) return { total: 0, hits: 0 };
    const units = [...(state.opponents || []), state.player].filter(Boolean);
    let total = 0;
    let hits = 0;
    units.forEach((u) => {
      if (!u || u.hp <= 0) return;
      if (u === target) return;
      if (attacker && u === attacker) return;
      if (u.departmentId !== target.departmentId) return;
      const result = applyDamage(state, attacker, u, damage, {}, helpers);
      total += result.dmg;
      hits += 1;
      if (u !== state.player && u.hp <= 0) {
        handleOpponentDefeat(state, u, attacker?.id === "player", attacker, helpers);
      }
    });
    return { total, hits };
  }

  function handleOpponentDefeat(state, o, byPlayer = false, attacker = null, helpers = {}) {
    if (!o || o.isDefeated) return;
    o.hp = 0;
    o.isDefeated = true;
    o.buffs = [];
    if (ReplyAllEngine.log?.logEvent) {
      ReplyAllEngine.log.logEvent(state, "stakeholder_opt_out", {
        actorId: o.employeeId || o.id,
        actorName: o.name,
        byPlayer,
      });
    }
    runUnitEffects(state, state.player, "stakeholder_opt_out", {
      target: o,
      byPlayer,
      attacker,
    }, helpers);
    if (!byPlayer && attacker && attacker.id !== "player") {
      runUnitEffects(state, state.player, "stakeholder_opt_out_other", {
        target: o,
        attacker,
      }, helpers);
    }
    if (o.employeeId === "colin_information_technology") {
      if (helpers.onDepartmentUnlock) helpers.onDepartmentUnlock("it", o);
    }
    if (byPlayer) {
      state.removedByPlayer = (state.removedByPlayer || 0) + 1;
      o.removedByPlayer = true;
      runUnitEffects(state, state.player, "remove_stakeholder", { target: o }, helpers);
    }
    if (helpers.onDefeat) helpers.onDefeat(o, byPlayer, attacker);
    if (state.targetId === o.id) {
      const next = (state.opponents || []).find((opp) => opp.hp > 0);
      if (next) state.targetId = next.id;
    }
    if ((state.opponents || []).every((opp) => opp.hp <= 0)) {
      if (!state.gameOver) {
        runUnitEffects(state, state.player, "thread_end", {}, helpers);
        const statCtx = getStatCtx(state);
        const maxHp = statCtx
          ? ReplyAllEngine.stats.getUnitMaxHp(statCtx, state.player)
          : state.player.maxHp ?? state.player.hp;
        state.player.hp = maxHp;
        state.gameOver = true;
        if (helpers.onThreadEnd) helpers.onThreadEnd(state);
      }
    }
  }

  function resolveFollowUps(state, payload = {}, helpers = {}) {
    const {
      attacker,
      target,
      baseDamage,
      combatKey,
      onHit,
      onExtras,
    } = payload;
    const results = [];
    if (!attacker || !target || target.hp <= 0) return results;
    const statCtx = getStatCtx(state);
    let chance = statCtx
      ? ReplyAllEngine.stats.getUnitFollowUpChance(statCtx, attacker)
      : 0;
    const rngStore = getRngStore(state);
    const rngKey = combatKey || rngStore.missionKey(state, MISSIONS, "combat");
    while (chance > 0 && target && target.hp > 0) {
      const hit = rngStore.next(state, rngKey) < chance;
      if (!hit) break;
      const result = applyDamage(state, attacker, target, baseDamage, {}, helpers);
      results.push(result);
      if (typeof onHit === "function") onHit(result, results.length);
      if (typeof onExtras === "function") onExtras(result, results.length);
      chance = Math.max(chance - 1, 0);
      if (attacker.hp != null && attacker.hp <= 0) break;
    }
    return results;
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
        if (effect.requiresHpFull) {
          const statCtx = getStatCtx(state);
          const maxHp = statCtx
            ? ReplyAllEngine.stats.getUnitMaxHp(statCtx, unit)
            : unit.maxHp ?? unit.hp;
          if (unit.hp < maxHp) return;
        }
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
    if (!mergedHelpers.getUnitMaxHp) {
      mergedHelpers.getUnitMaxHp = (u) => {
        const statCtx = getStatCtx(state);
        return statCtx
          ? ReplyAllEngine.stats.getUnitMaxHp(statCtx, u)
          : u?.maxHp ?? u?.hp ?? 0;
      };
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
    const store = state && state._rngStore;
    const isValidStore =
      !!store &&
      typeof store.reset === "function" &&
      typeof store.getStream === "function" &&
      typeof store.next === "function" &&
      typeof store.int === "function" &&
      typeof store.missionKey === "function" &&
      typeof store.shopKey === "function";
    if (!isValidStore) {
      state._rngStore = ReplyAllEngine.rng.createRngStore();
    }
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
      dev: { common: 3, uncommon: 5, rare: 8 },
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
      const statCtx = getStatCtx(state);
      if (statCtx) {
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
      const statCtx = getStatCtx(state);
      if (statCtx) {
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

  function getSellRefundForItem(itemType, item) {
    if (!item) return 0;
    const cost =
      item.cost || getItemCostByType(item.rarity || "common", itemType);
    return Math.max(0, Math.floor(cost / 2));
  }

  function getDirectShopItemById(state, itemId, itemType = null) {
    if (!itemId) return null;
    return (
      (state?.shop?.directItems || []).find(
        (it) => it.id === itemId && (!itemType || it.itemType === itemType),
      ) || null
    );
  }

  function buyDirectItemById(state, itemId, helpers = {}) {
    const expectedItemType = helpers?.expectedItemType || null;
    const item = getDirectShopItemById(state, itemId, expectedItemType);
    if (!item) return { ok: false, reason: "missing_item" };
    if (expectedItemType && item.itemType !== expectedItemType) {
      return { ok: false, reason: "wrong_type" };
    }
    return buyItem(state, item, helpers);
  }

  function getShopPackById(state, packId) {
    if (!packId) return null;
    return (state?.shop?.packs || []).find((p) => p.id === packId) || null;
  }

  function openPackById(state, packId) {
    const pack = getShopPackById(state, packId);
    if (!pack) return { ok: false, reason: "missing_pack" };
    return openPack(state, pack);
  }

  function applyShopDragAction(state, action, payload = {}, helpers = {}) {
    if (!state) return { ok: false, reason: "missing_state" };
    if (action === "buy_direct") {
      return buyDirectItemById(state, payload.itemId, helpers);
    }
    if (action === "open_pack") {
      return openPackById(state, payload.packId);
    }
    if (action === "equip_from_shop") {
      return buyDirectItemById(state, payload.itemId, {
        ...helpers,
        expectedItemType: payload.slotType || helpers?.expectedItemType || null,
      });
    }
    if (action === "archive_owned") {
      return archiveOwnedItem(state, payload.itemType, payload.itemId, {
        itemIndex:
          typeof payload.itemIndex === "number" ? payload.itemIndex : null,
        withRefund: payload.withRefund !== false,
      });
    }
    return { ok: false, reason: "unknown_action" };
  }

  function getOwnedAssets(state) {
    const p = state?.player || {};
    const addressBook = (p.addressBook || [])
      .map((id) => CONTACTS.find((c) => c.id === id))
      .filter(Boolean);
    return {
      addressBook,
      signatures: [...(p.signatures || [])],
      salutation: p.salutation || null,
      signoff: p.signOff || null,
      bcc: [...(p.bccContacts || p.bccs || [])],
    };
  }

  function archiveOwnedItem(state, itemType, itemId, options = {}) {
    const p = state?.player || {};
    const withRefund = options.withRefund !== false;
    let removed = null;
    let removedIndex = -1;

    if (itemType === "contact") {
      const list = p.addressBook || [];
      removedIndex = list.indexOf(itemId);
      if (removedIndex >= 0) {
        list.splice(removedIndex, 1);
        removed = CONTACTS.find((c) => c.id === itemId) || { id: itemId };
      }
      if (removed && p.contactPermanentBoosts) delete p.contactPermanentBoosts[itemId];
      if (removed && p.contactTrainingCount) delete p.contactTrainingCount[itemId];
      if (removed && p.contactEffectBoosts) delete p.contactEffectBoosts[itemId];
    } else if (itemType === "signature") {
      const list = p.signatures || [];
      removedIndex = list.findIndex((s) => s.id === itemId);
      if (removedIndex >= 0) removed = list.splice(removedIndex, 1)[0];
    } else if (itemType === "salutation") {
      if (p.salutation && (!itemId || p.salutation.id === itemId)) {
        removed = p.salutation;
        p.salutation = null;
      }
    } else if (itemType === "signoff") {
      if (p.signOff && (!itemId || p.signOff.id === itemId)) {
        removed = p.signOff;
        p.signOff = null;
      }
    } else if (itemType === "bcc") {
      const list = p.bccContacts || p.bccs || [];
      if (typeof options.itemIndex === "number" && options.itemIndex >= 0) {
        removedIndex = options.itemIndex < list.length ? options.itemIndex : -1;
      } else {
        removedIndex = list.findIndex((b) => b.id === itemId);
      }
      if (removedIndex >= 0) removed = list.splice(removedIndex, 1)[0];
    } else {
      return { ok: false, reason: "unsupported_type" };
    }

    if (!removed) return { ok: false, reason: "missing_item" };
    const refund = withRefund ? getSellRefundForItem(itemType, removed) : 0;
    if (refund > 0) {
      p.reputation = (p.reputation || 0) + refund;
    }
    return { ok: true, item: removed, itemType, refund };
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
    const p = state.player || {};
    let replaceRefund = 0;
    if (item.itemType === "salutation" && p.salutation && p.salutation.id !== item.id) {
      replaceRefund = getSellRefundForItem("salutation", p.salutation);
    } else if (item.itemType === "signoff" && p.signOff && p.signOff.id !== item.id) {
      replaceRefund = getSellRefundForItem("signoff", p.signOff);
    }
    if ((state.player?.reputation || 0) + replaceRefund < cost) {
      return { ok: false, reason: "rep", cost };
    }
    if (item.purchased) return { ok: false, reason: "purchased" };
    const eligibility = canAcquireItem(state, item, helpers);
    if (!eligibility.ok) {
      return { ok: false, reason: eligibility.reason || "ineligible", cost };
    }
    if (item.itemType === "salutation" && p.salutation && p.salutation.id !== item.id) {
      archiveOwnedItem(state, "salutation", p.salutation.id, { withRefund: true });
    } else if (item.itemType === "signoff" && p.signOff && p.signOff.id !== item.id) {
      archiveOwnedItem(state, "signoff", p.signOff.id, { withRefund: true });
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
    let idx = QUARTERS.indexOf(state?.player?.quarter);
    if (idx < 0) idx = 0;
    idx = (idx + 1) % QUARTERS.length;
    state.player.quarter = QUARTERS[idx];
    if (state.player.quarter === "Q3") {
      state.player.year = (state.player.year || 1) + 1;
    }
    return state.player.quarter;
  }

  function advanceMission(state) {
    state.currentMissionIndex = Math.min(
      (state.currentMissionIndex || 0) + 1,
      Math.max(0, MISSIONS.length - 1),
    );
    return state.currentMissionIndex;
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

  function computeSummary(state) {
    const baseRepByQuarter = {
      Q3: 4,
      Q4: 5,
      Q2: 6,
      Q1: 8,
    };
    const baseRep =
      baseRepByQuarter[state?.player?.quarter] ?? baseRepByQuarter.Q3;
    let bonusRep = 0;

    if (state.expenseReportActive) bonusRep += Math.min(10, baseRep);

    const statCtx = getStatCtx(state);
    const repStats =
      statCtx && state.player
        ? ReplyAllEngine.stats.computeUnitStats(statCtx, state.player)
        : state.player || {};
    if (repStats.repBonus) bonusRep += repStats.repBonus;
    if (repStats.endRep) bonusRep += repStats.endRep;

    const ccRepBonus = (state.player?.buffs || [])
      .filter((b) => b.usedBy === state.player.name && b.repBonus)
      .reduce((sum, b) => sum + b.repBonus, 0);
    bonusRep += ccRepBonus;

    const ccEndRepBonus = (state.player?.buffs || [])
      .filter((b) => b.usedBy === state.player.name && b.endRep)
      .reduce((sum, b) => sum + b.endRep, 0);
    bonusRep += ccEndRepBonus;

    const hasMeetingMaestro = (state.player?.signatures || []).some(
      (s) => s && s.id === "meeting_maestro",
    );
    if (hasMeetingMaestro) {
      const ownedBuffs = (state.player?.buffs || []).filter(
        (b) => b.usedBy === state.player.name,
      ).length;
      bonusRep += ownedBuffs * 2;
    }

    const interestRep = Math.min(5, Math.floor((state.player?.reputation || 0) / 5));
    const winsRep = Math.max(0, state.player?.currentWins || 0) * 2;
    const flooredBonus = Math.floor(bonusRep);
    const totalRep = baseRep + flooredBonus + interestRep + winsRep;
    return {
      baseRep,
      bonusRep: flooredBonus,
      interestRep,
      winsRep,
      totalRep,
      upgrades: { ...(state.roundEndUpgrades || {}) },
    };
  }

  function applySummaryRewards(state, summary, helpers = {}) {
    if (!summary) return state;
    const effectsResult = runUnitEffects(
      state,
      state.player,
      "rep_adjust",
      { summary },
      helpers,
    );
    const repAward =
      effectsResult && typeof effectsResult.repAward === "number"
        ? effectsResult.repAward
        : summary.totalRep || 0;
    summary.totalRep = repAward;
    state.player.reputation = (state.player.reputation || 0) + repAward;
    state.missionActive = false;
    state.gameOver = false;
    state.lossReason = null;
    state.isProcessing = false;
    state.turn = 0;
    return state;
  }

  function prepareShopState(state, helpers = {}) {
    if (state.player && Array.isArray(state.player.buffs)) state.player.buffs = [];
    (state.opponents || []).forEach((o) => {
      if (Array.isArray(o.buffs)) o.buffs = [];
    });
    state.shop = state.shop || { directItems: [], packs: [], rerollCount: 0 };
    state.shop.rerollCount = 0;
    runUnitEffects(state, state.player, "shop_enter", {}, helpers);
    enterShop(state);
    return state;
  }

  function advanceAfterSummary(state, data = {}) {
    const missions = data?.missions || MISSIONS;
    const isFinal = (state.currentMissionIndex || 0) >= missions.length - 1;
    if (isFinal) {
      state.gameWon = true;
      state.gameOver = true;
      state.lossReason = null;
      return { isFinal: true, nextMissionIndex: state.currentMissionIndex || 0 };
    }
    const next = Math.min((state.currentMissionIndex || 0) + 1, missions.length - 1);
    state.currentMissionIndex = next;
    return { isFinal: false, nextMissionIndex: next };
  }

  function advanceQuarterWithPromotion(state) {
    const quarter = advanceQuarter(state);
    const needsPromotion = quarter === "Q2";
    let nextTitle = null;
    if (needsPromotion) {
      nextTitle = checkPromotion(state);
      if (nextTitle) applyPromotion(state, nextTitle.id);
    }
    return { quarter, needsPromotion, nextTitle };
  }

  function getPromotionStats(state) {
    const t = state?.player?.title || null;
    if (!t) return null;
    return {
      titleId: t.id || null,
      titleName: t.name || "",
      sigLimit: t.sigLimit ?? 0,
      addressLimit: t.addressLimit ?? 0,
      numCCperCCaction: t.numCCperCCaction ?? 1,
    };
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

  // ---------- Playflow Helpers ----------
  function formatTurnTime(turn) {
    const baseMinutes = 9 * 60;
    const totalMinutes = baseMinutes + Math.max(0, turn || 0) * 15;
    const breakStart = 12 * 60;
    const breakEnd = 13 * 60 + 15;
    const adjustedMinutes =
      totalMinutes > breakStart
        ? totalMinutes + (breakEnd - breakStart)
        : totalMinutes;
    let h = Math.floor(adjustedMinutes / 60);
    const m = adjustedMinutes % 60;
    const suffix = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${suffix}`;
  }

  function getMissionHeaderSubject(mission) {
    const subject = mission && mission.subject ? mission.subject : "Thread";
    const turns = mission && typeof mission.turns === "number" ? mission.turns : 0;
    return `Outlook Express - ${subject} (${formatTurnTime(turns)})`;
  }

  function getMissionSubSubject(mission) {
    const subject = mission && mission.subject ? mission.subject : "Thread";
    const turns = mission && typeof mission.turns === "number" ? mission.turns : 0;
    return `${subject} (due by ${formatTurnTime(turns)})`;
  }

  function formatMissionIntro(mission, player, opponents) {
    let intro = mission?.intro || "";
    intro = intro.replace(/{playerName}/g, player?.name || "Employee");
    (opponents || []).forEach((opp, idx) => {
      intro = intro.replace(new RegExp(`{opp${idx}}`, "g"), opp?.name || "Stakeholder");
    });
    return intro;
  }

  function buildMessageEntry(state, from, to, subject, body, classes = "") {
    return {
      from,
      to,
      subject,
      body,
      classes,
      time: formatTurnTime(state?.turn || 0),
      isIntro: classes.includes("intro-message"),
    };
  }

  function addMessageEntry(state, entry) {
    if (!Array.isArray(state.messageLogEntries)) state.messageLogEntries = [];
    state.messageLogEntries.unshift(entry);
    return entry;
  }

  function buildInboxRows(state, mission, spamCount = 16) {
    const rows = [];
    for (let i = 0; i < spamCount; i++) {
      const botNum = hashSeed(state?.seed || 0, `inbox:${i}`)
        .toString(36)
        .slice(0, 5);
      rows.push({
        id: `spam-${i}`,
        from: `bot-${botNum}@junk.co`,
        subject: SPAM_SUBJECTS[i % SPAM_SUBJECTS.length],
      });
    }
    return {
      mission: {
        from: mission?.from || "announcements@gov.org",
        subject: mission?.subject || "Thread",
      },
      spam: rows,
      statusText: `${324 + ((state?.player?.year || 1) * 4)} Messages, 1 Unread`,
    };
  }

  function getAvailablePlayerCcContacts(state) {
    return (state?.player?.addressBook || [])
      .map((id) => CONTACTS.find((c) => c.id === id))
      .filter((c) => c && !isContactInLoop(state, c.id) && !isContactImplicated(state, c));
  }

  function collectDefeats(state, byPlayer, attacker, helpers = {}) {
    (state.opponents || []).forEach((o) => {
      if (o.hp > 0) return;
      if (o.isDefeated) return;
      handleOpponentDefeat(state, o, byPlayer, attacker, helpers);
    });
  }

  function markDefeatIfPlayerDown(state) {
    if ((state?.player?.hp || 0) <= 0) {
      state.gameOver = true;
      state.missionActive = false;
      state.lossReason = "defeat";
    }
  }

  function applyLeverage(state, actionType, baseGain) {
    const cap = typeof LEVERAGE_MAX === "number" ? LEVERAGE_MAX : 8;
    const gain = getPlayerLeverageGain(state, actionType, baseGain);
    state.player.ult = Math.min(cap, (state.player.ult || 0) + gain);
    return gain;
  }

  function resolvePlayerCcAction(state, targetId, contactId, helpers = {}) {
    const target =
      (state.opponents || []).find((o) => o.id === targetId && o.hp > 0) ||
      (state.opponents || []).find((o) => o.hp > 0) ||
      null;
    if (!target) return { ok: false, reason: "missing_target" };
    const available = getAvailablePlayerCcContacts(state);
    if (!available.length) return { ok: false, reason: "no_contacts" };
    const chosen =
      available.find((c) => c.id === contactId) || available[0];
    const buff = addContactBuff(state, target, chosen, state.player.name, helpers);
    if (!buff) return { ok: false, reason: "buff_failed" };
    applyLeverage(state, "reply_to", 0);
    addMessageEntry(
      state,
      buildMessageEntry(
        state,
        state.player.name,
        target.name,
        "Looping In Contact",
        `I am looping in <strong>${chosen.name}</strong> for this thread.`,
        "border-l-4 border-violet-500 bg-violet-50",
      ),
    );
    return { ok: true, contact: chosen, target };
  }

  function getAvailablePlayerBccContacts(state) {
    return (state?.player?.bccContacts || state?.player?.bccs || []).filter(Boolean);
  }

  function resolvePlayerBccAction(state, bccId, bccIndex, helpers = {}) {
    const list = state?.player?.bccContacts || state?.player?.bccs || [];
    if (!Array.isArray(list) || !list.length) return { ok: false, reason: "no_bcc" };
    let idx = -1;
    if (typeof bccIndex === "number" && bccIndex >= 0 && bccIndex < list.length) {
      idx = bccIndex;
    } else if (bccId) {
      idx = list.findIndex((b) => b.id === bccId);
    } else {
      idx = 0;
    }
    if (idx < 0 || idx >= list.length) return { ok: false, reason: "missing_bcc" };

    const bcc = list[idx];
    list.splice(idx, 1);
    const player = state.player || {};
    const addSystemMessage = (subject, body) => {
      addMessageEntry(
        state,
        buildMessageEntry(
          state,
          "SYSTEM",
          player.name || "player",
          subject,
          body,
          "italic text-gray-500 text-[10px]",
        ),
      );
    };

    addMessageEntry(
      state,
      buildMessageEntry(
        state,
        player.name || "player",
        "everyone@gov.org",
        `Help Desk: ${bcc.name || "Internal Service"}`,
        `[PRIVATE MESSAGE] Sent: ${bcc.logText || bcc.bonus || "Internal service requested."}`,
        "bg-yellow-100 border-l-4 border-yellow-600",
      ),
    );

    runUnitEffects(state, state.player, "bcc_use", { bcc }, helpers);
    const effect = bcc.effect || null;
    const details = {};

    if (effect === "doubleRep") {
      state.expenseReportActive = true;
      details.doubleRep = true;
      addSystemMessage("Expense Report Logged", "Mission base reputation will be doubled (max +10 bonus).");
    } else if (effect === "contactRep") {
      const rep = Math.min(
        30,
        (player.buffs || [])
          .filter((b) => b.usedBy === player.name)
          .reduce((sum, b) => sum + Math.floor((getItemCostByType(b.rarity || "common", "contact") || 0) / 2), 0),
      );
      state.player.reputation = (state.player.reputation || 0) + rep;
      details.repGained = rep;
      addSystemMessage("Networking Success", `Gained +${rep} reputation from current CC sell value.`);
    } else if (
      effect === "contactUpgradeHp" ||
      effect === "contactUpgradeSingle" ||
      effect === "contactUpgradeEscalate" ||
      effect === "contactUpgradeRep"
    ) {
      const pool = (player.buffs || [])
        .filter((b) => b.usedBy === player.name)
        .sort((a, b) => (a.id || "").localeCompare(b.id || ""));
      if (!pool.length) {
        addSystemMessage("Upgrade Failed", "No CC'd contacts available to upgrade.");
      } else {
        const rngStore = getRngStore(state);
        const key = rngStore.missionKey(state, MISSIONS, "cc_upgrades");
        const target = pool[rngStore.int(state, key, pool.length)];
        const map = {
          contactUpgradeHp: { subtitle: "Credibility Trained", eff: { maxHp: 10 } },
          contactUpgradeSingle: { subtitle: "Reply Precision", eff: { singleDmg: 5 } },
          contactUpgradeEscalate: { subtitle: "Escalation Trained", eff: { escalateDmg: 4 } },
          contactUpgradeRep: { subtitle: "Recognition Awarded", eff: { repBonus: 3 } },
        };
        const upgrade = map[effect];
        player.contactUpgrades = player.contactUpgrades || {};
        player.contactUpgrades[target.id] = upgrade;
        applyContactPermanentBoost(state, player, target.id, upgrade.eff || {});
        applyBuffStats(target, upgrade.eff || {});
        target.subtitle = upgrade.subtitle;
        details.upgrade = { targetId: target.id, subtitle: upgrade.subtitle };
        addSystemMessage("Contact Upgraded", `[PRIVATE MESSAGE] ${target.name || target.id} has received ${upgrade.subtitle}.`);
      }
    } else if (effect === "randomContact") {
      const pool = CONTACTS.filter((c) => !(player.addressBook || []).includes(c.id) && !c.noShop);
      const picked = pickWeighted(pool, 1, "contact_create", state)[0] || null;
      if (!picked) {
        addSystemMessage("No Referrals Available", "No eligible contacts available for referral.");
      } else {
        const target =
          (state.opponents || []).find((o) => o.id === state.targetId && o.hp > 0) ||
          (state.opponents || []).find((o) => o.hp > 0) ||
          null;
        if (target) addContactBuff(state, target, picked, player.name, helpers);
        const statCtx = getStatCtx(state);
        const addrLimit = statCtx
          ? ReplyAllEngine.stats.getUnitAddressLimit(statCtx, player)
          : player.addressLimit ?? player.title?.addressLimit ?? 0;
        const canAdd = (player.addressBook || []).length < addrLimit;
        if (canAdd) {
          player.addressBook = player.addressBook || [];
          player.addressBook.push(picked.id);
        }
        details.randomContact = { id: picked.id, addedToAddressBook: canAdd };
        addSystemMessage(canAdd ? "New Referral" : "Temporary Referral", `${picked.name} was looped in${canAdd ? " and added to your address book." : " for this thread only."}`);
      }
    } else if (effect === "randomBccs") {
      const statCtx = getStatCtx(state);
      const limit = statCtx
        ? (ReplyAllEngine.stats.computeUnitStats(statCtx, player).bccLimit || 0)
        : player.bccLimit ?? 0;
      const slots = Math.max(0, limit - list.length);
      if (slots <= 0) {
        addSystemMessage("Help Desk Capacity Reached", "No additional Help Desk capacity is available.");
      } else {
        const owned = new Set(list.map((b) => b.id));
        const pool = BCC_CONTACTS.filter((b) => b.id !== bcc.id && !owned.has(b.id));
        const count = Math.min(2, slots, pool.length);
        const picked = pickWeighted(pool, count, "bcc_create", state).map((b) => ({ ...b }));
        picked.forEach((b) => list.push(b));
        if (picked.length) logBccGains(state, picked, "bcc:randomBccs", { sourceBcc: bcc.id });
        details.addedBcc = picked.map((b) => b.id);
        addSystemMessage("Help Desk Rollout Complete", picked.length ? `Added ${picked.length} Help Desk contact(s).` : "No eligible Help Desk contacts were available.");
      }
    } else if (effect === "statPack") {
      const upgrades = buildTrainingUpgrades();
      const picks = pickWeighted(upgrades, 3, "bcc_create", state);
      const chosen = pickWeighted(picks, Math.min(2, picks.length), "bcc_create", state);
      chosen.forEach((u) => applyCoachingBoosts(player, u.stats || u));
      details.statPack = chosen.map((u) => u.id);
      addSystemMessage("Executive Review", `Applied ${chosen.length} training adjustment(s).`);
    } else if (effect === "randomSignature") {
      const sigLimit = player?.title?.sigLimit ?? player.sigLimit ?? 0;
      if ((player.signatures || []).length >= sigLimit) {
        addSystemMessage("Signature Provisioning Failed", "Signature capacity reached.");
      } else {
        const owned = new Set((player.signatures || []).map((s) => s.id));
        const pool = SIGNATURES.filter((s) => !owned.has(s.id));
        const picked = pickWeighted(pool, 1, "signature_create", state)[0] || null;
        if (!picked) {
          addSystemMessage("Signature Provisioning Failed", "No eligible signatures available.");
        } else {
          player.signatures = player.signatures || [];
          player.signatures.push(picked);
          details.randomSignature = picked.id;
          addSystemMessage("Signature Provisioned", `Added signature: ${picked.name}.`);
        }
      }
    }

    return { ok: true, bcc, effect, details };
  }

  function executeAiPlan(state, ai, plan, mission, helpers = {}) {
    if (!plan) return { ok: false, reason: "missing_plan" };
    const targetId =
      plan.target?.id === "player"
        ? "player"
        : plan.target?.id;
    if (plan.type === "cc") {
      const target =
        targetId === "player"
          ? state.player
          : (state.opponents || []).find((o) => o.id === targetId);
      if (!target) return { ok: false, reason: "missing_target" };
      const ccTargets = Array.isArray(plan.ccTargets) ? plan.ccTargets : [];
      ccTargets.forEach((c) => {
        if (!c) return;
        addContactBuff(state, target, c, ai.name, helpers);
      });
      const aiLine = drawFromLineBag(
        state,
        ai,
        "attack",
        ai.attacks,
        "Looping in additional context for this thread.",
      );
      addMessageEntry(
        state,
        buildMessageEntry(
          state,
          ai.name,
          target.id === "player" ? state.player.name : target.name,
          "Looping In Contact",
          aiLine,
          "bg-violet-50 border-l-4 border-violet-400",
        ),
      );
      return { ok: true, type: "cc" };
    }
    const upperType =
      plan.type === "attack" ? "ATTACK" :
      plan.type === "escalate" ? "ESCALATE" :
      plan.type === "deflect" ? "DEFLECT" :
      plan.type === "promote" ? "PROMOTE" : null;
    if (!upperType) return { ok: false, reason: "unsupported_plan" };
    const action = {
      actorId: ai.id,
      type: upperType,
      targetId: targetId || "player",
    };
    const result = resolveAction(state, action, helpers);
    const toText =
      upperType === "ESCALATE"
        ? "everyone@gov.org"
        : targetId === "player"
          ? state.player.name
          : ((state.opponents || []).find((o) => o.id === targetId)?.name || "thread");
    const subject =
      upperType === "ATTACK" ? "Internal Memo" :
      upperType === "ESCALATE" ? "Escalation Notice" :
      upperType === "DEFLECT" ? "Holding Response" : "Self-Promotion";
    const aiLine =
      upperType === "DEFLECT"
        ? drawFromLineBag(
            state,
            ai,
            "deflect",
            ai.deflectLines,
            "I am pausing to document this before replying.",
          )
        : drawFromLineBag(
            state,
            ai,
            "attack",
            ai.attacks,
            "Following up to keep this thread moving.",
          );
    let body = aiLine;
    if (upperType === "ATTACK" && result?.result) {
      body += `<br><br><strong>Damage to Credibility: -${result.result.dmg}</strong>`;
    }
    if (upperType === "ESCALATE" && Array.isArray(result?.results)) {
      const total = result.results.reduce((acc, r) => acc + (r?.dmg || 0), 0);
      body += `<br><br><strong>Escalation Impact: -${total}</strong>`;
    }
    if (upperType === "PROMOTE") {
      body += `<br><br><strong>Recovered:</strong> +${result?.heal || 0} Credibility.`;
    }
    addMessageEntry(
      state,
      buildMessageEntry(
        state,
        ai.name,
        toText,
        subject,
        body,
        upperType === "ESCALATE" ? "bg-yellow-50 border-l-4 border-yellow-400" : "",
      ),
    );
    return result;
  }

  function runPlayerTurn(state, actionType, options = {}, data = {}, helpers = {}) {
    attachRuntimeState(state);
    if (!state || state.gameOver || !state.missionActive) {
      return { ok: false, reason: "inactive" };
    }

    const mission = (data?.missions || MISSIONS)[state.currentMissionIndex] || MISSIONS[0];
    const player = state.player;
    if (!player) return { ok: false, reason: "missing_player" };

    state.isProcessing = true;
    state.turn = (state.turn || 0) + 1;

    const statCtx = getStatCtx(state);
    const maxHp = statCtx
      ? ReplyAllEngine.stats.getUnitMaxHp(statCtx, player)
      : player.maxHp ?? player.hp;
    const passiveHeal = statCtx
      ? ReplyAllEngine.stats.getUnitTotalHeal(statCtx, player)
      : 0;
    player.hp = Math.min(maxHp, (player.hp || 0) + passiveHeal);

    const planned = state.aiPlannedActions || planAiActions(state, helpers);
    (state.opponents || [])
      .filter((o) => o.hp > 0)
      .forEach((ai) => {
        const plan = planned[ai.id];
        if (!plan || plan.type !== "deflect") return;
        if ((ai.deflectChargeReduce || 0) > 0 || (ai.deflectChargeReflect || 0) > 0)
          return;
        resolveDeflect(state, ai);
      });

    const upperType = String(actionType || "").toUpperCase();
    let playerResult = null;
    if (upperType === "CC") {
      playerResult = resolvePlayerCcAction(
        state,
        options.targetId || state.targetId,
        options.contactId,
        helpers,
      );
    } else if (upperType === "BCC") {
      playerResult = resolvePlayerBccAction(
        state,
        options.bccId,
        options.bccIndex,
        helpers,
      );
    } else {
      const action = {
        actorId: "player",
        type: upperType,
        targetId: options.targetId || state.targetId,
      };
      playerResult = resolveAction(state, action, helpers);
      if (playerResult && playerResult.ok) {
        if (upperType === "ATTACK") applyLeverage(state, "reply_to", 2);
        if (upperType === "ESCALATE") applyLeverage(state, "escalate", 1);
        if (upperType === "DEFLECT") applyLeverage(state, "deflect", 0);
        if (upperType === "PROMOTE") applyLeverage(state, "promote", 0);
      }
      if (upperType !== "CC") {
        const missionId = mission?.id || "default";
        const titleId = player.title?.id || "base";
        const playerLineKey =
          upperType === "ATTACK" ? "attack" :
          upperType === "ESCALATE" ? "escalate" :
          upperType === "DEFLECT" ? "deflect" :
          upperType === "PROMOTE" ? "selfPromote" :
          upperType === "ULT" ? "replyAll" : "attack";
        const playerLines = getPlayerActionLines(state, playerLineKey, missionId);
        const playerLine = drawFromLineBag(
          state,
          player,
          getPlayerLineBagKey(playerLineKey, missionId, titleId),
          playerLines,
          `${player.name} executed ${upperType}.`,
        );
        const subject =
          upperType === "ATTACK" ? "Reply To" :
          upperType === "ESCALATE" ? "Escalation Notice" :
          upperType === "DEFLECT" ? "Holding Response" :
          upperType === "PROMOTE" ? "FYI: Milestone" :
          upperType === "ULT" ? "Reply All" : "Action";
        const toText =
          upperType === "ESCALATE" || upperType === "ULT"
            ? "everyone@gov.org"
            : ((state.opponents || []).find((o) => o.id === (options.targetId || state.targetId))?.name || "thread");
        let body = playerLine;
        if (upperType === "ATTACK" && playerResult?.result) {
          body += `<br><br><strong>Damage to Credibility: -${playerResult.result.dmg}</strong>`;
        }
        if (
          (upperType === "ESCALATE" || upperType === "ULT") &&
          Array.isArray(playerResult?.results)
        ) {
          const total = playerResult.results.reduce((acc, r) => acc + (r?.dmg || 0), 0);
          body += `<br><br><strong>Total Impact: -${total}</strong>`;
        }
        if (upperType === "PROMOTE") {
          body += `<br><br><strong>Recovered:</strong> +${playerResult?.heal || 0} Credibility.`;
        }
        if (upperType === "DEFLECT") {
          body += `<br><br><strong>Deflection Ready:</strong> Reduce ${player.deflectChargeReduce || 0}, Retaliate ${player.deflectChargeReflect || 0}.`;
        }
        addMessageEntry(
          state,
          buildMessageEntry(
            state,
            player.name,
            toText,
            subject,
            body,
            upperType === "ESCALATE" ? "bg-orange-50 border-l-4 border-orange-500" : "",
          ),
        );
      }
    }

    collectDefeats(state, true, player, helpers);
    markDefeatIfPlayerDown(state);

    if (!state.gameOver) {
      const alive = (state.opponents || []).filter((o) => o.hp > 0);
      alive.forEach((ai) => {
        if (state.gameOver) return;
        let plan = state.aiPlannedActions?.[ai.id] || null;
        if (!isPlannedActionValid(state, ai, plan, helpers)) {
          plan = decideAiAction(state, ai, alive, state.player, helpers);
        }
        executeAiPlan(state, ai, plan, mission, helpers);
        collectDefeats(state, false, ai, helpers);
        markDefeatIfPlayerDown(state);
      });
    }

    clearDeflectCharges(state.player);
    if (isMissionOverdue(state, mission)) {
      triggerTimeoutLoss(state);
    }
    if (!state.gameOver) {
      planAiActions(state, helpers);
    } else {
      state.aiPlannedActions = {};
    }
    state.isProcessing = false;
    return {
      ok: true,
      action: upperType,
      playerResult,
      gameOver: !!state.gameOver,
      lossReason: state.lossReason || null,
    };
  }

  function startMissionWithIntro(state, missionId, data = {}, helpers = {}) {
    attachRuntimeState(state);
    startMission(state, missionId, data, helpers);
    const missions = data?.missions || MISSIONS;
    const mission = missions[state.currentMissionIndex] || missions[0] || null;
    if (!mission) return { state, mission: null, entry: null };
    state.messageLogEntries = [];
    const intro = formatMissionIntro(mission, state.player, state.opponents || []);
    const entry = buildMessageEntry(
      state,
      mission.from,
      "everyone@gov.org",
      mission.subject,
      intro,
      "border-l-4 border-blue-500 bg-blue-50 intro-message",
    );
    addMessageEntry(state, entry);
    planAiActions(state, helpers);
    return { state, mission, entry };
  }

  function getAdjustedTurnMinutes(turn) {
    const baseMinutes = 9 * 60;
    const totalMinutes = baseMinutes + Math.max(0, turn || 0) * 15;
    const breakStart = 12 * 60;
    const breakEnd = 13 * 60 + 15;
    return totalMinutes > breakStart
      ? totalMinutes + (breakEnd - breakStart)
      : totalMinutes;
  }

  function createStatCtx(state) {
    const getUnitStatBlocks = (u) => {
      const blocks = [];
      if (!u) return blocks;
      blocks.push(u);
      if (u.title) blocks.push(u.title);
      if (u.salutation) blocks.push(u.salutation);
      if (u.signOff) blocks.push(u.signOff);
      if (Array.isArray(u.signatures)) blocks.push(...u.signatures);
      if (u.coachingBoosts && Object.keys(u.coachingBoosts).length)
        blocks.push(u.coachingBoosts);
      if (Array.isArray(u.buffs))
        blocks.push(...u.buffs.map((b) => (b.eff ? b.eff : b)));
      return blocks;
    };

    const getSalutationWindowStats = (u, turnOverride = null) => {
      if (!u || !u.salutation || !Array.isArray(u.salutation.statWindows))
        return null;
      const timeMinutes = getAdjustedTurnMinutes(
        typeof turnOverride === "number" ? turnOverride : state.turn,
      );
      const matches = u.salutation.statWindows.filter((win) => {
        if (!win || !win.stats) return false;
        const start =
          typeof win.start === "number" ? win.start : Number.NEGATIVE_INFINITY;
        const end =
          typeof win.end === "number" ? win.end : Number.POSITIVE_INFINITY;
        return timeMinutes >= start && timeMinutes <= end;
      });
      if (!matches.length) return null;
      const stats = {};
      matches.forEach((win) => {
        STAT_FIELDS.forEach((field) => {
          const value = win.stats[field];
          if (typeof value === "number") {
            stats[field] = (stats[field] || 0) + value;
          }
        });
      });
      return Object.keys(stats).length ? stats : null;
    };

    const getSalutationPersistentStats = (u) => {
      if (!u || !u.salutation || !u.salutationBonuses) return null;
      const stats = u.salutationBonuses[u.salutation.id];
      if (!stats) return null;
      const filtered = {};
      let hasAny = false;
      STAT_FIELDS.forEach((field) => {
        const value = stats[field];
        if (typeof value === "number" && value !== 0) {
          filtered[field] = value;
          hasAny = true;
        }
      });
      return hasAny ? filtered : null;
    };

    const getSignoffPersistentStats = (u) => {
      if (!u || !u.signOff || !u.signoffBonuses) return null;
      const stats = u.signoffBonuses[u.signOff.id];
      if (!stats) return null;
      const filtered = {};
      let hasAny = false;
      STAT_FIELDS.forEach((field) => {
        const value = stats[field];
        if (typeof value === "number" && value !== 0) {
          filtered[field] = value;
          hasAny = true;
        }
      });
      return hasAny ? filtered : null;
    };

    const getUnitWinScaleStats = (u) => {
      if (!u) return null;
      const wins =
        typeof u.currentWins === "number"
          ? u.currentWins
          : typeof u.wins === "number"
            ? u.wins
            : 0;
      if (!wins) return null;
      const stats = {};
      getUnitStatBlocks(u).forEach((block) => {
        if (!block) return;
        if (typeof block.winScaleSingleDmg === "number") {
          stats.singleDmg =
            (stats.singleDmg || 0) + block.winScaleSingleDmg * wins;
        }
        if (typeof block.winScaleSingleDmgMult === "number") {
          stats.singleDmgMult =
            (stats.singleDmgMult || 0) + block.winScaleSingleDmgMult * wins;
        }
      });
      return Object.keys(stats).length ? stats : null;
    };

    return {
      getUnitStatBlocks,
      getSalutationWindowStats,
      getSalutationPersistentStats,
      getSignoffPersistentStats,
      getUnitWinScaleStats,
    };
  }

  function attachRuntimeState(state) {
    if (!state || typeof state !== "object") return state;
    if (
      !state._statCtx ||
      typeof state._statCtx.getUnitStatBlocks !== "function" ||
      typeof state._statCtx.getUnitWinScaleStats !== "function"
    ) {
      state._statCtx = createStatCtx(state);
    }
    return state;
  }

  function debugMutatePlayerStats(state, statChanges = {}, options = {}) {
    if (!state || !state.player) return { ok: false, reason: "missing_player" };
    if (!statChanges || typeof statChanges !== "object") {
      return { ok: false, reason: "invalid_changes" };
    }
    const mode = options.mode === "set" ? "set" : "add";
    applyUnitDefaults(state.player);
    const applied = {};
    Object.keys(statChanges).forEach((key) => {
      const delta = statChanges[key];
      if (typeof delta !== "number" || !Number.isFinite(delta)) return;
      const current =
        typeof state.player[key] === "number" ? state.player[key] : 0;
      const nextValue = mode === "set" ? delta : current + delta;
      state.player[key] = nextValue;
      applied[key] = nextValue;
    });
    if (!Object.keys(applied).length) return { ok: false, reason: "no_changes" };
    attachRuntimeState(state);
    return { ok: true, mode, applied, state };
  }

  ReplyAllEngine.play = {
    formatTurnTime,
    getMissionHeaderSubject,
    getMissionSubSubject,
    formatMissionIntro,
    buildMessageEntry,
    addMessageEntry,
    buildInboxRows,
    getAvailablePlayerCcContacts,
    getAvailablePlayerBccContacts,
    createStatCtx,
    attachRuntimeState,
    computeSummary,
    applySummaryRewards,
    prepareShopState,
    advanceAfterSummary,
    advanceQuarterWithPromotion,
    getPromotionStats,
    runPlayerTurn,
    startMissionWithIntro,
    debugMutatePlayerStats,
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
    applyDamage,
    applyDepartmentCleave,
    handleOpponentDefeat,
    decideAiAction,
    isContactInLoop,
    isContactImplicated,
    isPlannedActionValid,
    getContactUsedBy,
    getPlayerLeverageGain,
    pickRandomItem,
    shuffle,
    drawFromLineBag,
    getPlayerLineBagKey,
    getPlayerActionLines,
    getUnitSelfPromoteLines,
    getDepartmentName,
    formatLoopInText,
    applyUnitDefaults,
    serializePlayer,
    hydratePlayer,
    serializeShop,
    hydrateShop,
    buildSavePayload,
    saveGame,
    getSavedGame,
    clearSavedGame,
    applySavedGame,
    getMetaState,
    addContactBuff,
    clearDeflectCharges,
    clearOpponentDeflects,
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
    getDirectShopItemById,
    buyDirectItemById,
    getShopPackById,
    openPackById,
    applyShopDragAction,
    getItemCostByType,
    getOwnedAssets,
    archiveOwnedItem,
    getSellRefundForItem,
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
