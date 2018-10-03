// sw.js

// https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
self.importScripts('js/idb.js');

self.importScripts('js/dbhelper.min.js');

debug = true;

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
            //DBHelper.debugObject('', 'sw-addEventListener()-install-1-staticCacheName.cache');
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
                '/index.html',
                '/manifest.json',
                '/robots.txt',
                '/sw.js',
                'https://fonts.googleapis.com/css?family=Roboto',
                'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700',
                'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2',
                'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4.woff2',
            ]);
        }).then((result) => {
            //DBHelper.debugObject(result, 'sw-addEventListener()-install-2-result');
            caches.open(DBHelper.contentImgsCache).then(function (cache) {
                //DBHelper.debugObject('', 'sw-addEventListener()-install-2-contentImgsCache.cache');
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
                    '/img/placeholder.png',
                ]);
            }).then((result) => {
                //DBHelper.debugObject(result, 'sw-addEventListener()-install-3-result');
                return true;
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

    //DBHelper.debugObject(requestUrl.url, 'sw-addEventListener()-fetch-requestUrl.url');
    //DBHelper.debugObject(requestUrl.port, 'sw-addEventListener()-fetch-requestUrl.port');
    //DBHelper.debugObject(requestUrl.pathname, 'sw-addEventListener()-fetch-requestUrl.pathname');
    //DBHelper.debugObject((requestUrl.pathname.indexOf('img/') > 0), 'sw-addEventListener()-fetch-requestUrl.pathname.indexOf(img/) > 0');

    if (requestUrl.port === '1337') {
        //DBHelper.debugObject('', 'sw-addEventListener()-fetch-serveJSON()-call');
        const jsonResult = serveJSON(requestUrl);
        if (jsonResult) {
            return jsonResult;
        }

    }
    else if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname === '' || requestUrl.pathname === '/') {

            const cacheResponse = caches.match('/index.html');
            //DBHelper.debugObject((!!cacheResponse.then(response => response)), 'sw-addEventListener()-cacheResponse');

            event.respondWith(caches.match('/index.html')
                .catch(error => {
                    // Oops!. Got an error from server.
                    error.message = (`Request failed serve request. Returned status of ${error.message} - sw-addEventListener()-fetch`);
                    //DBHelper.debugObject(error.message, 'sw-addEventListener()-fetch-error.message');
                    //DBHelper.debugObject('', 'sw-addEventListener()-fetch-404.html');
                    return caches.match('/404.html');
                }));
            return;
        }

        if (requestUrl.pathname.indexOf('img/') > 0) {
            //DBHelper.debugObject('', 'sw-addEventListener()-fetch-respondWith-servePhoto()-call');
            event.respondWith(servePhoto(event.request));
            return;
        }
    }

    //DBHelper.debugObject('', 'sw-addEventListener()-fetch-respondWith-serveRequest()-call');
    event.respondWith(serveRequest(event.request));
});

function servePhoto(request) {
    //DBHelper.debugObject('', 'sw-servePhoto()');

    let storageUrl = request.url.replace(/^(\d+-?)+\d+$\.jpg$/, '');
    //DBHelper.debugObject(storageUrl, 'sw-servePhoto()-storageUrl');

    return caches.open(DBHelper.contentImgsCache).then(function (cache) {

        const cacheResponse = cache.match(storageUrl);
        //DBHelper.debugObject((!!cacheResponse.then(response => response)), 'sw-servePhoto()-cacheResponse');

        return cache.match(storageUrl).then(function (response) {
            if (response) return response;

            return fetch(request).then(function (networkResponse) {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            })
                .then((networkResponse) => {
                    if (networkResponse) return networkResponse;

                    return caches.match('/img/static/placeholder.png');
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

        const cacheResponse = cache.match(storageUrl);
        //DBHelper.debugObject((!!cacheResponse.then(response => response)), 'sw-serveRequest()-cacheResponse');

        return cacheResponse.then(function (response) {
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
            error.message = (`Request failed. Returned status of ${error.message} - sw-serveRequest()-catch`);
            //DBHelper.debugObject(error, 'sw-serveRequest()-catch');
            throw error;
        });
}

function serveJSON(requestUrl) {
    //DBHelper.debugObject('', 'sw-serveJSON()');
    //DBHelper.debugObject(requestUrl, 'sw-serveJSON()-input-requestUrl');

    //DBHelper.debugObject(navigator.onLine, 'sw-serveJSON()-1-navigator.onLine');

    if (!navigator.onLine) {
        const id = getParameterByName('id', requestUrl.url);
        //DBHelper.debugObject(id, 'sw-serveJSON()-1-id');

        return new Promise((resolve, reject) => {
            if (id) {
                //DBHelper.debugObject('', 'sw-serveJSON()-2-getRestaurantById()-call');
                DBHelper.getRestaurantById(id, (error, result) => {
                    if (error) reject(error);

                    resolve(id, result);
                });
            }
            else resolve(id, false);

        }).then((id, restaurant) => {
            if (id && restaurant) return restaurant;
            else if (id) return false;

            return new Promise((resolve2, reject2) => {
                //DBHelper.debugObject('', 'sw-serveJSON()-3-getAllRestaurants()-call');
                const is_append_properties = !navigator.onLine;
                DBHelper.getAllRestaurants(is_append_properties, (error, result) => {
                    if (error) reject2(error);

                    resolve2(result);
                });
            })
                .then((restaurants) => {

                    if (restaurants && restaurants.length > 0) return restaurants;

                    return false;
                })
        })
            .then((result) => {
                if (result) return JSON.stringify(result);

                return JSON.stringify([]);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - sw-serveJSON()-catch`);
                return JSON.stringify([]);
            });
    }

    //DBHelper.debugObject('', 'sw-serveJSON()-2-fetch');
    return fetch(requestUrl, {headers: {'Content-Type': 'application/json'}})
        .then(function (networkResponse) {
            return networkResponse;
        })
        .then(response => response.json())
        .catch(error => {
            // Oops!. Got an error from server.
            error.message = (`Request failed. Returned status of ${error.message} - sw-serveJSON`);
            return error;
        });
}

//https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name, url) {
    if (!url) return false;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
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