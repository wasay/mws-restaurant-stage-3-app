// js/dbhelper.js

let debug = true;

//DBHelper.debugRestaurantInfo('', 'start /lib/dbhelper.js');

const appPrefix = 'mws-restaurant-stage-3';
const staticCacheName = appPrefix + '-v2';
const contentImgsCache = appPrefix + '-content-imgs';
const allCaches = [
    staticCacheName,
    contentImgsCache
];
const dbName = 'topRestaurants3';
const dbVersion = 5;

//DBHelper.debugRestaurantInfo(dbName, 'dbhelper-dbName');
//DBHelper.debugRestaurantInfo(dbVersion, 'dbhelper-dbVersion');

// https://github.com/jakearchibald/idb
// https://developers.google.com/web/ilt/pwa/lab-indexeddb
// https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore

const dbPromise = idb.open(dbName, dbVersion, function (upgradeDb) {
    //DBHelper.debugRestaurantInfo(upgradeDb.oldVersion, 'dbhelper-upgradeDb-upgradeDb.oldVersion');

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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-upgradeDb-restaurantsObjectStore-setup');
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-upgradeDb-operatingHoursObjectStore-setup');
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-upgradeDb-reviewsObjectStore-setup');
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-upgradeDb-pendingObjectStore-setup');

        //DBHelper.debugRestaurantInfo(addV1Data, 'dbhelper-upgradeDb-3-addV1Data');
        case 4:
        //DBHelper.debugRestaurantInfo(addV1Data, 'dbhelper-upgradeDb-4-addV1Data');
    }
})
    .catch(error => {
        // Oops!. Got an error from server.
        error.message = (`Request failed createDB. Returned status of ${error.message}`);
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchRestaurants()');

        return fetch(DBHelper.DATABASE_URL_RESTAURANTS, {
            headers: {'Content-Type': 'application/json'}
        })
            .then(networkResponse => networkResponse.json())
            .then((restaurants) => {
                //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-fetchRestaurants()-3-restaurants');
                if (restaurants) {
                    this.restaurants = restaurants;
                    callback(null, restaurants);
                }
                else callback('No results by fetch', null);
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchRestaurantById()');
        // fetch all restaurants with proper error handling.
        let requestURL = DBHelper.DATABASE_URL_RESTAURANTS + '/' + id;
        //DBHelper.debugRestaurantInfo(requestURL, 'dbhelper-fetchRestaurantById()-requestURL');

        return fetch(requestURL, {
            headers: {'Content-Type': 'application/json'}
        })
            .then(networkResponse => networkResponse.json())
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchRestaurantByCuisine()');
        // Fetch all restaurants  with proper error handling
        return new Promise((resolve, reject) => {
            //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchRestaurantByCuisine-getAllRestaurants()-call');
            DBHelper
                .getAllRestaurants((error, result) => {
                    //DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchRestaurantByCuisine()-2-getAllRestaurants()-error');
                    //DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchRestaurantByCuisine()-2-getAllRestaurants()-result');
                    if (error || !result) reject(false);
                    resolve(result); // resolve to restaurant object with valid restaurant.id value
                });
        })
            .then((restaurants) => {
                if (restaurants) {
                    // Filter restaurants to have only given cuisine type
                    const results = restaurants.filter(r => r.cuisine_type == cuisine);
                    callback(null, results);
                }
                else callback('No restaurants found', null);
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchRestaurantByNeighborhood()');

        // Fetch all restaurants  with proper error handling
        return new Promise((resolve, reject) => {
            //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchRestaurantByNeighborhood-getAllRestaurants()-call');
            DBHelper
                .getAllRestaurants((error, result) => {
                    //DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchRestaurantByNeighborhood()-2-getAllRestaurants()-error');
                    //DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchRestaurantByNeighborhood()-2-getAllRestaurants()-result');
                    if (error || !result) reject(false);
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()');

        // Fetch all restaurants  with proper error handling
        return new Promise((resolve, reject) => {
            //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchRestaurantByCuisineAndNeighborhood-getAllRestaurants()-call');
            DBHelper
                .getAllRestaurants((error, result) => {
                    //DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-2-getAllRestaurants()-error');
                    //DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-2-getAllRestaurants()-result');
                    if (error || !result) reject(false);
                    resolve(result); // resolve to restaurant object with valid restaurant.id value
                });
        })
            .then(cuisine, neighborhood, (result) => {
                if (result) {
                    // Filter restaurants to have only given cuisine type or neighborhood type
                    let results = restaurants;

                    if (cuisine != 'all') { // filter by cuisine
                        results = results.filter(r => r.cuisine_type == cuisine);
                    }
                    if (neighborhood != 'all') { // filter by neighborhood
                        results = results.filter(r => r.neighborhood == neighborhood);
                    }
                    callback(null, results);
                }
                else callback('No results', null);
                return;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                if (typeof error === 'boolean') {
                    callback('Error', null);
                }
                else {
                    error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchCuisines()`);
                    console.log(error.message);
                    callback(error, null);
                }
            });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        DBHelper.debugRestaurantInfo('', 'dbhelper-fetchNeighborhoods()');

        // Fetch all restaurants  with proper error handling
        return new Promise((resolve, reject) => {
            DBHelper.debugRestaurantInfo('', 'dbhelper-fetchNeighborhoods-getAllRestaurants()-call');
            DBHelper
                .getAllRestaurants((error, result) => {
                    DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchNeighborhoods()-2-getAllRestaurants()-error');
                    DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchNeighborhoods()-2-getAllRestaurants()-result');
                    if (error || !result) reject(false);
                    resolve(result); // resolve to restaurant object with valid restaurant.id value
                });
        })
            .then((restaurants) => {
                if (restaurants) {
                    // Get all neighborhoods from all restaurants
                    const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
                    // Remove duplicates from neighborhoods
                    const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
                    callback(null, uniqueNeighborhoods);
                }
                else callback('No neighborhoods restaurants', null);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                if (typeof error === 'boolean') {
                    callback('Error', null);
                }
                else {
                    error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchCuisines()`);
                    console.log(error.message);
                    callback(error, null);
                }
            });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchCuisines()');

        // Fetch all restaurants  with proper error handling
        return new Promise((resolve, reject) => {
            //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchCuisines-getAllRestaurants()-call');
            DBHelper
                .getAllRestaurants((error, result) => {
                    //DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchCuisines()-2-getAllRestaurants()-error');
                    //DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchCuisines()-2-getAllRestaurants()-result');
                    if (error || !result) reject(false);
                    resolve(result); // resolve to restaurant object with valid restaurant.id value
                });
        })
            .then((restaurants) => {
                //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-fetchCuisines()-3-restaurants');
                if (restaurants && restaurants.length > 0) {
                    // Get all cuisines from all restaurants
                    const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                    // Remove duplicates from cuisines
                    const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
                    callback(null, uniqueCuisines);
                }
                else callback('No restaurants', null);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                if (typeof error === 'boolean') {
                    callback('Error', null);
                }
                else {
                    error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchCuisines()`);
                    console.log(error.message);
                    callback(error, null);
                }
            });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-urlForRestaurant()');
        //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-urlForRestaurant()-restaurant');
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-imageUrlForRestaurant()');
        //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-imageUrlForRestaurant()-restaurant');
        if (restaurant.photograph) {
            return (`img/${restaurant.photograph}.jpg`);
        }
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-mapMarkerForRestaurant()');
        //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-mapMarkerForRestaurant()-restaurant');
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
    static isIndexDbPopulated(callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-isIndexDbPopulated()');

        return dbPromise
            .then(db => {
                const txRestaurants = db.transaction('restaurants', 'readonly');
                const restaurantsStore = txRestaurants.objectStore('restaurants');
                return restaurantsStore.getKey(1);
            })
            .then((restaurant) => {
                return (typeof restaurant !== 'undefined' && restaurant) ? callback(null, true) : callback(null, false);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-isIndexDbPopulated()`);
                console.log(error.message);
                callback(false, null);
            });
    }


    /**
     * get all Db .
     */
    static getAllIndexDbRestaurants(callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-getAllIndexDbRestaurants()');

        dbPromise
            .then((db) => {
                const txRestaurants = db.transaction('restaurants', 'readonly');
                const restaurantsStore = txRestaurants.objectStore('restaurants');
                const restaurants = restaurantsStore.getAllKeys();
                if (restaurants && restaurants.length > 0) {
                    return restaurants.map((restaurant) => {
                        //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getAllIndexDbRestaurants()-1-1-restaurant');
                        return new Promise((resolve, reject) => {
                            DBHelper.getIndexDbRestaurantById(restaurant.restaurant_id, (error, result) => {
                                //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllIndexDbRestaurants()-1-2-getIndexDbRestaurantById()-error');
                                //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllIndexDbRestaurants()-1-2-getIndexDbRestaurantById()-result');
                                if (error || !result) reject(false);
                                resolve(result);
                            });
                        });
                    })
                        .then(restaurants, (result) => {
                            if (result) this.restaurants = result;
                            else this.restaurants = restaurants;

                            if (this.restaurants) callback(null, this.restaurants);
                            else callback('No Restaurants', null);
                            return;
                        });
                }
                else {
                    callback('No results in idb', null);
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-getIndexDbRestaurantById()');
        //DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getIndexDbRestaurantById()-restaurant_id');

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
                        //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getIndexDbRestaurantById()-1-2-restaurantsStore.get()');
                        return restaurant;
                    });
            })
            .then((restaurantRow) => {
                if (!restaurantRow) {
                    const error_message = (`No restaurant info found in idb - dbhelper-getIndexDbRestaurantById()-second`);
                    callback(error_message, null);
                    return;
                }
                //DBHelper.debugRestaurantInfo(restaurantRow, 'dbhelper-getIndexDbRestaurantById()-1-2-restaurantRow');

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

                //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getIndexDbRestaurantById()-1-2-restaurant');

                return restaurant;
            })
            .then((restaurant) => {
                if (!restaurant) {
                    const error_message = (`No restaurant info found in idb - dbhelper-getIndexDbRestaurantById()-fifth`);
                    callback(error_message, null);
                    return;
                }

                //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getIndexDbRestaurantById()-5-restaurant');

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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateRestaurantById()');

        let local_error = null;
        let cache_error = null;
        let remote_error = null;

        dbPromise.then(() => {
            DBHelper.addUpdateLocalRestaurantById(restaurant, (error, result) => {
                local_error = error;
            });
        }).then(() => {
            DBHelper.addUpdateCacheRestaurantById(restaurant.restaurant_id, (error, result) => {
                cache_error = error;
            });
        }).then(() => {
            DBHelper.addUpdateRemoteRestaurantById(restaurant, (error, result) => {
                remote_error = error;
            });
        }).then(() => {
            //DBHelper.debugRestaurantInfo(local_error, 'dbhelper-addUpdateRestaurantById()-local_error');
            //DBHelper.debugRestaurantInfo(cache_error, 'dbhelper-addUpdateRestaurantById()-cache_error');
            //DBHelper.debugRestaurantInfo(remote_error, 'dbhelper-addUpdateRestaurantById()-remote_error');

            if (local_error || cache_error || remote_error) {
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateLocalRestaurantById()');
        //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-addUpdateLocalRestaurantById()-restaurant');

        return dbPromise
            .then(db => {
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateCacheRestaurantById()');
        //DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-addUpdateCacheRestaurantById()-restaurant_id');

        return caches
            .open(staticCacheName)
            .then(function (cache) {
                //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateCacheRestaurantById()-Deleting index file cache');
                return cache
                    .delete(new Request('/'))
                    .delete(new Request('/restaurant.html?id=' + restaurant_id));
            }).then(function () {
                //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateCacheRestaurantById()-Adding index file cache');
                return fetch(new Request('/'))
                    .then(function () {
                        //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateCacheRestaurantById()-Adding restaurant file cache');
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateRemoteRestaurantById()');
        //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-addUpdateRemoteRestaurantById()-restaurant');

        let requestURL = DBHelper.DATABASE_URL_RESTAURANTS + '/' + restaurant.restaurant_id;
        //DBHelper.debugRestaurantInfo(requestURL, 'dbhelper-addUpdateRemoteRestaurantById()-requestURL');

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

                        const txPending = db.transaction('pending', 'readwrite');
                        let pendingStore = txPending.objectStore('pending');

                        const pending = {
                            id: Date.now(),
                            url: requestURL,
                            method: requestMethod,
                            body: requestBody,
                            headers: requestHeaders
                        };
                        //DBHelper.debugRestaurantInfo(pending, 'dbhelper-addUpdateRemoteRestaurantById()-1-pending');

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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchReviewsByRestaurantId()');
        //DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-fetchReviewsByRestaurantId()-restaurant_id');

        const requestURL = DBHelper.DATABASE_URL_REVIEWS + '?restaurant_id=' + restaurant_id;
        //DBHelper.debugRestaurantInfo(requestURL, 'dbhelper-fetchReviewsByRestaurantId()-requestURL');

        return fetch(requestURL)
            .then(response => response.json())
            .then((reviews) => {
                //DBHelper.debugRestaurantInfo(reviews, 'dbhelper-fetchReviewsByRestaurantId()-1-reviews');
                return reviews.map(review => {
                    return new Promise((resolve, reject) => {
                        // add or update review in cache
                        //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchReviewsByRestaurantId()-addUpdateLocalReviewById()-call');
                        DBHelper.addUpdateLocalReviewById(review, (error, result) => {
                            //DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchReviewsByRestaurantId()-2-addUpdateLocalReviewById()-error');
                            //DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchReviewsByRestaurantId()-2-addUpdateLocalReviewById()-result');
                            resolve(true);
                        });
                    })
                        .then(() => {
                            new Promise((resolve, reject) => {
                                //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchReviewsByRestaurantId()-addUpdateCacheReviewById()-call');
                                DBHelper.addUpdateCacheReviewById(review, (error, result) => {
                                    //DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchReviewsByRestaurantId()-3-addUpdateCacheReviewById()-error');
                                    //DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchReviewsByRestaurantId()-3-addUpdateCacheReviewById()-result');
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
                //DBHelper.debugRestaurantInfo(reviews, 'dbhelper-fetchReviewsByRestaurantId()-4-reviews');
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
        DBHelper.debugRestaurantInfo('', 'dbhelper-getAllRestaurants()');

        let restaurants = this.restaurants;
        //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-getAllRestaurants()-1-restaurants');

        return new Promise((resolve, reject) => {
            if (!restaurants) {
                DBHelper
                    .getAllIndexDbRestaurants((error, result) => {
                        //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllRestaurants()-1-sub-getAllIndexDbRestaurants()-error');
                        //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllRestaurants()-1-sub-getAllIndexDbRestaurants()-result');
                        if (error || !result) reject(false);
                        resolve(result);
                    });
            }
            else reject(false);
        })
            .then(restaurants, (result) => {
                //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-getAllRestaurants()-2-restaurants');

                if (result) {
                    restaurants = result;
                }

                if (!restaurants) {
                    return new Promise((resolve, reject) => {
                        DBHelper
                            .fetchRestaurants((error, result) => {
                                //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllRestaurants()-2-sub-fetchRestaurants()-error');
                                //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllRestaurants()-2-sub-fetchRestaurants()-result');
                                if (error || !result) reject(false);
                                resolve(result);
                            })
                    })
                        .then((result) => {
                            if (result) return result;
                            else return false;
                        });
                }
                else {
                    return restaurants;
                }
            })
            .then((restaurants) => {
                //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-getAllRestaurants()-3-1-restaurants');
                new Promise((resolve, reject) => {
                    if (restaurants) {
                        resolve(restaurants.map((restaurant) => {
                            const restaurant_id = ((restaurant.id ? restaurant.id : (restaurant.restaurant_id ? restaurant.restaurant_id : 0)));
                            //DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-appendRestaurantProperties()-1-restaurant_id');
                            return new Promise((resolve, reject) => {
                                //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getAllRestaurants()-3-2-restaurant');
                                //DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getAllRestaurants()-3-2-restaurant_id');
                                //DBHelper.debugRestaurantInfo('', 'dbhelper-getAllRestaurants()-3-3-1-appendRestaurantProperties()-call');
                                DBHelper
                                    .appendRestaurantProperties(restaurant, (error, result) => {
                                        //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllRestaurants()-3-3-2-appendRestaurantProperties()-error');
                                        //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllRestaurants()-3-3-2-appendRestaurantProperties()-result');
                                        if (error || !result) reject(false);
                                        resolve(result);
                                    });
                            })
                                .then(restaurant, (result) => {
                                    //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllRestaurants()-3-4-result');
                                    //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getAllRestaurants()-3-4-restaurant');
                                    if (result) return result;
                                    else if (restaurant) return restaurant;
                                    else return false;
                                });
                        }));
                        //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-getAllRestaurants()-3-5-restaurants');
                        //resolve(restaurants);
                    }
                    else {
                        //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-getAllRestaurants()-3-6-restaurants');
                        resolve(restaurants);
                    }
                })
            })
            .then((restaurants) => {
                DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-getAllRestaurants()-4-restaurants');
                if (restaurants && restaurants.length > 0) {
                    // update data
                    this.restaurants = restaurants;
                    callback(null, restaurants);
                }
                else callback('No restaurants', null);

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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-getRestaurantById()');
        //DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getRestaurantById()-restaurant_id');

        let restaurant;

        if (this.restaurant && this.restaurant.restaurant_id === restaurant_id) {
            restaurant = this.restaurant;
            //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-1-restaurant');
        }

        if (!restaurant && this.restaurants) {
            restaurant = this.restaurants.filter(r => r.id == restaurant_id);
            //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-2-restaurant');

            if (restaurant) this.restaurant = restaurant;
        }

        return new Promise((resolve, reject) => {
            resolve(true);
        })
            .then(() => {
                if (!restaurant) {
                    return new Promise((resolve, reject) => {
                        //DBHelper.debugRestaurantInfo('', 'dbhelper-getRestaurantById()-getIndexDbRestaurantById()-call');
                        DBHelper
                            .getIndexDbRestaurantById(restaurant_id, (error, result) => {
                                //DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantById()-2-sub-getIndexDbRestaurantById()-error');
                                //DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantById()-2-sub-getIndexDbRestaurantById()-result');
                                if (error || !result) reject(false);

                                if (result) this.restaurant = result;
                                resolve(result);
                            });
                    });
                }
                else return restaurant;
            })
            .then((restaurant) => {
                //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-3-restaurant');
                if (!restaurant) {
                    return new Promise((resolve, reject) => {
                        //DBHelper.debugRestaurantInfo('', 'dbhelper-getRestaurantById()-fetchRestaurantById()-call');
                        DBHelper
                            .fetchRestaurantById(restaurant_id, (error, result) => {
                                //DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantById()-3-sub-fetchRestaurantById()-error');
                                //DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantById()-3-sub-fetchRestaurantById()-result');
                                if (error || !result) reject(false);
                                resolve(result);
                            })
                    })
                        .then((restaurant) => {
                            if (restaurant) {
                                return new Promise((resolve, reject) => {
                                    DBHelper.addUpdateCacheRestaurantById(restaurant.restaurant_id, (error, result) => {
                                        resolve(restaurant);
                                    });
                                });
                            }
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
                if (restaurant) this.restaurant = restaurant;
                //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-4-restaurant');

                return restaurant;
            })
            .then((restaurants) => {
                //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-getRestaurantById()-5-restaurants');
                if (restaurants) {
                    return restaurants.map(restaurant => {
                        return new Promise((resolve, reject) => {
                            //DBHelper.debugRestaurantInfo('', 'dbhelper-getRestaurantById()-5-appendRestaurantProperties()-call');
                            DBHelper
                                .appendRestaurantProperties(restaurant, (error, result) => {
                                    //DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantById()-5-2-appendRestaurantProperties()-error');
                                    //DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantById()-5-2-appendRestaurantProperties()-result');
                                    if (error || !result) reject(false);
                                    resolve(result);
                                });
                        })
                            .then(restaurant, (result) => {
                                //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-getRestaurantById()-5-3-restaurants');
                                //DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantById()-5-3-result');
                                if (result) return result;
                                else if (restaurant) return restaurant;
                                else return false;
                            });
                    });
                }
                else return restaurants;
            })
            .then((restaurant) => {
                //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-6-restaurant');
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-appendRestaurantProperties()');
        //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-input-restaurant');

        return new Promise((resolve, reject) => {
            //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-3-1-getRestaurantOperatingHours()-restaurant');

            const restaurant_id = ((restaurant.id ? restaurant.id : (restaurant.restaurant_id ? restaurant.restaurant_id : 0)));
            //DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-appendRestaurantProperties()-1-restaurant_id');

            //DBHelper.debugRestaurantInfo('', 'dbhelper-appendRestaurantProperties()-3-2-getRestaurantOperatingHours()-call');
            DBHelper
                .getRestaurantOperatingHours(restaurant_id, (error, result) => {
                    //DBHelper.debugRestaurantInfo(error, 'dbhelper-appendRestaurantProperties()-3-3-getRestaurantOperatingHours()-sub-error');
                    //DBHelper.debugRestaurantInfo(result, 'dbhelper-appendRestaurantProperties()-3-3-getRestaurantOperatingHours()-sub-result');
                    if (error || !result) reject(false);
                    resolve(result);
                });
        })
            .then(restaurant, (result) => {
                //DBHelper.debugRestaurantInfo(result, 'dbhelper-appendRestaurantProperties()-3-4-result');
                if (result) {
                    restaurant.operating_hours = result.operating_hours;
                }
                //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-3-4-restaurant');
                return restaurant;
            })
            .then((restaurant) => {
                //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-4-1-restaurant');
                return new Promise((resolve, reject) => {
                    DBHelper
                        .getRestaurantReviews(restaurant_id, (error, result) => {
                            //DBHelper.debugRestaurantInfo(error, 'dbhelper-appendRestaurantProperties()-4-2-getRestaurantReviews()-error');
                            //DBHelper.debugRestaurantInfo(result, 'dbhelper-appendRestaurantProperties()-4-2-getRestaurantReviews()-result');
                            if (error || !result) reject(false);
                            resolve(result);
                        });
                })
                    .then(restaurant, (result) => {
                        //DBHelper.debugRestaurantInfo(result, 'dbhelper-appendRestaurantProperties()-4-3-result');
                        if (result) {
                            restaurant.reviews = result.reviews;
                        }
                        //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-4-4-restaurant');
                        return restaurant;
                    });
            })
            .then((restaurant) => {

                //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-5-1-restaurant');

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

                //DBHelper.debugRestaurantInfo(restaurant.id, 'dbhelper-appendRestaurantProperties()-5-2-restaurant.id');
                //DBHelper.debugRestaurantInfo(restaurant.restaurant_id, 'dbhelper-appendRestaurantProperties()-5-2-restaurant.restaurant_id');

                return restaurant;
            })
            .then((restaurant) => {
                //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-6');
                if (restaurant) callback(null, restaurant);
                else callback('No results in append restaurant properties', null);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                const error_message = (`Request failed. Returned status of ${error.message} - dbhelper-appendRestaurantProperties()`);
                callback(error_message, null);
                return;
            });
    }

    static getRestaurantOperatingHours(restaurant_id, callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-getRestaurantOperatingHours()');
        //DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getRestaurantOperatingHours()-1-restaurant_id');

        return new Promise((resolve, reject) => {
            //DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getRestaurantOperatingHours()-2-1-restaurant_id');
            //DBHelper.debugRestaurantInfo('', 'dbhelper-getRestaurantOperatingHours()-2-1-getIndexDbOperatingHoursByRestaurantId()-call');
            DBHelper
                .getIndexDbOperatingHoursByRestaurantId(restaurant_id, (error, result) => {
                    //DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantOperatingHours()-2-2-getIndexDbOperatingHoursByRestaurantId()-error');
                    //DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantOperatingHours()-2-2-getIndexDbOperatingHoursByRestaurantId()-result');
                    if (error || !result) reject(false);
                    resolve(result);
                })
        })
            .then((result) => {
                //DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantOperatingHours()-4-result');

                if (result) callback(null, result);
                else callback('No Hours for this restaurant', null);
                return;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                const error_message = (`Request failed. Returned status of ${error.message} - dbhelper-getRestaurantOperatingHours()`);
                callback(error_message, null);
                return;
            });
    }

    static getRestaurantReviews(restaurant_id, callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-getRestaurantReviews()');
        //DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getRestaurantReviews()-restaurant_id');

        return new Promise((resolve, reject) => {
            //DBHelper.debugRestaurantInfo('', 'dbhelper-getRestaurantReviews()-getReviewsByRestaurantId()-call');
            DBHelper.getReviewsByRestaurantId(restaurant_id, (error, result) => {
                //DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantReviews()-2-getReviewsByRestaurantId()-error');
                //DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantReviews()-2-getReviewsByRestaurantId()-result');
                if (error || !result) reject(false);
                resolve(result);
            });
        })
            .then((reviews) => {
                //DBHelper.debugRestaurantInfo(reviews, 'dbhelper-getRestaurantReviews()-3-reviews');
                if (reviews) callback(null, reviews);
                else callback('No reviews for this restaurant', null);
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-getAllReviews()');

        return new Promise((resolve, reject) => {
            resolve(true);
        })
            .then(() => {
                //DBHelper.debugRestaurantInfo(this.reviews, 'dbhelper-getAllReviews()-1-this.reviews');
                if (!this.reviews) {
                    return new Promise((resolve, reject) => {
                        DBHelper.getAllIndexDbReviews((error, result) => {
                            //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllReviews()-2-error');
                            //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllReviews()-2-result');
                            if (error || !result) reject(false);
                            resolve(result);
                        });
                    });
                }
                else return this.reviews;
            })
            .then((reviews) => {
                if (!reviews) {
                    return new Promise((resolve, reject) => {
                        DBHelper.fetchAllReviews((error, result) => {
                            //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllReviews()-3-error');
                            //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllReviews()-3-result');
                            if (error || !result) reject(false);
                            resolve(result);
                        });
                    });
                }
                else return reviews;
            })
            .then((reviews) => {
                //DBHelper.debugRestaurantInfo(reviews, 'dbhelper-getAllReviews()-4-reviews');

                if (reviews) {
                    // updated global object
                    this.reviews = reviews;
                }

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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-getReviewsByRestaurantId()');
        //DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getReviewsByRestaurantId()-restaurant_id');

        return new Promise((resolve, reject) => {
            resolve(true);
        }).then(() => {
            //DBHelper.debugRestaurantInfo(this.reviews, 'dbhelper-getReviewsByRestaurantId()-1-this.reviews');
            if (!this.reviews) {
                return new Promise((resolve, reject) => {
                    DBHelper
                        .getAllReviews((error, result) => {
                            //DBHelper.debugRestaurantInfo(error, 'dbhelper-getReviewsByRestaurantId()-2-getAllReviews()-error');
                            //DBHelper.debugRestaurantInfo(result, 'dbhelper-getReviewsByRestaurantId()-2-getAllReviews()-result');
                            if (error || !result) reject(false);
                            resolve(result);
                        });
                })
            }
            else return this.reviews;
        })
            .then((reviews) => {
                //DBHelper.debugRestaurantInfo(reviews, 'dbhelper-getReviewsByRestaurantId()-3-reviews');
                if (reviews) {
                    // updated global variable
                    this.reviews = reviews;

                    const restaurant_reviews = reviews.filter(r => r.restaurant_id == restaurant_id);
                    //DBHelper.debugRestaurantInfo(restaurant_reviews, 'dbhelper-getReviewsByRestaurantId()-4-restaurant_reviews');

                    callback(null, restaurant_reviews);
                    return;
                }
                else {
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-getIndexDbOperatingHoursByRestaurantId()');
        //DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getIndexDbOperatingHoursByRestaurantId()-restaurant_id');

        if (!restaurant_id) callback('Invalid restaurant_id', null);

        dbPromise.then(db => {
            const txOperatingHours = db.transaction('operating_hours', 'readonly');
            const operatingHoursStore = txOperatingHours.objectStore('operating_hours');

            return operatingHoursStore.get(restaurant_id)
                .then((operating_hours) => {
                    //DBHelper.debugRestaurantInfo(operating_hours, 'dbhelper-getIndexDbOperatingHoursByRestaurantId()-1-operating_hours');
                    if (operating_hours) {
                        callback(null, operating_hours);
                    }
                    else callback('No operating hours', null);
                    return;
                });
        })
    }

    /**
     * get db all reviews.
     */
    static getAllIndexDbReviews(callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-getAllIndexDbReviews()');

        dbPromise.then(function (db) {
            const txReviews = db.transaction('reviews', 'readonly');
            let reviewsStore = txReviews.objectStore('reviews');
            const reviews = reviewsStore.getAll();
            //DBHelper.debugRestaurantInfo(reviews, 'dbhelper-getAllIndexDbReviews()-1-reviews');

            callback(null, reviews);
        });
    }

    /**
     * Fetch all reviews
     */
    static fetchAllReviews(callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchAllReviews()');

        // fetch all review with proper error handling.

        let requestURL = DBHelper.DATABASE_URL_REVIEWS;
        //DBHelper.debugRestaurantInfo(requestURL, 'dbhelper-fetchAllReviews()-requestURL');

        return fetch(requestURL)
            .then(response => {
                const reviews = response.json();

                //DBHelper.debugRestaurantInfo(reviews, 'dbhelper-fetchAllReviews()-1-reviews');

                if (reviews) {
                    return reviews.map(review => {
                        return new Promise((resolve, reject) => {
                            // add or update review in cache
                            //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchAllReviews()-addUpdateLocalReviewById()-call');
                            DBHelper.addUpdateLocalReviewById(review, (error, result) => {
                                //DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchAllReviews()-2-addUpdateLocalReviewById()-error');
                                //DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchAllReviews()-2-addUpdateLocalReviewById()-result');
                                resolve(true);
                            });
                        })
                            .then(() => {
                                return new Promise((resolve, reject) => {
                                    // add or update review in cache
                                    //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchAllReviews()-addUpdateCacheReviewById()-call');
                                    DBHelper.addUpdateCacheReviewById(review, (error, result) => {
                                        //DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchAllReviews()-2-addUpdateLocalReviewById()-error');
                                        //DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchAllReviews()-2-addUpdateLocalReviewById()-result');
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
                //DBHelper.debugRestaurantInfo(reviews, 'dbhelper-fetchAllReviews()-3-reviews');
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateReviewById()');
        //DBHelper.debugRestaurantInfo(review, 'dbhelper-addUpdateReviewById()-review');

        let local_error = null;
        let cache_error = null;
        let remote_error = null;

        let idMax = review.review_id;

        //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateReviewById()-addUpdateLocalReviewById()-call');
        DBHelper.addUpdateLocalReviewById(review, (error, result) => {
            if (debug) console.log('error=' + (error));
            if (debug) console.log('result=' + (result));
            local_error = error;
        });

        //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateReviewById()-addUpdateCacheReviewById()-call');
        DBHelper.addUpdateCacheReviewById(review, (error, result) => {
            if (debug) console.log('error=' + (error));
            if (debug) console.log('result=' + (result));
            cache_error = error;
        });

        //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateReviewById()-addUpdateRemoteReviewById()-call');
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateLocalReviewById()');
        //DBHelper.debugRestaurantInfo(review, 'dbhelper-addUpdateLocalReviewById()-review');

        return dbPromise.then(function (db) {
            const txReview = db.transaction('reviews', 'readwrite');
            let reviewStore = txReview.objectStore('reviews');

            const idIndex = reviewStore.index('review_id');

            return idIndex.getAllKeys().then(keys => {
                let idMax = 0;
                keys.forEach(key => {
                    idMax = key;
                });

                // increment last key value by 1
                idMax++;

                return idMax;
            }).then(idMax => {
                review.review_id = idMax;

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
                            reviewStore.add(rtNewItem);
                        }
                        else {
                            reviewStore.put(rtNewItem);
                        }
                        txReview.complete;

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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateCacheReviewById()');
        //DBHelper.debugRestaurantInfo(review, 'dbhelper-addUpdateCacheReviewById()-review');

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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateRemoteReviewById()');
        //DBHelper.debugRestaurantInfo(review, 'dbhelper-addUpdateRemoteReviewById()-review');

        let requestURL = DBHelper.DATABASE_URL_REVIEWS;
        //DBHelper.debugRestaurantInfo(requestURL, 'dbhelper-addUpdateRemoteReviewById()-requestURL');

        // add remove id name as well
        const review_id = review.review_id;
        delete review.review_id;
        review.id = review_id;
        //DBHelper.debugRestaurantInfo(review.id, 'dbhelper-addUpdateRemoteReviewById()-review.id');

        if (review.id.length > 0) {
            requestURL += '/' + review.id;
            //DBHelper.debugRestaurantInfo(requestURL, 'dbhelper-addUpdateRemoteReviewById()-requestURL');
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
                //DBHelper.debugRestaurantInfo(navigator.onLine, 'dbhelper-addUpdateRemoteReviewById()-navigator.onLine');
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

    static debugRestaurantInfo(obj, callername, counter = 0, data = []) {

        try {

            if (debug) {
                data.push(((callername) + '=' + (obj) + ' typeof=' + (typeof obj) + ' -- is empty=' + ((obj === null || typeof obj === 'undefined' || obj.length === 0))));
                if (counter > 5) return data;

                if (typeof obj === 'object' && obj !== null) {
                    for (const i in obj) {
                        const subObj = obj[i];
                        const subObjName = callername + '-' + counter + '-' + subObj;
                        data = DBHelper.debugRestaurantInfo(subObj, subObjName, (counter + 1), data);
                    }
                }

                if (counter === 0) {
                    // data.forEach((item, index, data) => {
                    //     console.log(item, index);
                    // });
                    for (let i = 0; i < data.length; i++) {
                        console.log(data[i]);
                    }
                }
                else return data;
            }
        }
        catch (error) {
            console.log('Error=' + (error));
        }
    }

    static v1LoadData(callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-v1LoadData()');

        return new Promise((resolve, reject) => {
            DBHelper.isIndexDbPopulated((error, result) => {
                //DBHelper.debugRestaurantInfo(error, 'dbhelper-v1LoadData()-1-isIndexDbPopulated()-error');
                //DBHelper.debugRestaurantInfo(result, 'dbhelper-v1LoadData()-1-isIndexDbPopulated()-result');
                if (error) {
                    reject(false);
                }
                else {
                    resolve(result);
                }
            });
        })
            .then((is_db_populated) => {
                //DBHelper.debugRestaurantInfo('', 'dbhelper-v1LoadData()-3-1-call');
                //DBHelper.debugRestaurantInfo(is_db_populated, 'dbhelper-v1LoadData()-3-1-is_db_populated');
                new Promise((resolve, reject) => {
                    //DBHelper.debugRestaurantInfo(is_db_populated, 'dbhelper-v1LoadData()-3-2-is_db_populated');
                    let is_restaurant_data_loaded = is_db_populated;
                    if (!is_db_populated) {
                        //DBHelper.debugRestaurantInfo('', 'dbhelper-v1LoadData()-3-2-v1AddRestaurantsData()-call');

                        is_restaurant_data_loaded = new Promise((resolve2, reject2) => {
                            DBHelper.v1AddRestaurantsData((error, result) => {
                                //DBHelper.debugRestaurantInfo(error, 'dbhelper-v1LoadData()-3-3-v1AddRestaurantsData()-error');
                                //DBHelper.debugRestaurantInfo(result, 'dbhelper-v1LoadData()-3-3-v1AddRestaurantsData()-result');
                                if (error || !result) reject2(false);
                                resolve2(result);
                            });
                        });
                    }
                    resolve(is_restaurant_data_loaded);
                })
                    .then((is_data_loaded) => {
                        //DBHelper.debugRestaurantInfo(is_restaurant_data_loaded, 'dbhelper-v1LoadData()-4-Restaurant data-is_data_loaded');

                        return is_data_loaded;
                    });

                return is_db_populated;
            })
            .then((is_db_populated) => {

                return new Promise((resolve, reject) => {
                    //DBHelper.debugRestaurantInfo(is_db_populated, 'dbhelper-v1LoadData()-5-1-is_db_populated');
                    if (!is_db_populated) {

                        //DBHelper.debugRestaurantInfo('', 'dbhelper-v1LoadData()-5-1-v1AddRestaurantsData()-call');

                        DBHelper.v1AddReviewsData((error, result) => {
                            //DBHelper.debugRestaurantInfo(error, 'dbhelper-v1LoadData()-5-2-v1AddReviewsData()-error');
                            //DBHelper.debugRestaurantInfo(result, 'dbhelper-v1LoadData()-5-2-v1AddReviewsData()-result');
                            if (error || !result) reject(false);
                            resolve(is_db_populated);
                        });
                    }
                    else resolve(is_db_populated);
                })
                    .then(is_db_populated, (is_data_loaded) => {

                        //DBHelper.debugRestaurantInfo(is_data_loaded, 'dbhelper-v1LoadData()-4-1-Reviews data-is_data_loaded');

                        return is_db_populated;
                    });
            })
            .then((is_db_populated) => {
                //DBHelper.debugRestaurantInfo(is_db_populated, 'dbhelper-v1LoadData()-7-is_db_populated');
                new Promise((resolve, reject) => {
                    DBHelper.getAllRestaurants((error, result) =>{
                        resolve(result);
                    });
                });

                return is_db_populated;
            })
            .then((is_db_populated) => {
                //DBHelper.debugRestaurantInfo(is_db_populated, 'dbhelper-v1LoadData()-8-is_db_populated');
                callback(null, true);
                return;
            })
            .catch(error => {
                console.log('Load data error: ' + (error));
            });
    }

    static v1AddRestaurantsData(callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-v1AddRestaurantsData()');

        return new Promise((resolve, reject) => {

            const requestUrl = DBHelper.DATABASE_URL_RESTAURANTS;
            //DBHelper.debugRestaurantInfo(requestUrl, 'dbhelper-v1AddRestaurantsData()-1-requestUrl');

            return fetch(requestUrl)
                .then(response => resolve(response.json()))
        })
            .then((restaurants) => {

                //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-v1AddRestaurantsData()-2-restaurants');
                if (!restaurants || restaurants.length === 0) return false;

                return dbPromise.then((db) => {
                    // add to database
                    const txRestaurants = db.transaction('restaurants', 'readwrite');
                    let restaurantsStore = txRestaurants.objectStore('restaurants');

                    return restaurants.map(restaurant => {
                        return restaurantsStore.get(restaurant.id)
                            .then(function (item) {

                                //DBHelper.debugRestaurantInfo(item, 'dbhelper-v1AddRestaurantsData()-2-2-sub-1-item');
                                if (item) return true;

                                //https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore
                                restaurantsStore.add({
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
                                });
                                txRestaurants.complete;
                                //DBHelper.debugRestaurantInfo('', 'dbhelper-v1AddRestaurantsData()-2-2-sub-2-txRestaurants.complete');

                                let operating_hours = restaurant.operating_hours;

                                const txOperatingHours = db.transaction('operating_hours', 'readwrite');
                                let operatingHoursStore = txOperatingHours.objectStore('operating_hours');
                                //DBHelper.debugRestaurantInfo(operating_hours, 'dbhelper-v1AddRestaurantsData()-2-2-sub-1-item-operating_hours');

                                for (const indx in operating_hours) {
                                    operatingHoursStore.add({
                                        restaurant_id: restaurant.id,
                                        day: indx,
                                        hours: operating_hours[indx],
                                        createdAt: restaurant.createdAt,
                                        updatedAt: restaurant.updatedAt
                                    });
                                }
                                txOperatingHours.complete;
                                //DBHelper.debugRestaurantInfo('', 'dbhelper-v1AddRestaurantsData()-2-sub-2-txOperatingHours.complete');

                                return true;
                            });
                    });
                });
            })
            .then((result) => {
                //DBHelper.debugRestaurantInfo(result, 'dbhelper-v1AddRestaurantsData()-3-result');
                if (result) {
                    //DBHelper.debugRestaurantInfo('', 'dbhelper-v1AddRestaurantsData()-3-fetch data added');
                    callback(null, true);
                }
                else {
                    callback(false, null);
                }
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-v1AddRestaurantsData`);
                console.log(error.message);
                callback('Unable to load data', null);
            });
    }

    static v1AddReviewsData(callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-v1AddReviewsData()');

        return new Promise((resolve, reject) => {

            const requestUrl = DBHelper.DATABASE_URL_REVIEWS;
            //DBHelper.debugRestaurantInfo(requestUrl, 'dbhelper-v1AddReviewsData()-1-requestUrl');

            return fetch(requestUrl)
                .then(response => resolve(response.json()))
        })
            .then((reviews) => {

                if (!reviews || reviews.length === 0) return false;

                //DBHelper.debugRestaurantInfo(reviews, 'dbhelper-v1AddReviewsData()-2-reviews');
                this.reviews = reviews;

                return reviews.forEach(review => {
                    //DBHelper.debugRestaurantInfo(review, 'dbhelper-v1AddReviewsData()-2-2-review');
                    return dbPromise.then((db) => {
                        // add to database
                        const txReviews = db.transaction('reviews', 'readwrite');
                        let reviewsStore = txReviews.objectStore('reviews');

                        reviewsStore.get(review.id)
                            .then(function (item) {
                                //DBHelper.debugRestaurantInfo(item, 'dbhelper-v1AddReviewsData()-2-2-sub-1-item');
                                if (item) return true;

                                reviewsStore.add({
                                    review_id: review.id,
                                    restaurant_id: review.restaurant_id,
                                    name: review.name,
                                    rating: review.rating,
                                    comments: review.comments,
                                    createdAt: review.createdAt,
                                    updatedAt: review.updatedAt
                                });
                                txReviews.complete;
                                //DBHelper.debugRestaurantInfo('', 'dbhelper-v1AddReviewsData()-2-2-sub-2-txReviews.complete');

                                return true;
                            });
                        return true;
                    });
                });
            })
            .then(() => {
                //DBHelper.debugRestaurantInfo('', 'dbhelper-v1AddReviewsData()-fetch data added');
                callback(null, true);
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-getReviewById()');

        return new Promise((resolve, reject) => {
            resolve(true);
        })
            .then(() => {
                if (!this.reviews) {
                    return new Promise((resolve, reject) => {
                        DBHelper.getAllReviews((error, result) => {
                            //DBHelper.debugRestaurantInfo(error, 'dbhelper-getReviewById()-1-getAllReviews()-error');
                            //DBHelper.debugRestaurantInfo(result, 'dbhelper-getReviewById()-1-getAllReviews()-result');
                            if (error || !result) reject(false);
                            resolve(result);
                        });
                    });
                }
                else return this.reviews;
            })
            .then((reviews) => {
                if (reviews) {
                    const review = reviews.filter(r => r.id == review_id);
                    //DBHelper.debugRestaurantInfo(review, 'dbhelper-getReviewById()-4-review');

                    callback(null, review);
                }
                else callback('No review matched with id', null);
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-getAllIndexDbOperatingHours()');
        dbPromise.then(db => {
            const txOperatingHours = db.transaction('operating_hours', 'readonly');
            const operatingHoursStore = txOperatingHours.objectStore('operating_hours');
            const allOperatingHours = operatingHoursStore.getAll();

            //DBHelper.debugRestaurantInfo(allOperatingHours, 'dbhelper-getAllIndexDbOperatingHours()-1-allOperatingHours');

            callback(null, allOperatingHours);
            return;
        });
    }


    /**
     * Fetch a reviews by its restaurant ID.
     */
    static fetchReviewById(review_id, callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchReviewById()');
        //DBHelper.debugRestaurantInfo(review_id, 'dbhelper-fetchReviewById()-review_id');

        // fetch all review with proper error handling.

        let requestURL = DBHelper.DATABASE_URL_REVIEWS + '/' + review_id;
        //DBHelper.debugRestaurantInfo(requestURL, 'dbhelper-fetchReviewById()-requestURL');

        return fetch(requestURL)
            .then(response => {
                const review = response.json();
                //DBHelper.debugRestaurantInfo(review, 'dbhelper-fetchReviewById()-1-review');

                if (review) {
                    // add or update review in cache
                    //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchReviewById()-addUpdateLocalReviewById()-call');
                    DBHelper.addUpdateLocalReviewById(review, (error, result) => {
                        //DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchReviewById()-1-addUpdateLocalReviewById()-error');
                        //DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchReviewById()-1-addUpdateLocalReviewById()-reviews');
                    });

                    //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchReviewById()-addUpdateCacheReviewById()-call');
                    DBHelper.addUpdateCacheReviewById(review, (error, result) => {
                        //DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchReviewById()-1-addUpdateCacheReviewById()-error');
                        //DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchReviewById()-1-addUpdateCacheReviewById()-reviews');
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