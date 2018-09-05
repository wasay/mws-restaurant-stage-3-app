// js/dbhelper.js

// let _appPrefix = 'mws-restaurant-stage-3';
// let _staticCacheName = 'mws-restaurant-stage-3' + '-v1';
// let _contentImgsCache = 'mws-restaurant-stage-3' + '-content-imgs';
// let _allCaches = [
//     _staticCacheName,
//     _contentImgsCache
// ];
let _dbName = 'topRestaurants3';
// let _dbVersion = 1;
let _dbPromise = null;
// let _debug = true;

/**
 * Common database helper functions.
 */
class DBHelper {
    constructor() {
        this.restaurants = null;
        this.reviews = null;
        // this.dbPromise = null;
    }

    // static get appPrefix() {
    //     return _appPrefix;
    // }
    //
    // static get staticCacheName() {
    //     return _staticCacheName;
    // }
    //
    // static get contentImgsCache() {
    //     return _contentImgsCache;
    // }
    //
    // static get allCaches() {
    //     return _allCaches;
    // }
    //
    // static get dbName() {
    //     return _dbName;
    // }
    //
    // static get dbVersion() {
    //     return _dbVersion;
    // }
    //
    // static get dbPromise() {
    //     return _dbPromise;
    // }
    //
    static set dbPromise(value) {
        _dbPromise = value;
    }
    //
    // static get debug() {
    //     return _debug;
    // }

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
     * get all restaurants.
     */
    static getRestaurants(callback) {
        let debug = true;
        if (debug) console.log('dbhelper-getRestaurants()');

        let first_load = false;
        if (!Array.isArray(this.restaurants) || this.restaurants.length === 0) {
            first_load = true;
        }
        if (debug) console.log('first_load=' + (first_load));

        let restaurants = [];
        if (first_load) {
            if (debug) console.log('typeof _dbPromise=' + (typeof _dbPromise));

            if (typeof _dbPromise !== 'object') {
                // Oops!. Got an error from server.
                if (debug) console.log('_dbPromise is not set');
                const error = 'Error';
                return callback(error, null);
            }
            if (debug) console.log('_dbPromise=' + (_dbPromise));

            _dbPromise.then(function (db) {
                if (debug) console.log('get cache values db=' + (db));

                const txRestaurants = db.transaction('restaurants', 'readonly');
                let restaurantsStore = txRestaurants.objectStore('restaurants');

                restaurants = restaurantsStore.getAll();
            }).then(function (items) {
                    if (debug) console.log('items=' + (items));
                    if (!items) {
                        return;
                    }

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

                        item["operating_hours"] = DBHelper.getRestaurantOperatingHours(restaurant);
                        item["reviews"] = DBHelper.getRestaurantReviews(restaurant);
                        restaurants.push(item);
                    }
                    if (debug) console.log('restaurants=' + (restaurants));
                }
            );
            if (debug) console.log('is cache exists? this.restaurants=' + (restaurants));

            if (typeof restaurants === 'undefined' || restaurants === 'undefined' || restaurants.length === 0) {
                if (debug) console.log('get remote copy second');
                DBHelper.fetchRestaurants((error, restaurants) => {
                    if (error) return callback(error, null);
                    return callback(null, restaurants);
                })
            }
        }
        if (debug) console.log('restaurants=' + (restaurants));

        return callback(null, restaurants);
    }

    /**
     * get all restaurant reviews.
     */
    static getRestaurantOperatingHours(restaurant) {
        let debug = true;
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
        let debug = true;
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
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {
        let debug = true;
        if (debug) console.log('dbhelper-fetchRestaurants()');

        return fetch(DBHelper.DATABASE_URL_RESTAURANTS)
            .then(response => response.json())
            .then(response => callback(null, response))
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
        let debug = true;
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
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        let debug = true;
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
        let debug = true;
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
        let debug = true;
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
        let debug = true;
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
        let debug = true;
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
        let debug = true;

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
        let debug = true;
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
        let debug = true;

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
        let debug = true;
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
        let debug = true;
        if (debug) console.log('dbhelper-addUpdateRestaurantById()');

        let local_error = false;
        let cache_error = false;
        let remote_error = false;

        DBHelper.addUpdateLocalRestaurantById(restaurant, (error, result) => {
            local_error = error;
        });
        DBHelper.addUpdateCacheRestaurantById(restaurant, (error, result) => {
            cache_error = error;
        });
        DBHelper.addUpdateRemoteRestaurantById(restaurant, (error, result) => {
            remote_error = error;
        });

        if (local_error || cache_error || remote_error) {
            callback(local_error || cache_error || remote_error, null);
        }
    }

    /**
     * update a restaurant by its ID.
     */
    static addUpdateLocalRestaurantById(restaurant, callback) {
        let debug = true;
        if (debug) console.log('dbhelper-addUpdateLocalRestaurantById()');

        _dbPromise.then(db => {
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
        let debug = true;

        if (debug) console.log('dbhelper-addUpdateCacheRestaurantById()');

        if (debug) console.log('Updating cache');
        return caches.open(staticCacheName).then(function (cache) {
            if (debug) console.log('Delete cache');
            return cache.delete(new Request('/'))
                .then(function () {
                    return cache.delete(new Request('/restaurant.html?id=' + restaurant.id));
                });
        }).then(function () {
            if (debug) console.log('Add cache');
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
        let debug = true;

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
                    _dbPromise.then(db => {

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
    static addUpdateReviewById(id, callback) {
        let debug = true;

        if (debug) console.log('dbhelper-addUpdateReviewById()');
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
}

// module.exports = DBHelper;
// window.DBHelper = DBHelper;