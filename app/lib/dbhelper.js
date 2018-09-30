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
        DBHelper.debugRestaurantInfo('', 'dbhelper-fetchRestaurantById()');
        let requestURL = DBHelper.DATABASE_URL_RESTAURANTS + '/' + id;
        DBHelper.debugRestaurantInfo(requestURL, 'dbhelper-fetchRestaurantById()-requestURL');

        // fetch restaurant with proper error handling.
        return fetch(requestURL, {
            headers: {'Content-Type': 'application/json'}
        })
            .then(networkResponse => networkResponse.json())
            .then((restaurant) => {
                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-fetchRestaurantById()-restaurant');
                if (restaurant) {
                    callback(null, restaurant);
                }
                else callback('No results by fetch', null);
                return;
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
        //DBHelper.debugRestaurantInfo(cuisine, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-input-cuisine');
        //DBHelper.debugRestaurantInfo(neighborhood, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-input-neighborhood');

        // Fetch all restaurants  with proper error handling
        return new Promise((resolve, reject) => {
            //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchRestaurantByCuisineAndNeighborhood-1-1-getAllRestaurants()-call');
            DBHelper
                .getAllRestaurants((error, result) => {
                    //DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-1-2-getAllRestaurants()-error');
                    //DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-1-2-getAllRestaurants()-result');
                    if (error || !result) reject(false);
                    resolve(result); // resolve to restaurant object with valid restaurant.id value
                });
        })
            .then((results) => {
                //DBHelper.debugRestaurantInfo(cuisine, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-2-cuisine');
                //DBHelper.debugRestaurantInfo(neighborhood, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-2-neighborhood');
                //DBHelper.debugRestaurantInfo(results, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-2-results');
                if (results) {
                    // Filter restaurants to have only given cuisine type or neighborhood type

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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchNeighborhoods()');

        // Fetch all restaurants  with proper error handling
        return new Promise((resolve, reject) => {
            //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchNeighborhoods-getAllRestaurants()-call');
            DBHelper
                .getAllRestaurants((error, result) => {
                    //DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchNeighborhoods()-2-getAllRestaurants()-error');
                    //DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchNeighborhoods()-2-getAllRestaurants()-result');
                    if (error || !result) reject(false);
                    resolve(result); // resolve to restaurant object with valid restaurant.id value
                });
        })
            .then((restaurants) => {
                //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-fetchNeighborhoods()-3-restaurants');
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

        let loc = {};
        if (restaurant.latlng) loc = restaurant.latlng;
        else if (restaurant.lat) loc = {lat: restaurant.lat, lng: restaurant.lng};
        if (!loc || typeof loc === 'undefined' || loc.length === 0) {
            loc = {
                lat: 40.722216,
                lng: -73.987501
            };
        }
        //DBHelper.debugRestaurantInfo(loc, 'dbhelper-mapMarkerForRestaurant()-loc');

        const marker = new google.maps.Marker({
                position: loc,
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

        return dbPromise
            .then((db) => {
                const txRestaurants = db.transaction('restaurants', 'readonly');
                const restaurantsStore = txRestaurants.objectStore('restaurants');
                const restaurantsObj = restaurantsStore.getAllKeys();
                //DBHelper.debugRestaurantInfo(restaurantsObj, 'dbhelper-getAllRestaurants()-1-1-restaurantsObj');

                if (typeof restaurantsObj.map !== 'function') return false;

                let restaurants;
                restaurants = restaurantsObj.map((restaurant) => {
                    //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getAllIndexDbRestaurants()-1-2-restaurant');
                    return new Promise((resolve, reject) => {
                        DBHelper.getIndexDbRestaurantById(restaurant.restaurant_id, (error, result) => {
                            //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllIndexDbRestaurants()-1-3-getIndexDbRestaurantById()-error');
                            //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllIndexDbRestaurants()-1-3-getIndexDbRestaurantById()-result');
                            if (error || !result) reject(false);
                            resolve(result);
                        });
                    })
                        .then(restaurant, (result) => {
                            //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllIndexDbRestaurants()-1-4-result');
                            //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getAllIndexDbRestaurants()-1-4-restaurant');
                            if (result) return result;
                            else return restaurant;
                        })
                        .catch(error => {
                            // Oops!. Got an error from server.
                            error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getAllIndexDbRestaurants()-catch`);
                            console.log(error.message);
                            callback(error, null);
                        });
                });
                //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-getAllIndexDbRestaurants()-1-4-restaurants');
                return restaurants;
            })
            .then((restaurants) => {
                if (restaurants) {
                    callback(null, restaurants)
                }
                else {
                    callback('No results in idb', null);
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
            DBHelper.addUpdateLocalRestaurantOperationHoursById(restaurant, (error, result) => {
                cache_error = error;
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
                    .get(restaurant.id)
                    .then((item) => {
                        let restaurantObj = {
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
    static addUpdateLocalRestaurantOperationHoursById(restaurant, callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateLocalRestaurantOperationHoursById()');
        //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-addUpdateLocalRestaurantOperationHoursById()-restaurant');

        return dbPromise
            .then(db => {

                const txOperatingHours = db.transaction('operating_hours', 'readwrite');
                let operatingHoursStore = txOperatingHours.objectStore('operating_hours');

                // add delete logic here to improve application
                // delete all to add all, this will clear any deleted items as well

                return operatingHoursStore
                    .get(1)
                    .then(() => {
                        let operating_hours = restaurant.operating_hours;
                        //DBHelper.debugRestaurantInfo(operating_hours, 'dbhelper-addUpdateLocalRestaurantOperationHoursById()-operating_hours');

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
                        //DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateLocalRestaurantOperationHoursById()-txOperatingHours.complete');
                    })
                    .then(() => {
                        callback(null, true);
                    });
            })
            .catch(error => {
                callback(error + 'dbhelper-addUpdateLocalRestaurantOperationHoursById()-catch', null);
            });
    }

    /**
     * update a restaurant by its ID.
     */
    static addUpdateCacheRestaurantById(restaurant_id, callback) {
        DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateCacheRestaurantById()');
        DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-addUpdateCacheRestaurantById()-restaurant_id');

        return caches
            .open(staticCacheName)
            .then(function (cache) {
                DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateCacheRestaurantById()-Deleting index file cache');
                cache
                    .delete(new Request('/'))
                    .catch(error => {
                        return error;
                    });
                cache
                    .delete(new Request('/restaurant.html?id=' + restaurant_id))
                    .catch(error => {
                        return error;
                    });
                return cache;
            }).then(function () {
                DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateCacheRestaurantById()-Adding index file cache');
                return fetch(new Request('/'))
                    .then(function () {
                        DBHelper.debugRestaurantInfo('', 'dbhelper-addUpdateCacheRestaurantById()-Adding restaurant file cache');
                        return fetch(new Request('/restaurant.html?id=' + restaurant_id));
                    })
                    .catch(error => {
                        return error;
                    });
            }).then(function () {
                callback(null, true);
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
        //DBHelper.debugRestaurantInfo('', 'dbhelper-getAllRestaurants()');

        return new Promise((resolve, reject) => {
            resolve(true);
        })
            .then((result) => {
                //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllRestaurants()-2-1-result');
                //DBHelper.debugRestaurantInfo(this.restaurants, 'dbhelper-getAllRestaurants()-2-1-this.restaurants');

                return new Promise((resolve2, reject2) => {

                    DBHelper
                        .getAllIndexDbRestaurants((error, result) => {
                            //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllRestaurants()-2-3-getAllIndexDbRestaurants()-error');
                            //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllRestaurants()-2-3-getAllIndexDbRestaurants()-result');
                            if (error || !result) resolve2(false);
                            resolve2(result);
                        });
                })
                    .then((result) => {
                        //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllRestaurants()-2-4-getAllIndexDbRestaurants()-result');
                        return result;
                    })
                    .catch(error => {
                        // Oops!. Got an error from server.
                        // error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getAllIndexDbRestaurants()`);
                        // callback(error.message, null);
                        //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllRestaurants()-2-getAllIndexDbRestaurants()-catch');
                        return false;
                    });
            })
            .then((result) => {
                //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllRestaurants()-3-1-result');
                //DBHelper.debugRestaurantInfo(this.restaurants, 'dbhelper-getAllRestaurants()-3-1-this.restaurants');

                if (this.restaurants && this.restaurants.length > 0) return this.restaurants;

                return new Promise((resolve2, reject2) => {
                    DBHelper
                        .fetchRestaurants((error, result) => {
                            //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllRestaurants()-3-3-fetchRestaurants()-error');
                            //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllRestaurants()-3-3-fetchRestaurants()-result');
                            if (error || !result) resolve2(false);
                            resolve2(result);
                        });
                })
                    .catch(error => {
                        // Oops!. Got an error from server.
                        // error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchRestaurants()`);
                        // callback(error.message, null);
                        // return;
                        //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllRestaurants()-3-fetchRestaurants()-catch');
                        return error;
                    });
            })
            .then((restaurants) => {
                //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-getAllRestaurants()-4-1-restaurants');
                //DBHelper.debugRestaurantInfo(this.restaurants, 'dbhelper-getAllRestaurants()-4-1-this.restaurants');
                if (!restaurants || restaurants.length === 0) return this.restaurants;

                return new Promise((resolve2, reject2) => {
                    //DBHelper.debugRestaurantInfo(resolveResult, 'dbhelper-getAllRestaurants()-4-2-resolveResult');
                    //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-getAllRestaurants()-4-2-restaurants');

                    restaurants.map((restaurant) => {
                        //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getAllRestaurants()-4-3-restaurant');

                        const restaurant_id = ((restaurant.id ? restaurant.id : (restaurant.restaurant_id ? restaurant.restaurant_id : 0)));
                        //DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getAllRestaurants()-4-3-restaurant_id');
                        if (!restaurant_id) return restaurant;

                        return new Promise((resolve4, reject4) => {
                            //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getAllRestaurants()-4-4-1-restaurant');
                            //DBHelper.debugRestaurantInfo('', 'dbhelper-getAllRestaurants()-4-4-appendRestaurantProperties()-call');
                            DBHelper
                                .appendRestaurantProperties(restaurant, (error, result) => {
                                    //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllRestaurants()-4-4-2-appendRestaurantProperties()-error');
                                    //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllRestaurants()-4-4-2-appendRestaurantProperties()-result');
                                    if (error || !result) resolve4(restaurant);
                                    resolve4(result);
                                });
                        })
                            .then((restaurant) => {
                                //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getAllRestaurants()-4-4-3-restaurant');
                                return restaurant;
                            })
                            .catch(error => {
                                // // Oops!. Got an error from server.
                                // error.message = (`Request failed. Returned status of ${error.message} - dbhelper-appendRestaurantProperties()`);
                                // callback(error.message, null);
                                // return;
                                //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllRestaurants()-4-appendRestaurantProperties()-catch');
                                return error;
                            });
                        //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getAllRestaurants()-4-5-restaurant');
                        //return restaurant;
                    });
                    resolve2(restaurants);
                })
                    .then((restaurants) => {
                        //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-getAllRestaurants()-4-6-restaurants');
                        return restaurants;
                    })
                    .catch(error => {
                        // // Oops!. Got an error from server.
                        // error.message = (`Request failed. Returned status of ${error.message} - dbhelper-appendRestaurantProperties()`);
                        // callback(error.message, null);
                        // return;
                        //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllRestaurants()-4-new Promise()-catch');
                        return error;
                    });
            })
            .then((result) => {
                //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllRestaurants()-6-1-result');

                if (result && typeof result.then !== 'function' && result.length > 0) {
                    // update data
                    this.restaurants = result;
                    //DBHelper.debugRestaurantInfo(this.restaurants, 'dbhelper-getAllRestaurants()-6-1-this.restaurants');
                    callback(null, this.restaurants);
                }
                else callback('No restaurants', null);

            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getAllRestaurants - catch`);
                callback(error.message, null);
            });
    }

    /**
     * get restaurant by ID.
     */
    static getRestaurantById(restaurant_id, callback) {
        DBHelper.debugRestaurantInfo('', 'dbhelper-getRestaurantById()');
        DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getRestaurantById()-restaurant_id');

        let restaurant;
        if (this.restaurants) {
            restaurant = this.restaurants.filter(r => r.id == restaurant_id);
        }
        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-1-this.restaurant.filter');

        return new Promise((resolve, reject) => {
            resolve(true);
        })
            .then(() => {
                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-2-1-restaurant');
                if (restaurant) return restaurant;

                return new Promise((resolve2, reject2) => {
                    DBHelper.debugRestaurantInfo('', 'dbhelper-getRestaurantById()-2-2-getIndexDbRestaurantById()-call');
                    DBHelper
                        .getIndexDbRestaurantById(restaurant_id, (error, result) => {
                            DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantById()-2-3-getIndexDbRestaurantById()-error');
                            DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantById()-2-3-getIndexDbRestaurantById()-result');
                            if (error || !result) resolve2(false);

                            if (result) this.restaurant = result;
                            resolve2(result);
                        });
                });
            })
            .then((restaurant) => {
                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-3-1-restaurant');
                if (restaurant) return restaurant;

                return new Promise((resolve3, reject3) => {
                    DBHelper.debugRestaurantInfo('', 'dbhelper-getRestaurantById()-3-2-fetchRestaurantById()-call');
                    DBHelper
                        .fetchRestaurantById(restaurant_id, (error, result) => {
                            DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantById()-3-3-fetchRestaurantById()-error');
                            DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantById()-3-3-fetchRestaurantById()-result');
                            if (error || !result) reject3(error);
                            resolve3(result);
                        })
                })
                    .then((restaurant) => {
                        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-4-1-restaurant');
                        if (restaurant) {
                            return new Promise((resolve4, reject4) => {
                                DBHelper.debugRestaurantInfo('', 'dbhelper-getRestaurantById()-4-2-addUpdateCacheRestaurantById()-call');

                                DBHelper.addUpdateCacheRestaurantById(restaurant.restaurant_id, (error, result) => {
                                    DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantById()-4-3-fetchRestaurantById()-error');
                                    DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantById()-4-3-fetchRestaurantById()-result');
                                    if (error || !result) resolve4(restaurant);
                                    resolve4(restaurant);
                                });
                            });
                        }
                        return restaurant;
                    })
                    .catch(error => {
                        console.log('Error=' + (error.message));
                        return false;
                    });
            })
            .then((restaurant) => {
                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-5-1-restaurants');

                const restaurant_id = ((restaurant.id ? restaurant.id : (restaurant.restaurant_id ? restaurant.restaurant_id : 0)));
                DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getRestaurantById()-5-2-restaurant_id');

                if (!restaurant_id) return restaurant;

                //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-5-1-restaurant');

                return new Promise((resolve4, reject4) => {
                    DBHelper.debugRestaurantInfo('', 'dbhelper-getRestaurantById()-5-2-appendRestaurantProperties()-call');
                    DBHelper
                        .appendRestaurantProperties(restaurant, (error, result) => {
                            DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantById()-5-3-appendRestaurantProperties()-error');
                            DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantById()-5-3-appendRestaurantProperties()-result');
                            if (error || !result) resolve4(restaurant);
                            resolve4(result);
                        });
                })
                    .then((restaurant) => {
                        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-5-4-restaurant');
                        return restaurant;
                    })
                    .catch(error => {
                        // // Oops!. Got an error from server.
                        // error.message = (`Request failed. Returned status of ${error.message} - dbhelper-appendRestaurantProperties()`);
                        // callback(error.message, null);
                        // return;
                        //DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantById()-4-appendRestaurantProperties()-catch');
                        return error;
                    });
            })
            .then((restaurant) => {
                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-6-restaurant');
                // set/update current restaurant to this.restaurant variable
                if (restaurant) this.restaurant = restaurant;

                return restaurant;
            })
            .then((restaurant) => {
                //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-getRestaurantById()-7-restaurant');
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
        DBHelper.debugRestaurantInfo('', 'dbhelper-appendRestaurantProperties()');
        //DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-input-restaurant');
        DBHelper.debugRestaurantInfo(restaurant.operating_hours, 'dbhelper-appendRestaurantProperties()-input-restaurant.operating_hours');
        DBHelper.debugRestaurantInfo(restaurant.reviews, 'dbhelper-appendRestaurantProperties()-input-restaurant.reviews');

        if (restaurant &&
            (restaurant.operating_hours && restaurant.operating_hours.length && restaurant.operating_hours.length > 0) &&
            (restaurant.reviews && restaurant.reviews.length && restaurant.reviews.length > 0)
        ) {
            DBHelper.debugRestaurantInfo('', 'dbhelper-appendRestaurantProperties()-1-1-object already has operating_hours and reviews properties');
            callback(null, restaurant);
            return;
        }

        const restaurant_id = ((restaurant.id ? restaurant.id : (restaurant.restaurant_id ? restaurant.restaurant_id : 0)));
        DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-appendRestaurantProperties()-2-1-restaurant_id');

        new Promise((resolve, reject) => {
            resolve(true);
        })
            .then((result) => {
                if (restaurant &&
                    (restaurant.operating_hours && restaurant.operating_hours.length && restaurant.operating_hours.length > 0)
                ) {
                    DBHelper.debugRestaurantInfo('', 'dbhelper-appendRestaurantProperties()-2-1-object already has operating_hours properties');
                    return restaurant;
                }

                return new Promise((resolve2, reject2) => {
                    DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-2-1-restaurant');

                    DBHelper.debugRestaurantInfo('', 'dbhelper-appendRestaurantProperties()-2-2-getRestaurantOperatingHours()-call');
                    DBHelper
                        .getRestaurantOperatingHours(restaurant_id, (error, result) => {
                            DBHelper.debugRestaurantInfo(error, 'dbhelper-appendRestaurantProperties()-2-3-getRestaurantOperatingHours()-error');
                            DBHelper.debugRestaurantInfo(result, 'dbhelper-appendRestaurantProperties()-2-3-getRestaurantOperatingHours()-result');
                            if (error || !result) resolve2(false);
                            resolve2(result);
                        });
                })
                    .then((result) => {
                        DBHelper.debugRestaurantInfo(result, 'dbhelper-appendRestaurantProperties()-3-1-result');
                        if (result && result.length && result.length > 0) {
                            restaurant.operating_hours = result;
                        }
                        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-3-2-restaurant');
                        return restaurant;
                    })
                    .catch(error => {
                        // Oops!. Got an error from server.
                        const error_message = (`Request failed. Returned status of ${error.message} - dbhelper-appendRestaurantProperties()-3-catch`);
                        console.log(error_message);
                        return restaurant;
                    });
            })
            .then((restaurant) => {
                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-4-1-restaurant');

                if (restaurant &&
                    (restaurant.reviews && restaurant.reviews.length && restaurant.reviews.length > 0)
                ) {
                    DBHelper.debugRestaurantInfo('', 'dbhelper-appendRestaurantProperties()-4-1-object already has reviews properties');
                    return restaurant;
                }

                return new Promise((resolve3, reject3) => {
                    DBHelper.debugRestaurantInfo('', 'dbhelper-appendRestaurantProperties()-4-2-getReviewsByRestaurantId()-call');
                    DBHelper
                        .getReviewsByRestaurantId(restaurant_id, (error, result) => {
                            DBHelper.debugRestaurantInfo(error, 'dbhelper-appendRestaurantProperties()-4-3-getReviewsByRestaurantId()-error');
                            DBHelper.debugRestaurantInfo(result, 'dbhelper-appendRestaurantProperties()-4-3-getReviewsByRestaurantId()-result');
                            if (error || !result) reject3(false);
                            resolve3(result);
                        });
                })
                    .then((result) => {
                        DBHelper.debugRestaurantInfo(result, 'dbhelper-appendRestaurantProperties()-4-3-result');
                        if (result && result.length && result.length > 0) {
                            restaurant.reviews = result;
                        }
                        DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-4-4-restaurant');
                        return restaurant;
                    })
                    .catch(error => {
                        // Oops!. Got an error from server.
                        const error_message = (`Request failed. Returned status of ${error.message} - dbhelper-appendRestaurantProperties()-4-catch`);
                        console.log(error_message);
                        return restaurant;
                    });
            })
            .then((restaurant) => {

                if (restaurant) {
                    DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-5-1-restaurant');

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

                    DBHelper.debugRestaurantInfo(restaurant.id, 'dbhelper-appendRestaurantProperties()-5-2-restaurant.id');
                    DBHelper.debugRestaurantInfo(restaurant.restaurant_id, 'dbhelper-appendRestaurantProperties()-5-2-restaurant.restaurant_id');
                    DBHelper.debugRestaurantInfo(restaurant.operating_hours, 'dbhelper-appendRestaurantProperties()-5-2-restaurant.operating_hours');
                    DBHelper.debugRestaurantInfo(restaurant.reviews, 'dbhelper-appendRestaurantProperties()-5-2-restaurant.reviews');
                }
                return restaurant;
            })
            .then((restaurant) => {
                DBHelper.debugRestaurantInfo(restaurant, 'dbhelper-appendRestaurantProperties()-6');
                if (restaurant) callback(null, restaurant);
                else callback('No results in append restaurant properties', null);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                const error_message = (`Request failed. Returned status of ${error.message} - dbhelper-appendRestaurantProperties() - catch`);
                callback(error_message, null);
            });
    }

    static getRestaurantOperatingHours(restaurant_id, callback) {
        DBHelper.debugRestaurantInfo('', 'dbhelper-getRestaurantOperatingHours()');
        DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getRestaurantOperatingHours()-1-restaurant_id');

        new Promise((resolve, reject) => {
            DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getRestaurantOperatingHours()-2-1-restaurant_id');

            DBHelper.debugRestaurantInfo('', 'dbhelper-getRestaurantOperatingHours()-2-2-getIndexDbOperatingHoursByRestaurantId()-call');
            DBHelper
                .getIndexDbOperatingHoursByRestaurantId(restaurant_id, (error, result) => {
                    DBHelper.debugRestaurantInfo(error, 'dbhelper-getRestaurantOperatingHours()-2-3-getIndexDbOperatingHoursByRestaurantId()-error');
                    DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantOperatingHours()-2-3-getIndexDbOperatingHoursByRestaurantId()-result');
                    if (error || !result) resolve(false);
                    resolve(result);
                })
        })
            .then((result) => {
                DBHelper.debugRestaurantInfo(result, 'dbhelper-getRestaurantOperatingHours()-3-result');

                if (result) callback(null, result);
                else callback('No Hours for this restaurant', null);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                const error_message = (`Request failed. Returned status of ${error.message} - dbhelper-getRestaurantOperatingHours()`);
                callback(error_message, null);
            });
    }


    static getIndexDbOperatingHoursByRestaurantId(restaurant_id, callback) {
        DBHelper.debugRestaurantInfo('', 'dbhelper-getIndexDbOperatingHoursByRestaurantId()');
        DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getIndexDbOperatingHoursByRestaurantId()-restaurant_id');

        if (!restaurant_id) callback('Invalid restaurant_id', null);

        dbPromise.then(db => {
            const txOperatingHours = db.transaction('operating_hours', 'readonly');
            const operatingHoursStore = txOperatingHours.objectStore('operating_hours');

            return operatingHoursStore.getAll('restaurant_id', restaurant_id)
                .then((operating_hours) => {
                    DBHelper.debugRestaurantInfo(operating_hours, 'dbhelper-getIndexDbOperatingHoursByRestaurantId()-1-operating_hours');
                    if (!operating_hours) {
                        callback('No operating hours', null);
                        return;
                    }
                    callback(null, operating_hours);
                })
                .catch(error => {
                    // Oops!. Got an error from server.
                    error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getIndexDbOperatingHoursByRestaurantId()`);
                    callback(error.message, null);
                });
        })
    }


    /**
     * get all reviews.
     */
    static getAllReviews(callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-getAllReviews()');

        new Promise((resolve, reject) => {
            resolve(true);
        })
            .then(() => {
                //DBHelper.debugRestaurantInfo(this.reviews, 'dbhelper-getAllReviews()-1-this.reviews');
                if (!this.reviews) {
                    return new Promise((resolve2, reject2) => {
                        DBHelper.getAllIndexDbReviews((error, result) => {
                            //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllReviews()-2-error');
                            //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllReviews()-2-result');
                            if (error || !result) resolve2(false);
                            resolve2(result);
                        });
                    });
                }
                else return this.reviews;
            })
            .then((reviews) => {
                if (!reviews) {
                    return new Promise((resolve3, reject3) => {
                        DBHelper.fetchAllReviews((error, result) => {
                            //DBHelper.debugRestaurantInfo(error, 'dbhelper-getAllReviews()-3-error');
                            //DBHelper.debugRestaurantInfo(result, 'dbhelper-getAllReviews()-3-result');
                            if (error || !result) reject3(false);
                            resolve3(result);
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
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message}`);
                callback(error.message, null);
            });
    }

    /**
     * get db all reviews.
     */
    static getAllIndexDbReviews(callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-getAllIndexDbReviews()');

        dbPromise.then(function (db) {
            const txReviews = db.transaction('reviews', 'readonly');
            let reviewsStore = txReviews.objectStore('reviews');
            return reviewsStore.getAll()
                .catch(error => {
                    return false;
                });
        })
            .then((reviews) => {
                DBHelper.debugRestaurantInfo(reviews, 'dbhelper-getAllIndexDbReviews()-1-reviews');

                if (reviews) callback(null, reviews);
                else callback('No reviews for this restaurant', null);
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
                                return new Promise((resolve2, reject2) => {
                                    // add or update review in cache
                                    //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchAllReviews()-addUpdateCacheReviewById()-call');
                                    DBHelper.addUpdateCacheReviewById(review, (error, result) => {
                                        //DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchAllReviews()-2-addUpdateLocalReviewById()-error');
                                        //DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchAllReviews()-2-addUpdateLocalReviewById()-result');
                                        resolve2(true);
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
     * get all reviews.
     */
    static getReviewsByRestaurantId(restaurant_id, callback) {
        DBHelper.debugRestaurantInfo('', 'dbhelper-getReviewsByRestaurantId()');
        DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getReviewsByRestaurantId()-restaurant_id');

        new Promise((resolve, reject) => {
            resolve(true);
        })
            .then(() => {
                if (this.reviews && this.reviews.length && this.reviews.length > 0) {
                    let reviews = this.reviews.filter(r => r.restaurant_id == restaurant_id);
                    if (reviews && reviews.length && reviews.length > 0) {
                        DBHelper.debugRestaurantInfo(this.reviews, 'dbhelper-getReviewsByRestaurantId()-1-1-this.reviews');
                        return reviews;
                    }
                }

                return new Promise((resolve2, reject2) => {
                    DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getReviewsByRestaurantId()-2-1-restaurant_id');

                    DBHelper.debugRestaurantInfo('', 'dbhelper-getReviewsByRestaurantId()-2-2-getIndexDbReviewsByRestaurantId()-call');
                    DBHelper.getIndexDbReviewsByRestaurantId(restaurant_id, (error, result) => {
                        DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getReviewsByRestaurantId()-2-3-restaurant_id');
                        DBHelper.debugRestaurantInfo(error, 'dbhelper-getReviewsByRestaurantId()-2-3-getIndexDbReviewsByRestaurantId()-error');
                        DBHelper.debugRestaurantInfo(result, 'dbhelper-getReviewsByRestaurantId()-2-3-getIndexDbReviewsByRestaurantId()-result');
                        if (error || !result) resolve2(false);
                        resolve2(result);
                    });
                });
            })
            .then((reviews) => {
                DBHelper.debugRestaurantInfo(reviews, 'dbhelper-getReviewsByRestaurantId()-3-reviews');
                if (reviews && reviews.length && reviews.length > 0) return reviews;

                return new Promise((resolve3, reject3) => {
                    DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getReviewsByRestaurantId()-3-1-restaurant_id');

                    DBHelper.debugRestaurantInfo('', 'dbhelper-getReviewsByRestaurantId()-3-2-fetchAllReviewsByRestaurantId()-call');
                    DBHelper.fetchAllReviewsByRestaurantId(restaurant_id, (error, result) => {
                        DBHelper.debugRestaurantInfo(restaurant_id, 'dbhelper-getReviewsByRestaurantId()-3-3-restaurant_id');
                        DBHelper.debugRestaurantInfo(error, 'dbhelper-getReviewsByRestaurantId()-3-3-fetchAllReviewsByRestaurantId()-error');
                        DBHelper.debugRestaurantInfo(result, 'dbhelper-getReviewsByRestaurantId()-3-3-fetchAllReviewsByRestaurantId()-result');
                        if (error || !result) reject3(false);
                        resolve3(result);
                    });
                });
            })
            .then((reviews) => {
                DBHelper.debugRestaurantInfo(reviews, 'dbhelper-getReviewsByRestaurantId()-4-reviews');

                if (reviews && reviews.length && reviews.length > 0) callback(null, reviews);
                else callback('No reviews for this restaurant', null);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getReviewsByRestaurantId()-catch`);
                callback(error.message, null);
            });
    }

    /**
     * get db all reviews.
     */
    static getIndexDbReviewsByRestaurantId(restaurant_id, callback) {
        DBHelper.debugRestaurantInfo('', 'dbhelper-getIndexDbReviewsByRestaurantId()');

        dbPromise.then(function (db) {
            const txReviews = db.transaction('reviews', 'readonly');
            let reviewsStore = txReviews.objectStore('reviews');
            return reviewsStore.getAll('restaurant_id', restaurant_id)
                .catch(error => {
                    return false;
                });
        })
            .then((reviews) => {
                DBHelper.debugRestaurantInfo(reviews, 'dbhelper-getIndexDbReviewsByRestaurantId()-1-reviews');

                if (reviews) callback(null, reviews);
                else callback('No reviews for this restaurant', null);
            });
    }

    /**
     * Fetch all reviews
     */
    static fetchAllReviewsByRestaurantId(restaurant_id, callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchAllReviewsByRestaurantId()');

        // fetch all review with proper error handling.

        let requestURL = DBHelper.DATABASE_URL_REVIEWS + '?restaurant_id=' + (restaurant_id);
        //DBHelper.debugRestaurantInfo(requestURL, 'dbhelper-fetchAllReviewsByRestaurantId()-requestURL');

        return fetch(requestURL)
            .then(response => {
                const reviews = response.json();

                //DBHelper.debugRestaurantInfo(reviews, 'dbhelper-fetchAllReviewsByRestaurantId()-1-reviews');

                if (reviews && reviews.length && reviews.length > 0) {
                    return reviews.map(review => {
                        return new Promise((resolve, reject) => {
                            // add or update review in cache
                            //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchAllReviewsByRestaurantId()-addUpdateLocalReviewById()-call');
                            DBHelper.addUpdateLocalReviewById(review, (error, result) => {
                                //DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchAllReviewsByRestaurantId()-2-addUpdateLocalReviewById()-error');
                                //DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchAllReviewsByRestaurantId()-2-addUpdateLocalReviewById()-result');
                                resolve(true);
                            });
                        })
                            .then(() => {
                                return new Promise((resolve, reject) => {
                                    // add or update review in cache
                                    //DBHelper.debugRestaurantInfo('', 'dbhelper-fetchAllReviewsByRestaurantId()-addUpdateCacheReviewById()-call');
                                    DBHelper.addUpdateCacheReviewById(review, (error, result) => {
                                        //DBHelper.debugRestaurantInfo(error, 'dbhelper-fetchAllReviewsByRestaurantId()-2-addUpdateLocalReviewById()-error');
                                        //DBHelper.debugRestaurantInfo(result, 'dbhelper-fetchAllReviewsByRestaurantId()-2-addUpdateLocalReviewById()-result');
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
                error.message = (`Request failed-1. Returned status of ${error.message}-dbhelper-fetchAllReviewsByRestaurantId()-catch`);
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

                let review_id = idMax;
                //DBHelper.debugRestaurantInfo(review_id, 'dbhelper-addUpdateLocalReviewById()-1-1-review_id');

                if (review.review_id) review_id = review.review_id;
                //DBHelper.debugRestaurantInfo(review_id, 'dbhelper-addUpdateLocalReviewById()-1-2-review_id');

                return new Promise((resolve, reject) => {

                    resolve(reviewStore
                        .get(review_id));
                })
                    .then((result) => {
                        return {
                            review_id: review_id,
                            review: review,
                            item: result
                        };
                    })

                    .then((result) => {

                        let review_id = result.review_id;
                        let review = result.review;
                        let item = result.item;

                        //DBHelper.debugRestaurantInfo(review_id, 'dbhelper-addUpdateLocalReviewById()-2-review_id');
                        //DBHelper.debugRestaurantInfo(review, 'dbhelper-addUpdateLocalReviewById()-2-review');
                        //DBHelper.debugRestaurantInfo(item, 'dbhelper-addUpdateLocalReviewById()-2-item');

                        const rtNewItem = {
                            review_id: parseInt(review_id),
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
                        error.message = (`Request failed. Returned status of ${error.message} - addUpdateLocalReviewById`);
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

    static v1LoadData(callback) {
        //DBHelper.debugRestaurantInfo('', 'dbhelper-v1LoadData()');
        let is_db_populated;
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
                //DBHelper.debugRestaurantInfo('', 'dbhelper-v1LoadData()-2-1-call');
                //DBHelper.debugRestaurantInfo(is_db_populated, 'dbhelper-v1LoadData()-2-1-is_db_populated');
                return new Promise((resolve, reject) => {
                    //DBHelper.debugRestaurantInfo(is_db_populated, 'dbhelper-v1LoadData()-2-2-is_db_populated');
                    resolve(is_db_populated);
                })
                    .then((is_db_populated) => {

                        return new Promise((resolve2, reject2) => {
                            if (!is_db_populated) {
                                //DBHelper.debugRestaurantInfo('', 'dbhelper-v1LoadData()-2-2-v1AddRestaurantsData()-call');

                                DBHelper.v1AddRestaurantsData((error, result) => {
                                    //DBHelper.debugRestaurantInfo(error, 'dbhelper-v1LoadData()-2-3-v1AddRestaurantsData()-error');
                                    //DBHelper.debugRestaurantInfo(result, 'dbhelper-v1LoadData()-2-3-v1AddRestaurantsData()-result');
                                    if (error || !result) reject2(false);
                                    resolve2(result);
                                })
                            }
                            else {
                                //DBHelper.debugRestaurantInfo(false, 'dbhelper-v1LoadData()-2-4-v1AddRestaurantsData()-else-resolve');
                                resolve2(false);
                            }
                        })
                            .then((is_restaurants_added) => {

                                //DBHelper.debugRestaurantInfo(is_db_populated, 'dbhelper-v1LoadData()-3-1-is_db_populated');
                                //DBHelper.debugRestaurantInfo(is_restaurants_added, 'dbhelper-v1LoadData()-3-1-is_restaurants_added');

                                return is_restaurants_added;
                            })
                            .then((is_restaurants_added) => {

                                //DBHelper.debugRestaurantInfo(is_db_populated, 'dbhelper-v1LoadData()-4-1-is_db_populated');
                                //DBHelper.debugRestaurantInfo(is_restaurants_added, 'dbhelper-v1LoadData()-4-1-is_restaurants_added');

                                return new Promise((resolve3, reject3) => {
                                    return new Promise((resolve4, reject4) => {
                                        if (!is_db_populated) {
                                            return new Promise((resolve5, reject5) => {
                                                //DBHelper.debugRestaurantInfo('', 'dbhelper-v1LoadData()-4-2-v1AddReviewsData()-call');

                                                DBHelper.v1AddReviewsData((error, result) => {
                                                    //DBHelper.debugRestaurantInfo(error, 'dbhelper-v1LoadData()-4-3-v1AddReviewsData()-error');
                                                    //DBHelper.debugRestaurantInfo(result, 'dbhelper-v1LoadData()-4-3-v1AddReviewsData()-result');
                                                    if (error || !result) reject5(false);
                                                    resolve5(result);
                                                });
                                            })
                                                .then((result) => {
                                                    //DBHelper.debugRestaurantInfo(result, 'dbhelper-v1LoadData()-4-4-v1AddReviewsData()-if-result');
                                                    resolve4(result)
                                                });
                                        }
                                        else {
                                            //DBHelper.debugRestaurantInfo(is_db_populated, 'dbhelper-v1LoadData()-4-5-v1AddReviewsData()-else-is_db_populated');
                                            resolve4(is_db_populated);
                                        }
                                    })
                                        .then((result) => {
                                            //DBHelper.debugRestaurantInfo(result, 'dbhelper-v1LoadData()-4-6-v1AddReviewsData()-result');
                                            resolve3(result);
                                        });
                                });
                            })
                            .then((is_reviews_added) => {

                                //DBHelper.debugRestaurantInfo(is_db_populated, 'dbhelper-v1LoadData()-5-1-is_db_populated');
                                //DBHelper.debugRestaurantInfo(is_reviews_added, 'dbhelper-v1LoadData()-5-1-is_reviews_added');

                                return is_reviews_added;
                            });
                    })
                    .then(is_db_populated, (is_reviews_added) => {
                        //DBHelper.debugRestaurantInfo(is_db_populated, 'dbhelper-v1LoadData()-6-1-is_db_populated');
                        //DBHelper.debugRestaurantInfo(is_reviews_added, 'dbhelper-v1LoadData()-6-1-is_reviews_added');

                        return (is_db_populated || is_reviews_added);
                    })
                    .then((load_restaurants) => {
                        //DBHelper.debugRestaurantInfo(load_restaurants, 'dbhelper-v1LoadData()-7-1-load_restaurants');
                        if (!load_restaurants) {
                            callback('No data', null);
                            return
                        }
                        return new Promise((resolve, reject) => {
                            //DBHelper.debugRestaurantInfo('', 'dbhelper-v1LoadData()-7-2-getAllRestaurants()-call');

                            DBHelper.getAllRestaurants((error, result) => {
                                //DBHelper.debugRestaurantInfo(error, 'dbhelper-v1LoadData()-7-3-getAllRestaurants()-error');
                                //DBHelper.debugRestaurantInfo(result, 'dbhelper-v1LoadData()-7-3-getAllRestaurants()-result');
                                if (error || !result) reject(false);
                                resolve(result);
                            });
                        })
                            .then((restaurants) => {
                                //DBHelper.debugRestaurantInfo(restaurants, 'dbhelper-v1LoadData()-7-4-restaurants');
                                callback(null, restaurants);
                                return;
                            })
                            .catch(error => {
                                console.log('Load data error: ' + (error));
                                callback(error.message, null);
                                return
                            });
                    })
            })
            .catch(error => {
                console.log('Load data error: ' + (error));
                callback(error.message, null);
                return
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
                    return restaurants.map(restaurant => {
                        return new Promise((resolve2, reject2) => {
                            //DBHelper.debugRestaurantInfo('', 'dbhelper-v1AddRestaurantsData()-2-1-addUpdateLocalRestaurantById()-call');
                            DBHelper.addUpdateLocalRestaurantById(restaurant, (error, result) => {
                                //DBHelper.debugRestaurantInfo(error, 'dbhelper-v1AddRestaurantsData()-2-2-addUpdateLocalRestaurantById()-error');
                                //DBHelper.debugRestaurantInfo(result, 'dbhelper-v1AddRestaurantsData()-2-2-addUpdateLocalRestaurantById()-result');
                                if (error || !result) reject2(error);
                                resolve2(result);
                            })
                                .then((result) => {
                                    return new Promise((resolve3, reject3) => {
                                        //DBHelper.debugRestaurantInfo('', 'dbhelper-v1AddRestaurantsData()-2-3-addUpdateLocalRestaurantOperationHoursById()-call');
                                        DBHelper.addUpdateLocalRestaurantOperationHoursById(restaurant, (error, result) => {
                                            //DBHelper.debugRestaurantInfo(error, 'dbhelper-v1AddRestaurantsData()-2-4-addUpdateLocalRestaurantOperationHoursById()-error');
                                            //DBHelper.debugRestaurantInfo(result, 'dbhelper-v1AddRestaurantsData()-2-4-addUpdateLocalRestaurantOperationHoursById()-result');
                                            if (error || !result) reject3(error);
                                            resolve3(result);
                                        });
                                    });
                                });
                        });
                    });
                });
            })
            .then((result) => {
                //DBHelper.debugRestaurantInfo(result, 'dbhelper-v1AddRestaurantsData()-3-result');
                if (result) {
                    //DBHelper.debugRestaurantInfo('', 'dbhelper-v1AddRestaurantsData()-3-restaurant fetch data added');
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

                //DBHelper.debugRestaurantInfo(reviews, 'dbhelper-v1AddReviewsData()-2-reviews');
                if (!reviews || reviews.length === 0) return false;

                return dbPromise.then((db) => {
                    // add to database
                    return reviews.map(review => {
                        return new Promise((resolve2, reject2) => {
                            //DBHelper.debugRestaurantInfo('', 'dbhelper-v1AddReviewsData()-2-addUpdateLocalReviewById()-call');
                            DBHelper.addUpdateLocalReviewById(review, (error, result) => {
                                //DBHelper.debugRestaurantInfo(error, 'dbhelper-v1AddReviewsData()-2-2-addUpdateLocalReviewById()-error');
                                //DBHelper.debugRestaurantInfo(result, 'dbhelper-v1AddReviewsData()-2-2-addUpdateLocalReviewById()-result');
                                if (error || !result) reject2(error);
                                resolve2(result);
                            });
                        });
                    });
                });
            })
            .then((result) => {
                //DBHelper.debugRestaurantInfo(result, 'dbhelper-v1AddReviewsData()-3-result');
                if (result) {
                    //DBHelper.debugRestaurantInfo('', 'dbhelper-v1AddReviewsData()-3-reviews fetch data added');
                    callback(null, true);
                }
                else {
                    callback(false, null);
                }
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-v1AddReviewsData`);
                console.log(error.message);
                callback('Unable to load data', null);
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
                const part1 = (callername) + '=';
                let part2 = (obj);
                if (!(typeof obj === 'undefined' || obj === 'undefined' || obj === null || (typeof obj.toLowerCase === 'function' && obj.toLowerCase().search('error')))) {
                    //part2 = obj.toString().substring(0, 15);
                }
                const part3 = (' typeof=' + (typeof obj));
                const part4 = (' -- is empty=' + (obj === null || typeof obj === 'undefined' || obj.length === 0));

                data.push(((part1) + (part2) + (part3) + (part4)));
                if (counter > 5) return data;

                if (typeof obj === 'object' && obj !== null) {
                    for (const i in obj) {
                        const subObj = obj[i];
                        const subObjName = callername + '-' + counter + '-' + i;
                        data = DBHelper
                            .debugRestaurantInfo(subObj, subObjName, (counter + 1), data);
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


}

// module.exports = DBHelper;