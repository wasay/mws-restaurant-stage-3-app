// js/dbhelper.js

let debug = true;
if (debug) console.log('start /lib/dbhelper.js');

const appPrefix = 'mws-restaurant-stage-3';
const staticCacheName = appPrefix + '-v2';
const contentImgsCache = appPrefix + '-content-imgs';
const allCaches = [
    staticCacheName,
    contentImgsCache
];
const dbName = 'topRestaurants3';
const dbVersion = 5;

if (debug) console.log('dbhelper-dbName=' + (dbName));
if (debug) console.log('dbhelper-dbVersion=' + (dbVersion));

// https://github.com/jakearchibald/idb
// https://developers.google.com/web/ilt/pwa/lab-indexeddb
// https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore

let addV1Data = false;
const dbPromise = idb.open(dbName, dbVersion, function (upgradeDb) {
    if (debug) console.log('dbhelper-upgradeDb.oldVersion=' + (upgradeDb.oldVersion));

    switch (upgradeDb.oldVersion) {
        case 0:
            let restaurantsObjectStore = upgradeDb.createObjectStore('restaurants', {
                keyPath: 'restaurant_id',
                autoIncrement: true
            });
            restaurantsObjectStore.createIndex('restaurant_id', 'restaurant_id', {unique: true});
            restaurantsObjectStore.createIndex('name', 'name', {unique: false});
            restaurantsObjectStore.createIndex('neighborhood', 'neighborhood', {unique: false});
            restaurantsObjectStore.createIndex('photograph', 'photograph', {unique: false});
            restaurantsObjectStore.createIndex('address', 'address', {unique: false});
            restaurantsObjectStore.createIndex('lat', 'lat', {unique: false});
            restaurantsObjectStore.createIndex('lng', 'lng', {unique: false});
            restaurantsObjectStore.createIndex('cuisine_type', 'cuisine_type', {unique: false});
            restaurantsObjectStore.createIndex('is_favorite', 'is_favorite', {unique: false});
            restaurantsObjectStore.createIndex('createdAt', 'createdAt', {unique: false});
            restaurantsObjectStore.createIndex('updatedAt', 'updatedAt', {unique: false});
            if (debug) console.log('dbhelper-restaurantsObjectStore-done');
        case 1:

            // autoIncrement example - https://developers.google.com/web/ilt/pwa/working-with-indexeddb
            const operatingHoursObjectStore = upgradeDb.createObjectStore('operating_hours', {
                keyPath: 'operating_hour_id',
                autoIncrement: true
            });
            operatingHoursObjectStore.createIndex('operating_hour_id', 'operating_hour_id', {unique: true});
            operatingHoursObjectStore.createIndex('restaurant_id', 'restaurant_id', {unique: false});
            operatingHoursObjectStore.createIndex('day', 'day', {unique: false});
            operatingHoursObjectStore.createIndex('hours', 'hours', {unique: false});
            operatingHoursObjectStore.createIndex('createdAt', 'createdAt', {unique: false});
            operatingHoursObjectStore.createIndex('updatedAt', 'updatedAt', {unique: false});
            if (debug) console.log('dbhelper-operatingHoursObjectStore-done');
        case 2:

            const reviewsObjectStore = upgradeDb.createObjectStore('reviews', {
                keyPath: 'review_id',
                autoIncrement: true
            });
            reviewsObjectStore.createIndex('review_id', 'review_id', {unique: true});
            reviewsObjectStore.createIndex('restaurant_id', 'restaurant_id', {unique: false});
            reviewsObjectStore.createIndex('name', 'name', {unique: false});
            reviewsObjectStore.createIndex('rating', 'rating', {unique: false});
            reviewsObjectStore.createIndex('comments', 'comments', {unique: false});
            reviewsObjectStore.createIndex('createdAt', 'createdAt', {unique: false});
            reviewsObjectStore.createIndex('updatedAt', 'updatedAt', {unique: false});
            if (debug) console.log('dbhelper-reviewsObjectStore-done');
        case 3:

            let pendingObjectStore = upgradeDb.createObjectStore('pending', {
                keyPath: 'id',
                autoIncrement: true
            });
            pendingObjectStore.createIndex('id', 'id', {unique: true});
            pendingObjectStore.createIndex('url', 'url', {unique: false});
            pendingObjectStore.createIndex('method', 'method', {unique: false});
            pendingObjectStore.createIndex('headers', 'headers', {unique: false});
            pendingObjectStore.createIndex('body', 'body', {unique: false});
            if (debug) console.log('dbhelper-pendingObjectStore-done');

            addV1Data = true;
            if (debug) console.log('dbhelper-version-3-addV1Data=' + (addV1Data));
        case 4:
            if (debug) console.log('dbhelper-version-4-addV1Data=' + (addV1Data));
    }
})
    .catch(error => {
        // Oops!. Got an error from server.
        error.message = (`Request failed createDB. Returned status of ${error.message}`);
        throw error;
    });

const mypromise = new Promise((resolve, reject) => {
    dbPromise.then(db => {
        if (debug) console.log('dbhelper-dbPromise-then');
        const dbVersion = db.version;
        if (debug) console.log('dbhelper-dbVersion=' + (dbVersion));
        resolve(true);
    });
})
    .then(() => {
        if (debug) console.log('dbhelper-addV1Data=' + (addV1Data));
        if (!addV1Data) {
            return new Promise((resolve, reject) => {
                DBHelper.isIndexDbPopulated((error, response) => {
                    if (error) resolve(false);
                    resolve(true);
                });
            })
        }
        else return false;
    })
    .then(addV1Data, (isDbPopulated) => {
        if (debug) console.log('dbhelper-addV1Data=' + (addV1Data));
        if (debug) console.log('dbhelper-isDbPopulated=' + (isDbPopulated));
        addV1Data = isDbPopulated;
        return true;
    })
    .then(() => {
        if (debug) console.log('dbhelper-addV1Data=' + (addV1Data));
        if (addV1Data) {
            if (debug) console.log('dbhelper--calling-DBHelper.v1AddRestaurantsData()');
            DBHelper.v1AddRestaurantsData();
        }
        return true;
    }).then(() => {
        if (debug) console.log('dbhelper-addV1Data=' + (addV1Data));
        if (addV1Data) {
            if (debug) console.log('dbhelper--calling-DBHelper.v1AddReviewsData()');
            DBHelper.v1AddReviewsData();
        }
        return true;
    })
    .catch(error => {
        if (debug) console.log('dbhelper-some-error');
        // Oops!. Got an error from server.
        error.message = (`Request failed load data. Returned status of ${error.message}`);
        throw error;
    });


/**
 * Common database helper functions.
 */
class DBHelper {

    constructor() {
        this.restaurants = null;
        this.restaurant = null;
        this.reviews = null;
        this.operating_hours = null;
    }

    static get staticCacheName() {
        return staticCacheName;
    }

    static get contentImgsCache() {
        return contentImgsCache;
    }

    static get allCaches() {
        return allCaches;
    }

    static get dbPromise() {
        return dbPromise;
    }

    static get dbName() {
        return dbName;
    }

    static get dbVersion() {
        return dbVersion;
    }

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        //console.log('dbhelper-DATABASE_URL()');
        const port = 1337; // Change this to your server port
        // michael.phan.gen suggestion:
        // https://discussions.udacity.com/t/restaurant-reviews-app-stage-1/675923/8
        //return `https://raw.githubusercontent.com/udacity/mws-restaurant-stage-1/master/data/restaurants.json`;

        // return `http://localhost:${port}/data/restaurants.json`;
        return `http://localhost:${port}`;
    }

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL_RESTAURANTS() {
        return DBHelper.DATABASE_URL + '/restaurants';
    }

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL_REVIEWS() {
        return DBHelper.DATABASE_URL + '/reviews';
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {
        if (debug) console.log('dbhelper-fetchRestaurants()');

        return fetch(DBHelper.DATABASE_URL_RESTAURANTS, {
            headers: {'Content-Type': 'application/json'}
        })
            .then(networkResponse => networkResponse.json())
            .then((restaurants) => {
                if (restaurants) {
                    restaurants = restaurants.map(restaurant => {
                        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-fetchRestaurants()-1-1-restaurant');
                        return new Promise((resolve, reject) => {
                            DBHelper.appendRestaurantProperties(restaurant, (error, result) => {
                                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-fetchRestaurants()-1-2-restaurant');
                                DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchRestaurants()-1-2-error');
                                DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchRestaurants()-1-2-result');
                                if (error) resolve(restaurant);
                                resolve(result);
                            });
                        })
                            .then((restaurant) => {
                                return restaurant;
                            });
                    });
                }

                callback(null, restaurants);
                return;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchRestaurants()`);
                callback(error.message, null);
                return;
            });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        if (debug) console.log('dbhelper-fetchRestaurantById()');
        // fetch all restaurants with proper error handling.
        let requestURL = DBHelper.DATABASE_URL_RESTAURANTS + '/' + id;
        if (debug) console.log('dbhelper-fetchRestaurantById()-1-1-requestURL=' + (requestURL));

        return fetch(requestURL, {
            headers: {'Content-Type': 'application/json'}
        })
            .then(networkResponse => networkResponse.json())
            .then((restaurant) => {
                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-fetchRestaurantById()-2-1-restaurant');

                return new Promise((resolve, reject) => {
                    DBHelper.appendRestaurantProperties(restaurant, (error, result) => {
                        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-fetchRestaurantById()-2-2-appendRestaurantProperties()-restaurant');
                        DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchRestaurantById()-2-2-appendRestaurantProperties()-error');
                        DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchRestaurantById()-2-2-appendRestaurantProperties()-result');
                        if (error) resolve(restaurant);
                        resolve(result);
                    });
                })
                    .then((restaurant) => {
                        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-fetchRestaurantById()-2-3-restaurant');
                        callback(null, restaurant);
                        return;
                    });
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchRestaurantById()`);
                callback(error.message, null);
                return;
            });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        //console.log('dbhelper-fetchRestaurantByCuisine()');
        // Fetch all restaurants  with proper error handling
        return new Promise((resolve, reject) => {
            DBHelper
                .getAllRestaurants((error, result) => {
                    if (error) reject(false);
                    resolve(result); // resolve to restaurant object with valid restaurant.id value
                });
        })
            .then((restaurants) => {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchRestaurantByCuisine()`);
                console.log(error.message);
                callback(error, null);
            });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        //console.log('dbhelper-fetchRestaurantByNeighborhood()');

        // Fetch all restaurants  with proper error handling
        return new Promise((resolve, reject) => {
            DBHelper
                .getAllRestaurants((error, result) => {
                    if (error) reject(false);
                    resolve(result); // resolve to restaurant object with valid restaurant.id value
                });
        })
            .then((restaurants) => {
                // Filter restaurants to have only given neighborhood type
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchRestaurantByNeighborhood()`);
                console.log(error.message);
                callback(error, null);
            });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        //console.log('dbhelper-fetchRestaurantByCuisineAndNeighborhood()');

        // Fetch all restaurants  with proper error handling
        return new Promise((resolve, reject) => {
            DBHelper
                .getAllRestaurants((error, result) => {
                    if (error) reject(error);
                    resolve(result); // resolve to restaurant object with valid restaurant.id value
                });
        })
            .then((restaurants) => {
                // Filter restaurants to have only given cuisine type or neighborhood type
                let results = restaurants;

                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchRestaurantByCuisineAndNeighborhood()`);
                console.log(error.message);
                callback(error, null);
            });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        //console.log('dbhelper-fetchNeighborhoods()');

        // Fetch all restaurants  with proper error handling
        return new Promise((resolve, reject) => {
            DBHelper
                .getAllRestaurants((error, result) => {
                    if (error) reject(false);
                    resolve(result); // resolve to restaurant object with valid restaurant.id value
                });
        })
            .then((restaurants) => {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
                callback(null, uniqueNeighborhoods);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchNeighborhoods()`);
                console.log(error.message);
                callback(error, null);
            });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        //console.log('dbhelper-fetchCuisines()');

        // Fetch all restaurants  with proper error handling
        return new Promise((resolve, reject) => {
            DBHelper
                .getAllRestaurants((error, result) => {
                    if (error) reject(false);
                    resolve(result); // resolve to restaurant object with valid restaurant.id value
                });
        })
            .then((restaurants) => {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
                callback(null, uniqueCuisines);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchCuisines()`);
                console.log(error.message);
                callback(error, null);
            });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        //console.log('dbhelper-urlForRestaurant()-restaurant.id=' + (restaurant.id));
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        //console.log('dbhelper-imageUrlForRestaurant()');
        if (restaurant.photograph) {
            return (`img/${restaurant.photograph}.jpg`);
        }
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        //console.log('dbhelper-mapMarkerForRestaurant()');
        const marker = new google.maps.Marker({
                position: restaurant.latlng,
                title: restaurant.name,
                url: DBHelper.urlForRestaurant(restaurant),
                map: map,
                animation: google.maps.Animation.DROP
            }
        );
        return marker;
    }

    /**
     * get all Db .
     */
    static isIndexDbPopulated() {
        if (debug) console.log('dbhelper-isIndexDbPopulated()');

        return dbPromise
            .then(db => {
                const txRestaurants = db.transaction('restaurants', 'readonly');
                const restaurantsStore = txRestaurants.objectStore('restaurants');
                return restaurantsStore.getKey(1);
            })
            .then((restaurant) => {
                return (typeof restaurant !== 'undefined' && restaurant);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-isIndexDbPopulated()`);
                console.log(error.message);
                return false;
            });
    }


    /**
     * get all Db .
     */
    static getAllIndexDbRestaurants(callback) {
        if (debug) console.log('dbhelper-getAllIndexDbRestaurants()');

        dbPromise
            .then((db) => {
                const txRestaurants = db.transaction('restaurants', 'readonly');
                const restaurantsStore = txRestaurants.objectStore('restaurants');
                const restaurants = restaurantsStore.getAllKeys();
                if (restaurants && restaurants.length > 0) {
                    return restaurants.map((restaurant) => {
                        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getAllIndexDbRestaurants()-1-1-restaurant');
                        restaurant = new Promise((resolve, reject) => {
                            DBHelper.getIndexDbRestaurantById(restaurant.restaurant_id, (error, result) => {
                                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getAllIndexDbRestaurants()-1-2-getIndexDbRestaurantById()-restaurant');
                                DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllIndexDbRestaurants()-1-2-getIndexDbRestaurantById()-error');
                                DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllIndexDbRestaurants()-1-2-getIndexDbRestaurantById()-result');
                                if (error) resolve(restaurant);
                                resolve(result);
                            });
                        });
                        return restaurant;
                    })
                        .then((restaurants) => {
                            callback(null, restaurants);
                            return;
                        });
                }
                else {
                    callback('No results', null);
                    return;
                }
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getAllIndexDbRestaurants()-catch`);
                console.log(error.message);
                callback(error, null);
            });
    }


    /**
     * Fetch review by ID.
     */
    static getIndexDbRestaurantById(restaurant_id, callback) {

        if (debug) console.log('dbhelper-getIndexDbRestaurantById()-input-restaurant_id=' + (restaurant_id));

        if (!restaurant_id) {
            const error_message = (`Missing restaurant id - dbhelper-getIndexDbRestaurantById()`);
            callback(error_message, null);
            return;
        }

        return dbPromise
            .then((db) => {

                const txRestaurants = db.transaction('restaurants', 'readonly');
                let restaurantsStore = txRestaurants.objectStore('restaurants');

                return restaurantsStore
                    .get(parseInt(restaurant_id))
                    .then((restaurant) => {
                        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getIndexDbRestaurantById()-1-2-restaurantsStore.get()');
                        return restaurant;
                    });
            })
            .then((restaurantRow) => {
                if (!restaurantRow) {
                    const error_message = (`No restaurant info found in idb - dbhelper-getIndexDbRestaurantById()-second`);
                    callback(error_message, null);
                    return;
                }
                DBHelper.debugRestaurantInfo(restaurantRow, 'dbhelper-getIndexDbRestaurantById()-1-2-restaurantRow');

                // set default properites
                let restaurant = {};
                restaurant.restaurant_id = restaurantRow.restaurant_id;
                restaurant.name = restaurantRow.name;
                restaurant.address = restaurantRow.address;
                restaurant.photograph = restaurantRow.photograph;
                restaurant.neighborhood = restaurantRow.neighborhood;
                restaurant.cuisine_type = restaurantRow.cuisine_type;
                restaurant.is_favorite = restaurantRow.is_favorite;
                restaurant.lat = (restaurantRow.lat ? restaurantRow.lat : '');
                restaurant.lng = (restaurantRow.lng ? restaurantRow.lng : '');
                restaurant.createdAt = restaurantRow.createdAt;
                restaurant.updatedAt = restaurantRow.updatedAt;

                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getIndexDbRestaurantById()-1-2-restaurant');

                return restaurant;
            })
            .then((restaurant) => {
                return new Promise((resolve, reject) => {
                    DBHelper.appendRestaurantProperties(restaurant, (error, result) => {
                        if (debug) console.log('dbhelper-appendPropertiesForFetchRestaurant()-error=' + (error));
                        if (debug) console.log('dbhelper-appendPropertiesForFetchRestaurant()-result=' + (result));
                        if (error) resolve(restaurant);
                        resolve(result);
                    });
                })
                    .then((restaurant) => {

                        if (!restaurant) return restaurant;

                        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getIndexDbRestaurantById()-4-restaurant');

                        return restaurant;
                    });
            })
            .then((restaurant) => {
                if (!restaurant) {
                    const error_message = (`No restaurant info found in idb - dbhelper-getIndexDbRestaurantById()-fifth`);
                    callback(error_message, null);
                    return;
                }

                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getIndexDbRestaurantById()-5-restaurant');

                callback(null, restaurant);
                return;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getIndexDbRestaurantById()-catch`);
                console.log(error.message);
                callback(error, null);
                return;
            });
    }


    /**
     * update a restaurant by its ID.
     */
    static addUpdateRestaurantById(restaurant, callback) {
        if (debug) console.log('dbhelper-addUpdateRestaurantById()');

        let local_error = null;
        let cache_error = null;
        let remote_error = null;

        dbPromise.then(() => {
            DBHelper.addUpdateLocalRestaurantById(restaurant, (error, result) => {
                local_error = error;
            });
        }).then(() => {
            DBHelper.addUpdateCacheRestaurantById(restaurant, (error, result) => {
                cache_error = error;
            });
        }).then(() => {
            DBHelper.addUpdateRemoteRestaurantById(restaurant, (error, result) => {
                remote_error = error;
            });
        }).then(() => {
            if (debug) console.log('local_error=' + (local_error));
            if (debug) console.log('cache_error=' + (cache_error));
            if (debug) console.log('remote_error=' + (remote_error));

            if (local_error || cache_error || remote_error) {

                if (debug) console.log('error');
                callback(local_error || cache_error || remote_error, null);
                return;
            }
            callback(null, restaurant);
            return;
        });
    }

    /**
     * update a restaurant by its ID.
     */
    static addUpdateLocalRestaurantById(restaurant, callback) {
        if (debug) console.log('dbhelper-addUpdateLocalRestaurantById()');

        return dbPromise
            .then(db => {
                if (debug) console.log('restaurant-restaurant-start');
                const txRestaurants = db.transaction('restaurants', 'readwrite');
                let restaurantsStore = txRestaurants.objectStore('restaurants');

                return restaurantsStore
                    .get(restaurant.restaurant_id)
                    .then((item) => {
                        let restaurantObj = {
                            restaurant_id: restaurant.restaurant_id,
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
                        };
                        if (!item) {
                            restaurantsStore.add(restaurantObj);
                        }
                        else {
                            restaurantsStore.put(restaurantObj);
                        }
                        txRestaurants.complete;
                    })
                    .then(() => {
                        callback(null, true);
                        return;
                    });
            })
            .catch(error => {
                callback('Error', null);
                return;
            });
    }

    /**
     * update a restaurant by its ID.
     */
    static addUpdateCacheRestaurantById(restaurant_id, callback) {
        if (debug) console.log('dbhelper-addUpdateCacheRestaurantById()');
        if (debug) console.log('dbhelper-addUpdateCacheRestaurantById()-restaurant_id=' + (restaurant_id));

        if (debug) console.log('dbhelper-addUpdateCacheRestaurantById()-Update cache by deleting and then adding cache');
        return caches
            .open(staticCacheName)
            .then(function (cache) {
                if (debug) console.log('dbhelper-addUpdateCacheRestaurantById()-Deleting index file cache');
                return cache
                    .delete(new Request('/'))
                    .delete(new Request('/restaurant.html?id=' + restaurant_id));
            }).then(function () {
                if (debug) console.log('dbhelper-addUpdateCacheRestaurantById()-Adding index file cache');
                return fetch(new Request('/'))
                    .then(function () {
                        if (debug) console.log('dbhelper-addUpdateCacheRestaurantById()-Adding restaurant file cache');
                        return fetch(new Request('/restaurant.html?id=' + restaurant_id));
                    });
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message}`);
                callback(error, null);
            });
    }

    /**
     * update a restaurant by its ID.
     */
    static addUpdateRemoteRestaurantById(restaurant, callback) {

        if (debug) console.log('dbhelper-addUpdateRemoteRestaurantById()');

        let requestURL = DBHelper.DATABASE_URL_RESTAURANTS + '/' + restaurant.restaurant_id;
        if (debug) console.log('requestURL=' + (requestURL));

        const requestMethod = 'PUT';
        const requestBody = JSON.stringify(restaurant);
        const requestHeaders = {
            'Content-Type': 'application/json'
        };

        return fetch(requestURL, {
            method: requestMethod, body: requestBody, headers: requestHeaders
        })
            .catch(error => {

                if (!navigator.onLine) {

                    return dbPromise.then(function (db) {

                        if (debug) console.log('restaurant-pending-start');
                        const txPending = db.transaction('pending', 'readwrite');
                        let pendingStore = txPending.objectStore('pending');

                        const pending = {
                            id: Date.now(),
                            url: requestURL,
                            method: requestMethod,
                            body: requestBody,
                            headers: requestHeaders
                        };
                        DBHelper.debugRestaurantInfo(pending, 'dbhelper-addUpdateRemoteRestaurantById()-1-pending');

                        pendingStore.put(pending);
                        txPending.complete;
                        return true;
                    }).then(result => {
                        callback(null, result);
                    });
                }
                else {

                    // Oops!. Got an error from server.
                    error.message = (`Request failed. Returned status of ${error.message}`);
                    callback(error, null);
                }
            });
    }


    /**
     * Fetch all reviews.
     */
    static fetchReviewsByRestaurantId(restaurant_id, callback) {

        if (debug) console.log('dbhelper-fetchReviewsByRestaurantId()');
        if (debug) console.log('dbhelper-fetchReviewsByRestaurantId()-restaurant_id=' + (restaurant_id));

        const review_url = DBHelper.DATABASE_URL_REVIEWS + '?restaurant_id=' + restaurant_id;
        if (debug) console.log('dbhelper-fetchReviewsByRestaurantId()-review_url=' + (review_url));

        return fetch(review_url)
            .then(response => response.json())
            .then((reviews) => {
                DBHelper.debugRestaurantInfo(reviews, 'dbhelper-fetchReviewsByRestaurantId()-1-reviews');
                return reviews.map(review => {
                    return new Promise((resolve, reject) => {
                        // add or update review in cache
                        if (debug) console.log('dbhelper-fetchReviewsByRestaurantId().addUpdateLocalReviewById()-call');
                        DBHelper.addUpdateLocalReviewById(review, (error, result) => {
                            DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchReviewsByRestaurantId()-2-addUpdateLocalReviewById()-error');
                            DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchReviewsByRestaurantId()-2-addUpdateLocalReviewById()-result');
                            resolve(true);
                        });
                    })
                        .then(() => {
                            new Promise((resolve, reject) => {

                                if (debug) console.log('dbhelper-fetchReviewsByRestaurantId().addUpdateCacheReviewById()-call');
                                DBHelper.addUpdateCacheReviewById(review, (error, result) => {
                                    DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchReviewsByRestaurantId()-3-addUpdateCacheReviewById()-error');
                                    DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchReviewsByRestaurantId()-3-addUpdateCacheReviewById()-result');
                                    resolve(true);
                                });
                            })
                        })
                        .then(review, () => {
                            return review;
                        });
                });
            })
            .then((reviews) => {
                DBHelper.debugRestaurantInfo(reviews, 'dbhelper-fetchReviewsByRestaurantId()-4-reviews');
                callback(null, reviews);
                return;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchReviewsByRestaurantId()`);
                console.log(error.message);
                callback(error, null);
            });
    }


    /**
     * get all restaurants.
     */
    static getAllRestaurants(callback) {

        if (debug) console.log('dbhelper-getAllRestaurants()');

        if (debug) console.log('dbhelper-getAllRestaurants()-1-this.restaurants =' + (this.restaurants));

        return new Promise((resolve, reject) => {
            DBHelper.debugRestaurantInfo(this.restaurants, 'dbhelper-getAllRestaurants()-1-this.restaurants');
            if (!this.restaurants) {
                DBHelper
                    .getAllIndexDbRestaurants((error, result) => {
                        if (error) resolve(false);
                        resolve(result);
                    });
            }
            else resolve(this.restaurants);
        })
            .then((restaurants) => {
                DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-getAllRestaurants()-2-restaurants');
                if (!restaurants) {
                    return new Promise((resolve, reject) => {
                        DBHelper
                            .fetchRestaurants((error, result) => {
                                DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllRestaurants()-2-sub-fetchRestaurants()-error');
                                DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllRestaurants()-2-sub-fetchRestaurants()-result');
                                if (error) resolve(false);
                                resolve(result);
                            });
                    });
                }
                else return restaurants;
            })
            .then((restaurants) => {
                DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-getAllRestaurants()-3-restaurants');
                if (restaurants)
                {
                    return restaurants.map(restaurant => {
                        return new Promise((resolve, reject) => {
                            if (debug) console.log('dbhelper-getAllRestaurants()-3-appendRestaurantProperties()-call');
                            DBHelper
                                .appendRestaurantProperties(restaurant, (error, result) => {
                                    DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllRestaurants()-3-sub-appendRestaurantProperties()-error');
                                    DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllRestaurants()-3-sub-appendRestaurantProperties()-result');
                                    if (error) resolve(restaurant);
                                    resolve(result);
                                });
                        });
                    });
                }
                else restaurants;
            })
            .then((restaurants) => {
                DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-getAllRestaurants()-4-restaurants');
                if (restaurants)
                {
                    // update data
                    this.restaurants = restaurants;
                }

                callback(null, this.restaurants);
                return;

            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getAllRestaurants`);
                callback(error.message, null);
                return;
            });
    }

    /**
     * get restaurant by ID.
     */
    static getRestaurantById(restaurant_id, callback) {

        if (debug) console.log('dbhelper-getRestaurantById()');
        if (debug) console.log('dbhelper-getRestaurantById()-input-restaurant_id=' + (restaurant_id));

        let restaurant;

        if (this.restaurant && this.restaurant.restaurant_id === restaurant_id) {
            restaurant = this.restaurant;
            DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-1-restaurant');
        }

        if (!restaurant && this.restaurants) {
            restaurant = this.restaurants.filter(r => r.id == restaurant_id);
            DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-2-restaurant');

            if (restaurant) this.restaurant = restaurant;
        }

        return new Promise((resolve, reject) => {
            resolve(true);
        })
            .then(() => {
            if (!restaurant) {
                return new Promise((resolve, reject) => {
                    if (debug) console.log('dbhelper-getRestaurantById()-2-getIndexDbRestaurantById() call');
                    DBHelper
                        .getIndexDbRestaurantById(restaurant_id, (error, result) => {
                            DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantById()-2-sub-getIndexDbRestaurantById()-error');
                            DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantById()-2-sub-getIndexDbRestaurantById()-result');
                            if (error) resolve(false);

                            if (result) this.restaurant = result;
                            resolve(result);
                        });
                });
            }
            else return restaurant;
        })
            .then((restaurant) => {
                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-3-restaurant');
                if (!restaurant) {
                    return new Promise((resolve, reject) => {
                        if (debug) console.log('dbhelper-getRestaurantById()-3-2-fetchRestaurantById()-call');
                        DBHelper
                            .fetchRestaurantById(restaurant_id, (error, result) => {
                                DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantById()-3-sub-fetchRestaurantById()-error');
                                DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantById()-3-sub-fetchRestaurantById()-result');
                                if (error) reject(error);
                                resolve(result);
                            })
                    })
                        .then((restaurant) => {
                            if (restaurant) this.restaurant = restaurant;

                            // DBHelper.addUpdateLocalRestaurantById(restaurant, (error, result) => {
                            //     // both return restaurant
                            //     // (error) reject(restaurant);
                            //     //resolve(restaurant);
                            // });

                            DBHelper.addUpdateCacheRestaurantById(restaurant, (error, result) => {
                                // both return restaurant
                                //if (error) reject(restaurant);
                                //resolve(restaurant);
                            });

                            return restaurant;
                        })
                        .catch(error => {
                            // Oops!. Got an error from server.
                            error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getRestaurantById()-fetchRestaurantById()`);
                            callback(error.message, null);
                            return;
                        });
                }
                else return restaurant;
            })
            .then((restaurant) => {
                // set/update current restaurant to this.restaurant variable
                this.restaurant = restaurant;
                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-4-restaurant');

                return restaurant;
            })
            .then((restaurants) => {
                return restaurants.map(restaurant => {
                    return new Promise((resolve, reject) => {
                        if (debug) console.log('dbhelper-getRestaurantById()-5-appendRestaurantProperties()-call');
                        DBHelper
                            .appendRestaurantProperties(restaurant, (error, result) => {
                                DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantById()-5-sub-appendRestaurantProperties()-error');
                                DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantById()-5-sub-appendRestaurantProperties()-result');
                                if (error) resolve(restaurant);
                                resolve(result);
                            });
                    });
                });
            })
            .then((restaurant) => {
                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-6-restaurant');
                callback(null, restaurant);
                return;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getRestaurantById()`);
                callback(error.message, null);
                return;
            });
    }

    static appendRestaurantProperties(restaurant, callback) {

        if (debug) console.log('dbhelper-appendRestaurantProperties()');

        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-1-restaurant');

        return new Promise((resolve, reject) => {
            resolve(true);
        })
            .then(restaurant, () => {
                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-2-restaurant');
                return new Promise((resolve, reject) => {

                    // add missing properties in fetch response
                    if (!restaurant.id) restaurant.id = restaurant.restaurant_id;
                    if (!restaurant.restaurant_id) restaurant.restaurant_id = (restaurant.id ? restaurant.id : '');
                    if (!restaurant.latlng) restaurant.latlng = {};
                    if (!restaurant.latlng.lat) restaurant.latlng.lat = (restaurant.lat ? restaurant.lat : '');
                    if (!restaurant.latlng.lng) restaurant.latlng.lng = (restaurant.lng ? restaurant.lng : '');
                    if (!restaurant.lat) restaurant.lat = (restaurant.latlng.lat);
                    if (!restaurant.lng) restaurant.lng = (restaurant.latlng.lng);
                    if (!restaurant.operating_hours) restaurant.operating_hours = {};
                    if (!restaurant.reviews) restaurant.reviews = {};

                    resolve(restaurant);
                })
                    .then((restaurant) => {
                        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-2-2-restaurant');
                        return restaurant;
                    });
            })
            .then((restaurant) => {
                return new Promise((resolve, reject) => {
                    if (debug) console.log('dbhelper-appendRestaurantProperties()-3-getRestaurantOperatingHours()-call');
                    DBHelper
                        .getRestaurantOperatingHours(restaurant, (error, result) => {
                            DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-3-2-restaurant');
                            if (error) resolve(false);
                            resolve(result);
                        });
                })
                    .then(restaurant, (result) => {
                        if (result) {
                            restaurant.operating_hours = result.operating_hours;
                        }
                        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-4-restaurant');
                        return restaurant;
                    });
            })
            .then((restaurant) => {
                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-5-1');
                return new Promise((resolve, reject) => {
                    DBHelper
                        .getRestaurantReviews(restaurant, (error, result) => {
                            DBHelper.debugRestaurantInfo(error, 'dbhelper-appendRestaurantProperties()-5-sub-getRestaurantReviews()-error');
                            DBHelper.debugRestaurantInfo(result, 'dbhelper-appendRestaurantProperties()-5-sub-getRestaurantReviews()-result');
                            if (error) resolve(false);
                            resolve(result);
                        });
                })
                    .then(restaurant, (result) => {
                        if (result) {
                            restaurant.reviews = result.reviews;
                        }
                        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-4-restaurant');
                        return restaurant;
                    });
            })
    }

    static getRestaurantOperatingHours(restaurant, callback) {

        if (debug) console.log('dbhelper-getRestaurantOperatingHours()');
        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantOperatingHours()-1-restaurant');

        return new Promise((resolve, reject) => {
            if (debug) console.log('dbhelper-getRestaurantOperatingHours()-2-getIndexDbOperatingHoursByRestaurantId()-call');
            DBHelper
                .getIndexDbOperatingHoursByRestaurantId(restaurant.restaurant_id, (error, result) => {
                    DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantOperatingHours()-2-sub-getIndexDbOperatingHoursByRestaurantId()-error');
                    DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantOperatingHours()-2-sub-getIndexDbOperatingHoursByRestaurantId()-result');
                    if (error) resolve(restaurant);
                    resolve(result);
                })
        })
            .then(restaurant, (operating_hours) => {
                DBHelper.debugRestaurantInfo(operating_hours, 'dbhelper-getRestaurantOperatingHours()-2-operating_hours');

                if (operating_hours) {
                    if (operating_hours.hasOwnProperty('day')) {
                        restaurant.operating_hours = operating_hours;
                    }
                }
                return restaurant;
            })
            .then((restaurant) => {
                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantOperatingHours()-3-restaurant');

                callback(null, restaurant);
                return;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                const error_message = (`Request failed. Returned status of ${error.message} - dbhelper-getRestaurantOperatingHours()`);
                callback(error_message, null);
                return;
            });
    }

    static getRestaurantReviews(restaurant, callback) {

        if (debug) console.log('dbhelper-getRestaurantReviews()');
        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantReviews()-1-restaurant');

        return new Promise((resolve, reject) => {
            if (debug) console.log('dbhelper-getRestaurantReviews()-third-getReviewsByRestaurantId()-call');
            DBHelper.getReviewsByRestaurantId(restaurant.restaurant_id, (error, result) => {
                DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantReviews()-2-getReviewsByRestaurantId()-error');
                DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantReviews()-2-getReviewsByRestaurantId()-result');
                if (error) resolve({});
                resolve(result);
            });
        })
            .then(restaurant, (reviews) => {
                if (reviews) {
                    restaurant.reviews = reviews;
                }
                return restaurant;
            })
            .then((restaurant) => {
                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantReviews()-3-restaurant');
                callback(null, restaurant);
                return;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                const error_message = (`Request failed. Returned status of ${error.message} - dbhelper-getRestaurantReviews()`);
                callback(error_message, null);
                return;
            });
    }


    /**
     * get all reviews.
     */
    static getAllReviews(callback) {
        if (debug) console.log('dbhelper-getAllReviews()');

        return new Promise((resolve, reject) => {
            resolve(true);
        })
            .then(() => {
                DBHelper.debugRestaurantInfo(this.reviews, 'dbhelper-getAllReviews()-1-this.reviews');
                if ( ! this.reviews) {
                    return new Promise((resolve, reject) => {
                        DBHelper.getAllIndexDbReviews((error, results) => {
                            DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllReviews()-2-error');
                            DBHelper.debugRestaurantInfo(results, 'dbhelper-getAllReviews()-2-results');
                            if (error) resolve(false);
                            resolve(results);
                        });
                    });
                }
                else return this.reviews;
            })
            .then((reviews) => {
                if (!reviews) {
                    return new Promise((resolve, reject) => {
                        DBHelper.fetchAllReviews((error, results) => {
                            DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllReviews()-3-error');
                            DBHelper.debugRestaurantInfo(results, 'dbhelper-getAllReviews()-3-results');
                            if (error) resolve(false);
                            resolve(results);
                        });
                    });
                }
                else return reviews;
            })
            .then((reviews) => {
                DBHelper.debugRestaurantInfo(reviews, 'dbhelper-getAllReviews()-4-reviews');

                // updated global object
                this.reviews = reviews;

                callback(null, this.reviews);
                return;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message}`);
                callback(error.message, null);
                return;
            });
    }

    /**
     * Fetch review by ID.
     */
    static getReviewsByRestaurantId(restaurant_id, callback) {

        if (debug) console.log('dbhelper-getReviewsByRestaurantId()');
        if (debug) console.log('restaurant_id=' + (restaurant_id));

        return new Promise((resolve, reject) => {
            resolve(true);
        }).then(() => {
            DBHelper.debugRestaurantInfo(this.reviews, 'dbhelper-getReviewsByRestaurantId()-1-this.reviews');
            if (!this.reviews) {
                return new Promise((resolve, reject) => {
                    DBHelper
                        .getAllReviews((error, result) => {
                            DBHelper.debugRestaurantInfo(error, 'dbhelper-getReviewsByRestaurantId()-2-getAllReviews()-error');
                            DBHelper.debugRestaurantInfo(result, 'dbhelper-getReviewsByRestaurantId()-2-getAllReviews()-result');
                            if (error) resolve({});
                            resolve(result);
                        });
                })
            }
            else return this.reviews;
        })
            .then((reviews) => {
                DBHelper.debugRestaurantInfo(reviews, 'dbhelper-getReviewsByRestaurantId()-3-reviews');
                if (reviews)
                {
                    // updated global variable
                    this.reviews = reviews;

                    const restaurant_reviews = reviews.filter(r => r.restaurant_id == restaurant_id);
                    DBHelper.debugRestaurantInfo(restaurant_reviews, 'dbhelper-getReviewsByRestaurantId()-4-restaurant_reviews');

                    callback(null, restaurant_reviews);
                    return;
                }
                else
                {
                    callback('No reviews for this restaurant', null);
                    return;
                }
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getReviewsByRestaurantId()`);
                callback(error.message, null);
                return;
            });
    }

    static getIndexDbOperatingHoursByRestaurantId(restaurant_id, callback) {
        if (debug) console.log('dbhelper-getIndexDbOperatingHoursByRestaurantId()');

        dbPromise.then(db => {
            const txOperatingHours = db.transaction('operating_hours', 'readonly');
            const operatingHoursStore = txOperatingHours.objectStore('operating_hours');

            return operatingHoursStore.get(restaurant_id);
        })
            .then((operating_hours) => {
                DBHelper.debugRestaurantInfo(operating_hours, 'dbhelper-getIndexDbOperatingHoursByRestaurantId()-1-operating_hours');
                callback(null, operating_hours);
                return;
            });
    }

    /**
     * get db all reviews.
     */
    static getAllIndexDbReviews(callback) {
        if (debug) console.log('dbhelper-getAllIndexDbReviews()');

        dbPromise.then(function (db) {
            const txReviews = db.transaction('reviews', 'readonly');
            let reviewsStore = txReviews.objectStore('reviews');
            const reviews = reviewsStore.getAll();
            DBHelper.debugRestaurantInfo(reviews, 'dbhelper-getAllIndexDbReviews()-1-reviews');

            callback(null, reviews);
        });
    }

    /**
     * Fetch all reviews
     */
    static fetchAllReviews(callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-fetchAllReviews()');
        // fetch all review with proper error handling.

        let requestURL = DBHelper.DATABASE_URL_REVIEWS;
        if (debug) console.log('requestURL=' + (requestURL));

        return fetch(requestURL)
            .then(response => {
                const reviews = response.json();

                DBHelper.debugRestaurantInfo(reviews, 'dbhelper-fetchAllReviews()-1-reviews');

                if (reviews) {
                    return reviews.map(review => {
                        return new Promise((resolve, reject) => {
                            // add or update review in cache
                            if (debug) console.log('dbhelper-fetchAllReviews()-2-addUpdateLocalReviewById()-call');
                            DBHelper.addUpdateLocalReviewById(review, (error, result) => {
                                DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchAllReviews()-2-addUpdateLocalReviewById()-error');
                                DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchAllReviews()-2-addUpdateLocalReviewById()-result');
                                resolve(true);
                            });
                        })
                            .then(() => {
                                return new Promise((resolve, reject) => {
                                    // add or update review in cache
                                    if (debug) console.log('dbhelper-fetchAllReviews()-3-addUpdateCacheReviewById()-call');
                                    DBHelper.addUpdateCacheReviewById(review, (error, result) => {
                                        DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchAllReviews()-2-addUpdateLocalReviewById()-error');
                                        DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchAllReviews()-2-addUpdateLocalReviewById()-result');
                                        resolve(true);
                                    });
                                })
                            })
                            .then(review, () => {
                                return review;
                            });
                    });
                }
                else return reviews;
            })
            .then((reviews) => {
                DBHelper.debugRestaurantInfo(reviews, 'dbhelper-fetchAllReviews()-3-reviews');
                callback(null, reviews);
                return;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed-1. Returned status of ${error.message}`);
                callback(error.message, null);
                return;
            });
    }


    /**
     * update a review by its ID.
     */
    static addUpdateReviewById(review, callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-addUpdateReviewById()');

        // if (debug && review) {
        //     for (const indx in review) {
        //         if (debug) console.log('review[' + indx + ']=' + (review[indx]));
        //     }
        // }

        let local_error = null;
        let cache_error = null;
        let remote_error = null;

        let idMax = review.review_id;
        if (debug) console.log('calling-DBHelper.addUpdateLocalReviewById()');
        DBHelper.addUpdateLocalReviewById(review, (error, result) => {
            if (debug) console.log('error=' + (error));
            if (debug) console.log('result=' + (result));
            local_error = error;
        });

        if (debug) console.log('calling-DBHelper.addUpdateCacheReviewById()');
        DBHelper.addUpdateCacheReviewById(review, (error, result) => {
            if (debug) console.log('error=' + (error));
            if (debug) console.log('result=' + (result));
            cache_error = error;
        });

        if (debug) console.log('calling-DBHelper.addUpdateRemoteReviewById()');
        DBHelper.addUpdateRemoteReviewById(review, (error, result) => {
            if (debug) console.log('error=' + (error));
            if (debug) console.log('result=' + (result));
            remote_error = error;
        });

        const myPromise = new Promise((resolve, reject) => {
            if (debug) console.log('local_error=' + (local_error));
            if (debug) console.log('cache_error=' + (cache_error));
            if (debug) console.log('remote_error=' + (remote_error));

            if (local_error || cache_error || remote_error) {

                if (debug) console.log('error');
                callback(local_error || cache_error || remote_error, null);
                return;
            }
            callback(null, true);
            return;
        });
    }

    /**
     * update a review by its ID.
     */
    static addUpdateLocalReviewById(review, callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-addUpdateLocalReviewById()');

        return dbPromise.then(function (db) {
            if (debug) console.log('review-start');
            const txReview = db.transaction('reviews', 'readwrite');
            if (debug) console.log('txReview=' + (txReview));
            let reviewStore = txReview.objectStore('reviews');

            const idIndex = reviewStore.index('review_id');
            if (debug) console.log('idIndex=' + (idIndex));

            return idIndex.getAllKeys().then(keys => {
                let idMax = 0;
                keys.forEach(key => {
                    if (debug) console.log('key=' + key);
                    idMax = key;
                });

                // increment last key value by 1
                idMax++;
                if (debug) console.log('idMax++=' + (idMax));

                return idMax;
            }).then(idMax => {
                if (debug) {
                    if (debug) console.log('idMax.then()=' + (idMax));
                    for (const key in review) {
                        if (debug) console.log(key + '=' + review[key]);
                    }
                }
                review.review_id = idMax;
                if (debug) {
                    if (debug) console.log('updated review.review_id' + (idMax));
                    for (const key in review) {
                        if (debug) console.log(key + '=' + review[key]);
                    }
                }

                return reviewStore
                    .get(review.review_id)
                    .then((review, item) => {
                        const rtNewItem = {
                            review_id: parseInt((item ? item.review_id : idMax)),
                            restaurant_id: parseInt(review.restaurant_id),
                            name: review.name,
                            rating: parseInt(review.rating),
                            comments: review.comments,
                            updatedAt: review.updatedAt,
                            createdAt: review.createdAt
                        };
                        if (!item) {
                            if (debug) console.log('add review item');
                            reviewStore.add(rtNewItem);
                        }
                        else {
                            if (debug) console.log('update review item');
                            reviewStore.put(rtNewItem);
                        }
                        txReview.complete;
                        if (debug) console.log('review item added/updated');

                        if (debug) console.log('tx complete - callback');
                        callback(null, true);
                        return;
                    })
                    .catch(error => {
                        // Oops!. Got an error from server.
                        error.message = (`Request failed. Returned status of ${error.message}`);
                        callback(error, null);
                    });
            });
        });
    }

    /**
     * update a review by its ID.
     */
    static addUpdateCacheReviewById(review, callback) {

        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-addUpdateCacheReviewById()');

        if (debug) console.log('Update cache by deleting and then adding cache');
        return caches.open(staticCacheName).then(function (cache) {
            if (debug) console.log('Deleting index file cache');
            return cache.delete(new Request('/restaurant.html?id=' + review.restaurant_id));
        })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message}`);
                callback(error, null);
            });
    }

    /**
     * update a review by its ID.
     */
    static addUpdateRemoteReviewById(review, callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-addUpdateRemoteReviewById()');

        // if (debug && review) {
        //     for (const indx in review) {
        //         if (debug) console.log('review[' + indx + ']=' + (review[indx]));
        //     }
        // }

        let requestURL = DBHelper.DATABASE_URL_REVIEWS;
        if (debug) console.log('requestURL=' + (requestURL));

        // add remove id name as well
        const review_id = review.review_id;
        delete review.review_id;
        review.id = review_id;
        if (debug) console.log('review.id.length=' + (review.id.length));
        if (review.id.length > 0) {
            requestURL += '/' + review.id;
            if (debug) console.log('requestURL=' + (requestURL));
        }

        const requestMethod = 'POST';
        const requestBody = JSON.stringify(review);
        const requestHeaders = {
            'Content-Type': 'application/json'
        };

        return fetch(requestURL, {
            method: requestMethod, body: requestBody, headers: requestHeaders
        })
            .then(result => {
                if (debug) console.log('result=' + (result));
                if (debug) console.log('fetch-navigator.onLine=' + (navigator.onLine));
                if (!navigator.onLine) {

                    return dbPromise.then(function (db) {

                        if (debug) console.log('review-pending-start');
                        const txPending = db.transaction('pending', 'readwrite');
                        let pendingStore = txPending.objectStore('pending');

                        pendingStore.then(() => {
                            const pending = {
                                id: Date.now(),
                                url: requestURL,
                                method: requestMethod,
                                body: requestBody,
                                headers: requestHeaders
                            };
                            pendingStore.put(pending);
                            txPending.complete;
                        });
                    });
                }
            })
            .catch(error => {
                if (debug) console.log('catch-navigator.onLine=' + (navigator.onLine));
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message}`);
                callback(error, null);
            });
    }

    // example copied from
    // https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
    static formattedUnixTime(unix_timestamp) {
        const date_now = new Date();
        // Create a new JavaScript Date object based on the timestamp
        // multiplied by 1000 so that the argument is in milliseconds, not seconds.
        const date = new Date(unix_timestamp * 1000);
        let year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        if (year > date_now.getFullYear()) {
            year = date_now.getFullYear();
        }

        // Hours part from the timestamp
        const hours = date.getHours();
        // Minutes part from the timestamp
        const minutes = "0" + date.getMinutes();
        // Seconds part from the timestamp
        const seconds = "0" + date.getSeconds();

        const part = date.getDate();

        // Will display time in 10:30:23 format
        return (month + '/' + day + '/' + year + ' ' + (hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2)).toString());
        //return (hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2));
    }

    static findObjectByLabel(obj, label) {
        if(obj.label === label) { return obj; }
        for(const i in obj) {
            if(obj.hasOwnProperty(i)){
                const foundLabel = DBHelper.findObjectByLabel(obj[i], label);
                if(foundLabel) { return foundLabel; }
            }
        }
        return null;
    }

    static debugRestaurantInfo(obj, callername, counter=0)
    {
        if (counter > 2) return;

        for(const i in obj) {
            if(obj.hasOwnProperty(i) && obj.hasOwnProperty(i).length > 0){
                //DBHelper.debugRestaurantInfo(obj[i], callername, counter++);
                const obj2 = obj[i];
                for(const j in obj[i]) {
                    if (debug) console.log((callername) + '[' + (i) + ']=' + (obj[i]) + '[' + (i[j]) + ']=' + (obj2[i]));
                }
            }
            else if (debug) console.log((callername) + '[' + (i) + ']=' + (obj[i]));
        }
    }

    static v1AddRestaurantsData() {
        if (debug) console.log('v1AddRestaurantsData()');

        return fetch(DBHelper.DATABASE_URL_RESTAURANTS)
            .then(response => response.json())
            .then(function (neighborhoods) {
                if (debug) console.log('v1AddRestaurantsData()-neighborhoods=' + (neighborhoods));

                return neighborhoods.forEach(restaurant => {
                    return dbPromise.then((db) => {
                        // add to database
                        if (debug) console.log('v1AddRestaurantsData()-neighborhoods-each-restaurant=' + (restaurant));
                        const txRestaurants = db.transaction('restaurants', 'readwrite');
                        let restaurantsStore = txRestaurants.objectStore('restaurants');

                        restaurantsStore.get(restaurant.id)
                            .then(function (item) {

                                if (debug) console.log('v1AddRestaurantsData()-neighborhoods-each-restaurant-get');
                                if (item) return true;

                                //https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore
                                const rtNewItem = [{
                                    restaurant_id: restaurant.id,
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
                                if (debug) console.log('v1AddRestaurantsData()-neighborhoods-each-restaurant-tx-complete');

                                if (debug) console.log('v1AddRestaurantsData()-neighborhoods-each-restaurant-operating_hours-start');
                                let operating_hours = restaurant.operating_hours;

                                const txOperatingHours = db.transaction('operating_hours', 'readwrite');
                                let operatingHoursStore = txOperatingHours.objectStore('operating_hours');
                                for (const indx in operating_hours) {
                                    if (debug) console.log('v1AddRestaurantsData()-neighborhoods-each-restaurant-operating_hours-indx=' + (indx));
                                    if (debug) console.log('v1AddRestaurantsData()-neighborhoods-each-restaurant-operating_hours-value[indx]=' + (operating_hours[indx]));
                                    operatingHoursStore.add({
                                        restaurant_id: restaurant.id,
                                        day: indx,
                                        hours: operating_hours[indx],
                                        createdAt: restaurant.createdAt,
                                        updatedAt: restaurant.updatedAt
                                    });
                                }
                                txOperatingHours.complete;
                                if (debug) console.log('v1AddRestaurantsData()-neighborhoods-each-restaurant-operating_hours-tx-complete');

                                return true;
                            });
                    });
                });
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-v1AddRestaurantsData`);
                console.log(error.message);
                return true;
            });
    }

    static v1AddReviewsData() {
        if (debug) console.log('v1AddReviewsData()');

        const requestUrl = DBHelper.DATABASE_URL_REVIEWS;
        if (debug) console.log('v1AddReviewsData()-requestUrl=' + (requestUrl));

        return fetch(requestUrl)
            .then(response => response.json())
            .then(function (reviews) {

                if (debug) console.log('v1AddReviewsData()-reviews=' + (reviews));

                return dbPromise.then((db) => {

                    if (debug) console.log('v1AddReviewsData()-reviews-start');
                    const txReviews = db.transaction('reviews', 'readwrite');
                    let reviewsStore = txReviews.objectStore('reviews');

                    for (const rkey in reviews) {
                        reviewsStore.add({
                            review_id: reviews[rkey].id,
                            restaurant_id: reviews[rkey].restaurant_id,
                            name: reviews[rkey].name,
                            rating: reviews[rkey].rating,
                            comments: reviews[rkey].comments,
                            createdAt: reviews[rkey].createdAt,
                            updatedAt: reviews[rkey].updatedAt
                        });
                    }
                    txReviews.complete;
                    if (debug) console.log('v1AddReviewsData()-reviews-complete');

                    return true;
                });

            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed v1AddReviewsData. Returned status of ${error.message}`);
                console.log(error.message);
                return false;
            });
    }




    /**
     * get review by ID.
     */
    static getReviewById(review_id, callback) {

        if (debug) console.log('dbhelper-getReviewById()');

        return new Promise((resolve, reject) => {
            resolve(true);
        })
            .then(() => {
                if (!this.reviews) {
                    return new Promise((resolve, reject) => {
                        DBHelper.getAllReviews((error, reviews) => {
                            DBHelper.debugRestaurantInfo(error, 'dbhelper-getReviewById()-1-getAllReviews()-error');
                            DBHelper.debugRestaurantInfo(reviews, 'dbhelper-getReviewById()-1-getAllReviews()-reviews');
                            if (error) resolve(false);
                            resolve(reviews);
                        });
                    });
                }
                else return this.reviews;
            })
            .then(reviews => {
                const review = reviews.filter(r => r.id == review_id);
                DBHelper.debugRestaurantInfo(review, 'dbhelper-getReviewById()-4-review');

                callback(null, review);
                return;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed-2. Returned status of ${error.message}`);
                callback(error.message, null);
                return;
            });
    }

    static getAllIndexDbOperatingHours(callback) {
        if (debug) console.log('dbhelper-getAllIndexDbOperatingHours()');
        dbPromise.then(db => {
            const txOperatingHours = db.transaction('operating_hours', 'readonly');
            const operatingHoursStore = txOperatingHours.objectStore('operating_hours');
            const allOperatingHours = operatingHoursStore.getAll();

            DBHelper.debugRestaurantInfo(allOperatingHours, 'dbhelper-getAllIndexDbOperatingHours()-1-allOperatingHours');

            callback(null, allOperatingHours);
            return;
        });
    }


    /**
     * Fetch a reviews by its restaurant ID.
     */
    static fetchReviewById(review_id, callback) {
        if (debug) console.log('dbhelper-fetchReviewById()');
        if (debug) console.log('review_id=' + (review_id));
        // fetch all review with proper error handling.

        if (debug) console.log('call-fetch');

        let requestURL = DBHelper.DATABASE_URL_REVIEWS + '/' + review_id;
        if (debug) console.log('requestURL=' + (requestURL));

        return fetch(requestURL)
            .then(response => {
                const review = response.json();
                DBHelper.debugRestaurantInfo(review, 'dbhelper-fetchReviewById()-1-review');

                if (review) {
                    // add or update review in cache
                    if (debug) console.log('calling-DBHelper.addUpdateLocalReviewById()');
                    DBHelper.addUpdateLocalReviewById(review, (error, result) => {
                        if (debug) console.log('error=' + (error));
                        if (debug) console.log('result=' + (result));
                    });

                    if (debug) console.log('calling-DBHelper.addUpdateCacheReviewById()');
                    DBHelper.addUpdateCacheReviewById(review, (error, result) => {
                        if (debug) console.log('error=' + (error));
                        if (debug) console.log('result=' + (result));
                    });
                }
                callback(null, review);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed-1. Returned status of ${error.message}`);
                callback(error.message, null);
                return;
            });
    }


}

// module.exports = DBHelper;