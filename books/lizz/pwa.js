/* ============================================================
   LIZZWORD · 应用化与离线
   - 注册 Service Worker（file:// 与非安全上下文自动跳过）
   - 捕获 beforeinstallprompt，提供「安装到桌面」
   - 给页面一套离线包 API：pack / usage / clearData
   - 状态写在内存里，不落 localStorage，避免和云同步互相干扰
   ============================================================ */
(function () {
  "use strict";

  const SELF_SRC = document.currentScript && document.currentScript.src;
  const SW_URL = SELF_SRC
    ? new URL("../../sw.js", SELF_SRC).href
    : new URL("sw.js", window.location.href).href;

  const hasSW = "serviceWorker" in window.navigator;
  // file:// 下 isSecureContext 为 false，浏览器也不允许注册 SW
  const supported = hasSW && window.isSecureContext;

  let registration = null;
  let installPrompt = null;
  let installOutcome = "";
  const listeners = new Set();
  const tasks = new Map();

  function emit(event, payload) {
    listeners.forEach((fn) => {
      try { fn(event, payload || {}); } catch (error) { /* 单个订阅者出错不影响别人 */ }
    });
  }

  function onMessage(event) {
    const data = event.data || {};
    const task = data.taskId ? tasks.get(data.taskId) : null;
    if (task) {
      if (data.type === "pack-done" || data.type === "usage" || data.type === "data-cleared") {
        task.settle(data);
      } else if (typeof task.onProgress === "function") {
        task.onProgress(data);
      }
    }
    emit("sw-message", data);
  }

  function request(command, onProgress) {
    return new Promise((resolve, reject) => {
      if (!registration || !registration.active) {
        reject(new Error("离线服务还没准备好"));
        return;
      }
      const taskId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const timer = window.setTimeout(() => {
        tasks.delete(taskId);
        reject(new Error("离线服务没有回应"));
      }, 600000);
      tasks.set(taskId, {
        onProgress: onProgress,
        settle: (data) => {
          window.clearTimeout(timer);
          tasks.delete(taskId);
          resolve(data);
        }
      });
      registration.active.postMessage(Object.assign({ taskId: taskId }, command));
    });
  }

  async function register() {
    if (!supported || registration) return registration;
    const ready = await window.navigator.serviceWorker.ready;
    registration = ready;
    window.navigator.serviceWorker.addEventListener("message", onMessage);
    emit("ready", { scope: registration.scope });
    return registration;
  }

  function boot() {
    if (!supported) {
      emit("unsupported", { reason: window.isSecureContext ? "浏览器不支持 Service Worker" : "当前是 file:// 本地文件，请用网址打开" });
      return;
    }
    window.navigator.serviceWorker.register(SW_URL, { scope: new URL("./", window.location.href).href })
      .then(register)
      .catch((error) => emit("error", { message: String(error && error.message || error) }));

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      installPrompt = event;
      emit("install-availability", { available: true });
    });
    window.addEventListener("appinstalled", () => {
      installPrompt = null;
      emit("installed", {});
    });
    window.addEventListener("offline", () => emit("connection", { online: false }));
    window.addEventListener("online", () => emit("connection", { online: true }));
  }

  /* 装成应用：走浏览器安装弹窗；已被用户关掉时只能手动添加 */
  async function install() {
    if (!installPrompt) return "unavailable";
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    installPrompt = null;
    installOutcome = choice && choice.outcome ? choice.outcome : "unknown";
    emit("install-outcome", { outcome: installOutcome });
    return installOutcome;
  }

  function installed() {
    const modes = ["standalone", "window-controls-overlay"];
    return modes.some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches)
      || Boolean(window.navigator.standalone);
  }

  /* 把整本词书灌进离线缓存 */
  async function pack(urls, onProgress) {
    const list = Array.isArray(urls) ? urls.slice() : [];
    if (!list.length) return { done: 0, total: 0, bytes: 0, failed: [], stopped: false };
    const result = await request({ type: "pack", urls: list }, (data) => {
      if (onProgress) onProgress(data);
    });
    return {
      done: result.done,
      total: result.total,
      bytes: result.bytes,
      failed: result.failed || [],
      stopped: Boolean(result.stopped)
    };
  }

  async function usage() {
    if (!registration) return { usage: 0, quota: 0, names: [] };
    const result = await request({ type: "usage" });
    return { usage: result.usage || 0, quota: result.quota || 0, names: result.names || [] };
  }

  async function clearData() {
    await request({ type: "clear-data" });
    return true;
  }

  function formatBytes(value) {
    const n = Math.max(0, Number(value) || 0);
    if (n < 1024) return `${n} B`;
    if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`;
    if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;
    return `${(n / 1073741824).toFixed(2)} GB`;
  }

  const api = {
    supported: supported,
    swUrl: SW_URL,
    ready: register,
    register: boot,
    install: install,
    installed: installed,
    installAvailable: () => Boolean(installPrompt),
    pack: pack,
    usage: usage,
    clearData: clearData,
    formatBytes: formatBytes,
    isOnline: () => window.navigator.onLine !== false,
    subscribe(fn) {
      if (typeof fn === "function") listeners.add(fn);
      return () => listeners.delete(fn);
    }
  };

  window.LZPWA = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
