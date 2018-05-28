var staticCacheName = 'order-app-v5';
var contentImgsCache = 'order-content-imgs';
var  allCaches = [
    staticCacheName,
    contentImgsCache
];
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll([
                '/',
                '/restaurant.html',
                'dist/bundle.js',
                'styles/styles_min.css',
                'styles/styles_small.css',
                'styles/styles_medium.css',
            ]);
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('order-app') &&
                        !allCaches.includes(cacheName);
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function (event) {

    var requestUrl = new URL(event.request.url);
    if (requestUrl.origin === location.origin) {
        caches.open(staticCacheName).then(function (cache) {
            cache.add(requestUrl);
        })
        if (requestUrl.pathname === '/') {
            event.respondWith(caches.match('/'));
            return;
        }
        if (requestUrl.pathname.startsWith('/styles/')) {
            event.respondWith(servStyles(event.request));
            return;
        }
        if (requestUrl.pathname.startsWith('/images/')) {
            event.respondWith(servePhoto(event.request));
            return;
        }
    }
    caches.open(staticCacheName).then(function (cache) {
        cache.add(requestUrl);
    })
    event.respondWith(
        caches.match(event.request).then(function (response) {
            if (response) return response;
            return fetch(event.request);
        })
    );
});
function servePhoto(request) {
    var storageUrl = request.url.replace(/-\d+px\.webp$/, '');
    return caches.open(contentImgsCache).then(function (cache) {
        return cache.match(storageUrl).then(function (response) {
            if (response) return response;
            return fetch(request).then(function (networkResponse) {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            });
        });
    });
}
function servStyles(request) {
    var storageUrl = request.url.replace(/-\d+px\.css$/, '');
    return caches.open(staticCacheName).then(function (cache) {
        return cache.match(storageUrl).then(function (response) {
            if (response) return response;
            return fetch(request).then(function (networkResponse) {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            });
        });
    });
}