// js/dbhelper.js

let debug = false;

//DBHelper.debugObject('', 'start /lib/dbhelper.js');

const appPrefix = 'mws-restaurant-stage-3';
const staticCacheName = appPrefix + '-v2';
const contentImgsCache = appPrefix + '-content-imgs';
const allCaches = [
    staticCacheName,
    contentImgsCache
];
const dbName = 'topRestaurants3';
const dbVersion = 5;

//DBHelper.debugObject(dbName, 'dbhelper-dbName');
//DBHelper.debugObject(dbVersion, 'dbhelper-dbVersion');

// https://github.com/jakearchibald/idb
// https://developers.google.com/web/ilt/pwa/lab-indexeddb
// https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore

const dbPromise = idb.open(dbName, dbVersion, function (upgradeDb) {
    //DBHelper.debugObject(upgradeDb.oldVersion, 'dbhelper-upgradeDb-upgradeDb.oldVersion');

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
        //DBHelper.debugObject('', 'dbhelper-upgradeDb-restaurantsObjectStore-setup');
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
        //DBHelper.debugObject('', 'dbhelper-upgradeDb-operatingHoursObjectStore-setup');
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
        //DBHelper.debugObject('', 'dbhelper-upgradeDb-reviewsObjectStore-setup');
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
        //DBHelper.debugObject('', 'dbhelper-upgradeDb-pendingObjectStore-setup');

        //DBHelper.debugObject(addV1Data, 'dbhelper-upgradeDb-3-addV1Data');
        case 4:
        //DBHelper.debugObject(addV1Data, 'dbhelper-upgradeDb-4-addV1Data');
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
        //DBHelper.debugObject('', 'dbhelper-fetchRestaurants()');

        return fetch(DBHelper.DATABASE_URL_RESTAURANTS, {
            headers: {'Content-Type': 'application/json'}
        })
            .then(networkResponse => networkResponse.json())
            .then((restaurants) => {
                //DBHelper.debugObject(restaurants, 'dbhelper-fetchRestaurants()-3-restaurants');
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
        //DBHelper.debugObject('', 'dbhelper-fetchRestaurantById()');
        let requestURL = DBHelper.DATABASE_URL_RESTAURANTS + '/' + id;
        //DBHelper.debugObject(requestURL, 'dbhelper-fetchRestaurantById()-requestURL');

        // fetch restaurant with proper error handling.
        return fetch(requestURL, {
            headers: {'Content-Type': 'application/json'}
        })
            .then(networkResponse => networkResponse.json())
            .then((restaurant) => {
                //DBHelper.debugObject(restaurant, 'dbhelper-fetchRestaurantById()-restaurant');
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
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, is_append_properties, callback) {
        //DBHelper.debugObject('', 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()');
        //DBHelper.debugObject(cuisine, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-input-cuisine');
        //DBHelper.debugObject(neighborhood, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-input-neighborhood');

        // Fetch all restaurants  with proper error handling
        return new Promise((resolve, reject) => {
            //DBHelper.debugObject('', 'dbhelper-fetchRestaurantByCuisineAndNeighborhood-1-1-getAllRestaurants()-call');
            DBHelper
                .getAllRestaurants(is_append_properties, (error, result) => {
                    //DBHelper.debugObject(error, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-1-2-getAllRestaurants()-error');
                    //DBHelper.debugObject(result, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-1-2-getAllRestaurants()-result');
                    if (error || !result) reject(false);
                    resolve(result); // resolve to restaurant object with valid restaurant.id value
                });
        })
            .then((results) => {
                //DBHelper.debugObject(cuisine, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-2-cuisine');
                //DBHelper.debugObject(neighborhood, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-2-neighborhood');
                //DBHelper.debugObject(results, 'dbhelper-fetchRestaurantByCuisineAndNeighborhood()-2-results');
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
    static fetchNeighborhoods(is_append_properties, callback) {
        //DBHelper.debugObject('', 'dbhelper-fetchNeighborhoods()');

        // Fetch all restaurants  with proper error handling
        return new Promise((resolve, reject) => {
            //DBHelper.debugObject('', 'dbhelper-fetchNeighborhoods-getAllRestaurants()-call');
            DBHelper
                .getAllRestaurants(is_append_properties, (error, result) => {
                    //DBHelper.debugObject(error, 'dbhelper-fetchNeighborhoods()-2-getAllRestaurants()-error');
                    //DBHelper.debugObject(result, 'dbhelper-fetchNeighborhoods()-2-getAllRestaurants()-result');
                    if (error || !result) reject(false);
                    resolve(result); // resolve to restaurant object with valid restaurant.id value
                });
        })
            .then((restaurants) => {
                //DBHelper.debugObject(restaurants, 'dbhelper-fetchNeighborhoods()-3-restaurants');
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
    static fetchCuisines(is_append_properties, callback) {
        //DBHelper.debugObject('', 'dbhelper-fetchCuisines()');

        // Fetch all restaurants  with proper error handling
        return new Promise((resolve, reject) => {
            //DBHelper.debugObject('', 'dbhelper-fetchCuisines-getAllRestaurants()-call');
            DBHelper
                .getAllRestaurants(is_append_properties, (error, result) => {
                    DBHelper.debugObject(error, 'dbhelper-fetchCuisines()-2-getAllRestaurants()-error');
                    //DBHelper.debugObject(result, 'dbhelper-fetchCuisines()-2-getAllRestaurants()-result');
                    if (error || !result) reject(false);
                    resolve(result); // resolve to restaurant object with valid restaurant.id value
                });
        })
            .then((restaurants) => {
                //DBHelper.debugObject(restaurants, 'dbhelper-fetchCuisines()-3-restaurants');
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
        //DBHelper.debugObject('', 'dbhelper-urlForRestaurant()');
        //DBHelper.debugObject(restaurant, 'dbhelper-urlForRestaurant()-restaurant');
        return (`./restaurant.html?id=${restaurant.id ? restaurant.id : restaurant.restaurant_id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        //DBHelper.debugObject('', 'dbhelper-imageUrlForRestaurant()');
        //DBHelper.debugObject(restaurant, 'dbhelper-imageUrlForRestaurant()-restaurant');
        if (restaurant.photograph) {
            return (`img/${restaurant.photograph}.jpg`);
        }
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        //DBHelper.debugObject('', 'dbhelper-mapMarkerForRestaurant()');
        //DBHelper.debugObject(restaurant, 'dbhelper-mapMarkerForRestaurant()-restaurant');

        //https://stackoverflow.com/questions/22903756/using-regular-expression-to-validate-latitude-and-longitude-coordinates-then-dis
        //const latlng_regexp = new RegExp("^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6}");

        let loc = {};
        //DBHelper.debugObject(restaurant.latlng.lat, 'dbhelper-mapMarkerForRestaurant()-restaurant.latlng.lat');
        if (restaurant.latlng.lat) {
            //DBHelper.debugObject(restaurant.latlng, 'dbhelper-mapMarkerForRestaurant()-restaurant.latlng');
            loc = {lat: restaurant.latlng.lat, lng: restaurant.latlng.lng};
        }
        else {
            //DBHelper.debugObject(restaurant.lat, 'dbhelper-mapMarkerForRestaurant()-restaurant.lat');
            if (restaurant.lat) {
                //DBHelper.debugObject(restaurant.lat, 'dbhelper-mapMarkerForRestaurant()-restaurant.lat');
                //DBHelper.debugObject(restaurant.lng, 'dbhelper-mapMarkerForRestaurant()-restaurant.lng');
                loc = {lat: restaurant.lat, lng: restaurant.lng};
            }
            else {
                loc = {
                    lat: 40.722216,
                    lng: -73.987501
                };
            }
        }
        //DBHelper.debugObject(loc, 'dbhelper-mapMarkerForRestaurant()-loc');

        // update map center
        const map_center = new google.maps.LatLng(loc.lat, loc.lng);
        map.panTo(map_center);

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
        //DBHelper.debugObject('', 'dbhelper-isIndexDbPopulated()');

        return dbPromise
            .then(db => {
                const txRestaurants = db.transaction('restaurants', 'readonly');
                const restaurantsStore = txRestaurants.objectStore('restaurants');
                return restaurantsStore.getAllKeys();
            })
            .then((restaurants) => {
                return (typeof restaurants !== 'undefined' && restaurants && restaurants.length && restaurants.length > 0) ? callback(null, true) : callback(null, false);
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
        //DBHelper.debugObject('', 'dbhelper-getAllIndexDbRestaurants()');

        return dbPromise
            .then((db) => {
                const txRestaurants = db.transaction('restaurants', 'readonly');
                const restaurantsStore = txRestaurants.objectStore('restaurants');
                return restaurantsStore.getAll()
                    .then((restaurantsObj) => {

                        //DBHelper.debugObject(restaurantsObj, 'dbhelper-getAllRestaurants()-1-1-restaurantsObj');

                        if (typeof restaurantsObj.map !== 'function') return false;

                        let restaurants = restaurantsObj;

                        return new Promise((resolve, reject) => {
                            restaurants.map((restaurant) => {
                                //DBHelper.debugObject(restaurant.restaurant_id, 'dbhelper-getAllIndexDbRestaurants()-1-2-restaurant_id');
                                return new Promise((resolve2, reject2) => {
                                    DBHelper.getIndexDbRestaurantById(restaurant.restaurant_id, (error, result) => {
                                        //DBHelper.debugObject(error, 'dbhelper-getAllIndexDbRestaurants()-1-3-getIndexDbRestaurantById()-error');
                                        //DBHelper.debugObject(result, 'dbhelper-getAllIndexDbRestaurants()-1-3-getIndexDbRestaurantById()-result');
                                        if (error || !result) reject(false);
                                        resolve2(result);
                                    });
                                })
                            });

                            resolve(restaurants);
                        })
                            .then((result) => {
                                //DBHelper.debugObject(result, 'dbhelper-getAllIndexDbRestaurants()-1-4-result');
                                return result;
                            })
                            .catch(error => {
                                // Oops!. Got an error from server.
                                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getAllIndexDbRestaurants()-catch`);
                                return error;
                            });
                    });
            })
            .then((restaurants) => {
                //DBHelper.debugObject(restaurants, 'dbhelper-getAllIndexDbRestaurants()-2-1-restaurants');
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
        //DBHelper.debugObject('', 'dbhelper-getIndexDbRestaurantById()');
        //DBHelper.debugObject(restaurant_id, 'dbhelper-getIndexDbRestaurantById()-input-restaurant_id');

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
                        //DBHelper.debugObject(restaurant, 'dbhelper-getIndexDbRestaurantById()-1-restaurant');
                        return restaurant;
                    });
            })
            .then((restaurantRow) => {
                //DBHelper.debugObject(restaurantRow, 'dbhelper-getIndexDbRestaurantById()-2-1-restaurantRow');
                if (!restaurantRow) {
                    const error_message = (`No restaurant info found in idb - dbhelper-getIndexDbRestaurantById()-2`);
                    callback(error_message, null);
                    return;
                }
                //DBHelper.debugObject(restaurantRow, 'dbhelper-getIndexDbRestaurantById()-2-2-restaurantRow');
                //DBHelper.debugObject(restaurantRow.restaurant_id, 'dbhelper-getIndexDbRestaurantById()-2-2-restaurantRow.restaurant_id');

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

                //DBHelper.debugObject(restaurant, 'dbhelper-getIndexDbRestaurantById()-2-3-restaurant');

                return restaurant;
            })
            .then((restaurant) => {
                //DBHelper.debugObject(restaurant, 'dbhelper-getIndexDbRestaurantById()-3-1-restaurant');

                if (!restaurant) {
                    const error_message = (`No restaurant info found in idb - dbhelper-getIndexDbRestaurantById()-3`);
                    callback(error_message, null);
                    return;
                }

                callback(null, restaurant);
                return;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getIndexDbRestaurantById()-catch`);
                console.log(error.message);
                callback(error.message, null);
                return;
            });
    }


    /**
     * update a restaurant by its ID.
     */
    static addUpdateRestaurantById(restaurant, callback) {
        //DBHelper.debugObject('', 'dbhelper-addUpdateRestaurantById()');
        //DBHelper.debugObject(restaurant, 'dbhelper-addUpdateRestaurantById()-restaurant');

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
            DBHelper.addUpdateCacheRestaurantById(restaurant.id, (error, result) => {
                cache_error = error;
            });
        }).then(() => {
            DBHelper.addUpdateRemoteRestaurantById(restaurant, (error, result) => {
                remote_error = error;
            });
        }).then(() => {
            //DBHelper.debugObject(local_error, 'dbhelper-addUpdateRestaurantById()-local_error');
            //DBHelper.debugObject(cache_error, 'dbhelper-addUpdateRestaurantById()-cache_error');
            //DBHelper.debugObject(remote_error, 'dbhelper-addUpdateRestaurantById()-remote_error');

            if (local_error || cache_error || remote_error) {
                callback(local_error || cache_error || remote_error, null);
                return;
            }
            callback(null, restaurant);
        })
            .catch(error => {
                callback(error.message, null);
            });
    }

    /**
     * update a restaurant by its ID.
     */
    static addUpdateLocalRestaurantById(restaurant, callback) {
        //DBHelper.debugObject('', 'dbhelper-addUpdateLocalRestaurantById()');
        //DBHelper.debugObject(restaurant, 'dbhelper-addUpdateLocalRestaurantById()-restaurant');

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
        //DBHelper.debugObject('', 'dbhelper-addUpdateLocalRestaurantOperationHoursById()');
        //DBHelper.debugObject(restaurant, 'dbhelper-addUpdateLocalRestaurantOperationHoursById()-restaurant');

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
                        //DBHelper.debugObject(operating_hours, 'dbhelper-addUpdateLocalRestaurantOperationHoursById()-operating_hours');

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
                        //DBHelper.debugObject('', 'dbhelper-addUpdateLocalRestaurantOperationHoursById()-txOperatingHours.complete');
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
        //DBHelper.debugObject('', 'dbhelper-addUpdateCacheRestaurantById()');
        //DBHelper.debugObject(restaurant_id, 'dbhelper-addUpdateCacheRestaurantById()-restaurant_id');

        if (!navigator.onLine) {
            callback(null, 'Offline');
            return;
        }

        caches
            .open(staticCacheName)
            .then(function (cache) {
                //DBHelper.debugObject('', 'dbhelper-addUpdateCacheRestaurantById()-Deleting index file cache');
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
            //DBHelper.debugObject('', 'dbhelper-addUpdateCacheRestaurantById()-Adding index file cache');
            return fetch(new Request('/'))
                .then(function () {
                    //DBHelper.debugObject('', 'dbhelper-addUpdateCacheRestaurantById()-Adding restaurant file cache');
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
        //DBHelper.debugObject('', 'dbhelper-addUpdateRemoteRestaurantById()');
        //DBHelper.debugObject(restaurant, 'dbhelper-addUpdateRemoteRestaurantById()-restaurant');

        let requestURL = DBHelper.DATABASE_URL_RESTAURANTS + '/' + restaurant.id;
        //DBHelper.debugObject(requestURL, 'dbhelper-addUpdateRemoteRestaurantById()-requestURL');

        const requestMethod = 'PUT';
        const requestBody = JSON.stringify(restaurant);
        const requestHeaders = {
            'Content-Type': 'application/json'
        };

        return fetch(requestURL, {
            method: requestMethod, body: requestBody, headers: requestHeaders
        })
            .catch(error => {

                if (navigator.onLine) {
                    // Oops!. Got an error from server.
                    error.message = (`Request failed. Returned status of ${error.message} - dbhelper-addUpdateRemoteRestaurantById()`);
                    callback(error, null);
                }

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
                    //DBHelper.debugObject(pending, 'dbhelper-addUpdateRemoteRestaurantById()-1-pending');

                    pendingStore.put(pending);
                    txPending.complete;
                    return true;
                }).then(result => {
                    callback(null, result);
                })
                    .catch(error => {
                        error.message = (`Request failed. Returned status of ${error.message} - dbhelper-addUpdateRemoteRestaurantById()-catch`);
                        callback(error, null);
                    });
            });
    }

    /**
     * Fetch all reviews.
     */
    static fetchReviewsByRestaurantId(restaurant_id, callback) {
        //DBHelper.debugObject('', 'dbhelper-fetchReviewsByRestaurantId()');
        //DBHelper.debugObject(restaurant_id, 'dbhelper-fetchReviewsByRestaurantId()-restaurant_id');

        const requestURL = DBHelper.DATABASE_URL_REVIEWS + '?restaurant_id=' + restaurant_id;
        //DBHelper.debugObject(requestURL, 'dbhelper-fetchReviewsByRestaurantId()-requestURL');

        return fetch(requestURL)
            .then(response => response.json())
            .then((reviews) => {
                //DBHelper.debugObject(reviews, 'dbhelper-fetchReviewsByRestaurantId()-1-reviews');
                return reviews.map(review => {
                    return new Promise((resolve, reject) => {
                        resolve(true);
                    })
                        .then((result) => {
                            //DBHelper.debugObject(result, 'restaurant-saveNewReview()-result');
                            return new Promise((resolve2, reject2) => {
                                //DBHelper.debugObject('', 'dbhelper-addUpdateReviewById()-addUpdateCacheReviewById()-call');
                                DBHelper.addUpdateLocalAndCacheReviewById(review, (error, result) => {
                                    //DBHelper.debugObject(error, 'dbhelper-addUpdateReviewById()-addUpdateCacheReviewById()-error');
                                    //DBHelper.debugObject(result, 'dbhelper-addUpdateReviewById()-addUpdateCacheReviewById()-result');
                                    if (error) reject2(error);
                                    resolve2(result);
                                });
                            })
                        })
                        .then(review, () => {
                            return review;
                        })
                        .catch(error => {
                            // Oops!. Got an error from server.
                            error.message = (`${error.message} - dbhelper-fetchReviewsByRestaurantId()-2-catch`);
                            console.log(error.message);
                            return review;
                        });
                });
            })
            .then((reviews) => {
                //DBHelper.debugObject(reviews, 'dbhelper-fetchReviewsByRestaurantId()-4-reviews');
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
    static getAllRestaurants(is_append_properties, callback) {
        //DBHelper.debugObject('', 'dbhelper-getAllRestaurants()');
        //DBHelper.debugObject(is_append_properties, 'dbhelper-getAllRestaurants()-input-is_append_properties');

        if (this.restaurants && this.restaurants.length > 0) {
            callback(null, this.restaurants);
        }

        return new Promise((resolve, reject) => {
            resolve(true);
        })
            .then((result) => {
                //DBHelper.debugObject(result, 'dbhelper-getAllRestaurants()-2-1-result');
                //DBHelper.debugObject(this.restaurants, 'dbhelper-getAllRestaurants()-2-1-this.restaurants');

                return new Promise((resolve2, reject2) => {

                    DBHelper
                        .getAllIndexDbRestaurants((error, result) => {
                            DBHelper.debugObject(error, 'dbhelper-getAllRestaurants()-2-3-getAllIndexDbRestaurants()-error');
                            //DBHelper.debugObject(result, 'dbhelper-getAllRestaurants()-2-3-getAllIndexDbRestaurants()-result');
                            if (error || !result) resolve2(false);
                            resolve2(result);
                        });
                })
                    .then((result) => {
                        //DBHelper.debugObject(result, 'dbhelper-getAllRestaurants()-2-4-result');
                        return result;
                    })
                    .catch(error => {
                        // Oops!. Got an error from server.
                        // error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getAllIndexDbRestaurants()`);
                        // callback(error.message, null);
                        //DBHelper.debugObject(error, 'dbhelper-getAllRestaurants()-2-getAllIndexDbRestaurants()-catch');
                        return false;
                    });
            })
            .then((result) => {
                //DBHelper.debugObject(result, 'dbhelper-getAllRestaurants()-3-1-result');
                //DBHelper.debugObject(this.restaurants, 'dbhelper-getAllRestaurants()-3-1-this.restaurants');

                if (this.restaurants && this.restaurants.length > 0) return this.restaurants;
                if (result && result.length > 0) return result;

                return new Promise((resolve2, reject2) => {
                    //DBHelper.debugObject(result, 'dbhelper-getAllRestaurants()-3-2-fetchRestaurants()-call');
                    DBHelper
                        .fetchRestaurants((error, result) => {
                            //DBHelper.debugObject(error, 'dbhelper-getAllRestaurants()-3-3-fetchRestaurants()-error');
                            //DBHelper.debugObject(result, 'dbhelper-getAllRestaurants()-3-3-fetchRestaurants()-result');
                            if (error || !result) resolve2(false);
                            resolve2(result);
                        });
                })
                    .catch(error => {
                        // Oops!. Got an error from server.
                        // error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchRestaurants()`);
                        // callback(error.message, null);
                        // return;
                        //DBHelper.debugObject(error, 'dbhelper-getAllRestaurants()-3-fetchRestaurants()-catch');
                        return error;
                    });
            })
            .then((restaurants) => {
                //DBHelper.debugObject(restaurants, 'dbhelper-getAllRestaurants()-4-1-restaurants');
                //DBHelper.debugObject(this.restaurants, 'dbhelper-getAllRestaurants()-4-1-this.restaurants');
                if (!restaurants || restaurants.length === 0) return this.restaurants;

                // not working in offline mode
                // if (!is_append_properties) {
                //     callback(null, restaurants);
                //     return false;
                // }

                return new Promise((resolve2, reject2) => {
                    //DBHelper.debugObject(resolveResult, 'dbhelper-getAllRestaurants()-4-2-resolveResult');
                    //DBHelper.debugObject(restaurants, 'dbhelper-getAllRestaurants()-4-2-restaurants');

                    restaurants.map((restaurant) => {
                        //DBHelper.debugObject(restaurant, 'dbhelper-getAllRestaurants()-4-3-restaurant');

                        const restaurant_id = ((restaurant.id ? restaurant.id : (restaurant.restaurant_id ? restaurant.restaurant_id : 0)));
                        //DBHelper.debugObject(restaurant_id, 'dbhelper-getAllRestaurants()-4-3-restaurant_id');
                        if (!restaurant_id) return restaurant;

                        return new Promise((resolve4, reject4) => {
                            //DBHelper.debugObject(restaurant, 'dbhelper-getAllRestaurants()-4-4-1-restaurant');
                            //DBHelper.debugObject('', 'dbhelper-getAllRestaurants()-4-4-appendRestaurantProperties()-call');
                            DBHelper
                                .appendRestaurantProperties(restaurant, (error, result) => {
                                    //DBHelper.debugObject(error, 'dbhelper-getAllRestaurants()-4-4-2-appendRestaurantProperties()-error');
                                    //DBHelper.debugObject(result, 'dbhelper-getAllRestaurants()-4-4-2-appendRestaurantProperties()-result');
                                    if (error || !result) resolve4(restaurant);
                                    resolve4(result);
                                });
                        })
                            .then((restaurant) => {
                                //DBHelper.debugObject(restaurant, 'dbhelper-getAllRestaurants()-4-4-3-restaurant');
                                return restaurant;
                            })
                            .catch(error => {
                                // // Oops!. Got an error from server.
                                // error.message = (`Request failed. Returned status of ${error.message} - dbhelper-appendRestaurantProperties()`);
                                // callback(error.message, null);
                                // return;
                                //DBHelper.debugObject(error, 'dbhelper-getAllRestaurants()-4-appendRestaurantProperties()-catch');
                                return error;
                            });
                        //DBHelper.debugObject(restaurant, 'dbhelper-getAllRestaurants()-4-5-restaurant');
                        //return restaurant;
                    });
                    resolve2(restaurants);
                })
                    .then((restaurants) => {
                        //DBHelper.debugObject(restaurants, 'dbhelper-getAllRestaurants()-4-6-restaurants');
                        return restaurants;
                    })
                    .catch(error => {
                        // // Oops!. Got an error from server.
                        // error.message = (`Request failed. Returned status of ${error.message} - dbhelper-appendRestaurantProperties()`);
                        // callback(error.message, null);
                        // return;
                        //DBHelper.debugObject(error, 'dbhelper-getAllRestaurants()-4-new Promise()-catch');
                        return error;
                    });
            })
            .then((result) => {
                //DBHelper.debugObject(result, 'dbhelper-getAllRestaurants()-6-1-result');

                if (result && typeof result.then !== 'function' && result.length > 0) {
                    // update data
                    this.restaurants = result;
                    //DBHelper.debugObject(this.restaurants, 'dbhelper-getAllRestaurants()-6-1-this.restaurants');
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
        //DBHelper.debugObject('', 'dbhelper-getRestaurantById()');
        //DBHelper.debugObject(restaurant_id, 'dbhelper-getRestaurantById()-restaurant_id');

        let restaurant;
        if (this.restaurants) {
            //DBHelper.debugObject('', 'dbhelper-getRestaurantById()-1-this.restaurant.filter');
            restaurant = this.restaurants.filter(r => r.id == restaurant_id);
        }
        //DBHelper.debugObject(restaurant, 'dbhelper-getRestaurantById()-1-restaurant');

        return new Promise((resolve, reject) => {
            resolve(true);
        })
            .then(() => {
                //DBHelper.debugObject(restaurant, 'dbhelper-getRestaurantById()-2-1-restaurant');
                if (restaurant) return restaurant;

                return new Promise((resolve2, reject2) => {
                    //DBHelper.debugObject('', 'dbhelper-getRestaurantById()-2-2-getIndexDbRestaurantById()-call');
                    DBHelper
                        .getIndexDbRestaurantById(restaurant_id, (error, result) => {
                            //DBHelper.debugObject(error, 'dbhelper-getRestaurantById()-2-3-getIndexDbRestaurantById()-error');
                            //DBHelper.debugObject(result, 'dbhelper-getRestaurantById()-2-3-getIndexDbRestaurantById()-result');
                            if (error || !result) resolve2(false);

                            if (result) this.restaurant = result;
                            resolve2(result);
                        });
                })
                    .catch(error => {
                        error.message = (`${error.message} - dbhelper-getRestaurantById()-2`);
                        return error;
                    });
            })
            .then((restaurant) => {
                //DBHelper.debugObject(restaurant, 'dbhelper-getRestaurantById()-3-1-restaurant');
                if (restaurant) return restaurant;

                return new Promise((resolve3, reject3) => {
                    //DBHelper.debugObject('', 'dbhelper-getRestaurantById()-3-2-fetchRestaurantById()-call');
                    DBHelper
                        .fetchRestaurantById(restaurant_id, (error, result) => {
                            //DBHelper.debugObject(error, 'dbhelper-getRestaurantById()-3-3-fetchRestaurantById()-error');
                            //DBHelper.debugObject(result, 'dbhelper-getRestaurantById()-3-3-fetchRestaurantById()-result');
                            if (error || !result) reject3(error);
                            resolve3(result);
                        })
                })
                    .then((restaurant) => {
                        //DBHelper.debugObject(restaurant, 'dbhelper-getRestaurantById()-4-1-restaurant');
                        if (restaurant) {
                            return new Promise((resolve4, reject4) => {
                                //DBHelper.debugObject('', 'dbhelper-getRestaurantById()-4-2-addUpdateCacheRestaurantById()-call');

                                DBHelper.addUpdateCacheRestaurantById(restaurant.id, (error, result) => {
                                    //DBHelper.debugObject(error, 'dbhelper-getRestaurantById()-4-3-fetchRestaurantById()-error');
                                    //DBHelper.debugObject(result, 'dbhelper-getRestaurantById()-4-3-fetchRestaurantById()-result');
                                    if (error || !result) resolve4(restaurant);
                                    resolve4(restaurant);
                                });
                            });
                        }
                        return restaurant;
                    })
                    .catch(error => {
                        error.message = (`${error.message} - dbhelper-getRestaurantById()-4`);
                        return error;
                    });
            })
            .then((restaurant) => {
                //DBHelper.debugObject(restaurant, 'dbhelper-getRestaurantById()-5-1-restaurants');

                if (!restaurant) return restaurant;

                restaurant_id = ((restaurant.id ? restaurant.id : (restaurant.restaurant_id ? restaurant.restaurant_id : 0)));
                //DBHelper.debugObject(restaurant_id, 'dbhelper-getRestaurantById()-5-2-restaurant_id');

                if (!restaurant_id) return restaurant;

                //DBHelper.debugObject(restaurant, 'dbhelper-getRestaurantById()-5-1-restaurant');

                return new Promise((resolve4, reject4) => {
                    //DBHelper.debugObject('', 'dbhelper-getRestaurantById()-5-2-appendRestaurantProperties()-call');
                    DBHelper
                        .appendRestaurantProperties(restaurant, (error, result) => {
                            //DBHelper.debugObject(error, 'dbhelper-getRestaurantById()-5-3-appendRestaurantProperties()-error');
                            //DBHelper.debugObject(result, 'dbhelper-getRestaurantById()-5-3-appendRestaurantProperties()-result');
                            if (error || !result) resolve4(restaurant);
                            resolve4(result);
                        });
                })
                    .then((restaurant) => {
                        //DBHelper.debugObject(restaurant, 'dbhelper-getRestaurantById()-5-4-restaurant');
                        return restaurant;
                    })
                    .catch(error => {
                        // // Oops!. Got an error from server.
                        // error.message = (`Request failed. Returned status of ${error.message} - dbhelper-appendRestaurantProperties()`);
                        // callback(error.message, null);
                        // return;
                        //DBHelper.debugObject(error, 'dbhelper-getRestaurantById()-4-appendRestaurantProperties()-catch');
                        error.message = (`${error.message} - dbhelper-getRestaurantById()-5`);
                        return error;
                    });
            })
            .then((restaurant) => {
                //DBHelper.debugObject(restaurant, 'dbhelper-getRestaurantById()-6-restaurant');
                //DBHelper.debugObject('', 'dbhelper-getRestaurantById()-6-set/update current restaurant to this.restaurant variable');
                if (restaurant) this.restaurant = restaurant;

                return restaurant;
            })
            .then((restaurant) => {
                //DBHelper.debugObject(restaurant, 'dbhelper-getRestaurantById()-7-restaurant');
                callback(null, restaurant);
                return;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getRestaurantById()-catch`);
                callback(error.message, null);
                return;
            });
    }

    static appendRestaurantProperties(restaurant, callback) {
        //DBHelper.debugObject('', 'dbhelper-appendRestaurantProperties()-input');
        //DBHelper.debugObject(restaurant, 'dbhelper-appendRestaurantProperties()-input-restaurant');
        //DBHelper.debugObject(restaurant.operating_hours, 'dbhelper-appendRestaurantProperties()-input-restaurant.operating_hours');
        //DBHelper.debugObject(restaurant.reviews, 'dbhelper-appendRestaurantProperties()-input-restaurant.reviews');

        const restaurant_id = ((restaurant.id ? restaurant.id : (restaurant.restaurant_id ? restaurant.restaurant_id : 0)));
        //DBHelper.debugObject(restaurant_id, 'dbhelper-appendRestaurantProperties()-1-1-restaurant_id');

        if (restaurant &&
            (restaurant.operating_hours && restaurant.operating_hours.length && restaurant.operating_hours.length > 0) &&
            (restaurant.reviews && restaurant.reviews.length && restaurant.reviews.length > 0)
        ) {
            //DBHelper.debugObject('', 'dbhelper-appendRestaurantProperties()-1-2-object already has operating_hours and reviews properties');
            callback(null, restaurant);
            return;
        }

        new Promise((resolve, reject) => {
            resolve(true);
        })
            .then((result) => {
                //DBHelper.debugObject(restaurant.operating_hours, 'dbhelper-appendRestaurantProperties()-2-1-restaurant.operating_hours');
                if (restaurant &&
                    (restaurant.operating_hours && restaurant.operating_hours.length && restaurant.operating_hours.length > 0)
                ) {
                    //DBHelper.debugObject('', 'dbhelper-appendRestaurantProperties()-2-1-object already has operating_hours properties');
                    return restaurant;
                }

                return new Promise((resolve2, reject2) => {
                    //DBHelper.debugObject(restaurant, 'dbhelper-appendRestaurantProperties()-2-1-restaurant');

                    //DBHelper.debugObject('', 'dbhelper-appendRestaurantProperties()-2-2-getRestaurantOperatingHours()-call');
                    DBHelper
                        .getOperatingHoursByRestaurantId(restaurant_id, (error, result) => {
                            //DBHelper.debugObject(error, 'dbhelper-appendRestaurantProperties()-2-3-getRestaurantOperatingHours()-error');
                            //DBHelper.debugObject(result, 'dbhelper-appendRestaurantProperties()-2-3-getRestaurantOperatingHours()-result');
                            if (error || !result) resolve2(false);
                            resolve2(result);
                        });
                })
                    .then((result) => {
                        //DBHelper.debugObject(result, 'dbhelper-appendRestaurantProperties()-2-4-result');
                        if (result) {
                            restaurant.operating_hours = result;
                        }
                        //DBHelper.debugObject(restaurant.operating_hours, 'dbhelper-appendRestaurantProperties()-2-4-restaurant.operating_hours');
                        return restaurant;
                    })
                    .catch(error => {
                        // Oops!. Got an error from server.
                        const error_message = (`Request failed. Returned status of ${error.message} - dbhelper-appendRestaurantProperties()-2-catch`);
                        console.log(error_message);
                        return restaurant;
                    });
            })
            .then((restaurant) => {
                //DBHelper.debugObject(restaurant, 'dbhelper-appendRestaurantProperties()-3-1-restaurant');

                if (restaurant &&
                    (restaurant.reviews && restaurant.reviews.length && restaurant.reviews.length > 0)
                ) {
                    //DBHelper.debugObject('', 'dbhelper-appendRestaurantProperties()-3-1-object already has reviews properties');
                    return restaurant;
                }

                return new Promise((resolve3, reject3) => {
                    //DBHelper.debugObject('', 'dbhelper-appendRestaurantProperties()-3-2-getReviewsByRestaurantId()-call');
                    DBHelper
                        .getReviewsByRestaurantId(restaurant_id, (error, result) => {
                            //DBHelper.debugObject(error, 'dbhelper-appendRestaurantProperties()-3-3-getReviewsByRestaurantId()-error');
                            //DBHelper.debugObject(result, 'dbhelper-appendRestaurantProperties()-3-3-getReviewsByRestaurantId()-result');
                            if (error || !result) reject3(false);
                            resolve3(result);
                        });
                })
                    .then((result) => {
                        //DBHelper.debugObject(result, 'dbhelper-appendRestaurantProperties()-3-4-result');
                        if (result && result.length && result.length > 0) {
                            restaurant.reviews = result;
                        }
                        //DBHelper.debugObject(restaurant, 'dbhelper-appendRestaurantProperties()-3-4-restaurant');
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

                if (restaurant) {
                    //DBHelper.debugObject(restaurant, 'dbhelper-appendRestaurantProperties()-4-1-restaurant');

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

                    //DBHelper.debugObject(restaurant.id, 'dbhelper-appendRestaurantProperties()-5-2-restaurant.id');
                    //DBHelper.debugObject(restaurant.restaurant_id, 'dbhelper-appendRestaurantProperties()-5-2-restaurant.restaurant_id');
                    //DBHelper.debugObject(restaurant.operating_hours, 'dbhelper-appendRestaurantProperties()-5-2-restaurant.operating_hours');
                    //DBHelper.debugObject(restaurant.reviews, 'dbhelper-appendRestaurantProperties()-5-2-restaurant.reviews');
                }
                return restaurant;
            })
            .then((restaurant) => {
                //DBHelper.debugObject(restaurant, 'dbhelper-appendRestaurantProperties()-6');
                if (restaurant) callback(null, restaurant);
                else callback('No results in append restaurant properties', null);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                const error_message = (`Request failed. Returned status of ${error.message} - dbhelper-appendRestaurantProperties() - catch`);
                callback(error_message, null);
            });
    }

    static getOperatingHoursByRestaurantId(restaurant_id, callback) {
        //DBHelper.debugObject('', 'dbhelper-getOperatingHoursByRestaurantId()');
        //DBHelper.debugObject(restaurant_id, 'dbhelper-getOperatingHoursByRestaurantId()-input-restaurant_id');

        new Promise((resolve, reject) => {
            resolve(true);
        })
            .then(() => {
                return new Promise((resolve2, reject2) => {
                    //DBHelper.debugObject(restaurant_id, 'dbhelper-getOperatingHoursByRestaurantId()-2-1-restaurant_id');

                    //DBHelper.debugObject('', 'dbhelper-getOperatingHoursByRestaurantId()-2-2-getIndexDbOperatingHoursByRestaurantId()-call');
                    DBHelper.getIndexDbOperatingHoursByRestaurantId(restaurant_id, (error, result) => {
                        //DBHelper.debugObject(restaurant_id, 'dbhelper-getOperatingHoursByRestaurantId()-2-3-restaurant_id');
                        //DBHelper.debugObject(error, 'dbhelper-getOperatingHoursByRestaurantId()-2-3-getIndexDbOperatingHoursByRestaurantId()-error');
                        //DBHelper.debugObject(result, 'dbhelper-getOperatingHoursByRestaurantId()-2-3-getIndexDbOperatingHoursByRestaurantId()-result');
                        if (error || !result) resolve2(false);
                        resolve2(result);
                    });
                });
            })
            .then((operating_hours) => {
                //DBHelper.debugObject(operating_hours, 'dbhelper-getOperatingHoursByRestaurantId()-3-operating_hours');
                if (operating_hours) return operating_hours;

                return new Promise((resolve3, reject3) => {
                    //DBHelper.debugObject(restaurant_id, 'dbhelper-getOperatingHoursByRestaurantId()-3-1-restaurant_id');

                    //DBHelper.debugObject('', 'dbhelper-getOperatingHoursByRestaurantId()-3-2-fetchOperatingHoursByRestaurantId()-call');
                    DBHelper.fetchOperatingHoursByRestaurantId(restaurant_id, (error, result) => {
                        //DBHelper.debugObject(restaurant_id, 'dbhelper-getOperatingHoursByRestaurantId()-3-3-restaurant_id');
                        //DBHelper.debugObject(error, 'dbhelper-getOperatingHoursByRestaurantId()-3-3-fetchOperatingHoursByRestaurantId()-error');
                        //DBHelper.debugObject(result, 'dbhelper-getOperatingHoursByRestaurantId()-3-3-fetchOperatingHoursByRestaurantId()-result');
                        if (error || !result) reject3(false);
                        resolve3(result);
                    });
                });
            })
            .then((operating_hours) => {
                //DBHelper.debugObject(operating_hours, 'dbhelper-getOperatingHoursByRestaurantId()-4-operating_hours');

                if (operating_hours) callback(null, operating_hours);
                else callback('No operating hours for this restaurant', null);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getOperatingHoursByRestaurantId()-catch`);
                callback(error.message, null);
            });
    }


    static getIndexDbOperatingHoursByRestaurantId(restaurant_id, callback) {
        //DBHelper.debugObject('', 'dbhelper-getIndexDbOperatingHoursByRestaurantId()');
        //DBHelper.debugObject(restaurant_id, 'dbhelper-getIndexDbOperatingHoursByRestaurantId()-restaurant_id');

        if (!restaurant_id) callback('Invalid restaurant_id', null);

        dbPromise.then((db) => {
            const txOperatingHours = db.transaction('operating_hours', 'readonly');
            let operatingHoursStore = txOperatingHours.objectStore('operating_hours');

            return operatingHoursStore.getAll()
                .then((operating_hours) => {
                    //DBHelper.debugObject(operating_hours, 'dbhelper-getIndexDbOperatingHoursByRestaurantId()-2-operating_hours');
                    if (operating_hours && operating_hours.length > 0) {
                        operating_hours = operating_hours.filter(r => r.restaurant_id == restaurant_id);
                        //DBHelper.debugObject(operating_hours, 'dbhelper-getIndexDbOperatingHoursByRestaurantId()-2-operating_hours');
                    }

                    if (operating_hours && operating_hours.length > 0) {

                        let restaurant_operating_hours = {};
                        operating_hours.map(operating_hour => {
                            const day = operating_hour.day;
                            const hours = operating_hour.hours;
                            if (!(DBHelper.isObjectEmpty(day) || DBHelper.isObjectEmpty(hours))) restaurant_operating_hours[day] = hours;
                            return operating_hour;
                        });
                        //DBHelper.debugObject(restaurant_operating_hours, 'dbhelper-getIndexDbOperatingHoursByRestaurantId()-2-restaurant_operating_hours');

                        callback(null, restaurant_operating_hours);
                    }
                    else callback('No operating hours for this restaurant', null);
                })
                .catch(error => {
                    // Oops!. Got an error from server.
                    error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getIndexDbOperatingHoursByRestaurantId()`);
                    callback(error.message, null);
                });
        });
    }

    /**
     * Fetch all operating hours
     */
    static fetchOperatingHoursByRestaurantId(restaurant_id, callback) {
        //DBHelper.debugObject('', 'dbhelper-fetchOperatingHoursByRestaurantId()');
        //DBHelper.debugObject(restaurant_id, 'dbhelper-fetchOperatingHoursByRestaurantId()-restaurant_id');

        return new Promise((resolve, reject) => {
            //DBHelper.debugObject('', 'dbhelper-fetchOperatingHoursByRestaurantId()-3-2-fetchRestaurantById()-call');
            DBHelper
                .fetchRestaurantById(restaurant_id, (error, result) => {
                    //DBHelper.debugObject(error, 'dbhelper-fetchOperatingHoursByRestaurantId()-3-3-fetchRestaurantById()-error');
                    //DBHelper.debugObject(result, 'dbhelper-fetchOperatingHoursByRestaurantId()-3-3-fetchRestaurantById()-result');
                    if (error || !result) reject(error);
                    resolve(result);
                })
        })
            .then((restaurant) => {
                //DBHelper.debugObject(restaurant, 'dbhelper-fetchOperatingHoursByRestaurantId()-4-1-restaurant');

                if (!restaurant) {
                    callback('Could not fetch details of this restaurant', null);
                    return;
                }

                callback(null, restaurant.operating_hours);
            })
            .catch(error => {
                //DBHelper.debugObject(error, 'dbhelper-fetchOperatingHoursByRestaurantId()-catch');
                callback(error.message, null);
            });

    }

    /**
     * get all reviews.
     */
    static getReviewsByRestaurantId(restaurant_id, callback) {
        //DBHelper.debugObject('', 'dbhelper-getReviewsByRestaurantId()');
        //DBHelper.debugObject(restaurant_id, 'dbhelper-getReviewsByRestaurantId()-restaurant_id');

        new Promise((resolve, reject) => {
            resolve(true);
        })
            .then(() => {

                return new Promise((resolve2, reject2) => {
                    //DBHelper.debugObject(restaurant_id, 'dbhelper-getReviewsByRestaurantId()-2-1-restaurant_id');

                    //DBHelper.debugObject('', 'dbhelper-getReviewsByRestaurantId()-2-2-getIndexDbReviewsByRestaurantId()-call');
                    DBHelper.getIndexDbReviewsByRestaurantId(restaurant_id, (error, result) => {
                        //DBHelper.debugObject(restaurant_id, 'dbhelper-getReviewsByRestaurantId()-2-3-restaurant_id');
                        //DBHelper.debugObject(error, 'dbhelper-getReviewsByRestaurantId()-2-3-getIndexDbReviewsByRestaurantId()-error');
                        //DBHelper.debugObject(result, 'dbhelper-getReviewsByRestaurantId()-2-3-getIndexDbReviewsByRestaurantId()-result');
                        if (error || !result) resolve2(false);
                        resolve2(result);
                    });
                });
            })
            .then((reviews) => {
                //DBHelper.debugObject(reviews, 'dbhelper-getReviewsByRestaurantId()-3-reviews');
                if (reviews && reviews.length && reviews.length > 0) return reviews;

                return new Promise((resolve3, reject3) => {
                    //DBHelper.debugObject(restaurant_id, 'dbhelper-getReviewsByRestaurantId()-3-1-restaurant_id');

                    //DBHelper.debugObject('', 'dbhelper-getReviewsByRestaurantId()-3-2-fetchAllReviewsByRestaurantId()-call');
                    DBHelper.fetchReviewsByRestaurantId(restaurant_id, (error, result) => {
                        //DBHelper.debugObject(restaurant_id, 'dbhelper-getReviewsByRestaurantId()-3-3-restaurant_id');
                        //DBHelper.debugObject(error, 'dbhelper-getReviewsByRestaurantId()-3-3-fetchAllReviewsByRestaurantId()-error');
                        //DBHelper.debugObject(result, 'dbhelper-getReviewsByRestaurantId()-3-3-fetchAllReviewsByRestaurantId()-result');
                        if (error || !result) reject3(false);
                        resolve3(result);
                    });
                });
            })
            .then((reviews) => {
                //DBHelper.debugObject(reviews, 'dbhelper-getReviewsByRestaurantId()-4-reviews');

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
        //DBHelper.debugObject('', 'dbhelper-getIndexDbReviewsByRestaurantId()');
        //DBHelper.debugObject(restaurant_id, 'dbhelper-getIndexDbReviewsByRestaurantId()-input-restaurant_id');

        dbPromise.then((db) => {
            const txReviews = db.transaction('reviews', 'readonly');
            let reviewsStore = txReviews.objectStore('reviews');

            return reviewsStore.getAll()
                .then((reviews) => {
                    //DBHelper.debugObject(reviews, 'dbhelper-getIndexDbReviewsByRestaurantId()-2-reviews');
                    if (reviews && reviews.length > 0) {
                        reviews = reviews.filter(r => r.restaurant_id == restaurant_id);
                        //DBHelper.debugObject(reviews, 'dbhelper-getIndexDbReviewsByRestaurantId()-2-reviews');
                    }

                    if (reviews && reviews.length > 0) {
                        callback(null, reviews);
                    }
                    else callback('No reviews for this restaurant', null);
                })
                .catch(error => {
                    // Oops!. Got an error from server.
                    error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getIndexDbReviewsByRestaurantId()-catch`);
                    callback(error.message, null);
                });
        });
    }

    /**
     * update a review by its ID.
     */
    static addUpdateReviewById(review, callback) {
        DBHelper.debugObject('', 'dbhelper-addUpdateReviewById()');
        DBHelper.debugObject(review, 'dbhelper-addUpdateReviewById()-review');

        new Promise((resolve, reject) => {
            resolve(true);
        })
            .then((result) => {
                DBHelper.debugObject(result, 'restaurant-saveNewReview()-result');
                return new Promise((resolve2, reject2) => {
                    DBHelper.debugObject('', 'dbhelper-addUpdateReviewById()-addUpdateCacheReviewById()-call');
                    DBHelper.addUpdateLocalAndCacheReviewById(review, (error, result) => {
                        DBHelper.debugObject(error, 'dbhelper-addUpdateReviewById()-addUpdateCacheReviewById()-error');
                        DBHelper.debugObject(result, 'dbhelper-addUpdateReviewById()-addUpdateCacheReviewById()-result');
                        if (error) reject2(error);
                        resolve2(result);
                    });
                })
            })
            .then((result) => {
                DBHelper.debugObject(result, 'restaurant-saveNewReview()-result');
                return new Promise((resolve3, reject3) => {
                    DBHelper.debugObject('', 'dbhelper-addUpdateReviewById()-addUpdateRemoteReviewById()-call');
                    DBHelper.addUpdateRemoteReviewById(review, (error, result) => {
                        DBHelper.debugObject(error, 'dbhelper-addUpdateReviewById()-addUpdateRemoteReviewById()-error');
                        DBHelper.debugObject(result, 'dbhelper-addUpdateReviewById()-addUpdateRemoteReviewById()-result');
                        if (error) reject3(error);
                        resolve3(result);
                    });
                })
            })
            .then((result) => {
                DBHelper.debugObject(result, 'restaurant-saveNewReview()-result');
                return new Promise((resolve4, reject4) => {
                    DBHelper.fetchReviewsByRestaurantId(review.restaurant_id, (error, result) => {
                        DBHelper.debugObject(error, 'restaurant-addUpdateReviewById()-fetchReviewsByRestaurantId()-error');
                        DBHelper.debugObject(result, 'restaurant-addUpdateReviewById()-fetchReviewsByRestaurantId()-result');
                        if (error) reject4(error);
                        resolve4(result);
                    });
                });
            })
            .then((result) => {
                if (result) callback(null, true);
                else callback('One or more process failed to update restaurant data', null);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-addUpdateReviewById()-catch`);
                callback(error.message, null);
            });
    }

    static addUpdateLocalAndCacheReviewById(review, callback) {
        //DBHelper.debugObject('', 'dbhelper-addUpdateLocalAndCacheReviewById()');
        //DBHelper.debugObject(review, 'dbhelper-addUpdateLocalAndCacheReviewById()-input-review');

        new Promise((resolve, reject) => {
            //DBHelper.debugObject('', 'dbhelper-addUpdateLocalAndCacheReviewById()-1-addUpdateLocalReviewById()-call');
            DBHelper.addUpdateLocalReviewById(review, (error, result) => {
                //DBHelper.debugObject(error, 'dbhelper-addUpdateLocalAndCacheReviewById()-1-addUpdateLocalReviewById()-error');
                //DBHelper.debugObject(result, 'dbhelper-addUpdateLocalAndCacheReviewById()-1-addUpdateLocalReviewById()-result');
                if (error) reject(error);
                resolve(result);
            });
        })
            .then((result) => {
                //DBHelper.debugObject(result, 'restaurant-addUpdateLocalAndCacheReviewById()-2-result');
                if (!result) return false;

                return new Promise((resolve2, reject2) => {
                    //DBHelper.debugObject('', 'dbhelper-addUpdateLocalAndCacheReviewById()-2-addUpdateCacheReviewById()-call');
                    DBHelper.addUpdateCacheReviewById(review, (error, result) => {
                        //DBHelper.debugObject(error, 'dbhelper-addUpdateLocalAndCacheReviewById()-2-addUpdateCacheReviewById()-error');
                        //DBHelper.debugObject(result, 'dbhelper-addUpdateLocalAndCacheReviewById()-2-addUpdateCacheReviewById()-result');
                        if (error) reject2(error);
                        // valid with result=false
                        // as a cache version may not exists for a restaurant
                        resolve2(result);
                    });
                })
            })
            .then((result) => {
                //DBHelper.debugObject(result, 'restaurant-addUpdateLocalAndCacheReviewById()-3-result');

                callback(null, true);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-addUpdateLocalAndCacheReviewById()-catch`);
                callback(error.message, null);
            });
    }

    /**
     * update a review by its ID.
     */
    static addUpdateLocalReviewById(review, callback) {
        //DBHelper.debugObject('', 'dbhelper-addUpdateLocalReviewById()');
        //DBHelper.debugObject(review, 'dbhelper-addUpdateLocalReviewById()-review');

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
                //DBHelper.debugObject(review_id, 'dbhelper-addUpdateLocalReviewById()-1-1-review_id');

                if (review.review_id) review_id = review.review_id;
                //DBHelper.debugObject(review_id, 'dbhelper-addUpdateLocalReviewById()-1-2-review_id');

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

                        //DBHelper.debugObject(review_id, 'dbhelper-addUpdateLocalReviewById()-2-review_id');
                        //DBHelper.debugObject(review, 'dbhelper-addUpdateLocalReviewById()-2-review');
                        //DBHelper.debugObject(item, 'dbhelper-addUpdateLocalReviewById()-2-item');

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
                    })
                    .catch(error => {
                        // Oops!. Got an error from server.
                        error.message = (`Request failed. Returned status of ${error.message} - addUpdateLocalReviewById()-catch`);
                        callback(error, null);
                    });
            });
        });
    }

    /**
     * update a review by its ID.
     */
    static addUpdateCacheReviewById(review, callback) {
        //DBHelper.debugObject('', 'dbhelper-addUpdateCacheReviewById()');
        //DBHelper.debugObject(review, 'dbhelper-addUpdateCacheReviewById()-review');

        new Promise((resolve, reject) => {
            DBHelper.addUpdateCacheRestaurantById(restaurant_id, (error, result) => {
                resolve(result);
            });
        })
            .then(() => {
                callback(null, true);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - addUpdateCacheReviewById()-catch`);
                callback(error, null);
            });
    }

    /**
     * update a review by its ID.
     */
    static addUpdateRemoteReviewById(review, callback) {
        //DBHelper.debugObject('', 'dbhelper-addUpdateRemoteReviewById()');
        //DBHelper.debugObject(review, 'dbhelper-addUpdateRemoteReviewById()-review');

        let requestURL = DBHelper.DATABASE_URL_REVIEWS;
        //DBHelper.debugObject(requestURL, 'dbhelper-addUpdateRemoteReviewById()-requestURL');

        // add remove id name as well
        const review_id = review.review_id;
        delete review.review_id;
        review.id = review_id;
        //DBHelper.debugObject(review.id, 'dbhelper-addUpdateRemoteReviewById()-review.id');

        if (review.id.length > 0) {
            requestURL += '/' + review.id;
            //DBHelper.debugObject(requestURL, 'dbhelper-addUpdateRemoteReviewById()-requestURL');
        }

        const requestMethod = 'PUT';
        const requestBody = JSON.stringify(review);
        const requestHeaders = {
            'Content-Type': 'application/json'
        };

        return fetch(requestURL, {
            method: requestMethod, body: requestBody, headers: requestHeaders
        })
            .catch(error => {

                if (navigator.onLine) {
                    // Oops!. Got an error from server.
                    error.message = (`Request failed. Returned status of ${error.message} - dbhelper-addUpdateRemoteReviewById()`);
                    callback(error, null);
                }

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
                    //DBHelper.debugObject(pending, 'dbhelper-addUpdateRemoteReviewById()-1-pending');

                    pendingStore.put(pending);
                    txPending.complete;
                    return true;
                }).then(result => {
                    callback(null, result);
                })
                    .catch(error => {
                        error.message = (`Request failed. Returned status of ${error.message} - dbhelper-addUpdateRemoteReviewById()-catch`);
                        callback(error, null);
                    });
            });
    }

    static v1LoadData(load_all_restaurants, callback) {
        //DBHelper.debugObject('', 'dbhelper-v1LoadData()');
        //DBHelper.debugObject(load_all_restaurants, 'dbhelper-v1LoadData()-input-load_all_restaurants');

        return new Promise((resolve, reject) => {
            DBHelper.isIndexDbPopulated((error, result) => {
                //DBHelper.debugObject(error, 'dbhelper-v1LoadData()-1-isIndexDbPopulated()-error');
                //DBHelper.debugObject(result, 'dbhelper-v1LoadData()-1-isIndexDbPopulated()-result');
                if (error || !result) resolve(false);
                resolve(result);
            });
        })
            .then((is_db_populated) => {
                //DBHelper.debugObject(is_db_populated, 'dbhelper-v1LoadData()-2-1-is_db_populated');

                if (is_db_populated) return is_db_populated;

                //DBHelper.debugObject('', 'dbhelper-v1LoadData()-2-2-new Promise-load data');
                return new Promise((resolve, reject) => {
                    //DBHelper.debugObject(is_db_populated, 'dbhelper-v1LoadData()-2-2-is_db_populated');
                    resolve(is_db_populated);
                })
                    .then((is_db_populated) => {

                        return new Promise((resolve2, reject2) => {
                            //DBHelper.debugObject('', 'dbhelper-v1LoadData()-2-2-v1AddRestaurantsData()-call');

                            DBHelper.v1AddRestaurantsData((error, result) => {
                                //DBHelper.debugObject(error, 'dbhelper-v1LoadData()-2-3-v1AddRestaurantsData()-error');
                                //DBHelper.debugObject(result, 'dbhelper-v1LoadData()-2-3-v1AddRestaurantsData()-result');
                                if (error || !result) reject2(false);
                                resolve2(result);
                            })
                        })
                            .then((is_restaurants_added) => {
                                //DBHelper.debugObject(is_restaurants_added, 'dbhelper-v1LoadData()-4-1-is_restaurants_added');

                                if (!is_restaurants_added) return is_restaurants_added;

                                return new Promise((resolve3, reject3) => {
                                    //DBHelper.debugObject('', 'dbhelper-v1LoadData()-4-2-v1AddReviewsData()-call');

                                    DBHelper.v1AddReviewsData((error, result) => {
                                        //DBHelper.debugObject(error, 'dbhelper-v1LoadData()-4-3-v1AddReviewsData()-error');
                                        //DBHelper.debugObject(result, 'dbhelper-v1LoadData()-4-3-v1AddReviewsData()-result');
                                        if (error || !result) reject3(false);
                                        resolve3(result);
                                    });
                                })
                                    .then((is_reviews_added) => {
                                        //DBHelper.debugObject(is_reviews_added, 'dbhelper-v1LoadData()-5-1-is_reviews_added');

                                        return is_reviews_added;
                                    });
                            });
                    })
                    .then((is_restaurants_or_reviews_added) => {
                        //DBHelper.debugObject(is_db_populated, 'dbhelper-v1LoadData()-6-1-is_db_populated');
                        //DBHelper.debugObject(is_restaurants_or_reviews_added, 'dbhelper-v1LoadData()-6-1-is_restaurants_or_reviews_added');

                        return (is_db_populated || is_restaurants_or_reviews_added);
                    })
            })
            .then((is_db_populated_or_restaurants_or_reviews_added) => {
                //DBHelper.debugObject(is_db_populated_or_restaurants_or_reviews_added, 'dbhelper-v1LoadData()-3-1-is_db_populated_or_restaurants_or_reviews_added');
                if (!is_db_populated_or_restaurants_or_reviews_added) {
                    callback('Unable to retrive restaurants data', null);
                    return;
                }

                //DBHelper.debugObject(load_all_restaurants, 'dbhelper-v1LoadData()-3-1-load_all_restaurants');
                if (!load_all_restaurants) {
                    callback(null, true);
                }
                return load_all_restaurants;
            })
            .then((load_all_restaurants) => {
                //DBHelper.debugObject(load_all_restaurants, 'dbhelper-v1LoadData()-4-1-load_all_restaurants');

                if (!load_all_restaurants) return load_all_restaurants;

                return new Promise((resolve, reject) => {
                    //DBHelper.debugObject('', 'dbhelper-v1LoadData()-4-2-getAllRestaurants()-call');
                    DBHelper.getAllIndexDbRestaurants((error, result) => {
                        //DBHelper.debugObject(error, 'dbhelper-v1LoadData()-7-3-getAllRestaurants()-error');
                        //DBHelper.debugObject(result, 'dbhelper-v1LoadData()-7-3-getAllRestaurants()-result');
                        if (error || !result) reject(false);
                        resolve(result);
                    });
                })
                    .catch(error => {
                        //console.log('Load data error: ' + (error));
                        callback(error.message, null);
                    })
            })
            .then((restaurants) => {
                //DBHelper.debugObject(restaurants, 'dbhelper-v1LoadData()-5-1-restaurants');
                if (restaurants) callback(null, restaurants);
                else callback('No Restaurants data', null);
            })
            .catch(error => {
                //console.log('Load data error: ' + (error));
                callback(error.message, null);
            });
    }

    static v1AddRestaurantsData(callback) {
        //DBHelper.debugObject('', 'dbhelper-v1AddRestaurantsData()');

        return new Promise((resolve, reject) => {

            const requestUrl = DBHelper.DATABASE_URL_RESTAURANTS;
            //DBHelper.debugObject(requestUrl, 'dbhelper-v1AddRestaurantsData()-1-requestUrl');

            return fetch(requestUrl)
                .then(response => resolve(response.json()))
        })
            .then((restaurants) => {

                //DBHelper.debugObject(restaurants, 'dbhelper-v1AddRestaurantsData()-2-restaurants');
                if (!restaurants || restaurants.length === 0) return false;

                return dbPromise.then((db) => {
                    // add to database
                    return restaurants.map(restaurant => {
                        return new Promise((resolve2, reject2) => {
                            //DBHelper.debugObject('', 'dbhelper-v1AddRestaurantsData()-2-1-addUpdateLocalRestaurantById()-call');
                            DBHelper.addUpdateLocalRestaurantById(restaurant, (error, result) => {
                                //DBHelper.debugObject(error, 'dbhelper-v1AddRestaurantsData()-2-2-addUpdateLocalRestaurantById()-error');
                                //DBHelper.debugObject(result, 'dbhelper-v1AddRestaurantsData()-2-2-addUpdateLocalRestaurantById()-result');
                                if (error || !result) reject2(error);
                                resolve2(result);
                            })
                                .then((result) => {
                                    return new Promise((resolve3, reject3) => {
                                        //DBHelper.debugObject('', 'dbhelper-v1AddRestaurantsData()-2-3-addUpdateLocalRestaurantOperationHoursById()-call');
                                        DBHelper.addUpdateLocalRestaurantOperationHoursById(restaurant, (error, result) => {
                                            //DBHelper.debugObject(error, 'dbhelper-v1AddRestaurantsData()-2-4-addUpdateLocalRestaurantOperationHoursById()-error');
                                            //DBHelper.debugObject(result, 'dbhelper-v1AddRestaurantsData()-2-4-addUpdateLocalRestaurantOperationHoursById()-result');
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
                //DBHelper.debugObject(result, 'dbhelper-v1AddRestaurantsData()-3-result');
                if (result) {
                    //DBHelper.debugObject('', 'dbhelper-v1AddRestaurantsData()-3-restaurant fetch data added');
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
        //DBHelper.debugObject('', 'dbhelper-v1AddReviewsData()');

        return new Promise((resolve, reject) => {

            const requestUrl = DBHelper.DATABASE_URL_REVIEWS;
            //DBHelper.debugObject(requestUrl, 'dbhelper-v1AddReviewsData()-1-requestUrl');

            return fetch(requestUrl)
                .then(response => resolve(response.json()))
        })
            .then((reviews) => {

                //DBHelper.debugObject(reviews, 'dbhelper-v1AddReviewsData()-2-reviews');
                if (!reviews || reviews.length === 0) return false;

                return dbPromise.then((db) => {
                    // add to database
                    return reviews.map(review => {
                        return new Promise((resolve2, reject2) => {
                            //DBHelper.debugObject('', 'dbhelper-v1AddReviewsData()-2-addUpdateLocalReviewById()-call');
                            DBHelper.addUpdateLocalReviewById(review, (error, result) => {
                                //DBHelper.debugObject(error, 'dbhelper-v1AddReviewsData()-2-2-addUpdateLocalReviewById()-error');
                                //DBHelper.debugObject(result, 'dbhelper-v1AddReviewsData()-2-2-addUpdateLocalReviewById()-result');
                                if (error || !result) reject2(error);
                                resolve2(result);
                            });
                        });
                    });
                });
            })
            .then((result) => {
                //DBHelper.debugObject(result, 'dbhelper-v1AddReviewsData()-3-result');
                if (result) {
                    //DBHelper.debugObject('', 'dbhelper-v1AddReviewsData()-3-reviews fetch data added');
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

    static processPendingRequests(callback) {
        DBHelper.debugObject('', 'shared-processPendingRequests()');
        DBHelper.debugObject(navigator.onLine, 'shared-processPendingRequests()-navigator.onLine');

        if (!navigator.onLine) callback('Still not online', null);

        dbPromise.then(function (db) {
            const txPending = db.transaction('pending', 'readwrite');
            let pendingStore = txPending.objectStore('pending');

            let pendingDeleteIds = [];
            pendingStore
                .getAll()
                .then((pendingRequests) => {
                    if (!pendingRequests) return;

                    pendingRequests.map(pending => {
                        DBHelper.debugObject(pending, 'shared-processPendingRequests()-pending');
                        return fetch(pending.url, {
                            method: pending.method, body: pending.body, headers: pending.headers
                        })
                            .then(networkResponse => networkResponse.json())
                            .then((networkResponse) => {
                                DBHelper.debugObject(networkResponse, 'shared-processPendingRequests()-networkResponse');
                                if (networkResponse) {
                                    pendingDeleteIds.push(pending.id);
                                }
                            })
                            .catch(error => {
                                console.log(error + 'shared-processPendingRequests()-fetch-catch');
                            });
                    });
                });
            txPending.complete;
            return pendingDeleteIds;
        })
            .then((pendingDeleteIds) => {
                dbPromise.then(db => {
                    const txPending = db.transaction('pending', 'readwrite');
                    let pendingStore = txPending.objectStore('pending');
                    pendingDeleteIds.forEach(id => {
                        pendingStore.delete(id);
                    });
                })
                    .catch(error => {
                        console.log(error + 'shared-processPendingRequests()-dbPromise-delete');
                    });
            })
            .then(() => {
                callback(null, true);
            })
            .catch(error => {
                console.log(error + 'shared-processPendingRequests()-catch');
            });

    }


    // https://stackoverflow.com/questions/4994201/is-object-empty
    static isEmpty(obj) {
        //DBHelper.debugObject('', 'dbhelper-isObjectEmpty()');

        return (typeof obj === 'undefined' || obj === 'undefined' || obj === null || obj === false || (obj.length && obj.length === 0));
    }

    static isObjectEmpty(obj) {
        //DBHelper.debugObject('', 'dbhelper-isObjectEmpty()');

        return (typeof obj === 'object' && (obj === 'undefined' || obj === null || obj === false));
    }

    static debugObject(obj, callername, counter = 0, data = []) {

        try {

            if (debug) {
                const part1 = (callername) + '=';
                let part2 = (obj);
                if (!(typeof obj === 'undefined' || obj === 'undefined' || obj === null || (typeof obj.toLowerCase === 'function' && obj.toLowerCase().search('error')))) {
                    //part2 = obj.toString().substring(0, 15);
                }
                const part3 = (' typeof=' + (typeof obj));
                let part4;

                if (counter > 5) return data;
                let is_empty = DBHelper.isObjectEmpty(obj);

                if (typeof obj === "object") {
                    for (const i in obj) {
                        const subObj = obj[i];
                        is_empty = DBHelper.isObjectEmpty(subObj);
                        if (!(is_empty)) {
                            const subObjName = callername + '-' + counter + '-' + i;
                            data = DBHelper
                                .debugObject(subObj, subObjName, (counter + 1), data);
                        }
                        else part4 = (' -- Is Empty=' + (is_empty));
                    }
                }
                else part4 = (' -- Is Empty=' + (is_empty));
                data.push(((part1) + (part2) + (part3) + (part4)));

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
            console.log('Error=' + (error) + ' - dbhelper-debugObject()-catch');
        }
    }


}

// module.exports = DBHelper;