(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.BladeSurvivor = api;
})(
  typeof GameGlobal !== "undefined"
    ? GameGlobal
    : typeof window !== "undefined"
      ? window
      : this,
  function () {
    "use strict";

    var PI = Math.PI;
    var TWO_PI = PI * 2;
    var STORAGE_KEY = "shadow-blade-rogue-high-score";
    var LEADERBOARD_KEY = "shadow-blade-rogue-leaderboard";
    var SELECTED_CHARACTER_KEY = "shadow-blade-rogue-character";
    var ART_FILES = {
      hero: "assets/sprites/hero.png",
      ash: "assets/sprites/ash.png",
      swift: "assets/sprites/swift.png",
      iron: "assets/sprites/iron.png",
      boss: "assets/sprites/boss.png",
      blade: "assets/sprites/blade.png",
      heroShadow: "assets/sprites/hero-shadow-v2.png",
      heroThunder: "assets/sprites/hero-thunder-v2.png",
      heroLotus: "assets/sprites/hero-lotus-v2.png",
      enemyAsh: "assets/sprites/enemy-ash-v2.png",
      enemySwift: "assets/sprites/enemy-swift-v2.png",
      enemyFang: "assets/sprites/enemy-fang-v2.png",
      enemySpitter: "assets/sprites/enemy-spitter-v2.png",
      enemyWraith: "assets/sprites/enemy-wraith-v2.png",
      enemyIron: "assets/sprites/enemy-iron-v2.png",
      enemyWarden: "assets/sprites/enemy-warden-v2.png",
      enemyBoss: "assets/sprites/enemy-boss-v2.png",
      title: "assets/generated/title-key-art.jpg"
    };
    var MENU_TABS = [
      { id: "home", label: "出战" },
      { id: "heroes", label: "角色" },
      { id: "rank", label: "排行" },
      { id: "codex", label: "图鉴" }
    ];
    var CHARACTERS = [
      {
        id: "blade",
        name: "影刃",
        title: "均衡斩影",
        sprite: "heroShadow",
        color: "#55dbc1",
        accent: "#ffd36b",
        desc: "挥斩、飞剑、旋刃均衡，适合稳定成型。",
        perk: "断潮斩命中后有影痕追击。",
        hpMax: 104,
        speed: 150,
        pickup: 86,
        slashDamage: 24,
        slashRange: 124,
        slashCooldown: 0.62,
        orbitCount: 1,
        orbitDamage: 30,
        projectileCount: 1,
        projectileDamage: 18,
        projectileCooldown: 1.15,
        thunderDamage: 40,
        thunderCooldown: 4.2,
        regen: 0.65,
        talent: "shadow"
      },
      {
        id: "thunder",
        name: "青雷使",
        title: "连锁落雷",
        sprite: "heroThunder",
        color: "#78e7ff",
        accent: "#c7f7ff",
        desc: "血量较低，但落雷更频繁，会向周围敌人跳跃。",
        perk: "青雷命中后追加一次连锁电弧。",
        hpMax: 88,
        speed: 158,
        pickup: 82,
        slashDamage: 20,
        slashRange: 112,
        slashCooldown: 0.68,
        orbitCount: 0,
        orbitDamage: 24,
        projectileCount: 1,
        projectileDamage: 15,
        projectileCooldown: 1.02,
        thunderDamage: 64,
        thunderCooldown: 3.15,
        regen: 0.42,
        talent: "thunder"
      },
      {
        id: "lotus",
        name: "绯莲卫",
        title: "守阵续航",
        sprite: "heroLotus",
        color: "#ff7d91",
        accent: "#ffd36b",
        desc: "速度较慢，生命和回复更高，定期释放莲华阵。",
        perk: "莲华阵治疗自身，并灼伤近身敌群。",
        hpMax: 132,
        speed: 134,
        pickup: 94,
        slashDamage: 21,
        slashRange: 116,
        slashCooldown: 0.66,
        orbitCount: 2,
        orbitDamage: 26,
        projectileCount: 1,
        projectileDamage: 16,
        projectileCooldown: 1.25,
        thunderDamage: 32,
        thunderCooldown: 4.6,
        regen: 1.08,
        talent: "lotus"
      }
    ];
    var ENEMY_ORDER = ["ash", "swift", "fang", "spitter", "wraith", "iron", "warden", "boss"];
    var ENEMY_TYPES = {
      ash: {
        name: "灰烬傀",
        tier: "普通",
        sprite: "enemyAsh",
        behavior: "chase",
        r: 13,
        hp: 43,
        hpScale: 0.55,
        speed: 70,
        speedScale: 0.1,
        damage: 10,
        xp: 3,
        color: "#d64b39",
        edge: "#ffbf66",
        minAge: 0,
        weight: 55,
        desc: "基础追击单位，数量多，用来形成割草压力。"
      },
      swift: {
        name: "疾镰影",
        tier: "迅捷",
        sprite: "enemySwift",
        behavior: "weave",
        r: 10,
        hp: 28,
        hpScale: 0.45,
        speed: 112,
        speedScale: 0.08,
        damage: 9,
        xp: 2,
        color: "#e56c45",
        edge: "#ffe082",
        minAge: 35,
        weight: 24,
        desc: "高速蛇形靠近，逼迫玩家移动。"
      },
      fang: {
        name: "赤牙冲锋者",
        tier: "精英",
        sprite: "enemyFang",
        behavior: "charger",
        r: 15,
        hp: 68,
        hpScale: 0.68,
        speed: 84,
        speedScale: 0.08,
        damage: 17,
        xp: 4,
        color: "#ef5d42",
        edge: "#ffd36b",
        minAge: 62,
        weight: 14,
        desc: "蓄力后直线突进，命中很疼。"
      },
      spitter: {
        name: "毒灯术士",
        tier: "远程",
        sprite: "enemySpitter",
        behavior: "ranged",
        r: 13,
        hp: 54,
        hpScale: 0.58,
        speed: 58,
        speedScale: 0.04,
        damage: 8,
        xp: 4,
        color: "#9be36e",
        edge: "#d9ff9d",
        minAge: 78,
        weight: 13,
        desc: "保持距离并发射毒焰，考验走位。"
      },
      wraith: {
        name: "夜魇",
        tier: "迅捷",
        sprite: "enemyWraith",
        behavior: "phase",
        r: 12,
        hp: 46,
        hpScale: 0.5,
        speed: 126,
        speedScale: 0.1,
        damage: 12,
        xp: 5,
        color: "#6f6bff",
        edge: "#c9c7ff",
        minAge: 96,
        weight: 11,
        desc: "忽隐忽现，贴近时更难判断碰撞。"
      },
      iron: {
        name: "铁甲傀",
        tier: "重甲",
        sprite: "enemyIron",
        behavior: "chase",
        r: 18,
        hp: 112,
        hpScale: 0.9,
        speed: 52,
        speedScale: 0.02,
        damage: 15,
        xp: 5,
        armor: 0.18,
        color: "#b33b2f",
        edge: "#f9b15b",
        minAge: 105,
        weight: 18,
        desc: "厚血高甲，适合检验单体伤害。"
      },
      warden: {
        name: "骨盾卫",
        tier: "护卫",
        sprite: "enemyWarden",
        behavior: "warden",
        r: 20,
        hp: 156,
        hpScale: 1.1,
        speed: 44,
        speedScale: 0.02,
        damage: 18,
        xp: 7,
        armor: 0.28,
        color: "#84533f",
        edge: "#ffe0a3",
        minAge: 128,
        weight: 9,
        desc: "为附近怪物提供减伤光环，优先击杀收益高。"
      },
      boss: {
        name: "魇花将",
        tier: "Boss",
        sprite: "enemyBoss",
        behavior: "boss",
        r: 34,
        hp: 460,
        hpScale: 8,
        speed: 42,
        speedScale: 0.08,
        damage: 24,
        xp: 18,
        color: "#9c4cff",
        edge: "#ffd36b",
        desc: "周期释放震荡环并召唤随从。"
      }
    };

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function dist(a, b, c, d) {
      var x = a - c;
      var y = b - d;
      return Math.sqrt(x * x + y * y);
    }

    function norm(x, y) {
      var length = Math.sqrt(x * x + y * y);
      if (length < 0.001) {
        return { x: 0, y: 0, length: 0 };
      }
      return { x: x / length, y: y / length, length: length };
    }

    function rand(min, max) {
      return min + Math.random() * (max - min);
    }

    function choose(list) {
      return list[Math.floor(Math.random() * list.length)];
    }

    function padTime(value) {
      var minutes = Math.floor(value / 60);
      var seconds = Math.floor(value % 60);
      return (minutes < 10 ? "0" + minutes : "" + minutes) + ":" + (seconds < 10 ? "0" + seconds : "" + seconds);
    }

    function createGame(canvas, platform) {
      platform = platform || {};

      var ctx = canvas.getContext("2d");
      var width = 375;
      var height = 667;
      var dpr = 1;
      var state = "title";
      var buttons = [];
      var lastTime = 0;
      var running = false;
      var keys = {};
      var pointer = {
        id: null,
        down: false,
        activeStick: false,
        startX: 0,
        startY: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        buttonHandled: false
      };

      var player;
      var enemies;
      var gems;
      var projectiles;
      var effects;
      var enemyProjectiles;
      var levelChoices;
      var elapsed;
      var kills;
      var spawnTimer;
      var bossTimer;
      var highScore = loadHighScore();
      var leaderboard = loadLeaderboard();
      var selectedCharacterId = loadSelectedCharacter();
      var menuTab = "home";
      var titlePulse = 0;
      var sidebarSeen = false;
      var art = {};

      loadArtAssets();

      function loadHighScore() {
        var raw = null;
        if (platform.getStorage) {
          raw = platform.getStorage(STORAGE_KEY);
        }
        if (!raw) {
          return { score: 0, time: 0, kills: 0, level: 1 };
        }
        try {
          return JSON.parse(raw);
        } catch (err) {
          return { score: 0, time: 0, kills: 0, level: 1 };
        }
      }

      function saveHighScore(score) {
        if (score.score <= highScore.score) {
          return;
        }
        highScore = score;
        if (platform.setStorage) {
          platform.setStorage(STORAGE_KEY, JSON.stringify(score));
        }
      }

      function loadLeaderboard() {
        var raw = null;
        var list;
        if (platform.getStorage) {
          raw = platform.getStorage(LEADERBOARD_KEY);
        }
        if (!raw) {
          return [];
        }
        try {
          list = JSON.parse(raw);
        } catch (err) {
          return [];
        }
        if (!Array.isArray(list) || !list.length) {
          return [];
        }
        return list.slice(0, 10);
      }

      function saveLeaderboard(record) {
        leaderboard.push(record);
        leaderboard.sort(function (a, b) {
          return b.score - a.score || b.kills - a.kills || b.time - a.time;
        });
        leaderboard = leaderboard.slice(0, 10);
        if (platform.setStorage) {
          platform.setStorage(LEADERBOARD_KEY, JSON.stringify(leaderboard));
        }
      }

      function loadSelectedCharacter() {
        var raw = null;
        if (platform.getStorage) {
          raw = platform.getStorage(SELECTED_CHARACTER_KEY);
        }
        return getCharacter(raw).id;
      }

      function saveSelectedCharacter(id) {
        selectedCharacterId = getCharacter(id).id;
        if (platform.setStorage) {
          platform.setStorage(SELECTED_CHARACTER_KEY, selectedCharacterId);
        }
      }

      function getCharacter(id) {
        var i;
        for (i = 0; i < CHARACTERS.length; i += 1) {
          if (CHARACTERS[i].id === id) {
            return CHARACTERS[i];
          }
        }
        return CHARACTERS[0];
      }

      function getEnemyConfig(type) {
        return ENEMY_TYPES[type] || ENEMY_TYPES.ash;
      }

      function loadArtAssets() {
        var base = platform.assetBase || "";
        var key;
        for (key in ART_FILES) {
          if (Object.prototype.hasOwnProperty.call(ART_FILES, key)) {
            loadArtAsset(key, base + ART_FILES[key]);
          }
        }
      }

      function loadArtAsset(key, src) {
        var asset = {
          image: null,
          ready: false,
          failed: false
        };
        var image = null;
        var onLoad = function () {
          asset.ready = true;
        };
        var onError = function () {
          asset.failed = true;
        };
        art[key] = asset;

        if (platform.loadImage) {
          image = platform.loadImage(src, onLoad, onError);
        } else if (typeof Image !== "undefined") {
          image = new Image();
          image.onload = onLoad;
          image.onerror = onError;
          image.src = src;
        }

        if (image) {
          asset.image = image;
          if (image.complete && image.naturalWidth !== 0) {
            asset.ready = true;
          }
        } else {
          asset.failed = true;
        }
      }

      function getArt(name) {
        var asset = art[name];
        if (!asset || !asset.ready || !asset.image) {
          return null;
        }
        return asset.image;
      }

      function drawImageSprite(name, x, y, size, angle, alpha, flipX) {
        var image = getArt(name);
        if (!image) {
          return false;
        }
        ctx.save();
        ctx.translate(x, y);
        if (angle) {
          ctx.rotate(angle);
        }
        if (flipX) {
          ctx.scale(-1, 1);
        }
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        ctx.drawImage(image, -size * 0.5, -size * 0.5, size, size);
        ctx.restore();
        return true;
      }

      function drawGroundShadow(x, y, w, h, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#000000";
        ctx.translate(x, y);
        ctx.scale(w * 0.5, h * 0.5);
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, TWO_PI);
        ctx.fill();
        ctx.restore();
      }

      function resize() {
        var size;
        if (platform.getSize) {
          size = platform.getSize();
        } else {
          size = {
            width: canvas.clientWidth || canvas.width || width,
            height: canvas.clientHeight || canvas.height || height,
            dpr: 1
          };
        }

        width = Math.max(320, Math.floor(size.width || width));
        height = Math.max(520, Math.floor(size.height || height));
        dpr = clamp(size.dpr || 1, 1, 3);

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        if (canvas.style) {
          canvas.style.width = width + "px";
          canvas.style.height = height + "px";
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (player) {
          player.x = clamp(player.x, 26, width - 26);
          player.y = clamp(player.y, 72, height - 34);
        }
      }

      function resetRun() {
        var sidebarBonus = false;
        var hero = getCharacter(selectedCharacterId);
        if (platform.wasSidebarLaunch && platform.wasSidebarLaunch()) {
          sidebarBonus = true;
        }

        player = {
          characterId: hero.id,
          characterName: hero.name,
          characterTitle: hero.title,
          talent: hero.talent,
          sprite: hero.sprite || "hero",
          color: hero.color,
          accent: hero.accent,
          x: width * 0.5,
          y: height * 0.58,
          r: 14,
          hpMax: hero.hpMax + (sidebarBonus ? 14 : 0),
          hp: hero.hpMax + (sidebarBonus ? 14 : 0),
          speed: hero.speed + (sidebarBonus ? 14 : 0),
          pickup: hero.pickup + (sidebarBonus ? 32 : 0),
          xp: 0,
          xpNext: 22,
          level: 1,
          slashDamage: hero.slashDamage,
          slashRange: hero.slashRange,
          slashCooldown: hero.slashCooldown,
          slashTimer: 0.2,
          orbitCount: hero.orbitCount,
          orbitDamage: hero.orbitDamage,
          orbitRadius: 44,
          projectileCount: hero.projectileCount,
          projectileDamage: hero.projectileDamage,
          projectileCooldown: hero.projectileCooldown,
          projectileTimer: 0.65,
          thunderDamage: hero.thunderDamage,
          thunderCooldown: hero.thunderCooldown,
          thunderTimer: 2.4,
          regen: hero.regen,
          shadowEcho: hero.talent === "shadow" ? 0.42 : 0,
          thunderChains: hero.talent === "thunder" ? 1 : 0,
          lotusDamage: hero.talent === "lotus" ? 34 : 0,
          lotusHeal: hero.talent === "lotus" ? 8 : 0,
          lotusCooldown: hero.talent === "lotus" ? 5.8 : 999,
          lotusTimer: hero.talent === "lotus" ? 2.4 : 999,
          invuln: 0,
          face: 1,
          sidebarBonus: sidebarBonus
        };

        enemies = [];
        gems = [];
        projectiles = [];
        enemyProjectiles = [];
        effects = [];
        levelChoices = [];
        elapsed = 0;
        kills = 0;
        spawnTimer = 0.4;
        bossTimer = 72;
        sidebarSeen = sidebarBonus;
        state = "running";
      }

      function currentScore() {
        var survived = Math.floor(elapsed || 0);
        var levelValue = player ? player.level : 1;
        return kills * 9 + survived * 2 + levelValue * 27;
      }

      function finishRun(nextState) {
        var record = {
          score: currentScore(),
          time: Math.floor(elapsed),
          kills: kills,
          level: player.level,
          characterId: player.characterId,
          characterName: player.characterName,
          result: nextState,
          date: Date.now ? Date.now() : new Date().getTime()
        };
        state = nextState;
        saveHighScore(record);
        saveLeaderboard(record);
      }

      function spawnEnemy(kind) {
        var margin = 46;
        var side = Math.floor(Math.random() * 4);
        var x = side === 1 ? width + margin : side === 3 ? -margin : rand(-margin, width + margin);
        var y = side === 0 ? -margin : side === 2 ? height + margin : rand(70, height + margin);
        var age = elapsed || 0;
        var type = kind === "boss" ? "boss" : chooseEnemyType(age);
        var config = getEnemyConfig(type);
        var hp = config.hp + age * config.hpScale;
        var speed = config.speed + age * (config.speedScale || 0);
        var enemy;

        enemy = {
          type: type,
          name: config.name,
          behavior: config.behavior,
          x: x,
          y: y,
          r: config.r,
          hp: hp,
          hpMax: hp,
          speed: speed,
          damage: config.damage,
          xp: config.xp,
          armor: config.armor || 0,
          color: config.color,
          edge: config.edge,
          orbitCd: 0,
          touchCd: 0,
          actionCd: type === "boss" ? 3.2 : rand(0.7, 2.4),
          chargeTime: 0,
          chargeX: 0,
          chargeY: 0,
          phase: Math.random() * TWO_PI,
          shielded: false,
          hit: 0
        };
        enemies.push(enemy);
      }

      function chooseEnemyType(age) {
        var pool = [];
        var total = 0;
        var i;
        var config;
        var weight;
        var roll;
        for (i = 0; i < ENEMY_ORDER.length; i += 1) {
          if (ENEMY_ORDER[i] === "boss") {
            continue;
          }
          config = getEnemyConfig(ENEMY_ORDER[i]);
          if (age < config.minAge) {
            continue;
          }
          weight = config.weight + Math.min(18, Math.max(0, age - config.minAge) * 0.05);
          if (config.behavior === "warden" && enemies.length < 10) {
            weight *= 0.4;
          }
          total += weight;
          pool.push({ type: ENEMY_ORDER[i], weight: weight });
        }
        roll = Math.random() * total;
        for (i = 0; i < pool.length; i += 1) {
          roll -= pool[i].weight;
          if (roll <= 0) {
            return pool[i].type;
          }
        }
        return "ash";
      }

      function spawnWave(dt) {
        spawnTimer -= dt;
        if (spawnTimer > 0) {
          return;
        }
        var pressure = Math.floor(elapsed / 36);
        var count = 1 + Math.min(4, pressure);
        var i;
        for (i = 0; i < count; i += 1) {
          spawnEnemy("normal");
        }
        spawnTimer = Math.max(0.16, 0.82 - elapsed * 0.004);

        bossTimer -= spawnTimer;
        if (bossTimer <= 0) {
          spawnEnemy("boss");
          bossTimer = 74 + Math.random() * 18;
          effects.push({
            type: "ring",
            x: width * 0.5,
            y: height * 0.46,
            r: 40,
            life: 1,
            maxLife: 1,
            color: "#ffd36b"
          });
        }
      }

      function hurtEnemy(enemy, amount, color) {
        if (!enemy || enemy.dead) {
          return;
        }
        amount = amount * (1 - (enemy.armor || 0));
        if (enemy.shielded && enemy.type !== "warden") {
          amount *= 0.72;
        }
        enemy.hp -= amount;
        enemy.hit = 0.08;
        effects.push({
          type: "spark",
          x: enemy.x + rand(-enemy.r * 0.4, enemy.r * 0.4),
          y: enemy.y + rand(-enemy.r * 0.4, enemy.r * 0.4),
          vx: rand(-30, 30),
          vy: rand(-50, 12),
          life: 0.32,
          maxLife: 0.32,
          color: color || "#f8e7a0"
        });
        if (enemy.hp <= 0) {
          enemy.dead = true;
          kills += enemy.type === "boss" ? 12 : 1;
          dropGem(enemy.x, enemy.y, enemy.xp);
          if (enemy.type === "boss") {
            dropGem(enemy.x + 16, enemy.y - 8, 16);
            dropGem(enemy.x - 16, enemy.y + 10, 16);
            effects.push({
              type: "ring",
              x: enemy.x,
              y: enemy.y,
              r: enemy.r,
              life: 0.75,
              maxLife: 0.75,
              color: "#ffd36b"
            });
          }
        }
      }

      function hasLivingEnemy(type) {
        var i;
        for (i = 0; i < enemies.length; i += 1) {
          if (!enemies[i].dead && enemies[i].type === type) {
            return true;
          }
        }
        return false;
      }

      function refreshEnemyShields() {
        var i;
        var j;
        var enemy;
        var warden;
        for (i = 0; i < enemies.length; i += 1) {
          enemies[i].shielded = false;
        }
        for (i = 0; i < enemies.length; i += 1) {
          warden = enemies[i];
          if (warden.dead || warden.type !== "warden") {
            continue;
          }
          for (j = 0; j < enemies.length; j += 1) {
            enemy = enemies[j];
            if (!enemy.dead && enemy !== warden && dist(warden.x, warden.y, enemy.x, enemy.y) < 104) {
              enemy.shielded = true;
            }
          }
        }
      }

      function dropGem(x, y, value) {
        gems.push({
          x: x,
          y: y,
          r: value > 8 ? 6 : 4,
          value: value,
          spin: Math.random() * TWO_PI
        });
      }

      function nearestEnemy(maxRange) {
        var best = null;
        var bestDistance = maxRange || 99999;
        var i;
        var enemy;
        var distance;
        for (i = 0; i < enemies.length; i += 1) {
          enemy = enemies[i];
          if (enemy.dead) {
            continue;
          }
          distance = dist(player.x, player.y, enemy.x, enemy.y);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = enemy;
          }
        }
        return best;
      }

      function doSlash() {
        var target = nearestEnemy(player.slashRange + 38);
        var angle = target ? Math.atan2(target.y - player.y, target.x - player.x) : elapsed * 2.4;
        var i;
        var enemy;
        var distance;
        var facing;
        var delta;
        var hitCount = 0;

        effects.push({
          type: "slash",
          x: player.x,
          y: player.y,
          angle: angle,
          r: player.slashRange,
          life: 0.18,
          maxLife: 0.18,
          color: "#f8e7a0"
        });

        for (i = 0; i < enemies.length; i += 1) {
          enemy = enemies[i];
          if (enemy.dead) {
            continue;
          }
          distance = dist(player.x, player.y, enemy.x, enemy.y);
          if (distance > player.slashRange + enemy.r) {
            continue;
          }
          facing = Math.atan2(enemy.y - player.y, enemy.x - player.x);
          delta = Math.abs(Math.atan2(Math.sin(facing - angle), Math.cos(facing - angle)));
          if (delta < 1.35 || distance < 42) {
            hurtEnemy(enemy, player.slashDamage, "#fff0aa");
            hitCount += 1;
          }
        }

        if (player.talent === "shadow" && player.shadowEcho > 0 && hitCount > 0) {
          effects.push({
            type: "slash",
            x: player.x,
            y: player.y,
            angle: angle + PI,
            r: player.slashRange * 0.72,
            life: 0.16,
            maxLife: 0.16,
            color: "#55dbc1"
          });
          for (i = 0; i < enemies.length; i += 1) {
            enemy = enemies[i];
            if (!enemy.dead && dist(player.x, player.y, enemy.x, enemy.y) < player.slashRange * 0.72 + enemy.r) {
              hurtEnemy(enemy, player.slashDamage * player.shadowEcho, "#55dbc1");
            }
          }
        }
      }

      function fireBlades() {
        var target = nearestEnemy(620);
        var baseAngle = target ? Math.atan2(target.y - player.y, target.x - player.x) : Math.random() * TWO_PI;
        var spread = player.projectileCount > 1 ? 0.28 : 0;
        var i;
        var angle;
        for (i = 0; i < player.projectileCount; i += 1) {
          angle = baseAngle + (i - (player.projectileCount - 1) * 0.5) * spread;
          projectiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * 440,
            vy: Math.sin(angle) * 440,
            r: 5,
            life: 1.18,
            damage: player.projectileDamage,
            color: "#55dbc1"
          });
        }
      }

      function doThunder() {
        var target = nearestEnemy(9999);
        var i;
        var chain;
        var chainTarget;
        var enemy;
        if (!target) {
          return;
        }
        effects.push({
          type: "bolt",
          x: target.x,
          y: target.y,
          r: 42,
          life: 0.34,
          maxLife: 0.34,
          color: "#78e7ff"
        });
        for (i = 0; i < enemies.length; i += 1) {
          enemy = enemies[i];
          if (!enemy.dead && dist(target.x, target.y, enemy.x, enemy.y) < 54 + enemy.r) {
            hurtEnemy(enemy, player.thunderDamage, "#78e7ff");
          }
        }
        for (chain = 0; chain < player.thunderChains; chain += 1) {
          chainTarget = null;
          for (i = 0; i < enemies.length; i += 1) {
            enemy = enemies[i];
            if (!enemy.dead && enemy !== target && dist(target.x, target.y, enemy.x, enemy.y) < 150 + chain * 18) {
              chainTarget = enemy;
              break;
            }
          }
          if (chainTarget) {
            effects.push({
              type: "arc",
              x: target.x,
              y: target.y,
              x2: chainTarget.x,
              y2: chainTarget.y,
              life: 0.28,
              maxLife: 0.28,
              color: "#c7f7ff"
            });
            hurtEnemy(chainTarget, player.thunderDamage * (0.58 + chain * 0.08), "#c7f7ff");
          }
        }
      }

      function doLotusPulse() {
        var i;
        var enemy;
        var range = 88 + player.level * 1.5;
        player.hp = Math.min(player.hpMax, player.hp + player.lotusHeal);
        effects.push({
          type: "lotus",
          x: player.x,
          y: player.y,
          r: range,
          life: 0.58,
          maxLife: 0.58,
          color: "#ff7d91"
        });
        for (i = 0; i < enemies.length; i += 1) {
          enemy = enemies[i];
          if (!enemy.dead && dist(player.x, player.y, enemy.x, enemy.y) < range + enemy.r) {
            hurtEnemy(enemy, player.lotusDamage, "#ff7d91");
          }
        }
      }

      function fireEnemyShot(enemy) {
        var normal = norm(player.x - enemy.x, player.y - enemy.y);
        if (!normal.length) {
          return;
        }
        enemyProjectiles.push({
          x: enemy.x,
          y: enemy.y,
          vx: normal.x * 190,
          vy: normal.y * 190,
          r: enemy.type === "boss" ? 6 : 4,
          life: enemy.type === "boss" ? 4.2 : 3.2,
          damage: enemy.damage * (enemy.type === "boss" ? 0.78 : 0.7),
          color: enemy.type === "boss" ? "#ffd36b" : "#9be36e"
        });
        effects.push({
          type: "spark",
          x: enemy.x,
          y: enemy.y,
          vx: normal.x * 12,
          vy: normal.y * 12,
          life: 0.24,
          maxLife: 0.24,
          color: enemy.type === "boss" ? "#ffd36b" : "#9be36e"
        });
      }

      function updateRunning(dt) {
        var move = inputVector();
        var i;
        var j;
        var enemy;
        var gem;
        var projectile;
        var bladeAngle;
        var bladeX;
        var bladeY;
        var distance;
        var normal;

        elapsed += dt;
        player.invuln = Math.max(0, player.invuln - dt);
        player.hp = Math.min(player.hpMax, player.hp + player.regen * dt);
        if (Math.abs(move.x) > 0.05) {
          player.face = move.x < 0 ? -1 : 1;
        }
        player.x = clamp(player.x + move.x * player.speed * dt, 20, width - 20);
        player.y = clamp(player.y + move.y * player.speed * dt, 76, height - 22);

        spawnWave(dt);

        player.slashTimer -= dt;
        if (player.slashTimer <= 0) {
          doSlash();
          player.slashTimer = player.slashCooldown;
        }

        player.projectileTimer -= dt;
        if (player.projectileTimer <= 0) {
          fireBlades();
          player.projectileTimer = player.projectileCooldown;
        }

        player.thunderTimer -= dt;
        if (player.thunderTimer <= 0) {
          doThunder();
          player.thunderTimer = player.thunderCooldown;
        }

        player.lotusTimer -= dt;
        if (player.lotusTimer <= 0) {
          doLotusPulse();
          player.lotusTimer = player.lotusCooldown;
        }

        refreshEnemyShields();

        for (i = enemies.length - 1; i >= 0; i -= 1) {
          enemy = enemies[i];
          if (enemy.dead) {
            enemies.splice(i, 1);
            continue;
          }
          enemy.phase += dt * (enemy.type === "boss" ? 2.2 : 4.2);
          normal = norm(player.x - enemy.x, player.y - enemy.y);
          enemy.actionCd = Math.max(0, enemy.actionCd - dt);
          if (enemy.behavior === "charger" && enemy.chargeTime > 0) {
            enemy.chargeTime -= dt;
            enemy.x += enemy.chargeX * enemy.speed * 3.15 * dt;
            enemy.y += enemy.chargeY * enemy.speed * 3.15 * dt;
            if (Math.random() < 0.32) {
              effects.push({
                type: "spark",
                x: enemy.x,
                y: enemy.y,
                vx: rand(-20, 20),
                vy: rand(-20, 20),
                life: 0.18,
                maxLife: 0.18,
                color: "#ffd36b"
              });
            }
          } else if (enemy.behavior === "charger" && enemy.actionCd <= 0 && normal.length < 430) {
            enemy.chargeTime = 0.44;
            enemy.chargeX = normal.x;
            enemy.chargeY = normal.y;
            enemy.actionCd = 2.8 + Math.random() * 0.8;
            effects.push({
              type: "ring",
              x: enemy.x,
              y: enemy.y,
              r: enemy.r,
              life: 0.24,
              maxLife: 0.24,
              color: "#ffd36b"
            });
          } else if (enemy.behavior === "ranged") {
            if (normal.length < 210) {
              enemy.x -= normal.x * enemy.speed * 0.64 * dt;
              enemy.y -= normal.y * enemy.speed * 0.64 * dt;
            } else {
              enemy.x += normal.x * enemy.speed * 0.55 * dt;
              enemy.y += normal.y * enemy.speed * 0.55 * dt;
            }
            if (enemy.actionCd <= 0 && normal.length < 460) {
              fireEnemyShot(enemy);
              enemy.actionCd = 2.2 + Math.random() * 0.8;
            }
          } else if (enemy.behavior === "weave" || enemy.behavior === "phase") {
            enemy.x += normal.x * enemy.speed * dt + -normal.y * Math.sin(enemy.phase) * (enemy.behavior === "phase" ? 32 : 18) * dt;
            enemy.y += normal.y * enemy.speed * dt + normal.x * Math.sin(enemy.phase) * (enemy.behavior === "phase" ? 32 : 18) * dt;
          } else if (enemy.behavior === "boss") {
            enemy.x += normal.x * enemy.speed * dt;
            enemy.y += normal.y * enemy.speed * dt;
            if (enemy.actionCd <= 0) {
              effects.push({
                type: "bossPulse",
                x: enemy.x,
                y: enemy.y,
                r: 34,
                life: 0.68,
                maxLife: 0.68,
                color: "#ffd36b"
              });
              if (normal.length < 132 && player.invuln <= 0) {
                player.hp -= enemy.damage * 0.85;
                player.invuln = 0.24;
              }
              if (enemies.length < 80) {
                spawnEnemy(Math.random() < 0.55 ? "normal" : "normal");
              }
              if (Math.random() < 0.55) {
                fireEnemyShot(enemy);
              }
              enemy.actionCd = 5.2 + Math.random() * 1.6;
            }
          } else {
            enemy.x += normal.x * enemy.speed * dt;
            enemy.y += normal.y * enemy.speed * dt;
          }
          enemy.x = clamp(enemy.x, -70, width + 70);
          enemy.y = clamp(enemy.y, 54, height + 70);
          enemy.orbitCd = Math.max(0, enemy.orbitCd - dt);
          enemy.touchCd = Math.max(0, enemy.touchCd - dt);
          enemy.hit = Math.max(0, enemy.hit - dt);

          if (normal.length < enemy.r + player.r && enemy.touchCd <= 0) {
            enemy.touchCd = 0.55;
            if (player.invuln <= 0) {
              player.hp -= enemy.damage;
              player.invuln = 0.18;
              effects.push({
                type: "ring",
                x: player.x,
                y: player.y,
                r: 16,
                life: 0.28,
                maxLife: 0.28,
                color: "#ff7060"
              });
            }
          }
        }

        for (i = enemyProjectiles.length - 1; i >= 0; i -= 1) {
          projectile = enemyProjectiles[i];
          projectile.life -= dt;
          projectile.x += projectile.vx * dt;
          projectile.y += projectile.vy * dt;
          if (projectile.life <= 0 || projectile.x < -80 || projectile.x > width + 80 || projectile.y < -80 || projectile.y > height + 80) {
            enemyProjectiles.splice(i, 1);
            continue;
          }
          if (dist(projectile.x, projectile.y, player.x, player.y) < projectile.r + player.r && player.invuln <= 0) {
            player.hp -= projectile.damage;
            player.invuln = 0.2;
            effects.push({
              type: "ring",
              x: player.x,
              y: player.y,
              r: 14,
              life: 0.28,
              maxLife: 0.28,
              color: projectile.color
            });
            enemyProjectiles.splice(i, 1);
          }
        }

        for (i = 0; i < player.orbitCount; i += 1) {
          bladeAngle = elapsed * 4.4 + (i / player.orbitCount) * TWO_PI;
          bladeX = player.x + Math.cos(bladeAngle) * player.orbitRadius;
          bladeY = player.y + Math.sin(bladeAngle) * player.orbitRadius;
          for (j = 0; j < enemies.length; j += 1) {
            enemy = enemies[j];
            if (!enemy.dead && enemy.orbitCd <= 0 && dist(bladeX, bladeY, enemy.x, enemy.y) < enemy.r + 8) {
              enemy.orbitCd = 0.16;
              hurtEnemy(enemy, player.orbitDamage * 0.32, "#55dbc1");
            }
          }
        }

        for (i = projectiles.length - 1; i >= 0; i -= 1) {
          projectile = projectiles[i];
          projectile.life -= dt;
          projectile.x += projectile.vx * dt;
          projectile.y += projectile.vy * dt;
          if (projectile.life <= 0 || projectile.x < -80 || projectile.x > width + 80 || projectile.y < -80 || projectile.y > height + 80) {
            projectiles.splice(i, 1);
            continue;
          }
          for (j = 0; j < enemies.length; j += 1) {
            enemy = enemies[j];
            if (!enemy.dead && dist(projectile.x, projectile.y, enemy.x, enemy.y) < enemy.r + projectile.r) {
              hurtEnemy(enemy, projectile.damage, "#55dbc1");
              projectiles.splice(i, 1);
              break;
            }
          }
        }

        for (i = gems.length - 1; i >= 0; i -= 1) {
          gem = gems[i];
          gem.spin += dt * 4;
          distance = dist(player.x, player.y, gem.x, gem.y);
          if (distance < player.pickup) {
            normal = norm(player.x - gem.x, player.y - gem.y);
            gem.x += normal.x * (190 + (player.pickup - distance) * 4) * dt;
            gem.y += normal.y * (190 + (player.pickup - distance) * 4) * dt;
          }
          if (distance < player.r + gem.r + 5) {
            player.xp += gem.value;
            gems.splice(i, 1);
          }
        }

        for (i = effects.length - 1; i >= 0; i -= 1) {
          effects[i].life -= dt;
          if (effects[i].vx) {
            effects[i].x += effects[i].vx * dt;
            effects[i].y += effects[i].vy * dt;
          }
          if (effects[i].life <= 0) {
            effects.splice(i, 1);
          }
        }

        if (player.xp >= player.xpNext) {
          player.xp -= player.xpNext;
          player.xpNext = Math.floor(player.xpNext * 1.22 + 10);
          player.level += 1;
          levelChoices = rollUpgrades();
          state = "levelup";
        }

        if (player.hp <= 0) {
          player.hp = 0;
          finishRun("gameover");
        } else if (elapsed >= 300) {
          finishRun("victory");
        }
      }

      function inputVector() {
        var x = 0;
        var y = 0;
        if (keys.a || keys.ArrowLeft) {
          x -= 1;
        }
        if (keys.d || keys.ArrowRight) {
          x += 1;
        }
        if (keys.w || keys.ArrowUp) {
          y -= 1;
        }
        if (keys.s || keys.ArrowDown) {
          y += 1;
        }
        if (pointer.activeStick) {
          x += pointer.vx;
          y += pointer.vy;
        }
        var normal = norm(x, y);
        return { x: normal.x, y: normal.y };
      }

      function rollUpgrades() {
        var pool = [
          {
            id: "slash",
            name: "断潮斩",
            text: "挥斩伤害与范围提升",
            apply: function () {
              player.slashDamage *= 1.28;
              player.slashRange += 10;
              player.slashCooldown = Math.max(0.38, player.slashCooldown * 0.95);
            }
          },
          {
            id: "orbit",
            name: "旋刃阵",
            text: "环绕飞刃增加一枚",
            apply: function () {
              player.orbitCount = Math.min(7, player.orbitCount + 1);
              player.orbitRadius += player.orbitCount % 2 === 0 ? 5 : 0;
            }
          },
          {
            id: "jade",
            name: "灵玉磁场",
            text: "拾取范围扩大",
            apply: function () {
              player.pickup += 34;
            }
          },
          {
            id: "swift",
            name: "踏风",
            text: "移动速度提升",
            apply: function () {
              player.speed += 18;
            }
          },
          {
            id: "heart",
            name: "血莲",
            text: "生命上限与回复提升",
            apply: function () {
              player.hpMax += 18;
              player.hp = Math.min(player.hpMax, player.hp + 28);
              player.regen += 0.28;
            }
          },
          {
            id: "moon",
            name: "月影飞剑",
            text: "投掷飞剑更密集",
            apply: function () {
              player.projectileCount = Math.min(5, player.projectileCount + 1);
              player.projectileDamage *= 1.12;
              player.projectileCooldown = Math.max(0.7, player.projectileCooldown * 0.95);
            }
          },
          {
            id: "thunder",
            name: "青雷契",
            text: "落雷更快更狠",
            apply: function () {
              player.thunderDamage *= 1.34;
              player.thunderCooldown = Math.max(2.4, player.thunderCooldown * 0.86);
            }
          }
        ];
        if (player.talent === "shadow") {
          pool.push({
            id: "shadow-sigil",
            name: "影痕回响",
            text: "影刃追击更强，挥斩更利落",
            apply: function () {
              player.shadowEcho = Math.min(0.9, player.shadowEcho + 0.16);
              player.slashCooldown = Math.max(0.34, player.slashCooldown * 0.92);
            }
          });
        } else if (player.talent === "thunder") {
          pool.push({
            id: "chain-bolt",
            name: "连锁雷文",
            text: "落雷额外跳跃，并提升雷伤",
            apply: function () {
              player.thunderChains = Math.min(4, player.thunderChains + 1);
              player.thunderDamage *= 1.18;
            }
          });
        } else if (player.talent === "lotus") {
          pool.push({
            id: "lotus-field",
            name: "绯莲盛放",
            text: "莲华阵更频繁，治疗更高",
            apply: function () {
              player.lotusCooldown = Math.max(3.4, player.lotusCooldown * 0.86);
              player.lotusDamage *= 1.18;
              player.lotusHeal += 4;
            }
          });
        }
        var selected = [];
        var candidate;
        while (selected.length < 3 && pool.length > 0) {
          candidate = choose(pool);
          selected.push(candidate);
          pool.splice(pool.indexOf(candidate), 1);
        }
        return selected;
      }

      function applyChoice(index) {
        if (state !== "levelup" || !levelChoices[index]) {
          return;
        }
        levelChoices[index].apply();
        levelChoices = [];
        state = "running";
      }

      function update(dt) {
        titlePulse += dt;
        if (state === "running") {
          updateRunning(dt);
        } else {
          var i;
          for (i = effects.length - 1; i >= 0; i -= 1) {
            effects[i].life -= dt;
            if (effects[i].life <= 0) {
              effects.splice(i, 1);
            }
          }
        }
      }

      function draw() {
        buttons = [];
        drawBackground();
        if (player) {
          drawGems();
          drawEnemyProjectiles();
          drawProjectiles();
          drawEnemies();
          drawPlayer();
          drawEffects();
          drawHud();
        } else {
          drawTitleField();
        }

        if (state === "title") {
          drawTitle();
        } else if (state === "levelup") {
          drawLevelUp();
        } else if (state === "paused") {
          drawPause();
        } else if (state === "gameover" || state === "victory") {
          drawResult();
        }

        if (state === "running" && pointer.activeStick) {
          drawStick();
        }
      }

      function drawBackground() {
        var grd = ctx.createLinearGradient(0, 0, width, height);
        grd.addColorStop(0, "#080d0b");
        grd.addColorStop(0.48, "#132019");
        grd.addColorStop(1, "#241610");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, width, height);

        if (state === "title") {
          drawTitleBackdrop();
        }

        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = "#b8915f";
        ctx.lineWidth = 1;
        var gap = 42;
        var offset = (titlePulse * 10) % gap;
        var x;
        var y;
        for (x = -gap; x < width + gap; x += gap) {
          ctx.beginPath();
          ctx.moveTo(x + offset, 72);
          ctx.lineTo(x - height * 0.22 + offset, height);
          ctx.stroke();
        }
        for (y = 92; y < height + gap; y += gap) {
          ctx.beginPath();
          ctx.moveTo(0, y + offset * 0.4);
          ctx.lineTo(width, y - width * 0.22 + offset * 0.4);
          ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        for (var i = 0; i < 36; i += 1) {
          var px = (i * 97 + Math.sin(titlePulse * 0.35 + i) * 18) % width;
          var py = 84 + ((i * 173 + titlePulse * 9) % Math.max(160, height - 120));
          ctx.globalAlpha = 0.12 + (i % 5) * 0.025;
          ctx.fillStyle = i % 3 === 0 ? "#55dbc1" : i % 3 === 1 ? "#ffd36b" : "#ff7d61";
          ctx.beginPath();
          ctx.arc(px, py, 1.3 + (i % 4) * 0.45, 0, TWO_PI);
          ctx.fill();
        }
        ctx.restore();
      }

      function drawTitleBackdrop() {
        var image = getArt("title");
        var scale;
        var drawW;
        var drawH;
        var drawX;
        var drawY;
        if (!image || !image.width || !image.height) {
          return;
        }

        scale = Math.max(width / image.width, height / image.height);
        drawW = image.width * scale;
        drawH = image.height * scale;
        drawX = (width - drawW) * 0.5;
        drawY = (height - drawH) * 0.48;

        ctx.save();
        ctx.globalAlpha = 0.42;
        ctx.drawImage(image, drawX, drawY, drawW, drawH);
        ctx.fillStyle = "rgba(4,7,6,0.52)";
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      function drawTitleField() {
        ctx.save();
        for (var i = 0; i < 10; i += 1) {
          var angle = titlePulse * 0.85 + i * 0.63;
          var radius = 42 + i * 8;
          var x = width * 0.5 + Math.cos(angle) * radius;
          var y = height * 0.56 + Math.sin(angle) * radius * 0.72;
          ctx.strokeStyle = i % 2 ? "#55dbc1" : "#ffd36b";
          ctx.globalAlpha = 0.16;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, 12 + (i % 3) * 4, angle, angle + PI * 1.25);
          ctx.stroke();
        }
        ctx.restore();
      }

      function drawGems() {
        var gem;
        var i;
        ctx.save();
        for (i = 0; i < gems.length; i += 1) {
          gem = gems[i];
          ctx.translate(gem.x, gem.y);
          ctx.rotate(gem.spin);
          ctx.fillStyle = gem.value > 8 ? "#ffd36b" : "#55dbc1";
          ctx.globalAlpha = 0.95;
          ctx.beginPath();
          ctx.moveTo(0, -gem.r);
          ctx.lineTo(gem.r, 0);
          ctx.lineTo(0, gem.r);
          ctx.lineTo(-gem.r, 0);
          ctx.closePath();
          ctx.fill();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        ctx.restore();
      }

      function drawProjectiles() {
        var projectile;
        var i;
        ctx.save();
        ctx.lineCap = "round";
        for (i = 0; i < projectiles.length; i += 1) {
          projectile = projectiles[i];
          ctx.strokeStyle = projectile.color;
          ctx.globalAlpha = 0.9;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(projectile.x, projectile.y);
          ctx.lineTo(projectile.x - projectile.vx * 0.026, projectile.y - projectile.vy * 0.026);
          ctx.stroke();
          if (drawImageSprite("blade", projectile.x, projectile.y, 28, Math.atan2(projectile.vy, projectile.vx) + PI * 0.16, 0.92, false)) {
            continue;
          }
          ctx.fillStyle = "#eafff9";
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, 3, 0, TWO_PI);
          ctx.fill();
        }
        ctx.restore();
      }

      function drawEnemyProjectiles() {
        var projectile;
        var i;
        ctx.save();
        for (i = 0; i < enemyProjectiles.length; i += 1) {
          projectile = enemyProjectiles[i];
          ctx.globalAlpha = 0.88;
          ctx.fillStyle = projectile.color;
          ctx.strokeStyle = "rgba(255,255,255,0.38)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, projectile.r, 0, TWO_PI);
          ctx.fill();
          ctx.stroke();
          ctx.globalAlpha = 0.24;
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, projectile.r * 2.4, 0, TWO_PI);
          ctx.fill();
        }
        ctx.restore();
      }

      function enemySpriteName(enemy) {
        return getEnemyConfig(enemy.type).sprite || "ash";
      }

      function enemySpriteSize(enemy) {
        if (enemy.type === "boss") {
          return enemy.r * 4.45;
        }
        if (enemy.type === "iron" || enemy.type === "warden") {
          return enemy.r * 4.8;
        }
        if (enemy.type === "swift" || enemy.type === "wraith") {
          return enemy.r * 5.9;
        }
        if (enemy.type === "fang") {
          return enemy.r * 5.25;
        }
        return enemy.r * 4.65;
      }

      function drawEnemyBadges(enemy, spriteSize) {
        var pulse = 0.5 + Math.sin(enemy.phase) * 0.5;
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        if (enemy.shielded || enemy.type === "warden") {
          ctx.globalAlpha = enemy.type === "warden" ? 0.32 : 0.22;
          ctx.strokeStyle = "#ffd36b";
          ctx.lineWidth = enemy.type === "warden" ? 4 : 2;
          ctx.beginPath();
          ctx.arc(0, -enemy.r * 0.08, enemy.r * (1.7 + pulse * 0.12), 0, TWO_PI);
          ctx.stroke();
        }
        if (enemy.type === "spitter") {
          ctx.globalAlpha = 0.38;
          ctx.fillStyle = "#9be36e";
          ctx.beginPath();
          ctx.arc(0, -spriteSize * 0.22, 5 + pulse * 3, 0, TWO_PI);
          ctx.fill();
        } else if (enemy.type === "fang") {
          ctx.globalAlpha = enemy.chargeTime > 0 ? 0.9 : 0.42;
          ctx.strokeStyle = "#ffd36b";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-enemy.r * 0.8, -enemy.r * 0.8);
          ctx.lineTo(0, -enemy.r * 1.45);
          ctx.lineTo(enemy.r * 0.8, -enemy.r * 0.8);
          ctx.stroke();
        } else if (enemy.type === "wraith") {
          ctx.globalAlpha = 0.18 + pulse * 0.18;
          ctx.strokeStyle = "#c9c7ff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.r * 2.1, -PI * 0.2, PI * 1.15);
          ctx.stroke();
        }
        ctx.restore();
      }

      function drawBossHealth(enemy, size) {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = "#190d16";
        roundRect(-size * 0.28, -size * 0.46, size * 0.56, 5, 2);
        ctx.fill();
        ctx.fillStyle = "#ffd36b";
        roundRect(-size * 0.28, -size * 0.46, size * 0.56 * clamp(enemy.hp / enemy.hpMax, 0, 1), 5, 2);
        ctx.fill();
        ctx.restore();
      }

      function drawEnemies() {
        var enemy;
        var i;
        var spriteName;
        var spriteSize;
        var flip;
        for (i = 0; i < enemies.length; i += 1) {
          enemy = enemies[i];
          spriteName = enemySpriteName(enemy);
          spriteSize = enemySpriteSize(enemy) * (1 + Math.sin(enemy.phase) * 0.025);
          flip = player && enemy.x > player.x;
          drawGroundShadow(enemy.x, enemy.y + enemy.r * 0.62, spriteSize * 0.52, enemy.r * 0.72, enemy.type === "boss" ? 0.32 : 0.22);
          drawEnemyBadges(enemy, spriteSize);
          if (drawImageSprite(spriteName, enemy.x, enemy.y - enemy.r * 0.28 + Math.sin(enemy.phase) * 1.8, spriteSize, Math.sin(titlePulse * 6 + i) * 0.035, enemy.hit > 0 ? 1 : enemy.type === "wraith" ? 0.78 : 0.96, flip)) {
            if (enemy.hit > 0) {
              ctx.save();
              ctx.globalAlpha = 0.55;
              ctx.strokeStyle = "#ffe9bd";
              ctx.lineWidth = enemy.type === "boss" ? 4 : 2;
              ctx.beginPath();
              ctx.arc(enemy.x, enemy.y, enemy.r * 1.25, 0, TWO_PI);
              ctx.stroke();
              ctx.restore();
            }
            if (enemy.type === "boss") {
              drawBossHealth(enemy, spriteSize);
            }
            continue;
          }
          ctx.save();
          ctx.translate(enemy.x, enemy.y);
          ctx.globalAlpha = enemy.hit > 0 ? 1 : 0.92;
          ctx.fillStyle = enemy.hit > 0 ? "#ffe9bd" : enemy.color;
          ctx.strokeStyle = enemy.edge;
          ctx.lineWidth = enemy.type === "boss" ? 4 : 2;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.r, 0, TWO_PI);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#34100d";
          ctx.globalAlpha = 0.42;
          ctx.beginPath();
          ctx.arc(-enemy.r * 0.3, -enemy.r * 0.24, enemy.r * 0.2, 0, TWO_PI);
          ctx.arc(enemy.r * 0.3, -enemy.r * 0.24, enemy.r * 0.2, 0, TWO_PI);
          ctx.fill();
          if (enemy.type === "boss") {
            ctx.globalAlpha = 0.95;
            ctx.fillStyle = "#190d16";
            roundRect(-enemy.r, -enemy.r - 14, enemy.r * 2, 5, 2);
            ctx.fill();
            ctx.fillStyle = "#ffd36b";
            roundRect(-enemy.r, -enemy.r - 14, enemy.r * 2 * clamp(enemy.hp / enemy.hpMax, 0, 1), 5, 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      function drawPlayer() {
        var i;
        var angle;
        var x;
        var y;
        var heroSize = player.r * 5.55;
        drawGroundShadow(player.x, player.y + player.r * 0.78, heroSize * 0.54, player.r * 0.8, 0.3);
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = player.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r * (2.0 + Math.sin(titlePulse * 3.2) * 0.16), 0, TWO_PI);
        ctx.stroke();
        ctx.globalAlpha = player.invuln > 0 ? 0.65 : 1;
        if (!drawImageSprite(player.sprite || "hero", player.x, player.y - player.r * 0.55, heroSize, Math.sin(titlePulse * 5.5) * 0.025, player.invuln > 0 ? 0.65 : 1, player.face < 0)) {
          ctx.fillStyle = "#f6e7c8";
          ctx.strokeStyle = "#1b3931";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(player.x, player.y, player.r, 0, TWO_PI);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#1d2c29";
          ctx.beginPath();
          ctx.arc(player.x + 4, player.y - 4, 3, 0, TWO_PI);
          ctx.fill();
        }
        ctx.globalAlpha = player.invuln > 0 ? 0.26 : 0.18;
        ctx.strokeStyle = player.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r * 1.72, 0, TWO_PI);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.lineCap = "round";
        for (i = 0; i < player.orbitCount; i += 1) {
          angle = elapsed * 4.4 + (i / player.orbitCount) * TWO_PI;
          x = player.x + Math.cos(angle) * player.orbitRadius;
          y = player.y + Math.sin(angle) * player.orbitRadius;
          ctx.strokeStyle = player.color;
          ctx.globalAlpha = 0.84;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(x - Math.cos(angle) * 8, y - Math.sin(angle) * 8);
          ctx.lineTo(x + Math.cos(angle) * 10, y + Math.sin(angle) * 10);
          ctx.stroke();
          if (drawImageSprite("blade", x, y, 30, angle + PI * 0.16, 0.92, false)) {
            continue;
          }
          ctx.fillStyle = "#eafff9";
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, TWO_PI);
          ctx.fill();
        }
        ctx.restore();
      }

      function drawEffects() {
        var effect;
        var i;
        var t;
        for (i = 0; i < effects.length; i += 1) {
          effect = effects[i];
          t = clamp(effect.life / effect.maxLife, 0, 1);
          ctx.save();
          ctx.globalAlpha = t;
          if (effect.type === "slash") {
            ctx.translate(effect.x, effect.y);
            ctx.rotate(effect.angle);
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 9;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.arc(0, 0, effect.r * (1.08 - t * 0.12), -0.9, 0.9);
            ctx.stroke();
            ctx.strokeStyle = "#ff7d61";
            ctx.globalAlpha = t * 0.5;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, effect.r * 0.74, -0.7, 0.72);
            ctx.stroke();
          } else if (effect.type === "bolt") {
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(effect.x - 16, 70);
            ctx.lineTo(effect.x + 9, effect.y - effect.r * 0.4);
            ctx.lineTo(effect.x - 6, effect.y + 4);
            ctx.lineTo(effect.x + 20, effect.y + effect.r * 0.42);
            ctx.stroke();
            ctx.fillStyle = "rgba(120,231,255,0.22)";
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.r * (1.2 - t * 0.3), 0, TWO_PI);
            ctx.fill();
          } else if (effect.type === "ring") {
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.r + (1 - t) * 46, 0, TWO_PI);
            ctx.stroke();
          } else if (effect.type === "arc") {
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(effect.x, effect.y);
            ctx.quadraticCurveTo(
              (effect.x + effect.x2) * 0.5 + Math.sin(titlePulse * 20) * 16,
              (effect.y + effect.y2) * 0.5 - 28,
              effect.x2,
              effect.y2
            );
            ctx.stroke();
          } else if (effect.type === "lotus") {
            ctx.strokeStyle = effect.color;
            ctx.fillStyle = "rgba(255,125,145,0.12)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.r * (1.02 - t * 0.12), 0, TWO_PI);
            ctx.fill();
            ctx.stroke();
            ctx.globalAlpha = t * 0.62;
            for (var petal = 0; petal < 6; petal += 1) {
              ctx.save();
              ctx.translate(effect.x, effect.y);
              ctx.rotate(petal * TWO_PI / 6 + titlePulse * 0.8);
              ctx.beginPath();
              ellipsePath(effect.r * 0.34, 0, effect.r * 0.18, effect.r * 0.07, 0);
              ctx.fill();
              ctx.restore();
            }
          } else if (effect.type === "bossPulse") {
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.r + (1 - t) * 120, 0, TWO_PI);
            ctx.stroke();
            ctx.globalAlpha = t * 0.18;
            ctx.fillStyle = effect.color;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.r + (1 - t) * 80, 0, TWO_PI);
            ctx.fill();
          } else {
            ctx.fillStyle = effect.color;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, 2.8 + (1 - t) * 3, 0, TWO_PI);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      function drawHud() {
        var top = 12;
        drawBar(14, top, Math.min(210, width - 128), 12, player.hp / player.hpMax, "#ff6b58", "#2a1511");
        drawBar(14, top + 17, Math.min(210, width - 128), 8, player.xp / player.xpNext, "#55dbc1", "#102c25");

        ctx.save();
        ctx.fillStyle = "#f5ead1";
        ctx.font = "700 14px system-ui, sans-serif";
        ctx.textBaseline = "top";
        ctx.fillText("Lv " + player.level, 18, top + 29);
        ctx.textAlign = "center";
        ctx.fillText(padTime(elapsed), width * 0.5, top + 6);
        ctx.textAlign = "right";
        ctx.fillText(kills + " 斩", width - 16, top + 6);
        ctx.fillStyle = player.color;
        ctx.font = "800 11px system-ui, sans-serif";
        ctx.fillText(player.characterName, width - 16, top + 24);
        ctx.restore();

        addButton("pause", width - 56, top + 28, 42, 34, "Ⅱ", function () {
          state = "paused";
        }, "ghost");
      }

      function drawBar(x, y, w, h, value, fill, back) {
        ctx.save();
        ctx.fillStyle = back;
        roundRect(x, y, w, h, h * 0.5);
        ctx.fill();
        ctx.fillStyle = fill;
        roundRect(x, y, Math.max(h, w * clamp(value, 0, 1)), h, h * 0.5);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth = 1;
        roundRect(x, y, w, h, h * 0.5);
        ctx.stroke();
        ctx.restore();
      }

      function drawTitle() {
        var contentY;
        shade();
        drawTitleHeader();
        contentY = drawMenuTabs();
        if (menuTab === "heroes") {
          drawHeroMenu(contentY);
        } else if (menuTab === "rank") {
          drawLeaderboardMenu(contentY);
        } else if (menuTab === "codex") {
          drawCodexMenu(contentY);
        } else {
          drawHomeMenu(contentY);
        }
        drawHealthAdvisory();
      }

      function drawTitleHeader() {
        var hero = getCharacter(selectedCharacterId);
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#f7e7bf";
        ctx.font = "900 " + Math.min(42, width * 0.11) + "px system-ui, sans-serif";
        ctx.fillText("影刃花海", width * 0.5, height * 0.105);
        ctx.strokeStyle = "rgba(85,219,193,0.36)";
        ctx.lineWidth = 1.5;
        ctx.strokeText("影刃花海", width * 0.5, height * 0.105);
        ctx.font = "700 13px system-ui, sans-serif";
        ctx.fillStyle = "rgba(245,234,209,0.76)";
        ctx.fillText("当前出战 · " + hero.name + " / " + hero.title, width * 0.5, height * 0.155);
        ctx.restore();
      }

      function drawHealthAdvisory() {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "600 10px system-ui, sans-serif";
        ctx.fillStyle = "rgba(245,234,209,0.58)";
        ctx.fillText("健康游戏忠告：适度游戏益脑，沉迷游戏伤身。", width * 0.5, height - 34);
        ctx.fillText("合理安排时间，享受健康生活。", width * 0.5, height - 20);
        ctx.restore();
      }

      function drawMenuTabs() {
        var left = 14;
        var gap = 6;
        var tabW = (width - left * 2 - gap * (MENU_TABS.length - 1)) / MENU_TABS.length;
        var tabY = Math.max(122, height * 0.19);
        var i;
        var tab;
        for (i = 0; i < MENU_TABS.length; i += 1) {
          tab = MENU_TABS[i];
          addButton("tab-" + tab.id, left + i * (tabW + gap), tabY, tabW, 34, tab.label, (function (id) {
            return function () {
              menuTab = id;
            };
          })(tab.id), menuTab === tab.id ? "primary" : "secondary");
        }
        return tabY + 48;
      }

      function drawHomeMenu(y) {
        var hero = getCharacter(selectedCharacterId);
        var cardW = Math.min(328, width - 36);
        var x = width * 0.5 - cardW * 0.5;
        var textW = cardW - 128;
        drawPanel(x, y, cardW, 178);
        ctx.save();
        ctx.fillStyle = "#f7e7bf";
        ctx.font = "900 19px system-ui, sans-serif";
        ctx.fillText(hero.name + " · " + hero.title, x + 18, y + 18);
        ctx.fillStyle = "rgba(245,234,209,0.72)";
        ctx.font = "600 13px system-ui, sans-serif";
        drawWrappedText(hero.desc, x + 18, y + 48, textW, 18);
        ctx.fillStyle = hero.color;
        ctx.font = "800 13px system-ui, sans-serif";
        drawWrappedText(hero.perk, x + 18, y + 98, textW, 18);
        if (highScore.score > 0) {
          ctx.fillStyle = "rgba(245,234,209,0.78)";
          ctx.font = "700 13px system-ui, sans-serif";
          ctx.fillText("最佳 " + padTime(highScore.time || 0) + " · " + (highScore.kills || 0) + "斩 · " + highScore.score, x + 18, y + 142);
        }
        ctx.restore();
        drawGroundShadow(x + cardW - 62, y + 126, 78, 18, 0.32);
        drawImageSprite(hero.sprite || "hero", x + cardW - 62, y + 96, 104, Math.sin(titlePulse * 3.8) * 0.025, 0.96, false);

        if (platform.wasSidebarLaunch && platform.wasSidebarLaunch()) {
          badge(width * 0.5 - 58, y + 190, 116, 26, "侧栏祝福");
        }

        addButton("start", width * 0.5 - 92, y + 228, 184, 48, "开局", function () {
          resetRun();
        }, "primary");

        addButton("hero-tab", width * 0.5 - 92, y + 286, 88, 40, "换人", function () {
          menuTab = "heroes";
        }, "secondary");
        addButton("rank-tab", width * 0.5 + 4, y + 286, 88, 40, "排行", function () {
          menuTab = "rank";
        }, "secondary");

        if (platform.canSidebar && platform.canSidebar()) {
          addButton("sidebar", width * 0.5 - 92, y + 336, 184, 38, "侧栏加成", function () {
            if (platform.openSidebar) {
              platform.openSidebar();
            }
          }, "secondary");
        }
      }

      function drawHeroMenu(y) {
        var cardW = Math.min(330, width - 28);
        var cardH = 92;
        var x = width * 0.5 - cardW * 0.5;
        var i;
        var hero;
        var cy;
        for (i = 0; i < CHARACTERS.length; i += 1) {
          hero = CHARACTERS[i];
          cy = y + i * (cardH + 10);
          addButton("select-" + hero.id, x, cy, cardW, cardH, "", (function (id) {
            return function () {
              saveSelectedCharacter(id);
            };
          })(hero.id), "card");
          ctx.save();
          ctx.fillStyle = selectedCharacterId === hero.id ? hero.color : "#f7e7bf";
          ctx.font = "900 17px system-ui, sans-serif";
          ctx.fillText(hero.name + " · " + hero.title, x + 16, cy + 14);
          ctx.fillStyle = "rgba(245,234,209,0.7)";
          ctx.font = "600 12px system-ui, sans-serif";
          drawWrappedText(hero.desc, x + 16, cy + 40, cardW - 118, 16);
          drawGroundShadow(x + cardW - 50, cy + 72, 54, 12, 0.24);
          drawImageSprite(hero.sprite || "hero", x + cardW - 50, cy + 48, 72, Math.sin(titlePulse * 4 + i) * 0.02, selectedCharacterId === hero.id ? 1 : 0.76, false);
          ctx.textAlign = "right";
          ctx.fillStyle = selectedCharacterId === hero.id ? "#ffd36b" : "rgba(245,234,209,0.52)";
          ctx.font = "900 13px system-ui, sans-serif";
          ctx.fillText(selectedCharacterId === hero.id ? "已选择" : "选择", x + cardW - 16, cy + 35);
          ctx.restore();
        }
        addButton("hero-start", width * 0.5 - 92, y + CHARACTERS.length * (cardH + 10) + 8, 184, 44, "以此角色开局", function () {
          resetRun();
        }, "primary");
      }

      function drawLeaderboardMenu(y) {
        var cardW = Math.min(330, width - 28);
        var x = width * 0.5 - cardW * 0.5;
        var i;
        var rowY;
        var record;
        var panelH = Math.min(430, Math.max(282, height - y - 58));
        var rowH = clamp((panelH - 64) / 10, 22, 34);
        var scoreY;
        ctx.save();
        drawPanel(x, y, cardW, panelH);
        ctx.fillStyle = "#f7e7bf";
        ctx.font = "900 18px system-ui, sans-serif";
        ctx.fillText("本地排行榜", x + 16, y + 16);
        ctx.font = "600 12px system-ui, sans-serif";
        ctx.fillStyle = "rgba(245,234,209,0.58)";
        ctx.fillText("按分数排序，记录角色、时间和击杀。", x + 16, y + 40);
        for (i = 0; i < 10; i += 1) {
          rowY = y + 68 + i * rowH;
          scoreY = rowY + (rowH <= 24 ? 3 : 0);
          record = leaderboard[i];
          ctx.fillStyle = i === 0 ? "#ffd36b" : "#f7e7bf";
          ctx.font = "900 " + (rowH <= 24 ? 12 : 15) + "px system-ui, sans-serif";
          ctx.fillText((i + 1) + ".", x + 18, scoreY);
          if (record) {
            ctx.fillText(record.score, x + 50, scoreY);
            ctx.fillStyle = "rgba(245,234,209,0.7)";
            ctx.font = "600 " + (rowH <= 24 ? 10 : 12) + "px system-ui, sans-serif";
            ctx.fillText((record.characterName || "影刃") + " · " + padTime(record.time || 0) + " · " + (record.kills || 0) + "斩 · Lv " + (record.level || 1), x + 50, rowY + (rowH <= 24 ? 16 : 19));
          } else {
            ctx.fillStyle = "rgba(245,234,209,0.42)";
            ctx.font = "600 " + (rowH <= 24 ? 10 : 13) + "px system-ui, sans-serif";
            ctx.fillText("等待一次出战记录", x + 50, rowY + (rowH <= 24 ? 8 : 5));
          }
        }
        ctx.restore();
      }

      function drawCodexMenu(y) {
        var cardW = Math.min(330, width - 28);
        var gap = height < 620 ? 4 : 6;
        var available = Math.max(ENEMY_ORDER.length * 34 + gap * (ENEMY_ORDER.length - 1), height - y - 58);
        var cardH = clamp((available - gap * (ENEMY_ORDER.length - 1)) / ENEMY_ORDER.length, 34, 58);
        var x = width * 0.5 - cardW * 0.5;
        var i;
        var type;
        var config;
        var cy;
        for (i = 0; i < ENEMY_ORDER.length; i += 1) {
          type = ENEMY_ORDER[i];
          config = getEnemyConfig(type);
          cy = y + i * (cardH + gap);
          drawPanel(x, cy, cardW, cardH);
          ctx.save();
          ctx.fillStyle = config.edge;
          ctx.font = "900 " + (cardH < 42 ? 11 : 14) + "px system-ui, sans-serif";
          ctx.fillText(config.name + " · " + config.tier, x + 14, cy + (cardH < 42 ? 8 : 12));
          if (cardH >= 42) {
            ctx.fillStyle = "rgba(245,234,209,0.68)";
            ctx.font = "600 11px system-ui, sans-serif";
            drawWrappedText(config.desc, x + 14, cy + 34, cardW - 92, 14);
          }
          ctx.restore();
          drawGroundShadow(x + cardW - 40, cy + cardH - 8, 36, 8, 0.2);
          drawImageSprite(config.sprite || "ash", x + cardW - 40, cy + cardH * 0.5, type === "boss" ? cardH * 1.14 : cardH * 0.98, Math.sin(titlePulse * 4.5 + i) * 0.03, 0.92, false);
        }
      }

      function drawLevelUp() {
        shade();
        ctx.save();
        ctx.fillStyle = "#f7e7bf";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "900 25px system-ui, sans-serif";
        ctx.fillText("悟道", width * 0.5, height * 0.22);
        ctx.restore();

        var cardW = Math.min(300, width - 40);
        var cardH = 76;
        var startY = height * 0.31;
        for (var i = 0; i < levelChoices.length; i += 1) {
          drawChoice(i, width * 0.5 - cardW * 0.5, startY + i * (cardH + 12), cardW, cardH);
        }
      }

      function drawChoice(index, x, y, w, h) {
        var choice = levelChoices[index];
        addButton("choice-" + index, x, y, w, h, "", function () {
          applyChoice(index);
        }, "card");
        ctx.save();
        ctx.fillStyle = "#f7e7bf";
        ctx.textBaseline = "top";
        ctx.font = "800 18px system-ui, sans-serif";
        ctx.fillText(choice.name, x + 18, y + 15);
        ctx.fillStyle = "rgba(245,234,209,0.7)";
        ctx.font = "600 13px system-ui, sans-serif";
        ctx.fillText(choice.text, x + 18, y + 43);
        ctx.textAlign = "right";
        ctx.fillStyle = "#55dbc1";
        ctx.font = "900 20px system-ui, sans-serif";
        ctx.fillText(index + 1, x + w - 18, y + 26);
        ctx.restore();
      }

      function drawPause() {
        shade();
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#f7e7bf";
        ctx.font = "900 30px system-ui, sans-serif";
        ctx.fillText("暂停", width * 0.5, height * 0.33);
        ctx.restore();
        addButton("resume", width * 0.5 - 82, height * 0.48, 164, 46, "继续", function () {
          state = "running";
        }, "primary");
        addButton("restart", width * 0.5 - 82, height * 0.48 + 58, 164, 42, "重开", function () {
          resetRun();
        }, "secondary");
      }

      function drawResult() {
        shade();
        var win = state === "victory";
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = win ? "#ffd36b" : "#f7e7bf";
        ctx.font = "900 32px system-ui, sans-serif";
        ctx.fillText(win ? "破晓" : "败阵", width * 0.5, height * 0.27);
        ctx.fillStyle = "rgba(245,234,209,0.82)";
        ctx.font = "700 15px system-ui, sans-serif";
        ctx.fillText(padTime(elapsed) + " · " + kills + "斩 · Lv " + player.level, width * 0.5, height * 0.35);
        ctx.font = "900 24px system-ui, sans-serif";
        ctx.fillStyle = "#55dbc1";
        ctx.fillText("" + currentScore(), width * 0.5, height * 0.41);
        ctx.restore();

        addButton("again", width * 0.5 - 82, height * 0.56, 164, 46, "再来一局", function () {
          resetRun();
        }, "primary");
        addButton("home", width * 0.5 - 82, height * 0.56 + 58, 164, 42, "主界面", function () {
          player = null;
          enemies = [];
          gems = [];
          projectiles = [];
          effects = [];
          state = "title";
        }, "secondary");
      }

      function shade() {
        ctx.save();
        ctx.fillStyle = "rgba(5,8,7,0.62)";
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      function badge(x, y, w, h, label) {
        ctx.save();
        ctx.fillStyle = "rgba(85,219,193,0.18)";
        ctx.strokeStyle = "rgba(85,219,193,0.52)";
        ctx.lineWidth = 1;
        roundRect(x, y, w, h, h * 0.5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#dffdf5";
        ctx.font = "700 13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x + w * 0.5, y + h * 0.5);
        ctx.restore();
      }

      function drawPanel(x, y, w, h) {
        ctx.save();
        ctx.fillStyle = "rgba(12,17,15,0.82)";
        ctx.strokeStyle = "rgba(255,211,107,0.26)";
        ctx.lineWidth = 1;
        roundRect(x, y, w, h, 8);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      function drawWrappedText(text, x, y, maxWidth, lineHeight) {
        var line = "";
        var i;
        var test;
        for (i = 0; i < text.length; i += 1) {
          test = line + text.charAt(i);
          if (ctx.measureText(test).width > maxWidth && line) {
            ctx.fillText(line, x, y);
            line = text.charAt(i);
            y += lineHeight;
          } else {
            line = test;
          }
        }
        if (line) {
          ctx.fillText(line, x, y);
        }
      }

      function addButton(id, x, y, w, h, label, action, style) {
        buttons.push({ id: id, x: x, y: y, w: w, h: h, action: action });
        if (style === "card") {
          ctx.save();
          ctx.fillStyle = "rgba(22,28,24,0.88)";
          ctx.strokeStyle = "rgba(255,211,107,0.32)";
          ctx.lineWidth = 1.5;
          roundRect(x, y, w, h, 8);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          return;
        }

        ctx.save();
        if (style === "primary") {
          ctx.fillStyle = "#ffd36b";
          ctx.strokeStyle = "rgba(255,255,255,0.28)";
          ctx.shadowColor = "rgba(255,211,107,0.35)";
          ctx.shadowBlur = 16;
        } else if (style === "secondary") {
          ctx.fillStyle = "rgba(85,219,193,0.16)";
          ctx.strokeStyle = "rgba(85,219,193,0.52)";
        } else {
          ctx.fillStyle = "rgba(245,234,209,0.1)";
          ctx.strokeStyle = "rgba(245,234,209,0.28)";
        }
        roundRect(x, y, w, h, 8);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.stroke();
        if (label) {
          ctx.fillStyle = style === "primary" ? "#25180d" : "#f5ead1";
          ctx.font = "900 " + Math.min(20, h * 0.43) + "px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, x + w * 0.5, y + h * 0.5);
        }
        ctx.restore();
      }

      function roundRect(x, y, w, h, r) {
        r = Math.min(r, w * 0.5, h * 0.5);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      }

      function ellipsePath(x, y, rx, ry, rotation) {
        if (ctx.ellipse) {
          ctx.ellipse(x, y, rx, ry, rotation || 0, 0, TWO_PI);
          return;
        }
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation || 0);
        ctx.scale(rx, ry);
        ctx.arc(0, 0, 1, 0, TWO_PI);
        ctx.restore();
      }

      function drawStick() {
        ctx.save();
        ctx.globalAlpha = 0.48;
        ctx.strokeStyle = "#f7e7bf";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pointer.startX, pointer.startY, 42, 0, TWO_PI);
        ctx.stroke();
        ctx.fillStyle = "#55dbc1";
        ctx.beginPath();
        ctx.arc(pointer.startX + pointer.vx * 30, pointer.startY + pointer.vy * 30, 14, 0, TWO_PI);
        ctx.fill();
        ctx.restore();
      }

      function runButton(x, y) {
        var i;
        var button;
        for (i = buttons.length - 1; i >= 0; i -= 1) {
          button = buttons[i];
          if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
            button.action();
            return true;
          }
        }
        return false;
      }

      function pointerStart(x, y, id) {
        pointer.buttonHandled = false;
        if (runButton(x, y)) {
          pointer.id = id;
          pointer.down = true;
          pointer.activeStick = false;
          pointer.buttonHandled = true;
          return;
        }
        if (state !== "running") {
          return;
        }
        pointer.id = id;
        pointer.down = true;
        pointer.activeStick = y > height * 0.38 && x < width * 0.72;
        pointer.startX = x;
        pointer.startY = y;
        pointer.x = x;
        pointer.y = y;
        pointer.vx = 0;
        pointer.vy = 0;
      }

      function pointerMove(x, y, id) {
        if (!pointer.down || pointer.id !== id || !pointer.activeStick) {
          return;
        }
        pointer.x = x;
        pointer.y = y;
        var vector = norm(x - pointer.startX, y - pointer.startY);
        var amount = Math.min(1, vector.length / 48);
        pointer.vx = vector.x * amount;
        pointer.vy = vector.y * amount;
      }

      function pointerEnd(x, y, id) {
        if (pointer.buttonHandled && (pointer.id === id || id === undefined)) {
          pointerCancel(id);
          return;
        }
        if (pointer.down && pointer.id === id) {
          if (!pointer.activeStick) {
            runButton(x, y);
          }
          pointerCancel(id);
        } else {
          runButton(x, y);
        }
      }

      function pointerCancel(id) {
        if (pointer.id !== id && id !== undefined) {
          return;
        }
        pointer.id = null;
        pointer.down = false;
        pointer.activeStick = false;
        pointer.buttonHandled = false;
        pointer.vx = 0;
        pointer.vy = 0;
      }

      function keyChange(key, down) {
        var normalized = key;
        if (key === "A") {
          normalized = "a";
        } else if (key === "D") {
          normalized = "d";
        } else if (key === "W") {
          normalized = "w";
        } else if (key === "S") {
          normalized = "s";
        }
        keys[normalized] = down;
        if (!down) {
          return;
        }
        if (state === "title") {
          if (normalized === "Enter" || normalized === " ") {
            resetRun();
          } else if (normalized === "1") {
            menuTab = "home";
          } else if (normalized === "2") {
            menuTab = "heroes";
          } else if (normalized === "3") {
            menuTab = "rank";
          } else if (normalized === "4") {
            menuTab = "codex";
          }
        } else if (state === "running" && normalized === "Escape") {
          state = "paused";
        } else if (state === "paused" && (normalized === "Escape" || normalized === " ")) {
          state = "running";
        } else if (state === "levelup") {
          if (normalized === "1") {
            applyChoice(0);
          } else if (normalized === "2") {
            applyChoice(1);
          } else if (normalized === "3") {
            applyChoice(2);
          }
        } else if ((state === "gameover" || state === "victory") && (normalized === "Enter" || normalized === " ")) {
          resetRun();
        }
      }

      function frame(now) {
        if (!running) {
          return;
        }
        if (!lastTime) {
          lastTime = now || (platform.now ? platform.now() : Date.now());
        }
        var dt = Math.min(0.034, Math.max(0.001, ((now || Date.now()) - lastTime) / 1000));
        lastTime = now || Date.now();
        update(dt);
        draw();
        requestFrame(frame);
      }

      function requestFrame(fn) {
        if (platform.requestFrame) {
          platform.requestFrame(fn);
        } else if (typeof requestAnimationFrame !== "undefined") {
          requestAnimationFrame(fn);
        } else {
          setTimeout(function () {
            fn(Date.now());
          }, 16);
        }
      }

      function start() {
        if (running) {
          return;
        }
        resize();
        enemies = [];
        gems = [];
        projectiles = [];
        enemyProjectiles = [];
        effects = [];
        player = null;
        elapsed = 0;
        kills = 0;
        running = true;
        state = "title";
        requestFrame(frame);
      }

      return {
        start: start,
        resize: resize,
        pointerStart: pointerStart,
        pointerMove: pointerMove,
        pointerEnd: pointerEnd,
        pointerCancel: pointerCancel,
        keyChange: keyChange
      };
    }

    return {
      createGame: createGame
    };
  }
);
