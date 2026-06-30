var BladeSurvivor = require("./src/blade-survivor.js");

var REVIEW_HEALTH_ADVISORY = "健康游戏忠告：适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。";
var ttApi = typeof tt !== "undefined" ? tt : null;
var canvas = ttApi && ttApi.createCanvas ? ttApi.createCanvas() : null;
var sidebarAvailable = false;
var sidebarLaunch = false;

function markSidebarLaunch(options) {
  if (!options) {
    return;
  }
  if (options.scene === "sidebar" || options.launch_from === "sidebar") {
    sidebarLaunch = true;
  }
  if (options.query && (options.query.scene === "sidebar" || options.query.from === "sidebar")) {
    sidebarLaunch = true;
  }
}

function systemInfo() {
  if (ttApi && ttApi.getSystemInfoSync) {
    try {
      return ttApi.getSystemInfoSync();
    } catch (err) {
      return {};
    }
  }
  return {};
}

if (ttApi && ttApi.setPreferredFramesPerSecond) {
  try {
    ttApi.setPreferredFramesPerSecond(60);
  } catch (err) {}
}

if (ttApi && ttApi.getLaunchOptionsSync) {
  try {
    markSidebarLaunch(ttApi.getLaunchOptionsSync());
  } catch (err) {}
}

if (ttApi && ttApi.onShow) {
  ttApi.onShow(function (res) {
    markSidebarLaunch(res);
  });
}

if (ttApi && ttApi.checkScene) {
  try {
    ttApi.checkScene({
      scene: "sidebar",
      success: function (res) {
        sidebarAvailable = !!(res && (res.isExist || res.exist || res.errMsg === "checkScene:ok"));
      },
      fail: function () {
        sidebarAvailable = false;
      }
    });
  } catch (err) {
    sidebarAvailable = false;
  }
}

var game = BladeSurvivor.createGame(canvas, {
  getSize: function () {
    var info = systemInfo();
    return {
      width: info.windowWidth || 375,
      height: info.windowHeight || 667,
      dpr: info.pixelRatio || 1
    };
  },
  requestFrame: function (fn) {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(fn);
    } else {
      setTimeout(function () {
        fn(Date.now());
      }, 16);
    }
  },
  now: function () {
    return Date.now();
  },
  getStorage: function (key) {
    if (!ttApi || !ttApi.getStorageSync) {
      return null;
    }
    try {
      return ttApi.getStorageSync(key);
    } catch (err) {
      return null;
    }
  },
  setStorage: function (key, value) {
    if (!ttApi || !ttApi.setStorageSync) {
      return false;
    }
    try {
      ttApi.setStorageSync(key, value);
    } catch (err) {
      return false;
    }
    return true;
  },
  canSidebar: function () {
    return sidebarAvailable && !!(ttApi && ttApi.navigateToScene);
  },
  loadImage: function (src, onLoad, onError) {
    var image = ttApi && ttApi.createImage ? ttApi.createImage() : null;
    if (!image) {
      return null;
    }
    image.onload = onLoad;
    image.onerror = onError;
    image.src = src;
    return image;
  },
  wasSidebarLaunch: function () {
    return sidebarLaunch;
  },
  openSidebar: function () {
    if (!ttApi || !ttApi.navigateToScene) {
      return;
    }
    try {
      ttApi.navigateToScene({
        scene: "sidebar",
        extraData: {
          from: "sidebar"
        },
        success: function () {
          sidebarLaunch = true;
        },
        fail: function () {}
      });
    } catch (err) {}
  }
});

function touchPoint(event) {
  var list = event.changedTouches && event.changedTouches.length ? event.changedTouches : event.touches;
  var touch = list && list.length ? list[0] : null;
  if (!touch) {
    return null;
  }
  return {
    x: touch.clientX || touch.x || 0,
    y: touch.clientY || touch.y || 0,
    id: touch.identifier || 1
  };
}

if (ttApi && ttApi.onTouchStart) {
  ttApi.onTouchStart(function (event) {
    var point = touchPoint(event);
    if (point) {
      game.pointerStart(point.x, point.y, point.id);
    }
  });
  ttApi.onTouchMove(function (event) {
    var point = touchPoint(event);
    if (point) {
      game.pointerMove(point.x, point.y, point.id);
    }
  });
  ttApi.onTouchEnd(function (event) {
    var point = touchPoint(event);
    if (point) {
      game.pointerEnd(point.x, point.y, point.id);
    } else {
      game.pointerCancel(1);
    }
  });
  ttApi.onTouchCancel(function (event) {
    var point = touchPoint(event);
    game.pointerCancel(point ? point.id : 1);
  });
}

if (ttApi && ttApi.onWindowResize) {
  ttApi.onWindowResize(function () {
    game.resize();
  });
}

game.start();
