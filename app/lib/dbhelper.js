// js/dbhelper.js

// import idb from "idb";
if (debug) console.log('start /lib/dbhelper.js');

const appPrefix = 'mws-restaurant-stage-3';
const dbName = 'topRestaurants5';
const dbVersion = 5;

const staticCacheName = appPrefix + '-v9';
const contentImgsCache = appPrefix + '-content-imgs';

const allCaches = [
    staticCacheName,
    contentImgsCache
];
let addV1Data = false;
if (debug) console.log('dbhelper-addV1Data=' + (addV1Data));

// https://github.com/jakearchibald/idb
// https://developers.google.com/web/ilt/pwa/lab-indexeddb
// https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore
if (debug) console.log('dbhelper-dbName=' + (dbName));
if (debug) console.log('dbhelper-dbVersion=' + (dbVersion));
const dbPromise = idb.open(dbName, dbVersion, function (upgradeDb) {
    if (debug) console.log('dbhelper-upgradeDb.oldVersion=' + (upgradeDb.oldVersion));

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
            reviewsObjectStore.createIndex('id', 'id', {unique: true});
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
        console.log(`Request failed createDB. Returned status of ${error.message}`);
    });

dbPromise.then(db => {
    if (debug) console.log('dbhelper-dbPromise is set');
    const dbVersion = db.version;
    if (debug) console.log('dbhelper-dbVersion=' + (dbVersion));
    return true;
}).then(db => {
    if (debug) console.log('dbhelper-addV1Data=' + (addV1Data));
    if (addV1Data) {
        if (debug) console.log('dbhelper--calling-DBHelper.v1AddRestaurantsData()');
        return DBHelper.v1AddRestaurantsData(db, (error, result) => {
            if (error) return false;
            if (result) return true;
        });
    }
    return true;
}).then(db => {
    if (debug) console.log('dbhelper-addV1Data=' + (addV1Data));
    if (addV1Data) {
        if (debug) console.log('dbhelper--calling-DBHelper.v1AddReviewsData()');
        return DBHelper.v1AddReviewsData(db, (error, result) => {
            if (error) return false;
            if (result) return true;
        });
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
        this.reviews = null;
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
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-fetchRestaurantByCuisineAndNeighborhood()');
        // Fetch all restaurants
        return DBHelper.getAllRestaurants((error, restaurants) => {
            if (error || !restaurants) {
                return callback(error, null);
            }
            return restaurants;
        }).then(restaurants => {
            if (debug) console.log('dbhelper-fetchRestaurantByCuisineAndNeighborhood()-restaurants=' + (restaurants));
            let results = restaurants;

            if (cuisine != 'all') { // filter by cuisine
                results = results.filter(r => r.cuisine_type == cuisine);
            }
            if (neighborhood != 'all') { // filter by neighborhood
                results = results.filter(r => r.neighborhood == neighborhood);
            }
            if (debug) console.log('dbhelper-fetchRestaurantByCuisineAndNeighborhood()-results=' + (results));
            return callback(null, results);
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-fetchNeighborhoods()');
        // Fetch all restaurants
        DBHelper.getAllRestaurants((error, restaurants) => {
            if (debug) console.log('-----------------------------------');
            if (debug) console.log('dbhelper-fetchNeighborhoods()-getAllRestaurants()-error=' + (error));
            if (debug) console.log('dbhelper-fetchNeighborhoods()-getAllRestaurants()-restaurants=' + (restaurants));
            if (error) return callback(error, null);
            if (!restaurants) return callback('Restaurants does not exist', null);
            return restaurants;
        }).then(restaurants => {
            // Get all neighborhoods from all restaurants
            const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
            // Remove duplicates from neighborhoods
            const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
            return callback(null, uniqueNeighborhoods);
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-fetchCuisines()');

        // get all restaurants
        DBHelper.getAllRestaurants((error, restaurants) => {
            if (debug) console.log('-----------------------------------');
            if (debug) console.log('dbhelper-fetchCuisines()-getAllRestaurants()-error=' + (error));
            if (debug) console.log('dbhelper-fetchCuisines()-getAllRestaurants()-restaurants=' + (restaurants));
            if (error) return callback(error, null);
            if (!restaurants) return callback('Restaurants does not exist', null);
            return restaurants;
        }).then(restaurants => {
            // Get all cuisines from all restaurants
            const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
            // Remove duplicates from cuisines
            const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
            return callback(null, uniqueCuisines);
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
     * get all restaurants.
     */
    static getAllRestaurants(callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-getAllRestaurants()');

        if (debug) console.log('dbhelper-getAllRestaurants()-this.restaurants=' + (this.restaurants));

        let restaurants = this.restaurants;
        return dbPromise.then(() => {
            if (debug) console.log('dbhelper-getAllRestaurants()-(!Array.isArray(restaurants) || restaurants.length === 0)=' + ((!Array.isArray(restaurants) || restaurants.length === 0)));
            if (!Array.isArray(restaurants) || restaurants.length === 0) {
                return dbPromise.then(() => {
                    if (debug) console.log('dbhelper-getAllRestaurants()- calling-DBHelper.getAllIndexDbRestaurants()');
                    return DBHelper.getAllIndexDbRestaurants((error, restaurants) => {
                        if (debug) console.log('-----------------------------------');
                        if (debug) console.log('dbhelper-getAllRestaurants()-getAllIndexDbRestaurants()-error=' + (error));
                        if (debug) console.log('dbhelper-getAllRestaurants()-getAllIndexDbRestaurants()-restaurants=' + (restaurants));
                        if (error) return callback(error.message, null);
                        return restaurants;
                    });
                });
            }
        })
            .then(restaurants => {
                if (debug) console.log('dbhelper-getAllRestaurants()-then()=' + (restaurants));
                if (debug) console.log('dbhelper-getAllRestaurants()-(!Array.isArray(restaurants) || restaurants.length === 0)=' + ((!Array.isArray(restaurants) || restaurants.length === 0)));
                if (!Array.isArray(restaurants) || restaurants.length === 0) {
                    if (debug) console.log('dbhelper-getAllRestaurants()-calling - DBHelper.fetchAllRestaurants()');
                    return DBHelper.fetchAllRestaurants((error, restaurants) => {
                        if (debug) console.log('-----------------------------------');
                        if (debug) console.log('dbhelper-getAllRestaurants()-fetchAllRestaurants()-error=' + (error));
                        if (debug) console.log('dbhelper-getAllRestaurants()-fetchAllRestaurants()-result=' + (restaurants));
                        if (error) return callback(error.message, null);
                        return restaurants;
                    });
                }
                if (debug) console.log('dbhelper-getAllRestaurants()-getAllIndexDbRestaurants()-return=' + (restaurants));
                return restaurants;
            })
            .then(restaurants => {
                if (debug) console.log('dbhelper-getAllRestaurants()-restaurants=' + (restaurants));

                this.restaurants = restaurants;
                if (debug) console.log('dbhelper-getAllRestaurants()-this.restaurants-end=' + (this.restaurants));
                return callback(null, this.restaurants);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message}`);
                return callback(error.message, null);
            });
    }

    /**
     * Fetch review by ID.
     */
    static getRestaurantById(restaurant_id, callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-getRestaurantById()');
        if (debug) console.log('dbhelper-getRestaurantById()-restaurant_id=' + (restaurant_id));

        let restaurants = this.restaurants;
        return dbPromise.then(() => {
            if (!Array.isArray(restaurants) || restaurants.length === 0) {
                restaurants = DBHelper.getAllRestaurants((error, restaurants) => {
                    if (debug) console.log('-----------------------------------');
                    if (debug) console.log('dbhelper-getRestaurantById()-restaurants=' + (restaurants));
                    return restaurants;
                });
            }
            return restaurants;
        })
            .then(restaurants => {
                // if restaurants array exists then use that
                if (debug) console.log('dbhelper-getRestaurantById()-restaurants=' + (restaurants));

                if (!restaurants) {
                    let error_message = (`Request failed. Unable to retrieve restaurant by id.`);
                    return callback(error_message, null);
                }

                // set the this.restaurants variable
                if (debug) console.log('dbhelper-getRestaurantById()-set restaurants to this.restaurants');
            }).then(restaurants => {
                return restaurants
                    .then(restaurants => {
                        const restaurant = restaurants.filter(r => r.id == restaurant_id);
                        return callback(null, restaurant);
                    })
                    .catch(error => {
                        // Oops!. Got an error from server.
                        error.message = (`Request failed. Returned status of ${error.message}`);
                        return callback(error.message, null);
                    });
            });
    }

    /**
     * Fetch all reviews.
     */
    static getAllIndexDbRestaurants(callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-getAllIndexDbRestaurants()');

        return dbPromise.then(function (db) {
            const txRestaurants = db.transaction('restaurants', 'readonly');
            let restaurantsStore = txRestaurants.objectStore('restaurants');
            return restaurantsStore.getAll();
        }).then(restaurants_list => {
            if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-restaurants_list=' + (restaurants_list));
            if (!restaurants_list) return restaurants_list;

            let restaurants = [];
            for (const restaurant in restaurants_list) {
                if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-restaurant=' + (restaurant));
                if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-restaurant.id=' + (restaurant.id));
                let rItem = DBHelper.getIndexDbRestaurantById(restaurant.id, (error, result) => {
                    if (debug) console.log('-----------------------------------');
                    if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-result' + (result));
                    return result;
                });
                restaurants.push(rItem);
            }
            return restaurants;
        }).then(restaurants => {
            return callback(null, restaurants);
        });
    }


    /**
     * Fetch review by ID.
     */
    static getIndexDbRestaurantById(restaurant_id, callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-getIndexDbRestaurantById()');
        if (debug) console.log('dbhelper-getIndexDbRestaurantById()-restaurant_id=' + (restaurant_id));

        if (!restaurant_id) {
            let error_message = (`Request failed. Missing restaurant id`);
            return callback(error_message, null);
        }

        dbPromise.then(function (db) {
            if (debug) console.log('dbhelper-getIndexDbRestaurantById()-dbPromise');

            const txRestaurants = db.transaction('restaurants', 'readonly');
            if (debug) console.log('dbhelper-getIndexDbRestaurantById()-txRestaurants=' + (txRestaurants));

            let restaurantsStore = txRestaurants.objectStore('restaurants');
            if (debug) console.log('dbhelper-getIndexDbRestaurantById()-restaurantsStore=' + (restaurantsStore));

            const restaurant = restaurantsStore.getAll('restaurant_id', restaurant_id);
            if (debug) console.log('dbhelper-getIndexDbRestaurantById()-restaurant=' + (restaurant));

            return restaurant;

        }).then(function (db, restaurant) {
                if (!restaurant) {
                    return [];
                }

                let restaurantsArr = [];
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

                restaurantsArr.push(item);

                if (debug) console.log('dbhelper-restaurantsArr=' + (restaurantsArr));
                return restaurantsArr;
            }
        ).then(restaurant => callback(null, restaurant));
    }


    /**
     * Fetch all restaurants
     */
    static fetchAllRestaurants(callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-fetchAllRestaurants()');
        // fetch all review with proper error handling.

        let requestURL = DBHelper.DATABASE_URL_RESTAURANTS;
        if (debug) console.log('dbhelper-fetchAllRestaurants()-requestURL=' + (requestURL));

        return fetch(requestURL, {
            headers: {'Content-Type': 'application/json'}
        })
            .then(networkResponse => {
                if (debug) console.log('dbhelper-fetchAllRestaurants()-networkResponse' + (networkResponse));
                return networkResponse;
            })
            .then(response => response.json())
            .then(jsonData => {
                if (debug) console.log('dbhelper-fetchAllRestaurants()-data.length=' + (jsonData.length));
                if (debug) console.log('dbhelper-fetchAllRestaurants()-data=' + (jsonData));
                return callback(null, jsonData);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchAllRestaurants()`);
                return callback(error.message, null);
            });
    }


    /**
     * Fetch a restaurant by its restaurant ID.
     */
    static fetchRestaurantById(restaurant_id, callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-fetchRestaurantById()');
        if (debug) console.log('dbhelper-fetchRestaurantById()-restaurant_id=' + (restaurant_id));
        // fetch all restaurant with proper error handling.

        let requestURL = DBHelper.DATABASE_URL_RESTAURANTS + '/' + restaurant_id;
        if (debug) console.log('dbhelper-fetchRestaurantById()-requestURL=' + (requestURL));

        return fetch(requestURL)
            .then(response => {
                return response.json();
            })
            .then(restaurant => {

                // add or update restaurant in cache
                if (debug) console.log('dbhelper-fetchRestaurantById()-calling-DBHelper.addUpdateLocalRestaurantById()');
                DBHelper.addUpdateLocalRestaurantById(restaurant, (error, result) => {
                    if (debug) console.log('dbhelper-fetchRestaurantById()-error=' + (error));
                    if (debug) console.log('dbhelper-fetchRestaurantById()-result=' + (result));
                });

                if (debug) console.log('dbhelper-fetchRestaurantById()-calling-DBHelper.addUpdateCacheRestaurantById()');
                DBHelper.addUpdateCacheRestaurantById(restaurant, (error, result) => {
                    if (debug) console.log('-----------------------------------');
                    if (debug) console.log('dbhelper-fetchRestaurantById()-error=' + (error));
                    if (debug) console.log('dbhelper-fetchRestaurantById()-result=' + (result));
                });
                callback(null, restaurant);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message}`);
                return callback(error.message, null);
            });
    }

    /**
     * get all reviews.
     */
    static getAllReviews(callback) {

        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-getAllReviews()');

        if (!Array.isArray(this.reviews) || this.reviews.length === 0) {
            this.reviews = DBHelper.getAllIndexDbReviews((error, reviews) => {
                return reviews;
            });
            if (debug) console.log('dbhelper-getAllReviews()-this.reviews' + (this.reviews));
        }

        if (!Array.isArray(this.reviews) || this.reviews.length === 0) {
            this.reviews = DBHelper.fetchAllReviews((error, reviews) => {
                return reviews;
            });
            if (debug) console.log('dbhelper-getAllReviews()-this.reviews' + (this.reviews));
        }

        return this.reviews
            .then(reviews => {
                return callback(null, reviews);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message}`);
                return callback(error.message, null);
            });
    }

    /**
     * Fetch review by ID.
     */
    static getReviewsByRestaurantId(restaurant_id, callback) {

        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-getReviewsByRestaurantId()');
        if (debug) console.log('restaurant_id=' + (restaurant_id));

        let reviews = this.reviews;
        if (!Array.isArray(this.reviews) || this.reviews.length === 0) {
            reviews = DBHelper.getAllReviews((error, restaurant_reviews) => {
                return restaurant_reviews;
            });
        }

        // if reviews array exists then use that to filter out restaurant specific reviews
        if (debug) console.log('reviews=' + (reviews));

        return reviews
            .then(reviews => {
                const restaurant_reviews = reviews.filter(r => r.restaurant_id == restaurant_id);
                return callback(null, restaurant_reviews);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed-2. Returned status of ${error.message}`);
                return callback(error.message, null);
            });
    }

    /**
     * Fetch review by ID.
     */
    static getReviewById(restaurant_id, review_id, callback) {

        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-getReviewById()');
        if (debug) console.log('restaurant_id=' + (restaurant_id));
        if (debug) console.log('review_id=' + (review_id));

        let reviews = this.reviews;
        if (!Array.isArray(this.reviews) || this.reviews.length === 0) {
            reviews = DBHelper.getAllReviews((error, restaurant_reviews) => {
                return restaurant_reviews;
            });
        }

        // if reviews array exists then use that to filter out restaurant specific reviews
        if (debug) console.log('reviews=' + (reviews));

        return reviews
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

    /**
     * Fetch all reviews.
     */
    static getAllIndexDbReviews(callback) {

        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-getAllIndexDbReviews()');

        dbPromise.then(function (db) {
            const txReviews = db.transaction('reviews', 'readonly');
            let reviewsStore = txReviews.objectStore('reviews');
            const review_list = reviewsStore.getAll();
            return callback(null, reviews);
        });
    }

    //
    // /**
    //  * Fetch review by ID.
    //  */
    // static getIndexDbReviewsByRestaurantId(restaurant_id, callback) {
    //
    //     if (debug) console.log('-----------------------------------');
    //     if (debug) console.log('dbhelper-getIndexDbReviewsByRestaurantId()');
    //     if (debug) console.log('review_id=' + (restaurant_id));
    //
    //     dbPromise.then(function (db) {
    //         const txReviews = db.transaction('reviews', 'readonly');
    //         let reviewsStore = txReviews.objectStore('reviews');
    //         const review_list = reviewsStore.getAll('restaurant_id', restaurant.id);
    //         let reviews = [];
    //         for (const review in review_list) {
    //             const rItem = {
    //                 "id": review.id,
    //                 "restaurant_id": review.restaurant_id,
    //                 "name": review.name,
    //                 "date": review.date,
    //                 "rating": review.rating,
    //                 "comments": review.comments,
    //                 "createdAt": review.createdAt,
    //                 "updatedAt": review.updatedAt
    //             };
    //             reviews.push(rItem);
    //         }
    //         return reviews;
    //     }).then(reviews => {
    //         return callback(null, JSON.stringify(reviews));
    //     })
    //         .catch(error => {
    //             // Oops!. Got an error from server.
    //             error.message = (`Request failed. Returned status of ${error.message}`);
    //             return callback(error.message, null);
    //         });
    // }
    //
    // /**
    //  * Fetch review by ID.
    //  */
    // static getIndexDbReviewById(review_id, callback) {
    //
    //     if (debug) console.log('-----------------------------------');
    //     if (debug) console.log('dbhelper-getIndexDbReviewById()');
    //     if (debug) console.log('review_id=' + (review_id));
    //
    //     dbPromise.then(function (db) {
    //         const txReviews = db.transaction('reviews', 'readonly');
    //         let reviewsStore = txReviews.objectStore('reviews');
    //         const review_list = reviewsStore.getAll('review_id', review_id);
    //         let reviews = [];
    //         for (const review in review_list) {
    //             const rItem = {
    //                 "id": review.id,
    //                 "restaurant_id": review.restaurant_id,
    //                 "name": review.name,
    //                 "date": review.date,
    //                 "rating": review.rating,
    //                 "comments": review.comments,
    //                 "createdAt": review.createdAt,
    //                 "updatedAt": review.updatedAt
    //             };
    //             reviews.push(rItem);
    //         }
    //         return reviews;
    //     }).then(reviews => {
    //         return callback(null, JSON.stringify(reviews));
    //     })
    //         .catch(error => {
    //             // Oops!. Got an error from server.
    //             error.message = (`Request failed. Returned status of ${error.message}`);
    //             return callback(error.message, null);
    //         });
    // }

    /**
     * Fetch all reviews
     */
    static fetchAllReviews(callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-fetchAllReviews()');
        // fetch all review with proper error handling.

        if (debug) console.log('call-fetch');

        let requestURL = DBHelper.DATABASE_URL_REVIEWS;
        if (debug) console.log('requestURL=' + (requestURL));

        return fetch(requestURL)
            .then(response => callback(null, response.json()))
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed-1. Returned status of ${error.message}`);
                return callback(error.message, null);
            });
    }


    /**
     * Fetch all reviews.
     */
    static fetchReviewsByRestaurantId(restaurant_id, callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-fetchReviews()');
        if (debug) console.log('restaurant_id=' + (restaurant_id));

        if (debug) console.log('call-fetch');

        if (debug) console.log('DBHelper.DATABASE_URL_REVIEWS=' + (DBHelper.DATABASE_URL_REVIEWS));

        return fetch(DBHelper.DATABASE_URL_REVIEWS)
            .then(response => {
                const reviews = response.json();
                const restaurant_reviews = reviews.filter(r => r.restaurant_id == restaurant_id);

                if (debug) console.log('restaurant_reviews=' + (restaurant_reviews));
                return restaurant_reviews;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed-1. Returned status of ${error.message}`);
                return callback(error.message, null);
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
                callback(null, review);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed-1. Returned status of ${error.message}`);
                return callback(error.message, null);
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

        if (debug) console.log('-----------------------------------');
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

        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-addUpdateRemoteRestaurantById()');

        let requestURL = DBHelper.DATABASE_URL_RESTAURANTS + '/' + restaurant.id;
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
     * update a review by its ID.
     */
    static addUpdateReviewById(review, callback) {
        if (debug) console.log('-----------------------------------');
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

        if (debug && review) {
            for (const indx in review) {
                if (debug) console.log('review[' + indx + ']=' + (review[indx]));
            }
        }

        let requestURL = DBHelper.DATABASE_URL_REVIEWS;
        if (debug) console.log('requestURL=' + (requestURL));

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
        // if (debug) console.log('fetchResult=' + (fetchResult));
        //
        // if (fetchResult) {
        //     callback(null, fetchResult);
        // }
        // else {
        //     callback('Review does not exist', null);
        // }
    }

    static v1AddRestaurantsData(db, callback) {
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

                return callback(null, true);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed v1AddRestaurantsData. Returned status of ${error.message}`);
                return callback(error, null);
            });
    }

    static v1AddReviewsData(db, callback) {
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
                if (debug) console.log('v1AddReviewsData()-reviews-complete');

                return callback(null, true);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed v1AddReviewsData. Returned status of ${error.message}`);
                return callback(error, null);
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