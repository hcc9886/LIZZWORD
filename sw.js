/* ============================================================
   LIZZWORD · Service Worker
   - SHELL 缓存：两个页面 + 全部 css/js/图标/词书索引，装完即可离线启动
   - DATA 缓存：books/prepared 分片、books/deep 批次、content 词条，
     访问过就存下；「离线包」按钮会主动把整本词书灌进来
   - 导航请求走网络优先，失败回退缓存，保证改版能生效又不至于打不开
   - file:// 打开时本文件不会被注册（见 books/lizz/pwa.js）
   ============================================================ */
"use strict";

const BUILD = "v1";
const SHELL_CACHE = `lizzword-shell-${BUILD}`;
const DATA_CACHE = `lizzword-data-${BUILD}`;

const SHELL_FILES = [
  "./",
  "./index.html",
  "./games.html",
  "./manifest.webmanifest",
  "./words.json",
  "./icons/icon-32.png",
  "./icons/icon-64.png",
  "./icons/icon-96.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
  "./books/cet4.json",
  "./books/daily.json",
  "./books/zero-basic.json",
  "./books/affix-roots.json",
  "./books/collocation.json",
  "./books/ket-pet.json",
  "./books/new-concept.json",
  "./books/zhonggaozhi.json",
  "./books/ab.json",
  "./books/coca.json",
  "./books/pets.json",
  "./books/self-study.json",
  "./books/zikao.json",
  "./books/zhuanshengben.json",
  "./books/bec.json",
  "./books/medical.json",
  "./books/business-law.json",
  "./books/fce.json",
  "./books/pte.json",
  "./books/study-abroad.json",
  "./books/kaoyan.json",
  "./books/english-major.json",
  "./books/distractors.json",
  "./books/ielts.json",
  "./books/middle.json",
  "./books/quotes.json",
  "./books/shanghai.json",
  "./books/toefl-core-5000.json",
  "./books/BOOK-SCHEMA.md",
  "./books/manifest.js",
  "./books/word-family.json",
  "./books/deep/index.js",
  "./books/lizz/plan-engine.js",
  "./books/lizz/onboarding.js",
  "./books/lizz/entitlements.js",
  "./books/lizz/events.js",
  "./books/lizz/theme.css",
  "./books/lizz/theme.js",
  "./books/lizz/lizz.css",
  "./books/lizz/study.css",
  "./books/lizz/account.css",
  "./books/lizz/account-config.js",
  "./books/lizz/account.js",
  "./books/lizz/flashcard.js",
  "./books/lizz/lizz-accessories.js",
  "./books/lizz/lizz-feed.js",
  "./books/lizz/lizz-grade.js",
  "./books/lizz/lizz-shop.js",
  "./books/lizz/lizz-state.js",
  "./books/lizz/lizz.js",
  "./books/lizz/pwa.js",
  "./books/lizz/quiz-options.js",
  "./books/lizz/quiz-pool.js",
  "./books/lizz/similar-words.js",
  "./books/lizz/speech.js",
  "./books/lizz/study-timer.js",
  "./books/lizz/tutorial-flow.js",
  "./books/lizz/tutorial-words.js",
  "./books/lizz/games/games.css",
  "./books/lizz/games/games-words.js",
  "./books/lizz/games/games-core.js",
  "./books/lizz/games/games-app.js",
  "./books/lizz/games/game-match.js",
  "./books/lizz/games/game-flash.js",
  "./books/lizz/games/game-scramble.js",
  "./books/lizz/games/game-listen.js"
];

// 这些前缀下的响应进 DATA 缓存：内容不可变，只增不改
const DATA_PREFIXES = ["/books/prepared/", "/books/deep/", "/content/"];

function urlOf(path) {
  return new URL(path, self.location).href;
}

function isDataUrl(url) {
  const rel = url.slice(self.location.origin.length);
  return DATA_PREFIXES.some((prefix) => rel.startsWith(prefix));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => Promise.all(SHELL_FILES.map((path) => {
        const url = urlOf(path);
        // 单个文件缺失不应该让整个安装失败
        return cache.add(url).catch(() => undefined);
      })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, DATA_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => !keep.has(name)).map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

async function putInCache(cacheName, request, response) {
  if (!response || response.status !== 200 || response.type !== "basic") return response;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  return response;
}

// HEAD 探测离线的办法：缓存里有同名条目就说 200，没有就说 404
async function handle(event) {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method === "HEAD") {
    const cached = await caches.match(request.url);
    if (cached) return new Response(null, { status: 200, headers: { "content-type": "application/json" } });
    try {
      return await fetch(request);
    } catch (error) {
      return new Response(null, { status: 404, statusText: "Not Found" });
    }
  }

  // 页面导航：先网络，拿到就更新 SHELL；离线或断网时回退缓存
  if (request.mode === "navigate") {
    try {
      const fresh = await fetch(request);
      await putInCache(SHELL_CACHE, request, fresh);
      return fresh;
    } catch (error) {
      const cached = await caches.match(request)
        || await caches.match(request.destination === "document" && url.pathname.endsWith("/games.html")
          ? urlOf("./games.html")
          : urlOf("./index.html"));
      if (cached) return cached;
      return new Response(
        "<!DOCTYPE html><meta charset=\"utf-8\"><title>LIZZWORD</title>"
        + "<p style=\"font:16px/1.7 sans-serif;padding:32px\">这个页面还没在离线缓存里。"
        + "请先联网打开一次，或在「我的词书 → 离线与安装」里下载离线包。</p>",
        { status: 503, headers: { "content-type": "text/html; charset=utf-8" } }
      );
    }
  }

  const cacheName = isDataUrl(url.href) ? DATA_CACHE : SHELL_CACHE;

  // 词书分片与静态资源：缓存优先，未命中才走网络并回填
  const cached = await caches.match(request);
  if (cached) {
    if (cacheName === SHELL_CACHE) {
      // 静态资源后台更新，下次进来就是新版
      event.waitUntil(
        fetch(request).then((fresh) => putInCache(SHELL_CACHE, request, fresh)).catch(() => undefined)
      );
    }
    return cached;
  }

  const fresh = await fetch(request);
  await putInCache(cacheName, request, fresh);
  return fresh;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  // 跨域请求（例如云端同步）一律放行，不劫持也不缓存
  if (request.method !== "GET" && request.method !== "HEAD") return;
  if (new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(handle(event).catch(() => caches.match(request.url)));
});

/* ===== 与页面通信 ===== */
async function packUrls(urls, taskId, clientId) {
  const cache = await caches.open(DATA_CACHE);
  const client = await self.clients.get(clientId);
  let done = 0;
  let bytes = 0;
  let failed = [];
  let stopped = false;

  for (const path of urls) {
    const request = new Request(urlOf(path), { cache: "default" });
    const existing = await cache.match(request);
    if (existing) {
      done += 1;
      continue;
    }
    try {
      const response = await fetch(request);
      if (!response.ok) {
        failed.push({ path: path, reason: `HTTP ${response.status}` });
      } else {
        const body = await response.arrayBuffer();
        bytes += body.byteLength;
        await cache.put(request, new Response(body, {
          status: 200,
          headers: { "content-type": "application/json" }
        }));
      }
    } catch (error) {
      const name = error && error.name;
      failed.push({ path: path, reason: name === "QuotaExceededError" ? "存储空间不足" : String(error && error.message || error) });
      if (name === "QuotaExceededError") stopped = true;
    }
    done += 1;
    if (client) {
      client.postMessage({ type: "pack-progress", taskId: taskId, done: done, total: urls.length, bytes: bytes, failed: failed.length, stopped: stopped });
    }
    if (stopped) break;
  }

  if (client) {
    client.postMessage({ type: "pack-done", taskId: taskId, done: done, total: urls.length, bytes: bytes, failed: failed, stopped: stopped });
  }
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "ping") {
    event.source && event.source.postMessage({ type: "pong", build: BUILD });
    return;
  }
  if (data.type === "skip-waiting") {
    self.skipWaiting();
    return;
  }
  if (data.type === "pack") {
    packUrls(Array.isArray(data.urls) ? data.urls : [], String(data.taskId || ""), event.source && event.source.id);
    return;
  }
  if (data.type === "usage") {
    Promise.all([caches.keys(), navigator.storage.estimate()])
      .then(([names, estimate]) => {
        if (event.source) {
          event.source.postMessage({ type: "usage", taskId: String(data.taskId || ""), names: names, usage: estimate.usage || 0, quota: estimate.quota || 0 });
        }
      });
    return;
  }
  if (data.type === "clear-data") {
    caches.delete(DATA_CACHE).then(() => {
      if (event.source) {
        event.source.postMessage({ type: "data-cleared", taskId: String(data.taskId || "") });
      }
    });
  }
});
