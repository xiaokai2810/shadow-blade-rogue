(function () {
  "use strict";

  var canvas = document.getElementById("game");
  var game = window.BladeSurvivor.createGame(canvas, {
    getSize: function () {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1
      };
    },
    requestFrame: function (fn) {
      return window.requestAnimationFrame(fn);
    },
    now: function () {
      return performance.now();
    },
    getStorage: function (key) {
      try {
        return window.localStorage.getItem(key);
      } catch (err) {
        return null;
      }
    },
    setStorage: function (key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (err) {
        return false;
      }
      return true;
    },
    canSidebar: function () {
      return false;
    },
    loadImage: function (src, onLoad, onError) {
      var image = new Image();
      image.onload = onLoad;
      image.onerror = onError;
      image.src = src;
      return image;
    },
    wasSidebarLaunch: function () {
      return false;
    }
  });

  function pointFromEvent(event) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  canvas.addEventListener("pointerdown", function (event) {
    canvas.setPointerCapture(event.pointerId);
    var point = pointFromEvent(event);
    game.pointerStart(point.x, point.y, event.pointerId);
    event.preventDefault();
  });

  canvas.addEventListener("pointermove", function (event) {
    var point = pointFromEvent(event);
    game.pointerMove(point.x, point.y, event.pointerId);
    event.preventDefault();
  });

  canvas.addEventListener("pointerup", function (event) {
    var point = pointFromEvent(event);
    game.pointerEnd(point.x, point.y, event.pointerId);
    event.preventDefault();
  });

  canvas.addEventListener("pointercancel", function (event) {
    game.pointerCancel(event.pointerId);
    event.preventDefault();
  });

  window.addEventListener("keydown", function (event) {
    game.keyChange(event.key, true);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].indexOf(event.key) !== -1) {
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", function (event) {
    game.keyChange(event.key, false);
  });

  window.addEventListener("resize", function () {
    game.resize();
  });

  game.start();
})();
