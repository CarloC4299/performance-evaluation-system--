const CACHE_NAME = 'performance-v3.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/cloudbase-sdk.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

// 安装时缓存资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 拦截请求，优先使用缓存
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 缓存命中，返回缓存
        if (response) {
          return response;
        }
        // 否则发起网络请求
        return fetch(event.request).then(
          response => {
            // 检查是否有效响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // 克隆响应，因为响应流只能使用一次
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        ).catch(() => {
          // 网络失败，返回离线页面（如果是页面请求）
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});