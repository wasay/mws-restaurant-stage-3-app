// sw.js

// self.importScripts('js/dbhelper.min.js');
// https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
self.importScripts('js/idb.js');

let debug = true;
if (debug) console.log('start /sw.js');

self.importScripts('js/dbhelper.min.js');

self.addEventListener('install', function (event) {
    if (debug) console.log('sw-install()');

    // The promise that skipWaiting() returns can be safely ignored.
    self.skipWaiting();

    event.waitUntil(caches.open(DBHelper.staticCacheName).then(function (cache) {
        return cache.addAll(['/css/app.min.css', '/js/regular.js', '/js/fontawesome.js', '/js/app.min.js', '/js/dbhelper.min.js', '/js/idb.js', '/js/index.min.js', '/js/restaurant.min.js', '/404.html', '/', '/index.html', '/manifest.json', '/robots.txt', '/sw.js', 'https://fonts.googleapis.com/css?family=Roboto', 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700', 'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2', 'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4.woff2']);
    }).then(() => {
        caches.open(DBHelper.contentImgsCache).then(function (cache) {
            return cache.addAll(['/img/icons/icon.png', '/img/icons/icon192.png', '/img/icons/icon512.png', '/img/320/1.jpg', '/img/320/2.jpg', '/img/320/3.jpg', '/img/320/4.jpg', '/img/320/5.jpg', '/img/320/6.jpg', '/img/320/7.jpg', '/img/320/8.jpg', '/img/320/9.jpg', '/img/320/10.jpg']);
        });
    }).catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed. Returned status of ${error.message} - sw-install()`;
        throw error;
    }));
});

self.addEventListener('activate', function (event) {
    if (debug) console.log('sw-activate()');
    event.waitUntil(cleanCache().catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed. Returned status of ${error.message} - sw-activate()`;
        return false;
    }));
});

self.addEventListener('fetch', function (event) {
    if (debug) console.log('sw-listener-fetch()');

    const requestUrl = new URL(event.request.url);
    if (debug) console.log('sw-listener-fetch-requestUrl=' + requestUrl);

    if (debug) console.log('sw-listener-fetch-requestUrl.port=' + requestUrl.port);
    if (debug) console.log('sw-listener-fetch-requestUrl.origin=' + requestUrl.origin);
    if (debug) console.log('sw-listener-fetch-location.origin=' + location.origin);

    if (requestUrl.port === '1337') {
        if (debug) console.log('sw-listener-fetch-return-serveJSON');
        const jsonResponse = serveJSON(requestUrl);
        if (debug) console.log('sw-listener-fetch-jsonResponse=' + jsonResponse);
        event.respondWith(jsonResponse);
        return;
    } else if (requestUrl.origin === location.origin) {
        if (debug) console.log('sw-listener-fetch-requestUrl.pathname=' + requestUrl.pathname);

        if (requestUrl.pathname === '' || requestUrl.pathname === '/' || requestUrl.pathname === '/index.html') {
            if (debug) console.log('sw-listener-fetch-respondWith-caches.match');
            caches.match('/index.html').then(cacheResponse => {
                if (debug) console.log('sw-listener-fetch-cacheResponse=' + cacheResponse);
                return cacheResponse;
            });
        }
        if (requestUrl.pathname.startsWith('img/') || requestUrl.pathname.startsWith('/img/')) {
            if (debug) console.log('sw-listener-fetch-servePhoto');
            const photoResponse = servePhoto(event.request);
            if (debug) console.log('sw-listener-fetch-servePhoto-photoResponse=' + photoResponse);
            event.respondWith(photoResponse);
            return;
        }
    }

    if (debug) console.log('sw-listener-fetch-respondWith-serveRequest()');
    const requestResponse = serveRequest(event.request);
    if (debug) console.log('sw-listener-fetch-serveRequest-requestResponse=' + requestResponse);
    event.respondWith(requestResponse);
});

// self.addEventListener('message', function(event) {
//   if (event.data.action === 'skipWaiting') {
//     self.skipWaiting();
//   }
// });

function servePhoto(request) {
    if (debug) console.log('sw-servePhoto()');

    let storageUrl = request.url.replace(/^(\d+-?)+\d+$\.jpg$/, '');

    return caches.open(DBHelper.contentImgsCache).then(function (cache) {
        return cache.match(storageUrl).then(response => response).catch(error => {
            if (debug) console.log('sw-cache did not match');

            if (debug) console.log('sw-fetch request.url=' + request.url);
            return fetch(request).then(function (networkResponse) {
                if (debug) console.log('sw-response cache');
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            }).catch(error => {
                // Oops!. Got an error from server.
                error.message = `Request failed serve request. Returned status of ${error.message}`;
                if (debug) console.log('sw-404 return placeholder.png');
                return caches.match('/img/static/placeholder.png');
            });
        });
    }).catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed serve photo. Returned status of ${error.message}`;
        throw error;
    });
}

function serveJSON(requestUrl) {
    if (debug) console.log('sw-serveJSON()');

    if (debug) console.log('sw-serveJSON-requestUrl=' + requestUrl);
    return fetch(requestUrl, { headers: { 'Content-Type': 'application/json' } }).then(function (networkResponse) {
        if (debug) console.log('sw-serveJSON-networkResponse');
        return networkResponse;
    }).then(response => response.json()).then(jsonData => {
        if (debug) console.log('sw-serveJSON-data.length=' + jsonData.length);
        if (debug) console.log('sw-serveJSON-data=' + jsonData);
        return jsonData;
    }).catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed. Returned status of ${error.message} - sw-serveJSON`;
        throw error;
    });
}

function serveRequest(request) {
    if (debug) console.log('sw-serveRequest()');

    let storageUrl = request.url;

    if (debug) console.log('sw-serveRequest()-request.method=' + request.method);
    if (request.method === 'GET') {
        if (debug) console.log('sw-serveRequest()-GET REQUEST');
        return caches.open(DBHelper.staticCacheName).then(function (cache) {
            return cache.match(storageUrl).then(response => {
                if (debug) console.log('sw-serveRequest()-cache response match');
                return response;
            }).catch(error => {
                if (debug) console.log('sw-serveRequest()-cache-error=' + error);
                if (debug) console.log('sw-serveRequest()-cache-error-fetch()-request.url=' + request.url);
                return fetch(request).then(function (networkResponse) {
                    if (debug) console.log('sw-serveRequest()-cache-error-fetch()-networkResponse=' + networkResponse);
                    if (debug) console.log('sw-serveRequest()-cache-error-fetch()-networkResponse-cache.put()');
                    cache.put(storageUrl, networkResponse.clone());
                    return networkResponse;
                }).catch(error => {
                    // Oops!. Got an error from server.
                    error.message = `Request failed serve request. Returned status of ${error.message}`;
                    if (debug) console.log('sw-serveRequest()-cache-error-fetch()-error=' + error.message);
                    throw error;
                });
            });
        });
    }

    if (debug) console.log('sw-serveRequest()-NON-GET Request');
    return fetch(request).then(function (networkResponse) {
        if (debug) console.log('sw-serveRequest()-fetch()-networkResponse=' + networkResponse);
        return networkResponse;
    }).catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed serve request. Returned status of ${error.message}`;
        if (debug) console.log('sw-serveRequest()-fetch()-error=' + error.message);
        if (debug) console.log('404 return index.html');
        return caches.match('/404.html');
    });
}

function cleanCache() {
    if (debug) console.log('sw-cleanCache()');
    return caches.keys().then(function (cacheNames) {
        return Promise.all(cacheNames.filter(function (cacheName) {
            return cacheName.startsWith(appPrefix) && !allCaches.includes(cacheName);
        }).map(function (cacheName) {
            return caches.delete(cacheName);
        }));
    }).catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed clean cache. Returned status of ${error.message}`;
        throw error;
    });
}

if (debug) console.log('end /sw.js');
//# sourceMappingURL=sw.js.map
