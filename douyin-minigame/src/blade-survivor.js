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
    var ART_FILES = {
      hero: "assets/sprites/hero.png",
      ash: "assets/sprites/ash.png",
      swift: "assets/sprites/swift.png",
      iron: "assets/sprites/iron.png",
      boss: "assets/sprites/boss.png",
      blade: "assets/sprites/blade.png",
      title: "assets/generated/title-key-art.jpg"
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
        vy: 0
      };

      var player;
      var enemies;
      var gems;
      var projectiles;
      var effects;
      var levelChoices;
      var elapsed;
      var kills;
      var spawnTimer;
      var bossTimer;
      var highScore = loadHighScore();
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
        if (platform.wasSidebarLaunch && platform.wasSidebarLaunch()) {
          sidebarBonus = true;
        }

        player = {
          x: width * 0.5,
          y: height * 0.58,
          r: 14,
          hpMax: sidebarBonus ? 118 : 104,
          hp: sidebarBonus ? 118 : 104,
          speed: sidebarBonus ? 164 : 150,
          pickup: sidebarBonus ? 118 : 86,
          xp: 0,
          xpNext: 22,
          level: 1,
          slashDamage: 24,
          slashRange: 124,
          slashCooldown: 0.62,
          slashTimer: 0.2,
          orbitCount: 1,
          orbitDamage: 30,
          orbitRadius: 44,
          projectileCount: 1,
          projectileDamage: 18,
          projectileCooldown: 1.15,
          projectileTimer: 0.65,
          thunderDamage: 40,
          thunderCooldown: 4.2,
          thunderTimer: 2.4,
          regen: 0.65,
          invuln: 0,
          face: 1,
          sidebarBonus: sidebarBonus
        };

        enemies = [];
        gems = [];
        projectiles = [];
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
        state = nextState;
        saveHighScore({
          score: currentScore(),
          time: Math.floor(elapsed),
          kills: kills,
          level: player.level
        });
      }

      function spawnEnemy(kind) {
        var margin = 46;
        var side = Math.floor(Math.random() * 4);
        var x = side === 1 ? width + margin : side === 3 ? -margin : rand(-margin, width + margin);
        var y = side === 0 ? -margin : side === 2 ? height + margin : rand(70, height + margin);
        var age = elapsed || 0;
        var enemy;

        if (kind === "boss") {
          enemy = {
            type: "boss",
            x: x,
            y: y,
            r: 34,
            hp: 460 + age * 8,
            hpMax: 460 + age * 8,
            speed: 42 + age * 0.08,
            damage: 24,
            xp: 18,
            color: "#9c4cff",
            edge: "#ffd36b",
            orbitCd: 0,
            touchCd: 0,
            hit: 0
          };
        } else if (age > 105 && Math.random() < 0.18) {
          enemy = {
            type: "iron",
            x: x,
            y: y,
            r: 18,
            hp: 112 + age * 0.9,
            hpMax: 112 + age * 0.9,
            speed: 52,
            damage: 15,
            xp: 5,
            color: "#b33b2f",
            edge: "#f9b15b",
            orbitCd: 0,
            touchCd: 0,
            hit: 0
          };
        } else if (age > 42 && Math.random() < 0.3) {
          enemy = {
            type: "swift",
            x: x,
            y: y,
            r: 10,
            hp: 27 + age * 0.45,
            hpMax: 27 + age * 0.45,
            speed: 112 + age * 0.08,
            damage: 9,
            xp: 2,
            color: "#e56c45",
            edge: "#ffe082",
            orbitCd: 0,
            touchCd: 0,
            hit: 0
          };
        } else {
          enemy = {
            type: "ash",
            x: x,
            y: y,
            r: 13,
            hp: 43 + age * 0.55,
            hpMax: 43 + age * 0.55,
            speed: 70 + age * 0.1,
            damage: 10,
            xp: 3,
            color: "#d64b39",
            edge: "#ffbf66",
            orbitCd: 0,
            touchCd: 0,
            hit: 0
          };
        }
        enemies.push(enemy);
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

        for (i = enemies.length - 1; i >= 0; i -= 1) {
          enemy = enemies[i];
          if (enemy.dead) {
            enemies.splice(i, 1);
            continue;
          }
          normal = norm(player.x - enemy.x, player.y - enemy.y);
          enemy.x += normal.x * enemy.speed * dt;
          enemy.y += normal.y * enemy.speed * dt;
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

      function enemySpriteName(enemy) {
        if (enemy.type === "boss") {
          return "boss";
        }
        if (enemy.type === "iron") {
          return "iron";
        }
        if (enemy.type === "swift") {
          return "swift";
        }
        return "ash";
      }

      function enemySpriteSize(enemy) {
        if (enemy.type === "boss") {
          return enemy.r * 4.45;
        }
        if (enemy.type === "iron") {
          return enemy.r * 4.8;
        }
        if (enemy.type === "swift") {
          return enemy.r * 5.9;
        }
        return enemy.r * 4.65;
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
          spriteSize = enemySpriteSize(enemy);
          flip = player && enemy.x > player.x;
          drawGroundShadow(enemy.x, enemy.y + enemy.r * 0.62, spriteSize * 0.52, enemy.r * 0.72, enemy.type === "boss" ? 0.32 : 0.22);
          if (drawImageSprite(spriteName, enemy.x, enemy.y - enemy.r * 0.28, spriteSize, Math.sin(titlePulse * 6 + i) * 0.035, enemy.hit > 0 ? 1 : 0.96, flip)) {
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
        ctx.globalAlpha = player.invuln > 0 ? 0.65 : 1;
        if (!drawImageSprite("hero", player.x, player.y - player.r * 0.55, heroSize, Math.sin(titlePulse * 5.5) * 0.025, player.invuln > 0 ? 0.65 : 1, player.face < 0)) {
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
        ctx.strokeStyle = "#55dbc1";
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
          ctx.strokeStyle = "#55dbc1";
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
        shade();
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#f7e7bf";
        ctx.font = "900 " + Math.min(46, width * 0.12) + "px system-ui, sans-serif";
        ctx.fillText("影刃花海", width * 0.5, height * 0.26);
        ctx.strokeStyle = "rgba(85,219,193,0.36)";
        ctx.lineWidth = 1.5;
        ctx.strokeText("影刃花海", width * 0.5, height * 0.26);

        if (highScore.score > 0) {
          ctx.font = "600 14px system-ui, sans-serif";
          ctx.fillStyle = "rgba(245,234,209,0.78)";
          ctx.fillText("最佳 " + padTime(highScore.time) + " · " + highScore.kills + "斩 · " + highScore.score, width * 0.5, height * 0.34);
        }
        if (platform.wasSidebarLaunch && platform.wasSidebarLaunch()) {
          badge(width * 0.5 - 58, height * 0.38, 116, 26, "侧栏祝福");
        }
        ctx.font = "600 10px system-ui, sans-serif";
        ctx.fillStyle = "rgba(245,234,209,0.58)";
        ctx.fillText("健康游戏忠告：适度游戏益脑，沉迷游戏伤身。", width * 0.5, height - 34);
        ctx.fillText("合理安排时间，享受健康生活。", width * 0.5, height - 20);
        ctx.restore();

        addButton("start", width * 0.5 - 82, height * 0.68, 164, 48, "开局", function () {
          resetRun();
        }, "primary");

        if (platform.canSidebar && platform.canSidebar()) {
          addButton("sidebar", width * 0.5 - 82, height * 0.68 + 58, 164, 42, "侧栏加成", function () {
            if (platform.openSidebar) {
              platform.openSidebar();
            }
          }, "secondary");
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
        if (runButton(x, y)) {
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
        if (state === "title" && (normalized === "Enter" || normalized === " ")) {
          resetRun();
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
