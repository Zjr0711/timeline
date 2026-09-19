/* 时间轴 Service Worker：离线缓存，秒开 */
var CACHE = 'timeline-v3';
var ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* 页面优先联网，确保布局更新后不会被旧 index.html 卡住；离线时回退到缓存 */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var isPage = e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').indexOf('text/html') !== -1;
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
        return hit || (isPage ? caches.match('./index.html') : Response.error());
      });
    })
  );
});
