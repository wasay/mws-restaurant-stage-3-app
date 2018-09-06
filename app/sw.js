// sw.js

// self.importScripts('js/dbhelper.min.js');
// https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
self.importScripts('js/idb.js');

let debug = false;
if (debug) console.log('start /sw.js');

self.importScripts('js/dbhelper.min.js');


self.addEventListener('install', function (event) {
    if (debug) console.log('sw-install()');

    // The promise that skipWaiting() returns can be safely ignored.
    self.skipWaiting();

    event.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll([
                '/css/app.min.css',
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
                '/js/all.js',
                '/js/app.min.js',
                '/js/dbhelper.min.js',
                '/js/idb.js',
                '/js/index.min.js',
                '/js/restaurant.min.js',
                '/',
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
        })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed install. Returned status of ${error.message}`);
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
                error.message = (`Request failed activate. Returned status of ${error.message}`);
                return false;
            })
    );
});


self.addEventListener('fetch', function (event) {
    if (debug) console.log('sw-fetch()');

    const requestUrl = new URL(event.request.url);
    if (debug) console.log('fetch requestUrl=' + (requestUrl));


    if (debug) console.log('requestUrl.port=' + (requestUrl.port));
    if (debug) console.log('requestUrl.origin=' + (requestUrl.origin));
    if (debug) console.log('location.origin=' + (location.origin));

    if (requestUrl.port === '1337') {
        if (DBHelper.dbPromise && DBHelper.dbPromise.db && DBHelper.dbPromise.db.transaction.objectStore('restaurants')) {
            const jsonResult = serveJSON(requestUrl);
            if (jsonResult) {
                return jsonResult;
            }
        }
    }
    else if (requestUrl.origin === location.origin) {
        if (debug) console.log('requestUrl.pathname=' + (requestUrl.pathname));
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

            if (debug) console.log('fetch request.url=' + (request.url));
            return fetch(request).then(function (networkResponse) {
                if (debug) console.log('response cache');
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
            if (debug) console.log('cache match check');
            if (response) return response;

            if (debug) console.log('fetch request.url=' + (request.url));
            return fetch(request).then(function (networkResponse) {
                if (debug) console.log('response cache');
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            })
                .catch(error => {
                    // Oops!. Got an error from server.
                    error.message = (`Request failed serve request. Returned status of ${error.message}`);
                    if (debug) console.log('404 return index.html');
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
            error.message = (`Request failed clean cache. Returned status of ${error.message}`);
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
    if (debug) console.log('id=' + (id));
    if (id) {
        const restaurant = getRestaurantById(id);
        if (restaurant.length > 0) {
            return restaurant;
        }
    }
    else {
        const restaurants = getAllRestaurants();
        if (restaurants.length > 0) {
            return restaurants;
        }
    }

    return [];
}


function getAllRestaurants() {
    if (debug) console.log('getAllRestaurants()');

    return DBHelper.dbPromise.then(function (db) {
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
                let item =
                    {
                        "id": restaurant.id,
                        "name": restaurant.name,
                        "neighborhood": restaurant.neighborhood,
                        "photograph": restaurant.photograph,
                        "address": restaurant.address,
                        "latlng": {
                            "lat": restaurant.latlng.lat,
                            "lng": restaurant.latlng.lat,
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
        }
    );
}

function getRestaurantById(id) {
    if (debug) console.log('getRestaurantById()');

    return DBHelper.dbPromise.then(function (db) {
        const txRestaurants = db.transaction('restaurants', 'readonly');
        let restaurantsStore = txRestaurants.objectStore('restaurants');
        return restaurantsStore.get(id);
    }).then(function (restaurant) {
            if (!restaurant) {
                return JSON.stringify([]);
            }

            let item =
                {
                    "id": restaurant.id,
                    "name": restaurant.name,
                    "neighborhood": restaurant.neighborhood,
                    "photograph": restaurant.photograph,
                    "address": restaurant.address,
                    "latlng": {
                        "lat": restaurant.latlng.lat,
                        "lng": restaurant.latlng.lat,
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
        }
    );
}

if (debug) console.log('end /sw.js');
