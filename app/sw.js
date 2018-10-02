// sw.js

// https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
self.importScripts('js/idb.js');

self.importScripts('js/dbhelper.min.js');

debug = false;

//DBHelper.debugObject('', 'start /sw.js');

self.addEventListener('install', function (event) {
    //DBHelper.debugObject('', 'sw-install()');

    // The promise that skipWaiting() returns can be safely ignored.
    self.skipWaiting();

    // DBHelper.v1LoadData((error, result) => {
    //     //DBHelper.debugObject(error, 'dbhelper-v1LoadData-error');
    //     //DBHelper.debugObject(result, 'dbhelper-v1LoadData-result');
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
            // caches.open(DBHelper.contentImgsCache).then(function (cache) {
            //     return cache.addAll([
            //         '/img/icons/icon.png',
            //         '/img/icons/icon192.png',
            //         '/img/icons/icon512.png',
            //         '/img/320/1.jpg',
            //         '/img/320/2.jpg',
            //         '/img/320/3.jpg',
            //         '/img/320/4.jpg',
            //         '/img/320/5.jpg',
            //         '/img/320/6.jpg',
            //         '/img/320/7.jpg',
            //         '/img/320/8.jpg',
            //         '/img/320/9.jpg',
            //         '/img/320/10.jpg',
            //     ]);
            // });
        })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - sw-install()`);
                throw error;
            })
    );
});

self.addEventListener('activate', function (event) {
    //DBHelper.debugObject('', 'sw-activate()');
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
    //DBHelper.debugObject('', 'sw-addEventListener()-fetch()');

    const requestUrl = new URL(event.request.url);
    //DBHelper.debugObject(requestUrl, 'sw-addEventListener()-fetch-requestUrl');

    if (requestUrl.port === '1337') {
        //DBHelper.debugObject('', 'sw-addEventListener()-fetch-serveJSON()-call');
        const jsonResult = serveJSON(requestUrl);
        if (jsonResult) {
            return jsonResult;
        }

    }
    else if (requestUrl.origin === location.origin) {
        //DBHelper.debugObject(requestUrl.pathname, 'sw-addEventListener()-fetch-requestUrl.pathname');
        if (requestUrl.pathname === '' || requestUrl.pathname === '/') {
            //DBHelper.debugObject('', 'sw-addEventListener()-fetch-respondWith-caches.match()');
            event.respondWith(caches.match('/index.html'));
            return;
        }
        if (requestUrl.pathname.startsWith('img/') || requestUrl.pathname.startsWith('/img/')) {
            //DBHelper.debugObject('', 'sw-addEventListener()-fetch-respondWith-servePhoto()');
            event.respondWith(servePhoto(event.request));
            return;
        }
    }

    //DBHelper.debugObject('', 'sw-addEventListener()-fetch-respondWith-serveRequest()');
    event.respondWith(serveRequest(event.request));
});

function servePhoto(request) {
    //DBHelper.debugObject('', 'sw-servePhoto()');

    let storageUrl = request.url.replace(/^(\d+-?)+\d+$\.jpg$/, '');
    //DBHelper.debugObject(storageUrl, 'sw-servePhoto()-storageUrl');

    return caches.open(DBHelper.contentImgsCache).then(function (cache) {
        return cache.match(storageUrl).then(function (response) {
            if (response) return response;

            return fetch(request).then(function (networkResponse) {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            })
                .catch(error => {
                    // Oops!. Got an error from server.
                    error.message = (`Request failed serve request. Returned status of ${error.message}`);
                    //DBHelper.debugObject(error.message, 'sw-servePhoto()-error.message');
                    //DBHelper.debugObject('', 'sw-servePhoto()-404 return placeholder.png');
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
    //DBHelper.debugObject('', 'sw-serveRequest()');

    let storageUrl = request.url;
    //DBHelper.debugObject(storageUrl, 'sw-serveRequest()-storageUrl');

    return caches.open(staticCacheName).then(function (cache) {

        return cache.match(storageUrl).then(function (response) {
            //DBHelper.debugObject('', 'sw-serveRequest()-is cache');
            if (response) return response;

            return fetch(request).then(function (networkResponse) {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            })
                .catch(error => {
                    // Oops!. Got an error from server.
                    error.message = (`Request failed serve request. Returned status of ${error.message}`);
                    //DBHelper.debugObject(error.message, 'sw-servePhoto()-error.message');
                    //DBHelper.debugObject('', 'sw-serveRequest()-404 return index.html');
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
    //DBHelper.debugObject('', 'sw-cleanCache()');
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
    //DBHelper.debugObject('', 'sw-serveJSON()');
    //DBHelper.debugObject(requestUrl, 'sw-serveJSON()-input-requestUrl');

    return fetch(requestUrl, {headers: {'Content-Type': 'application/json'}})
        .then(function (networkResponse) {
            return networkResponse;
        })
        .then(response => response.json())
        .catch(error => {
            // Oops!. Got an error from server.
            error.message = (`Request failed. Returned status of ${error.message} - sw-serveJSON`);
            throw error;
        });
}