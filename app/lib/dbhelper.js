// js/dbhelper.js

// import idb from "idb";
if (debug) console.log('start /lib/dbhelper.js');

const appPrefix = 'mws-restaurant-stage-3';
const staticCacheName = appPrefix + '-v2';
const contentImgsCache = appPrefix + '-content-imgs';
const allCaches = [
    staticCacheName,
    contentImgsCache
];
let addV1Data = false;
if (debug) console.log('addV1Data=' + (addV1Data));

// https://github.com/jakearchibald/idb
// https://developers.google.com/web/ilt/pwa/lab-indexeddb
// https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore
const dbName = 'topRestaurants4';
const dbVersion = 5;
if (debug) console.log('dbName=' + (dbName));
if (debug) console.log('dbVersion=' + (dbVersion));
const dbPromise = idb.open(dbName, dbVersion, function (upgradeDb) {
    if (debug) console.log('sw.createDB()-upgradeDb.oldVersion=' + (upgradeDb.oldVersion));

    switch (upgradeDb.oldVersion) {
        case 0:
            let restaurantsObjectStore = upgradeDb.createObjectStore('restaurants', {
                keyPath: 'id',
                autoIncrement: true
            });
            restaurantsObjectStore.createIndex('id', 'id', {unique: true});
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
            if (debug) console.log('createIndex-restaurantsObjectStore');
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
            if (debug) console.log('createIndex-operatingHoursObjectStore');
        case 2:

            const reviewsObjectStore = upgradeDb.createObjectStore('reviews', {
                keyPath: 'review_id',
                autoIncrement: true
            });
            reviewsObjectStore.createIndex('id', 'id', {unique: true});
            reviewsObjectStore.createIndex('restaurant_id', 'restaurant_id', {unique: false});
            reviewsObjectStore.createIndex('name', 'name', {unique: false});
            reviewsObjectStore.createIndex('rating', 'rating', {unique: false});
            reviewsObjectStore.createIndex('comments', 'comments', {unique: false});
            reviewsObjectStore.createIndex('createdAt', 'createdAt', {unique: false});
            reviewsObjectStore.createIndex('updatedAt', 'updatedAt', {unique: false});
            if (debug) console.log('createIndex-reviewsObjectStore');
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
            if (debug) console.log('createIndex-pendingObjectStore');

            addV1Data = true;
            if (debug) console.log('version-0-addV1Data=' + (addV1Data));
        case 4:
            if (debug) console.log('version-1-addV1Data=' + (addV1Data));
    }
})
    .catch(error => {
        // Oops!. Got an error from server.
        console.log(`Request failed createDB. Returned status of ${error.message}`);
    });

dbPromise.then(db => {
    if (debug) console.log('dbPromise is set');
    const dbVersion = db.version;
    if (debug) console.log('dbVersion=' + (dbVersion));

    if (addV1Data) {
        DBHelper.v1AddRestaurantsData(db);
        DBHelper.v1AddReviewsData(db);
    }
})
    .catch(error => {
        if (debug) console.log('dbPromise is not set');
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
    }

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get dbPromise() {
        return dbPromise;
    }

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        //console.log('dbhelper-DATABASE_URL()');

        const port = 1337;
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
     * get all restaurants.
     */
    static getRestaurants(callback) {
        if (debug) console.log('dbhelper-getRestaurants()');

        if (debug) console.log('------------------1--------------------------');
        if (debug) console.log('Array.isArray(this.restaurants)=' + (Array.isArray(this.restaurants)));

        if (!Array.isArray(this.restaurants) || this.restaurants.length === 0) {
            // first try; get cache data
            if (debug) console.log('first try; get cache data');
            DBHelper.getCacheRestaurants((error, restaurants) => {
                if (error) {
                    error.message = (`Request failed. Returned status of ${error.message}`);
                    callback(error.message, null);
                }
                if (debug) console.log('restaurants.length=' + (restaurants.length));
                if (restaurants) {
                    this.restaurants = restaurants;
                    return callback(null, this.restaurants);
                }
            });
        }

        if (debug) console.log('------------------2--------------------------');
        if (debug) console.log('Array.isArray(this.restaurants)=' + (Array.isArray(this.restaurants)));

        if (!Array.isArray(this.restaurants) || this.restaurants.length === 0) {
            // second try; get remote data
            if (debug) console.log('second try; get remote data');

            DBHelper.fetchRestaurants((error, restaurants) => {
                if (error) {
                    error.message = (`Request failed. Returned status of ${error.message}`);
                    callback(error.message, null);
                }
                if (debug) console.log('restaurants.length=' + (restaurants.length));
                if (restaurants) {
                    this.restaurants = restaurants;
                    return callback(null, this.restaurants);
                }
            });
        }

        if (debug) console.log('-------------------3------------------------');
        if (debug) console.log('Array.isArray(this.restaurants)=' + (Array.isArray(this.restaurants)));

        if (Array.isArray(this.restaurants)) {
            return callback(null, this.restaurants);
        }

        // empty restaurant results
        return;
    }

    static getCacheRestaurants(callback) {
        if (debug) console.log('dbhelper-getCacheRestaurants()');

        this.restaurants = dbPromise.then(function (db) {
            if (debug) console.log('dbPromise');
            const txRestaurants = db.transaction('restaurants', 'readonly');
            if (debug) console.log('txRestaurants=' + (txRestaurants));
            let restaurantsStore = txRestaurants.objectStore('restaurants');
            if (debug) console.log('restaurantsStore=' + (restaurantsStore));
            const allRestaurants = restaurantsStore.getAll();
            if (debug) console.log('allRestaurants=' + (allRestaurants));
            return allRestaurants;
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
                            "date": review.date,
                            "rating": review.rating,
                            "comments": review.comments
                        };
                        reviews.push(rItem);
                    }
                    item["reviews"] = reviews;
                    restaurants.push(item);
                }
                if (debug) console.log('restaurants=' + (restaurants));
                return JSON.stringify(restaurants);
            }
        );
    }


    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {
        if (debug) console.log('dbhelper-fetchRestaurants()');

        const requestUrl = DBHelper.DATABASE_URL_RESTAURANTS;
        if (debug) console.log('fetch requestUrl=' + (requestUrl));

        this.restaurants = fetch(requestUrl)
            .then(response => response.json())
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed-1. Returned status of ${error.message}`);
                return callback(error.message, null);
            });
        if (debug) console.log('this.restaurants.length=' + (this.restaurants.length));
        if (debug) console.log('this.restaurants' + (this.restaurants));

        return this.restaurants
            .then(restaurants => {
                if (debug) console.log('callback()');
                if (debug) console.log('this.restaurants.length=' + (this.restaurants.length));
                if (debug) console.log('this.restaurants' + (this.restaurants));
                return callback(null, restaurants);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed-2. Returned status of ${error.message}`);
                return callback(error.message, null);
            });
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurantsOld(callback) {
        if (debug) console.log('dbhelper-fetchRestaurantsOld()');

        const requestUrl = DBHelper.DATABASE_URL_RESTAURANTS;
        if (debug) console.log('fetch requestUrl=' + (requestUrl));

        const request = new Request(requestUrl);
        return fetch(request).then(function (networkResponse) {
            return networkResponse.json();
        })
            .then(restaurants => {
                if (debug) console.log('restaurants.length=' + (restaurants.length));
                callback(null, restaurants);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed-1. Returned status of ${error.message}`);
                return callback(error.message, null);
            });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        if (debug) console.log('dbhelper-fetchRestaurantById()');
        if (debug) console.log('id=' + (id));
        // fetch all restaurants with proper error handling.
        DBHelper.getRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            }
            else {
                const restaurant = restaurants.find(r => r.id == id);
                if (restaurant) { // Got the restaurant
                    if (debug) console.log('restaurant-callback=' + (restaurant));
                    callback(null, restaurant);
                }
                else { // Restaurant does not exist in the database
                    callback('Restaurant does not exist', null);
                }
            }
        });
    }

    /**
     * get all restaurant reviews.
     */
    static getRestaurantOperatingHours(restaurant) {
        if (debug) console.log('dbhelper-getRestaurantOperatingHours()');
        if (debug) console.log('restaurant=' + (restaurant));

        const txOperatingHours = db.transaction('operating_hours', 'readonly');
        let operatingHoursStore = txOperatingHours.objectStore('operating_hours');
        const operating_hours_list = operatingHoursStore.getAll(['restaurant_id', restaurant.id]);
        let operating_hours = [];
        for (const indx in operating_hours_list) {
            operating_hours[indx] = [operating_hours_list[indx]];
        }

        return operating_hours;
    }

    /**
     * get all restaurant reviews.
     */
    static getRestaurantReviews(restaurant) {
        if (debug) console.log('dbhelper-getRestaurantReviews()');
        if (debug) console.log('restaurant=' + (restaurant));

        const txReviews = db.transaction('reviews', 'readonly');
        let reviewsStore = txReviews.objectStore('reviews');
        const review_list = reviewsStore.getAll('restaurant_id', restaurant.id);
        let reviews = [];
        for (const review in review_list) {
            const rItem = {
                "name": review.name,
                "date": review.date,
                "rating": review.rating,
                "comments": review.comments
            };
            reviews.push(rItem);
        }

        return reviews;
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        if (debug) console.log('dbhelper-fetchRestaurantByCuisine()');
        // Fetch all restaurants  with proper error handling
        DBHelper.getRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            }
            else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        if (debug) console.log('dbhelper-fetchRestaurantByNeighborhood()');
        // Fetch all restaurants
        DBHelper.getRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            }
            else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {

        if (debug) console.log('dbhelper-fetchRestaurantByCuisineAndNeighborhood()');
        // Fetch all restaurants
        DBHelper.getRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            }
            else {
                let results = restaurants;

                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        if (debug) console.log('dbhelper-fetchNeighborhoods()');
        // Fetch all restaurants
        DBHelper.getRestaurants((error, restaurants) => {
            if (debug) console.log('error=' + (error));
            if (debug) console.log('restaurants=' + (restaurants));
            if (error) {
                callback(error, null);
            }
            else {
                if (!restaurants) {
                    return callback('Restaurants does not exist', null);
                }

                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        if (debug) console.log('dbhelper-fetchCuisines()');
        // Fetch all restaurants
        DBHelper.getRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            }
            else {
                if (!restaurants) {
                    return callback('Restaurants does not exist', null);
                }

                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        //console.log('dbhelper-urlForRestaurant()');
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
     * Fetch all reviews.
     */
    static getCacheReviews(restaurant_id, review_id, callback) {

        if (debug) console.log('dbhelper-getCacheReviews()');
        if (debug) console.log('restaurant_id=' + (restaurant_id));
        if (debug) console.log('callback=' + (callback));

        if (!Array.isArray(this.reviews) || this.reviews.length === 0) {
            this.reviews = DBHelper.fetchReviews(restaurant_id, review_id, callback)
                .catch(error => {
                    // Oops!. Got an error from server.
                    error.message = (`Request failed-1. Returned status of ${error.message}`);
                    return callback(error.message, null);
                });
        }
        if (debug) console.log('this.reviews' + (this.reviews));

        return this.reviews
            .then(reviews => {
                if (debug) console.log('reviews-callback=' + (reviews));
                if (debug) console.log('typeof callback=' + (typeof callback));
                if (typeof callback !== 'undefined') {
                    return callback(null, reviews);
                }
                return reviews;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed-2. Returned status of ${error.message}`);
                if (typeof callback === 'function') {
                    return callback(error.message, null);
                }
                else {
                    return false;
                }
            });
    }


    /**
     * Fetch all reviews.
     */
    static fetchReviews(restaurant_id, review_id, callback) {
        if (debug) console.log('dbhelper-fetchReviews()');
        if (debug) console.log('restaurant_id=' + (restaurant_id));
        if (debug) console.log('callback=' + (callback));

        if (debug) console.log('call-fetch');

        if (debug) console.log('DBHelper.DATABASE_URL_REVIEWS=' + (DBHelper.DATABASE_URL_REVIEWS));

        return fetch(DBHelper.DATABASE_URL_REVIEWS)
            .then(response => response.json())
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed-1. Returned status of ${error.message}`);
                return callback(error.message, null);
            });
    }

    /**
     * Fetch a reviews by its restaurant ID.
     */
    static fetchReviewsByRestaurantId(restaurant_id, callback) {

        if (debug) console.log('dbhelper-fetchReviewsByRestaurantId()');
        if (debug) console.log('restaurant_id=' + (restaurant_id));
        if (debug) console.log('callback=' + (callback));
        // fetch all review with proper error handling.

        DBHelper.getCacheReviews(restaurant_id, null, (error, reviews) => {
            if (debug) console.log('error=' + (error));
            if (error) {
                callback(error, null);
            }
            else {
                if (debug) console.log('reviews=' + (reviews));
                const restaurant_reviews = reviews.filter(r => r.restaurant_id == restaurant_id);
                if (debug) console.log('restaurant_reviews.filter=' + (restaurant_reviews));
                if (restaurant_reviews) { // Got the reviews
                    callback(null, restaurant_reviews);
                }
                else { // review does not exist in the database
                    callback('Reviews does not exist', null);
                }
            }
        });
    }

    /**
     * Fetch a review by its ID.
     */
    static fetchReviewById(id, callback) {
        if (debug) console.log('dbhelper-fetchReviewById()');
        // fetch all review with proper error handling.
        DBHelper.getCacheReviews(null, id, (error, reviews) => {
            if (error) {
                callback(error, null);
            }
            else {
                const review = reviews.find(r => r.id == id);
                if (review) { // Got the review
                    callback(null, review);
                }
                else { // review does not exist in the database
                    callback('Review does not exist', null);
                }
            }
        });
    }

    /**
     * update a restaurant by its ID.
     */
    static addUpdateRestaurantById(restaurant, callback) {
        debug = true;
        if (debug) console.log('dbhelper-addUpdateRestaurantById()');

        if (debug && restaurant) {
            for (const indx in restaurant) {
                if (debug) console.log('restaurant[' + indx + ']=' + (restaurant[indx]));
            }
        }

        let local_error = null;
        let cache_error = null;
        let remote_error = null;

        DBHelper.addUpdateLocalRestaurantById(restaurant, (error, result) => {
            local_error = error;
        });
        DBHelper.addUpdateCacheRestaurantById(restaurant, (error, result) => {
            cache_error = error;
        });
        DBHelper.addUpdateRemoteRestaurantById(restaurant, (error, result) => {
            remote_error = error;
        });
        if (debug) console.log('local_error=' + (local_error));
        if (debug) console.log('cache_error=' + (cache_error));
        if (debug) console.log('remote_error=' + (remote_error));

        if (local_error || cache_error || remote_error) {

            if (debug) console.log('error');
            return callback(local_error || cache_error || remote_error, null);
        }
        return callback(null, true);
    }

    /**
     * update a restaurant by its ID.
     */
    static addUpdateLocalRestaurantById(restaurant, callback) {
        if (debug) console.log('dbhelper-addUpdateLocalRestaurantById()');

        return dbPromise.then(function (db) {
            if (debug) console.log('restaurant-restaurant-start');
            const txRestaurants = db.transaction('restaurants', 'readwrite');
            let restaurantsStore = txRestaurants.objectStore('restaurants');

            restaurantsStore
                .get(restaurant.id)
                .then(function (item) {
                    if (!item) {
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
                    }
                    else {
                        restaurantsStore.put(restaurant);
                    }
                    txRestaurants.complete;

                    callback(null, true);
                })
                .catch(error => {
                    // Oops!. Got an error from server.
                    error.message = (`Request failed. Returned status of ${error.message}`);
                    callback(error, null);
                });
        });
    }

    /**
     * update a restaurant by its ID.
     */
    static addUpdateCacheRestaurantById(restaurant, callback) {

        if (debug) console.log('dbhelper-addUpdateCacheRestaurantById()');

        if (debug) console.log('Update cache by deleting and then adding cache');
        return caches.open(staticCacheName).then(function (cache) {
            if (debug) console.log('Deleting index file cache');
            return cache.delete(new Request('/'))
                .then(function () {
                    return cache.delete(new Request('/restaurant.html?id=' + restaurant.id));
                });
        }).then(function () {
            if (debug) console.log('Adding index file cache');
            return fetch(new Request('/'))
                .then(function () {
                    return fetch(new Request('/restaurant.html?id=' + restaurant.id));
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

        let requestURL = DBHelper.DATABASE_URL_RESTAURANTS + '/' + restaurant.id;
        if (debug) console.log('requestURL=' + (requestURL));

        const requestMethod = 'PUT';
        const requestBody = JSON.stringify(restaurant);
        const requestHeaders = {
            'Content-Type': 'application/json'
        };

        const fetchResult = fetch(requestURL, {
            method: requestMethod, body: requestBody, headers: requestHeaders
        })
            .catch(error => {

                if (!navigator.onLine) {

                    return dbPromise.then(function (db) {

                        if (debug) console.log('restaurant-pending-start');
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

                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message}`);
                callback(error, null);
            });

        if (fetchResult) {
            callback(null, fetchResult);
        }
        else {
            callback('Review does not exist', null);
        }
    }


    /**
     * update a review by its ID.
     */
    static addUpdateReviewById(review, callback) {
        debug = true;
        if (debug) console.log('dbhelper-addUpdateReviewById()');

        if (debug && review) {
            for (const indx in review) {
                if (debug) console.log('review[' + indx + ']=' + (review[indx]));
            }
        }

        let local_error = null;
        let cache_error = null;
        let remote_error = null;

        let idMax = review.id;
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
     * update a restaurant by its ID.
     */
    static addUpdateLocalReviewById(review, callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-addUpdateLocalReviewById()');

        return dbPromise.then(function (db) {
            if (debug) console.log('review-start');
            const txReview = db.transaction('reviews', 'readwrite');
            if (debug) console.log('txReview=' + (txReview));
            let reviewStore = txReview.objectStore('reviews');

            const idIndex = reviewStore.index('id');
            if (debug) console.log('idIndex=' + (idIndex));

            return idIndex.getAllKeys().then(keys => {
                let idMax = 0;
                keys.forEach(key => {
                    console.log('key=' + key);
                    idMax = key;
                });

                // increment last key value by 1
                idMax++;
                if (debug) console.log('idMax++=' + (idMax));

                return idMax;
            }).then(idMax => {
                if (debug) {
                    console.log('idMax.then()=' + (idMax));
                    for (const key in review) {
                        console.log(key + '=' + review[key]);
                    }
                }
                review.id = idMax;
                if (debug) {
                    console.log('updated review.id' + (idMax));
                    for (const key in review) {
                        console.log(key + '=' + review[key]);
                    }
                }

                return reviewStore
                    .get(review.id)
                    .then(function (item) {
                        if (!item) {
                            if (debug) console.log('add review item');
                            const rtNewItem = [{
                                id: idMax,
                                restaurant_id: parseInt(review.restaurant_id),
                                name: review.name,
                                rating: parseInt(review.rating),
                                comment: review.comment,
                                updatedAt: review.updatedAt,
                                createdAt: review.createdAt
                            }];
                            reviewStore.add(rtNewItem[0]);
                            if (debug) console.log('review item added');
                        }
                        else {
                            if (debug) console.log('update review item');
                            reviewStore.put(review);
                        }
                        txReview.complete;

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
     * update a restaurant by its ID.
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
     * update a restaurant by its ID.
     */
    static addUpdateRemoteReviewById(review, callback) {

        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-addUpdateRemoteReviewById()');

        let requestURL = DBHelper.DATABASE_URL_REVIEWS;
        if (debug) console.log('requestURL=' + (requestURL));

        if (debug) console.log('review.id.length=' + (review.id.length));
        if (review.id.length > 0) {
            requestURL += '/' + review.id;
            if (debug) console.log('requestURL=' + (requestURL));
        }

        const requestMethod = 'POST';
        const requestBody = JSON.stringify(restaurant);
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
        // if (debug) console.log('fetchResult=' + (fetchResult));
        //
        // if (fetchResult) {
        //     callback(null, fetchResult);
        // }
        // else {
        //     callback('Review does not exist', null);
        // }
    }

    static v1AddRestaurantsData(db) {
        if (debug) console.log('v1AddRestaurantsData()');

        return fetch(DBHelper.DATABASE_URL_RESTAURANTS)
            .then(response => response.json())
            .then(function (neighborhoods) {

                if (debug) console.log('version0AddRestaurantsData()-neighborhoods');
                if (debug) console.log('neighborhoods=' + (neighborhoods));

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
                            if (debug) console.log('indx=' + (indx));
                            if (debug) console.log('operating_hours[indx]=' + (operating_hours[indx]));
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
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed v1AddRestaurantsData. Returned status of ${error.message}`);

                throw error;
            });
    }

    static v1AddReviewsData(db) {
        if (debug) console.log('v1AddReviewsData()');

        const requestUrl = DBHelper.DATABASE_URL_REVIEWS;
        if (debug) console.log('requestUrl=' + (requestUrl));

        return fetch(requestUrl)
            .then(response => response.json())
            .then(function (reviews) {

                if (debug) console.log('v1AddReviewsData()-reviews');
                if (debug) console.log('reviews=' + (reviews));

                if (debug) console.log('restaurant-reviews-start');
                const txReviews = db.transaction('reviews', 'readwrite');
                let reviewsStore = txReviews.objectStore('reviews');
                if (debug) console.log('reviews=' + (reviews));

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
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed v1AddReviewsData. Returned status of ${error.message}`);

                throw error;
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

if (debug) console.log('end /lib/dbhelper.js');

// module.exports = DBHelper;
// window.DBHelper = DBHelper;