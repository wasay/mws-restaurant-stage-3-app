// sw.js

// https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
self.importScripts('js/idb.js');

self.importScripts('js/dbhelper.min.js');

//debug = false;

if (debug) console.log('start /sw.js');

self.addEventListener('install', function (event) {
    if (debug) console.log('sw-install()');

    // The promise that skipWaiting() returns can be safely ignored.
    self.skipWaiting();

    // DBHelper.v1LoadData((error, result) => {
    //     DBHelper.debugRestaurantInfo(error, 'dbhelper-v1LoadData-error');
    //     DBHelper.debugRestaurantInfo(result, 'dbhelper-v1LoadData-result');
    // });

    event.waitUntil(
        caches.open(DBHelper.staticCacheName).then(function (cache) {
            return cache.addAll([
                '/css/main.min.css',
                '/js/regular.js',
                '/js/fontawesome.js',
                '/js/main.min.js',
                '/js/dbhelper.min.js',
                '/js/idb.js',
                '/js/index.min.js',
                '/js/restaurant.min.js',
                '/404.html',
                '/',
                '/index.html',
                '/manifest.json',
                '/robots.txt',
                '/sw.js',
                'https://fonts.googleapis.com/css?family=Roboto',
                'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700',
                'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2',
                'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4.woff2',
            ]);
        }).then(() => {
            caches.open(DBHelper.contentImgsCache).then(function (cache) {
                return cache.addAll([
                    '/img/icons/icon.png',
                    '/img/icons/icon192.png',
                    '/img/icons/icon512.png',
                    '/img/320/1.jpg',
                    '/img/320/2.jpg',
                    '/img/320/3.jpg',
                    '/img/320/4.jpg',
                    '/img/320/5.jpg',
                    '/img/320/6.jpg',
                    '/img/320/7.jpg',
                    '/img/320/8.jpg',
                    '/img/320/9.jpg',
                    '/img/320/10.jpg',
                ]);
            });
        })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - sw-install()`);
                throw error;
            })
    );
});

self.addEventListener('activate', function (event) {
    if (debug) console.log('sw-activate()');
    event.waitUntil(
        cleanCache()
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - sw-activate()`);
                return false;
            })
    );
});


self.addEventListener('fetch', function (event) {
    if (debug) console.log('sw-listener-fetch()');

    const requestUrl = new URL(event.request.url);
    if (debug) console.log('sw-listener-fetch-requestUrl=' + (requestUrl));

    if (debug) console.log('sw-listener-fetch-requestUrl.port=' + (requestUrl.port));
    if (debug) console.log('sw-listener-fetch-requestUrl.origin=' + (requestUrl.origin));
    if (debug) console.log('sw-listener-fetch-location.origin=' + (location.origin));

    if (requestUrl.port === '1337') {
        if (debug) console.log('sw-listener-fetch-return-serveJSON');
        const jsonResult = serveJSON(requestUrl);
        if (jsonResult) {
            return jsonResult;
        }

    }
    else if (requestUrl.origin === location.origin) {
        if (debug) console.log('sw-requestUrl.pathname=' + (requestUrl.pathname));
        if (requestUrl.pathname === '' || requestUrl.pathname === '/') {
            if (debug) console.log('sw-listener-fetch-respondWith-caches.match');
            event.respondWith(caches.match('/index.html'));
            return;
        }
        if (requestUrl.pathname.startsWith('img/') || requestUrl.pathname.startsWith('/img/')) {
            if (debug) console.log('sw-listener-fetch-servePhoto');
            event.respondWith(servePhoto(event.request));
            return;
        }
    }

    if (debug) console.log('sw-listener-fetch-respondWith-serveRequest()');
    event.respondWith(serveRequest(event.request));
});

function servePhoto(request) {
    if (debug) console.log('sw-servePhoto()');

    let storageUrl = request.url.replace(/^(\d+-?)+\d+$\.jpg$/, '');

    return caches.open(DBHelper.contentImgsCache).then(function (cache) {
        return cache.match(storageUrl).then(function (response) {
            if (debug) console.log('sw-cache check if a match');
            if (response) return response;

            if (debug) console.log('sw-fetch request.url=' + (request.url));
            return fetch(request).then(function (networkResponse) {
                if (debug) console.log('sw-response cache');
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            })
                .catch(error => {
                    // Oops!. Got an error from server.
                    error.message = (`Request failed serve request. Returned status of ${error.message}`);
                    if (debug) console.log('404 return placeholder.png');
                    return caches.match('/img/static/placeholder.png');
                });
        });
    })
        .catch(error => {
            // Oops!. Got an error from server.
            error.message = (`Request failed serve photo. Returned status of ${error.message}`);
            throw error;
        });
}

function serveRequest(request) {
    if (debug) console.log('sw-serveRequest()');

    let storageUrl = request.url;

    return caches.open(staticCacheName).then(function (cache) {

        return cache.match(storageUrl).then(function (response) {
            if (debug) console.log('sw-cache match check');
            if (response) return response;

            if (debug) console.log('sw-fetch request.url=' + (request.url));
            return fetch(request).then(function (networkResponse) {
                if (debug) console.log('response cache');
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            })
                .catch(error => {
                    // Oops!. Got an error from server.
                    error.message = (`Request failed serve request. Returned status of ${error.message}`);
                    if (debug) console.log('sw-404 return index.html');
                    return caches.match('/404.html');
                });
        });
    })
        .catch(error => {
            // Oops!. Got an error from server.
            error.message = (`Request failed serve request. Returned status of ${error.message}`);
            throw error;
        });
}

function cleanCache() {
    if (debug) console.log('sw-cleanCache()');
    return caches.keys().then(function (cacheNames) {
        return Promise.all(
            cacheNames.filter(function (cacheName) {
                return cacheName.startsWith(appPrefix) &&
                    !allCaches.includes(cacheName);
            }).map(function (cacheName) {
                return caches.delete(cacheName);
            })
        );
    })
        .catch(error => {
            // Oops!. Got an error from server.
            error.message = (`Request failed clean cache. Returned status of ${error.message} -sw-cleanCache()`);
            throw error;
        });
}

function serveJSON(requestUrl) {
    if (debug) console.log('sw-serveJSON()');

    if (debug) console.log('sw-serveJSON-requestUrl=' + requestUrl);
    return fetch(requestUrl, {headers: {'Content-Type': 'application/json'}})
        .then(function (networkResponse) {
            if (debug) console.log('sw-serveJSON-networkResponse');
            return networkResponse;
        })
        .then(response => response.json())
        .catch(error => {
            // Oops!. Got an error from server.
            error.message = (`Request failed. Returned status of ${error.message} - sw-serveJSON`);
            throw error;
        });
}