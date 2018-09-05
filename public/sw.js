// sw.js

// self.importScripts('js/dbhelper.min.js');
// https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
self.importScripts('js/idb.js');

const appPrefix = 'mws-restaurant-stage-3';
const staticCacheName = 'mws-restaurant-stage-3' + '-v1';
const contentImgsCache = 'mws-restaurant-stage-3' + '-content-imgs';
const allCaches = [staticCacheName, contentImgsCache];
const dbName = 'topRestaurants3';
const dbVersion = 1;
let debug = true;

if (debug) console.log('appPrefix=' + appPrefix);
if (debug) console.log('staticCacheName=' + staticCacheName);
if (debug) console.log('contentImgsCache=' + contentImgsCache);
if (debug) console.log('allCaches=' + allCaches);
if (debug) console.log('dbName=' + dbName);
if (debug) console.log('dbVersion=' + dbVersion);
if (debug) console.log('debug=' + debug);

let addV1Data = false;

// https://github.com/jakearchibald/idb
// https://developers.google.com/web/ilt/pwa/lab-indexeddb
// https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore
const dbPromise = idb.open(dbName, dbVersion, function (upgradeDb) {
    if (debug) console.log('sw.createDB()-upgradeDb.oldVersion=' + upgradeDb.oldVersion);

    switch (upgradeDb.oldVersion) {
        case 0:
            let restaurantsObjectStore = upgradeDb.createObjectStore('restaurants', {
                keyPath: 'id',
                autoIncrement: true
            });
            restaurantsObjectStore.createIndex('id', 'id', { unique: true });
            restaurantsObjectStore.createIndex('name', 'name', { unique: false });
            restaurantsObjectStore.createIndex('neighborhood', 'neighborhood', { unique: false });
            restaurantsObjectStore.createIndex('photograph', 'photograph', { unique: false });
            restaurantsObjectStore.createIndex('address', 'address', { unique: false });
            restaurantsObjectStore.createIndex('lat', 'lat', { unique: false });
            restaurantsObjectStore.createIndex('lng', 'lng', { unique: false });
            restaurantsObjectStore.createIndex('cuisine_type', 'cuisine_type', { unique: false });
            restaurantsObjectStore.createIndex('is_favorite', 'is_favorite', { unique: false });
            restaurantsObjectStore.createIndex('createdAt', 'createdAt', { unique: false });
            restaurantsObjectStore.createIndex('updatedAt', 'updatedAt', { unique: false });

            // autoIncrement example - https://developers.google.com/web/ilt/pwa/working-with-indexeddb
            const operatingHoursObjectStore = upgradeDb.createObjectStore('operating_hours', {
                keyPath: 'operating_hour_id',
                autoIncrement: true
            });
            operatingHoursObjectStore.createIndex('operating_hour_id', 'operating_hour_id', { unique: true });
            operatingHoursObjectStore.createIndex('restaurant_id', 'restaurant_id', { unique: false });
            operatingHoursObjectStore.createIndex('day', 'day', { unique: false });
            operatingHoursObjectStore.createIndex('hours', 'hours', { unique: false });
            operatingHoursObjectStore.createIndex('createdAt', 'createdAt', { unique: false });
            operatingHoursObjectStore.createIndex('updatedAt', 'updatedAt', { unique: false });

            const reviewsObjectStore = upgradeDb.createObjectStore('reviews', {
                keyPath: 'review_id',
                autoIncrement: true
            });
            reviewsObjectStore.createIndex('id', 'id', { unique: true });
            reviewsObjectStore.createIndex('restaurant_id', 'restaurant_id', { unique: false });
            reviewsObjectStore.createIndex('name', 'name', { unique: false });
            reviewsObjectStore.createIndex('rating', 'rating', { unique: false });
            reviewsObjectStore.createIndex('comments', 'comments', { unique: false });
            reviewsObjectStore.createIndex('createdAt', 'createdAt', { unique: false });
            reviewsObjectStore.createIndex('updatedAt', 'updatedAt', { unique: false });

            let pendingObjectStore = upgradeDb.createObjectStore('pending', {
                keyPath: 'id',
                autoIncrement: true
            });
            pendingObjectStore.createIndex('id', 'id', { unique: true });
            pendingObjectStore.createIndex('url', 'url', { unique: false });
            pendingObjectStore.createIndex('method', 'method', { unique: false });
            pendingObjectStore.createIndex('headers', 'headers', { unique: false });
            pendingObjectStore.createIndex('body', 'body', { unique: false });

            addV1Data = true;
    }
}).catch(error => {
    // Oops!. Got an error from server.
    error.message = `Request failed createDB. Returned status of ${error.message}`;
    throw error;
});

if (debug) console.log('dbPromise is set');
dbPromise.then(db => {
    const dbVersion = db.version;
    if (debug) console.log('dbVersion=' + dbVersion);
    if (addV1Data) {
        v1AddRestaurantsData(db);
        v1AddReviewsData(db);
    }
}).catch(error => {
    // Oops!. Got an error from server.
    error.message = `Request failed load data. Returned status of ${error.message}`;
    throw error;
});

self.addEventListener('install', function (event) {
    if (debug) console.log('sw-install()');

    // The promise that skipWaiting() returns can be safely ignored.
    self.skipWaiting();

    event.waitUntil(caches.open(staticCacheName).then(function (cache) {
        return cache.addAll(['/css/app.min.css', '/img/icons/icon.png', '/img/icons/icon192.png', '/img/icons/icon512.png', '/img/320/1.jpg', '/img/320/2.jpg', '/img/320/3.jpg', '/img/320/4.jpg', '/img/320/5.jpg', '/img/320/6.jpg', '/img/320/7.jpg', '/img/320/8.jpg', '/img/320/9.jpg', '/img/320/10.jpg', '/js/all.js', '/js/app.min.js', '/js/dbhelper.min.js', '/js/idb.js', '/js/index.min.js', '/js/restaurant.min.js', '/', '/404.html', '/index.html', '/manifest.json', '/robots.txt', '/sw.js', 'https://fonts.googleapis.com/css?family=Roboto', 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700', 'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2', 'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4.woff2']);
    }).catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed install. Returned status of ${error.message}`;
        throw error;
    }));
});

self.addEventListener('activate', function (event) {
    if (debug) console.log('sw-activate()');
    event.waitUntil(cleanCache().catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed activate. Returned status of ${error.message}`;
        return false;
    }));
});

self.addEventListener('fetch', function (event) {
    if (debug) console.log('sw-fetch()');

    const requestUrl = new URL(event.request.url);
    if (debug) console.log('fetch requestUrl=' + requestUrl);

    if (debug) console.log('requestUrl.port=' + requestUrl.port);
    if (debug) console.log('requestUrl.origin=' + requestUrl.origin);
    if (debug) console.log('location.origin=' + location.origin);

    if (requestUrl.port === '1337') {
        if (dbPromise && dbPromise.db && dbPromise.db.transaction.objectStore('restaurants')) {
            const jsonResult = serveJSON(requestUrl);
            if (jsonResult) {
                return jsonResult;
            }
        }
    } else if (requestUrl.origin === location.origin) {
        if (debug) console.log('requestUrl.pathname=' + requestUrl.pathname);
        if (requestUrl.pathname === '' || requestUrl.pathname === '/') {
            event.respondWith(caches.match('/index.html'));
            return;
        }
        if (requestUrl.pathname.startsWith('img/') || requestUrl.pathname.startsWith('/img/')) {
            event.respondWith(servePhoto(event.request));
            return;
        }
    }
    if (debug) console.log('other');

    event.respondWith(serveRequest(event.request));
});

// self.addEventListener('message', function(event) {
//   if (event.data.action === 'skipWaiting') {
//     self.skipWaiting();
//   }
// });

function servePhoto(request) {
    if (debug) console.log('sw-servePhoto()');

    let storageUrl = request.url.replace(/^(\d+-?)+\d+$\.jpg$/, '');

    return caches.open(contentImgsCache).then(function (cache) {
        return cache.match(storageUrl).then(function (response) {
            if (debug) console.log('cache match check');
            if (response) return response;

            if (debug) console.log('fetch request.url=' + request.url);
            return fetch(request).then(function (networkResponse) {
                if (debug) console.log('response cache');
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            }).catch(error => {
                // Oops!. Got an error from server.
                error.message = `Request failed serve request. Returned status of ${error.message}`;
                if (debug) console.log('404 return placeholder.png');
                return caches.match('/img/static/placeholder.png');
            });
        });
    }).catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed serve photo. Returned status of ${error.message}`;
        throw error;
    });
}

function serveRequest(request) {
    if (debug) console.log('sw-serveRequest()');

    let storageUrl = request.url;

    return caches.open(staticCacheName).then(function (cache) {

        return cache.match(storageUrl).then(function (response) {
            if (debug) console.log('cache match check');
            if (response) return response;

            if (debug) console.log('fetch request.url=' + request.url);
            return fetch(request).then(function (networkResponse) {
                if (debug) console.log('response cache');
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            }).catch(error => {
                // Oops!. Got an error from server.
                error.message = `Request failed serve request. Returned status of ${error.message}`;
                if (debug) console.log('404 return index.html');
                return caches.match('/404.html');
            });
        });
    }).catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed serve request. Returned status of ${error.message}`;
        throw error;
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

function serveJSON(requestUrl) {
    if (debug) console.log('sw-serveJSON()');
    // get indexed db
    const id = getParameterByName('id', requestUrl.url);
    if (debug) console.log('id=' + id);
    if (id) {
        const restaurant = getRestaurantById(id);
        if (restaurant.length > 0) {
            return restaurant;
        }
    } else {
        const restaurants = getAllRestaurants();
        if (restaurants.length > 0) {
            return restaurants;
        }
    }

    return [];
}

function v1AddRestaurantsData(db) {
    debug = false;
    if (debug) console.log('v1AddRestaurantsData()');

    return fetch(DBHelper.DATABASE_URL_RESTAURANTS).then(response => response.json()).then(function (neighborhoods) {

        if (debug) console.log('version0AddRestaurantsData()-neighborhoods');
        if (debug) console.log('neighborhoods=' + neighborhoods);

        neighborhoods.forEach(restaurant => {
            if (debug) console.log('neighborhoods-restaurant()');

            // add to database

            if (debug) console.log('restaurant-restaurant-start');
            const txRestaurants = db.transaction('restaurants', 'readwrite');
            let restaurantsStore = txRestaurants.objectStore('restaurants');

            restaurantsStore.get(restaurant.id).then(function (item) {

                if (item) return true;

                //https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore
                const rtNewItem = [{
                    id: restaurant.id,
                    name: restaurant.name,
                    neighborhood: restaurant.neighborhood,
                    photograph: restaurant.photograph,
                    address: restaurant.address,
                    lat: restaurant.latlng.lat,
                    lng: restaurant.latlng.lng,
                    cuisine_type: restaurant.cuisine_type,
                    is_favorite: restaurant.is_favorite,
                    createdAt: restaurant.createdAt,
                    updatedAt: restaurant.updatedAt
                }];
                restaurantsStore.add(rtNewItem[0]);
                txRestaurants.complete;

                if (debug) console.log('restaurant-restaurant-complete');

                if (debug) console.log('restaurant-operating_hours-start');
                let operating_hours = restaurant.operating_hours;

                const txOperatingHours = db.transaction('operating_hours', 'readwrite');
                let operatingHoursStore = txOperatingHours.objectStore('operating_hours');
                for (const indx in operating_hours) {
                    if (debug) console.log('indx=' + indx);
                    if (debug) console.log('operating_hours[indx]=' + operating_hours[indx]);
                    operatingHoursStore.add({
                        restaurant_id: restaurant.id,
                        day: indx,
                        hours: operating_hours[indx],
                        createdAt: restaurant.createdAt,
                        updatedAt: restaurant.updatedAt
                    });
                }
                txOperatingHours.complete;
                if (debug) console.log('restaurant-operating_hours-complete');
            });
        });

        return true;
    }).catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed v1AddRestaurantsData. Returned status of ${error.message}`;

        throw error;
    });
}

function v1AddReviewsData(db) {
    debug = false;
    if (debug) console.log('v1AddReviewsData()');

    return fetch(DBHelper.DATABASE_URL_REVIEWS).then(response => response.json()).then(function (reviews) {

        if (debug) console.log('v1AddReviewsData()-reviews');
        if (debug) console.log('reviews=' + reviews);

        if (debug) console.log('restaurant-reviews-start');
        const txReviews = db.transaction('reviews', 'readwrite');
        let reviewsStore = txReviews.objectStore('reviews');
        if (debug) console.log('reviews=' + reviews);

        for (const rkey in reviews) {
            if (debug) console.log('rkey=' + rkey);
            if (debug) console.log('review[rkey]=' + reviews[rkey]);
            if (debug) console.log('reviews[rkey].id=' + reviews[rkey].id);
            if (debug) console.log('reviews[rkey].restaurant_id=' + reviews[rkey].restaurant_id);
            if (debug) console.log('reviews[rkey].name=' + reviews[rkey].name);
            if (debug) console.log('reviews[rkey].createdAt=' + reviews[rkey].createdAt);
            if (debug) console.log('reviews[rkey].rating=' + reviews[rkey].rating);
            if (debug) console.log('reviews[rkey].comments=' + reviews[rkey].comments);
            reviewsStore.add({
                id: reviews[rkey].id,
                restaurant_id: reviews[rkey].restaurant_id,
                name: reviews[rkey].name,
                rating: reviews[rkey].rating,
                comments: reviews[rkey].comments,
                createdAt: reviews[rkey].createdAt,
                updatedAt: reviews[rkey].updatedAt
            });
        }
        txReviews.complete;
        if (debug) console.log('restaurant-reviews-complete');

        return true;
    }).catch(error => {
        // Oops!. Got an error from server.
        error.message = `Request failed v1AddReviewsData. Returned status of ${error.message}`;

        throw error;
    });
}

function getAllRestaurants() {
    if (debug) console.log('getAllRestaurants()');

    //if (!dbPromise) return JSON.stringify([]);

    return idb.open(dbName).then(function (db) {
        const txRestaurants = db.transaction('restaurants', 'readonly');
        let restaurantsStore = txRestaurants.objectStore('restaurants');
        return restaurantsStore.getAll();
    }).then(function (db, items) {
        if (!items) {
            return JSON.stringify([]);
        }

        let restaurants = [];
        for (let i = 0; i < items.length; i++) {
            const restaurant = items[i];
            let item = {
                "id": restaurant.id,
                "name": restaurant.name,
                "neighborhood": restaurant.neighborhood,
                "photograph": restaurant.photograph,
                "address": restaurant.address,
                "latlng": {
                    "lat": restaurant.latlng.lat,
                    "lng": restaurant.latlng.lat
                },
                "cuisine_type": restaurant.cuisine_type,
                "is_favorite": restaurant.is_favorite,
                "createdAt": restaurant.createdAt,
                "updatedAt": restaurant.updatedAt
            };

            const txOperatingHours = db.transaction('operating_hours', 'readonly');
            let operatingHoursStore = txOperatingHours.objectStore('operating_hours');
            const operating_hours_list = operatingHoursStore.getAll(['restaurant_id', restaurant.id]);
            let operating_hours = [];
            for (const indx in operating_hours_list) {
                operating_hours[indx] = [operating_hours_list[indx]];
            }
            item["operating_hours"] = operating_hours;

            const txReviews = db.transaction('reviews', 'readonly');
            let reviewsStore = txReviews.objectStore('reviews');
            const review_list = reviewsStore.getAll('restaurant_id', restaurant.id);
            let reviews = [];
            for (const review in review_list) {
                const rItem = {
                    "name": review.name,
                    "rating": review.rating,
                    "comments": review.comments,
                    "createdAt": review.createdAt,
                    "updatedAt": review.updatedAt
                };
                reviews.push(rItem);
            }
            item["reviews"] = reviews;
            restaurants.push(item);
        }
        return JSON.stringify(restaurants);
    });
}

function getRestaurantById(id) {
    if (debug) console.log('getRestaurantById()');

    return idb.open(dbName).then(function (db) {
        const txRestaurants = db.transaction('restaurants', 'readonly');
        let restaurantsStore = txRestaurants.objectStore('restaurants');
        return restaurantsStore.get(id);
    }).then(function (restaurant) {
        if (!restaurant) {
            return JSON.stringify([]);
        }

        let item = {
            "id": restaurant.id,
            "name": restaurant.name,
            "neighborhood": restaurant.neighborhood,
            "photograph": restaurant.photograph,
            "address": restaurant.address,
            "latlng": {
                "lat": restaurant.latlng.lat,
                "lng": restaurant.latlng.lat
            },
            "cuisine_type": restaurant.cuisine_type,
            "is_favorite": restaurant.is_favorite,
            "createdAt": restaurant.createdAt,
            "updatedAt": restaurant.updatedAt
        };

        const txOperatingHours = db.transaction('operating_hours', 'readonly');
        let operatingHoursStore = txOperatingHours.objectStore('operating_hours');
        const operating_hours_list = operatingHoursStore.getAll(['restaurant_id', restaurant.id]);
        let operating_hours = [];
        for (const indx in operating_hours_list) {
            operating_hours[indx] = [operating_hours_list[indx]];
        }
        item["operating_hours"] = operating_hours;

        const txReviews = db.transaction('reviews', 'readonly');
        let reviewsStore = txReviews.objectStore('reviews');
        const review_list = reviewsStore.getAll('restaurant_id', restaurant.id);
        let reviews = [];
        for (const review in review_list) {
            const rItem = {
                "name": review.name,
                "rating": review.rating,
                "comments": review.comments,
                "createdAt": review.createdAt,
                "updatedAt": review.updatedAt
            };
            reviews.push(rItem);
        }
        item["reviews"] = reviews;

        return JSON.stringify(item);
    });
}

// assign dbPromise object to dbhelper class
// DBHelper.dbPromise = dbPromise;