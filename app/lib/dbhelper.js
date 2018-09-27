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

dbPromise.then(db => {
    if (debug) console.log('dbhelper-dbPromise-then');
    const dbVersion = db.version;
    if (debug) console.log('dbhelper-dbVersion=' + (dbVersion));
    return db;
}).then(db => {
    if (debug) console.log('dbhelper-addV1Data=' + (addV1Data));
    if (!addV1Data) {
        if (!DBHelper.isIndexDbPopulated()) {
            addV1Data = true;
        }
    }
    return db;
}).then(db => {

    if (debug) console.log('dbhelper-addV1Data=' + (addV1Data));
    if (addV1Data) {
        if (debug) console.log('dbhelper--calling-DBHelper.v1AddRestaurantsData()');
        return DBHelper.v1AddRestaurantsData(db);
    }
    return db;
}).then(db => {
    if (debug) console.log('dbhelper-addV1Data=' + (addV1Data));
    if (addV1Data) {
        if (debug) console.log('dbhelper--calling-DBHelper.v1AddReviewsData()');
        return DBHelper.v1AddReviewsData(db);
    }
    return db;
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
        //console.log('dbhelper-fetchRestaurants()');

        return fetch(DBHelper.DATABASE_URL_RESTAURANTS, {
            headers: {'Content-Type': 'application/json'}
        })
            .then(networkResponse => callback(null, networkResponse.json()))
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchRestaurants()`);
                return callback(error.message, null);
            });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        //debug = true;
        if (debug) console.log('dbhelper-fetchRestaurantById()');
        // fetch all restaurants with proper error handling.
        let requestURL = DBHelper.DATABASE_URL_RESTAURANTS + '/' + id;
        if (debug) console.log('dbhelper-fetchRestaurantById()-requestURL=' + (requestURL));

        return fetch(requestURL, {
            headers: {'Content-Type': 'application/json'}
        })
            .then(networkResponse => networkResponse.json())
            .then((restaurant) => {
                if (restaurant) {
                    // add properties
                    restaurant.restaurant_id = (restaurant.id ? restaurant.id : '');
                    restaurant.lat = (restaurant.latlng.lat ? restaurant.latlng.lat : '');
                    restaurant.lng = (restaurant.latlng.lng ? restaurant.latlng.lng : '');
                    restaurant.operating_hours = {};
                    restaurant.reviews = {};
                }

                return callback(null, restaurant);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchRestaurantById()`);
                return callback(error.message, null);
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
                    if (error) reject(false);
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
            .then((restaurants) => {
                return (typeof restaurants !== 'undefined' && restaurants);
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
        //debug = true;
        if (debug) console.log('dbhelper-getAllIndexDbRestaurants()');

        dbPromise
            .then((db) => {
                const txRestaurants = db.transaction('restaurants', 'readonly');
                const restaurantsStore = txRestaurants.objectStore('restaurants');
                const restaurants = restaurantsStore.getAllKeys();
                if (restaurants) {
                    return new Promise((resolve, reject) => {
                        return restaurants.map((restaurant) => {
                            DBHelper.getIndexDbRestaurantById(restaurant.restaurant_id, (error, result) => {
                                if (error) resolve(false);
                                resolve(result);
                            });
                        });
                    })
                    .then((restaurants) => {
                        if (!restaurants.id) restaurants.id = restaurants.restaurant_id;
                        return callback(null, restaurants);
                    });
                }
                else return callback('No results', null);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getAllIndexDbRestaurants()`);
                console.log(error.message);
                callback(error, null);
            });
    }


    /**
     * Fetch review by ID.
     */
    static getIndexDbRestaurantById(restaurant_id, callback) {
// debug = true;
        if (debug) console.log('dbhelper-getIndexDbRestaurantById()-input-restaurant_id=' + (restaurant_id));

        let error = {};
        if (!restaurant_id) {
            error.message = (`Missing restaurant id - dbhelper-getIndexDbRestaurantById()`);
            return callback(error, null);
        }

        let restaurant = {};

        return dbPromise
            .then(db => {
                const txRestaurants = db.transaction('restaurants', 'readonly');

                let restaurantsStore = txRestaurants.objectStore('restaurants');

                const restaurantRow = restaurantsStore.get(restaurant_id);

                if (!restaurant) return false;

                return restaurantRow;
            })
            .then((db, restaurantRow, restaurant) => {

                if (debug) console.log('dbhelper-getIndexDbRestaurantById()- typeof restaurantRow=' + (typeof restaurantRow));
                if (debug) console.log('dbhelper-getIndexDbRestaurantById()- restaurantRow=' + (restaurantRow));
                if (!restaurantRow) {
                    error.message = (`No restaurant id match in idb`);
                    return callback(error, null);
                }

                if (debug) console.log('dbhelper-getIndexDbRestaurantById()-restaurantRow=' + (restaurantRow));
                if (debug) console.log('dbhelper-getIndexDbRestaurantById()-restaurantRow.restaurant_id=' + (restaurantRow.restaurant_id));

                // set default properites
                restaurant.restaurant_id = restaurantRow.restaurant_id;
                restaurant.name = restaurantRow.name;
                restaurant.address = restaurantRow.address;
                restaurant.photograph = restaurantRow.photograph;
                restaurant.neighborhood = restaurantRow.neighborhood;
                restaurant.cuisine_type = restaurantRow.cuisine_type;
                restaurant.is_favorite = restaurantRow.is_favorite;
                restaurant.lat = restaurantRow.lat;
                restaurant.lng = restaurantRow.lng;
                restaurant.createdAt = restaurantRow.createdAt;
                restaurant.updatedAt = restaurantRow.updatedAt;
                // add properties
                restaurant.id = restaurantRow.restaurant_id;
                restaurant.latlng = {};
                restaurant.latlng.lat = restaurantRow.lat;
                restaurant.latlng.lng = restaurantRow.lng;
                restaurant.operating_hours = {};
                restaurant.reviews = {};

                return restaurant;
            })
            .then((restaurant) => {
                return callback(null, restaurant);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getIndexDbRestaurantById()`);
                console.log(error.message);
                callback(error, null);
            });
    }


    static v1AddRestaurantsData(db) {
        if (debug) console.log('v1AddRestaurantsData()');

        return fetch(DBHelper.DATABASE_URL_RESTAURANTS)
            .then(response => response.json())
            .then(function (neighborhoods) {
                if (debug) console.log('v1AddRestaurantsData()-neighborhoods=' + (neighborhoods));

                neighborhoods.forEach(restaurant => {

                    // add to database
                    if (debug) console.log('v1AddRestaurantsData()-neighborhoods-each-restaurant=' + (restaurant));
                    const txRestaurants = db.transaction('restaurants', 'readwrite');
                    let restaurantsStore = txRestaurants.objectStore('restaurants');

                    restaurantsStore.get(restaurant.id).then(function (item) {

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

                    });
                });

                return db;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-v1AddRestaurantsData`);
                console.log(error.message);
                return db;
            });
    }

    static v1AddReviewsData(db) {
        if (debug) console.log('v1AddReviewsData()');

        const requestUrl = DBHelper.DATABASE_URL_REVIEWS;
        if (debug) console.log('v1AddReviewsData()-requestUrl=' + (requestUrl));

        return fetch(requestUrl)
            .then(response => response.json())
            .then(function (reviews) {

                if (debug) console.log('v1AddReviewsData()-reviews=' + (reviews));

                if (debug) console.log('v1AddReviewsData()-reviews-start');
                const txReviews = db.transaction('reviews', 'readwrite');
                let reviewsStore = txReviews.objectStore('reviews');

                for (const rkey in reviews) {
                    if (debug) console.log('rkey=' + (rkey));
                    if (debug) console.log('review[rkey]=' + (reviews[rkey]));
                    if (debug) console.log('reviews[rkey].id=' + (reviews[rkey].id));
                    if (debug) console.log('reviews[rkey].restaurant_id=' + (reviews[rkey].restaurant_id));
                    if (debug) console.log('reviews[rkey].name=' + (reviews[rkey].name));
                    if (debug) console.log('reviews[rkey].createdAt=' + (reviews[rkey].createdAt));
                    if (debug) console.log('reviews[rkey].rating=' + (reviews[rkey].rating));
                    if (debug) console.log('reviews[rkey].comments=' + (reviews[rkey].comments));
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
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed v1AddReviewsData. Returned status of ${error.message}`);
                console.log(error.message);
                return false;
            });
    }


    /**
     * update a restaurant by its ID.
     */
    static addUpdateRestaurantById(restaurant, callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-addUpdateRestaurantById()');

        if (debug && restaurant) {
            for (const indx in restaurant) {
                if (debug) console.log('restaurant[' + indx + ']=' + (restaurant[indx]));
            }
        }

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
                return callback(local_error || cache_error || remote_error, null);
            }
            return callback(null, restaurant);
        });
    }

    /**
     * update a restaurant by its ID.
     */
    static addUpdateLocalRestaurantById(restaurant, callback) {
        if (debug) console.log('-----------------------------------');
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
                        return callback(null, true);
                    });
            })
            .catch(error => {
                return callback('Error', null);
            });
    }

    /**
     * update a restaurant by its ID.
     */
    static addUpdateCacheRestaurantById(restaurant_id, callback) {
        if (debug) console.log('dbhelper-addUpdateCacheRestaurantById()');
        if (debug) console.log('dbhelper-addUpdateCacheRestaurantById()-restaurant_id=' + (restaurant_id));

        if (debug) console.log('Update cache by deleting and then adding cache');
        return caches
            .open(staticCacheName)
            .then(function (cache) {
                if (debug) console.log('Deleting index file cache');
                return cache
                    .delete(new Request('/'))
                    .delete(new Request('/restaurant.html?id=' + restaurant_id));
            }).then(function () {
                if (debug) console.log('Adding index file cache');
                return fetch(new Request('/'))
                    .then(function () {
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

        if (debug) console.log('-----------------------------------');
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
        //debug = true;
        if (debug) console.log('dbhelper-fetchReviewsByRestaurantId()');
        if (debug) console.log('dbhelper-fetchReviewsByRestaurantId()-restaurant_id=' + (restaurant_id));

        if (debug) console.log('call-fetch');

        const review_url = DBHelper.DATABASE_URL_REVIEWS + '?restaurant_id=' + restaurant_id;
        if (debug) console.log('dbhelper-fetchReviewsByRestaurantId()-review_url=' + (review_url));

        return fetch(review_url)
            .then(response => response.json())
            .then((reviews) => {
                if (debug) console.log('dbhelper-fetchReviewsByRestaurantId()-reviews=' + (reviews));
                return reviews.map(review => {
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

                    return review;
                });
            })
            .then((reviews) => {
                if (debug) console.log('dbhelper-fetchReviewsByRestaurantId()-reviews=' + (reviews));
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
        //debug = true;
        if (debug) console.log('dbhelper-getAllRestaurants()');

        //return dbPromise
            //.then(() => {
                if (debug) console.log('dbhelper-getAllRestaurants() - 1 - this.restaurants =' + (this.restaurants));
                return new Promise((resolve, reject) => {
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
                        if (debug) console.log('dbhelper-getAllRestaurants() - 1 - getAllIndexDbRestaurants()-restaurants =' + (restaurants));
                        if (restaurants.length > 0) this.restaurants = restaurants;
                        return restaurants;
                    })//;
            //})
            .then(() => {
                if (debug) console.log('dbhelper-getAllRestaurants() - 2 - this.restaurants =' + (this.restaurants));
                if (!this.restaurants) {
                    return new Promise((resolve, reject) => {
                        DBHelper
                            .fetchRestaurants((error, result) => {
                                if (error) reject(false);
                                if (debug) console.log('dbhelper-getAllRestaurants() - 2 - fetchRestaurants()-result =' + (result));
                                resolve(result);
                            });
                    })
                        .then((restaurants) => {
                            if (debug) console.log('dbhelper-getAllRestaurants() - 2 - restaurants =' + (restaurants));
                            if (restaurants.length > 0) this.restaurants = restaurants;
                            return true;
                        });
                }
                else this.restaurants;
            })
            .then(() => {
                if (debug) console.log('dbhelper-getAllRestaurants() - 3-1 - this.restaurants =' + (this.restaurants));
                return new Promise((resolve, reject) => {
                    if (this.restaurants) {
                        let restaurants = this.restaurants;
                        restaurants.map(restaurant => {
                            restaurant.restaurant_id = (restaurant.restaurant_id ? restaurant.restaurant_id : restaurant.id);
                            if (debug) console.log('dbhelper-getAllRestaurants() - 3-2 - restaurant.restaurant_id =' + (restaurant.restaurant_id));
                            return new Promise((resolve, reject) => {
                                DBHelper
                                    .getRestaurantReviewsOperatingHours(restaurant, (error, result) => {
                                        if (debug) console.log('dbhelper-getAllRestaurants() - 3-2 - getRestaurantReviewsOperatingHours()-error =' + (error));
                                        if (error) resolve(restaurant);
                                        if (debug) console.log('dbhelper-getAllRestaurants() - 3-2 - getRestaurantReviewsOperatingHours()-result =' + (result));
                                        resolve(result);
                                    });
                            })
                                .then((result) => {
                                    if (result) {
                                        restaurant.reviews = result.reviews;
                                        restaurant.operating_hours = result.operating_hours;
                                    }
                                    if (debug) console.log('dbhelper-getAllRestaurants() - 3-3 - restaurant =' + (restaurant));
                                    return restaurant;
                                });
                        });
                        if (debug) console.log('dbhelper-getAllRestaurants() - 3-4 - restaurants =' + (restaurants));
                        resolve(restaurants);
                    }
                    else resolve(this.restaurants);
                })
                    .catch(error => {
                        // Oops!. Got an error from server.
                        const error_message = (`Request failed. Returned status of ${error.message} - dbhelper-getAllRestaurants`);
                        if (debug) console.log(error_message);
                        return restaurant;
                    });
            })
            .then(() => {
                if (debug) console.log('dbhelper-getAllRestaurants() - 4 - this.restaurants =' + (this.restaurants));
                if (this.restaurants) return callback(null, this.restaurants);
                if (!this.restaurants) return callback('No data', null);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getAllRestaurants`);
                return callback(error.message, null);
            });
    }

    /**
     * get restaurant by ID.
     */
    static getRestaurantById(restaurant_id, callback) {
        //debug = true;
        if (debug) console.log('dbhelper-getRestaurantById()');
        if (debug) console.log('dbhelper-getRestaurantById()-restaurant_id=' + (restaurant_id));

        return new Promise((resolve, reject) => {
            if (debug) console.log('dbhelper-getRestaurantById() - 1 - this.restaurants=' + (this.restaurants));
            if (this.restaurants) {
                restaurant = this.restaurants.filter(r => r.id == restaurant_id);
                if (debug) console.log('dbhelper-getRestaurantById() - 1 - restaurant=' + (restaurant));
            }
            if (!restaurant) {
                if (debug) console.log('dbhelper-getRestaurantById() - 1 - getIndexDbRestaurantById() call');
                DBHelper
                    .getIndexDbRestaurantById(restaurant_id, (error, result) => {
                        if (debug) console.log('dbhelper-getRestaurantById() - 1 - getIndexDbRestaurantById()-error=' + (error));
                        if (error) resolve(false);
                        if (debug) console.log('dbhelper-getRestaurantById() - 1 - getIndexDbRestaurantById()-result=' + (result));
                        resolve(result);
                    });
            }
            else resolve(restaurant);
        })
            .then((restaurant) => {
                if (debug) console.log('dbhelper-getRestaurantById() - 2 - restaurant =' + (typeof restaurant));
                if (debug) console.log('dbhelper-getRestaurantById() - 2 - restaurant =' + (restaurant));
                if (!restaurant) {
                    if (debug) console.log('dbhelper-getRestaurantById() - 2 - new Promise()');
                    return new Promise((resolve, reject) => {
                        DBHelper
                            .fetchRestaurantById(restaurant_id, (error, result) => {
                                if (error) reject(error);
                                resolve(result);
                            })
                    })
                        .then((restaurant) => {
                            if (debug) console.log('dbhelper-getRestaurantById() - 2.then() - restaurant.restaurant_id=' + (restaurant.restaurant_id));

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
                if (debug) console.log('dbhelper-getRestaurantById() - 3 - restaurant =' + (typeof restaurant));
                if (debug) console.log('dbhelper-getRestaurantById() - 3 - restaurant =' + (restaurant));
                if (debug) console.log('dbhelper-getRestaurantById() - 3 - restaurant.id=' + (restaurant.restaurant_id));

                return new Promise((resolve, reject) => {
                    DBHelper
                        .getRestaurantReviewsOperatingHours(restaurant, (error, result) => {
                            if (error) resolve(restaurant);
                            if (debug) console.log('dbhelper-getRestaurantById() - 3 - getRestaurantReviewsOperatingHours()-result =' + (result));
                            resolve(result);
                        });
                })
            })
            .then((restaurant, result) => {
                if (debug) console.log('dbhelper-getRestaurantById() - 3 - .then()-result =' + (result));
                if (result) {
                    if (debug) console.log('dbhelper-getRestaurantById() - 3 - .then()-result.id =' + (result.id));
                    if (debug) console.log('dbhelper-getRestaurantById() - 3 - .then()-result.reviews =' + (result.reviews));
                    result.reviews.map(review => {
                        if (debug) console.log('dbhelper-getRestaurantById() - 3 - .then()-result.review_id=' + (review.review_id));
                    });
                    restaurant.reviews = result.reviews;
                    restaurant.operating_hours = result.operating_hours;
                }
                if (debug) console.log('dbhelper-getRestaurantById() - 3 - .then()-restaurant =' + (restaurant));
                if (debug) console.log('dbhelper-getRestaurantById() - 3 - .then()-restaurant.id=' + (restaurant.id));
                if (debug) console.log('dbhelper-getRestaurantById() - 3 - .then()-restaurant.reviews=' + (restaurant.reviews));
                restaurant.reviews.map(review => {
                    if (debug) console.log('dbhelper-getRestaurantById() - 3 - .then()-restaurant.review_id=' + (review.review_id));
                });
                return restaurant;
            })
            .then((restaurant) => {
                if (debug) console.log('dbhelper-getRestaurantById() - 4 - .then()-restaurant =' + (restaurant));
                if (debug) console.log('dbhelper-getRestaurantById() - 4 - .then()-restaurant.id=' + (restaurant.id));
                if (debug) console.log('dbhelper-getRestaurantById() - 4 - .then()-restaurant.reviews=' + (restaurant.reviews));
                return callback(null, restaurant);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getRestaurantById()`);
                callback(error.message, null);
                return;
            });
    }

    static getRestaurantReviewsOperatingHours(restaurant, callback) {
        //debug = true;
        if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()');
        if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-input-restaurant=' + (restaurant));

        const restaurant_id = (restaurant.id ? restaurant.id : (restaurant.restaurant_id ? restaurant.restaurant_id : ''));
        if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-restaurant_id=' + (restaurant_id));

        if (!restaurant_id) callback('Missing restaurant id', null);

        return new Promise((resolve, reject) => {
            if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(first)-getIndexDbOperatingHoursByRestaurantId()-call');
            DBHelper
                .getIndexDbOperatingHoursByRestaurantId(restaurant_id, (error, result) => {
                    if (error) resolve(restaurant);
                    resolve(result);
                })
        })
            .then((restaurant, operating_hours) => {
                if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(second)-restaurant=' + (restaurant));
                if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(second)-operating_hours=' + (operating_hours));

                if (!restaurant) return callback('no restaurant data', null);

                return new Promise((resolve, reject) => {
                    // add missing properties
                    if (!restaurant.id) restaurant.id = restaurant.restaurant_id;
                    if (!restaurant.restaurant_id) restaurant.restaurant_id = restaurant.id;
                    if (!restaurant.latlng) restaurant.latlng = {};
                    if (!restaurant.latlng.lat) restaurant.latlng.lat = (restaurant.lat ? restaurant.lat : '');
                    if (!restaurant.latlng.lng) restaurant.latlng.lng = (restaurant.lng ? restaurant.lng : '');
                    if (!restaurant.operating_hours) restaurant.operating_hours = {};
                    if (!restaurant.reviews) restaurant.reviews = {};

                    if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(second)-restaurant.operating_hours=' + (restaurant.operating_hours));

                    if (restaurant.operating_hours) {
                        if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(second)-restaurant.operating_hours.hasOwnProperty(day)=' + (restaurant.operating_hours.hasOwnProperty('day')));
                        if (restaurant.operating_hours.hasOwnProperty('day')) {
                            restaurant.operating_hours.map(operating_hour => {
                                if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(second)-operating_hour=' + (operating_hour.day));
                            });
                        }
                    }

                    if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(second)-operating_hours=' + (operating_hours));
                    if (operating_hours) {
                        if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(second)-operating_hours.operating_hours.hasOwnProperty(day)=' + (operating_hours.hasOwnProperty('day')));
                        if (operating_hours.hasOwnProperty('day')) {
                            operating_hours.map(operating_hour => {
                                if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(second)-operating_hour=' + (operating_hour.day));
                            });
                            restaurant.operating_hours = operating_hours;
                        }
                    }

                    // confirm property
                    if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(second)-restaurant.operating_hours=' + (restaurant.operating_hours));

                    resolve(restaurant);
                })
                    .then((restaurant) => {
                        return new Promise((resolve, reject) => {
                            if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(third)-getReviewsByRestaurantId()-call');
                            DBHelper.getReviewsByRestaurantId(restaurant_id, (error, result) => {
                                if (error) resolve({});
                                resolve(result);
                            });
                        })
                            .then((reviews) => {
                                reviews.map(review => {
                                    if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(fourth)-getReviewsByRestaurantId()-review.review_id=' + (review.review_id));
                                });
                                restaurant.reviews = reviews;
                                return restaurant;
                            });
                    })
                    .then((restaurant) => {
                        if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(fifth)-restaurant.id=' + (restaurant.id));
                        if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(fifth)-restaurant.restaurant_id=' + (restaurant.restaurant_id));
                        if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(fifth)-restaurant.reviews=' + (restaurant.reviews));
                        restaurant.reviews.map(review => {
                            if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(fifth)-review.review_id=' + (review.review_id));
                        });
                        if (debug) console.log('dbhelper-getRestaurantReviewsOperatingHours()-.then(fifth)-restaurant.operating_hours=' + (restaurant.operating_hours));
                        callback(null, restaurant);
                        return;
                    })
            })
            .catch(error => {
                // Oops!. Got an error from server.
                const error_message = (`Request failed. Returned status of ${error.message} - dbhelper-getRestaurantReviewsOperatingHours()`);
                callback(error_message, null);
                return;
            });
    }


    /**
     * get all reviews.
     */
    static getAllReviews(callback) {
        if (debug) console.log('dbhelper-getAllReviews()');

        let reviews = this.reviews;

        return dbPromise
            .then(() => {
                reviews = this.reviews;
                if (debug) console.log('dbhelper-getAllReviews()- is reviews array empty - second - results =' + (reviews));
                if (!reviews) {
                    return DBHelper.getAllIndexDbReviews((error, results) => {
                        if (error) callback(error.message, null);
                        if (debug) console.log('dbhelper-getAllReviews()- is reviews array empty - second-sub1 - results =' + (results));
                        if (results) this.reviews = results;
                        return true;
                    });
                }
                else return true;
            })
            .then(() => {
                reviews = this.reviews;
                if (!reviews) {
                    return DBHelper.fetchAllReviews((error, results) => {
                        if (error) return callback(error.message, null);
                        if (debug) console.log('dbhelper-getAllReviews()- is reviews array empty - third-sub1 - results =' + (results));
                        if (results) this.reviews = results;
                        return true;
                    });
                }
                else return true;
            })
            .then(() => {
                reviews = this.reviews;
                if (debug) console.log('dbhelper-getAllReviews()- is reviews array empty - fourth - results =' + (reviews));

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
        //debug = true;
        if (debug) console.log('dbhelper-getReviewsByRestaurantId()');
        if (debug) console.log('restaurant_id=' + (restaurant_id));

        return new Promise((resolve, reject) => {
            if (!this.reviews) {
                DBHelper
                    .getAllReviews((error, result) => {
                        if (error) resolve({});
                        resolve(result);
                    });
            }
            else resolve(this.reviews);
        })
            .then((reviews) => {
                if (!reviews) callback('No reviews for this restaurant', null);

                this.reviews = reviews;
                return reviews;
            })
            .then((reviews) => {
                const restaurant_reviews = reviews.filter(r => r.restaurant_id == restaurant_id);
                restaurant_reviews.map(review => {
                    if (debug) console.log('dbhelper-getReviewsByRestaurantId()-review.review_id=' + (review.review_id));
                });
                return callback(null, restaurant_reviews);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-getReviewsByRestaurantId()`);
                return callback(error.message, null);
            });
    }

    /**
     * get review by ID.
     */
    static getReviewById(restaurant_id, review_id, callback) {

        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-getReviewById()');
        if (debug) console.log('restaurant_id=' + (restaurant_id));
        if (debug) console.log('review_id=' + (review_id));

        if (!this.reviews) {
            return DBHelper.getAllReviews((error, restaurant_reviews) => {
                this.reviews = restaurant_reviews;
                return true;
            });
        }

        // if reviews array exists then use that to filter out restaurant specific reviews
        if (debug) console.log('this.reviews=' + (this.reviews));

        return this.reviews
            .then(reviews => {
                const review = reviews.filter(r => r.id == review_id);
                return callback(null, review);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed-2. Returned status of ${error.message}`);
                return callback(error.message, null);
            });
    }

    static getAllIndexDbOperatingHours(callback) {
        if (debug) console.log('dbhelper-getAllIndexDbOperatingHours()');
        dbPromise.then(db => {
            const txOperatingHours = db.transaction('operating_hours', 'readonly');
            const operatingHoursStore = txOperatingHours.objectStore('operating_hours');
            const allOperatingHours = operatingHoursStore.getAll();
            return callback(null, allOperatingHours);
        });
    }

    static getIndexDbOperatingHoursByRestaurantId(restaurant_id, callback) {
        if (debug) console.log('dbhelper-getIndexDbOperatingHoursByRestaurantId()');
        dbPromise.then(db => {
            const txOperatingHours = db.transaction('operating_hours', 'readonly');
            const operatingHoursStore = txOperatingHours.objectStore('operating_hours');
            const allOperatingHours = operatingHoursStore.get(restaurant_id);
            return callback(null, allOperatingHours);
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

                if (reviews) {
                    reviews.map(review => {
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
                    });
                }
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
     * Fetch a reviews by its restaurant ID.
     */
    static fetchReviewById(review_id, callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-fetchReviewById()');
        if (debug) console.log('review_id=' + (review_id));
        // fetch all review with proper error handling.

        if (debug) console.log('call-fetch');

        let requestURL = DBHelper.DATABASE_URL_REVIEWS + '/' + review_id;
        if (debug) console.log('requestURL=' + (requestURL));

        return fetch(requestURL)
            .then(response => {
                const review = response.json();

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
                return callback(error.message, null);
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
                return callback(local_error || cache_error || remote_error, null);
            }
            return callback(null, true);
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
                        return callback(null, true);
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


}

// module.exports = DBHelper;