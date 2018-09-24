// js/dbhelper.js

let debug = true;
if (debug) console.log('start /lib/dbhelper.js');

const appPrefix = 'mws-restaurant-stage-3';
const staticCacheName = appPrefix + '-v1';
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
            .then(networkResponse => {
                if (debug) console.log('dbhelper-fetchRestaurants()-networkResponse' + (networkResponse));
                return networkResponse;
            })
            .then(response => response.json())
            .then(restaurants => {
                for (const key in restaurants) {
                    restaurants[key].restaurant_id = restaurants[key].id;
                    restaurants[key].reviews = [];
                }

                let key = 0;
                restaurants.forEach(restaurant => {
                    if (restaurant) {
                        return DBHelper.fetchReviewsByRestaurantId(restaurant.restaurant_id, (error, result) => {
                            restaurants[key].reviews = result;
                        });
                    }
                    key++;
                });

                return restaurants;
            })
            .then(jsonData => {
                if (debug) console.log('dbhelper-fetchRestaurants()-data.length=' + (jsonData.length));
                if (debug) console.log('dbhelper-fetchRestaurants()-data=' + (jsonData));
                return callback(null, jsonData);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchRestaurants()`);
                return callback(error.message, null);
            });

        // let restaurants = this.restaurants;
        //
        // return dbPromise.then(restaurants => {
        //     if (debug) console.log('dbhelper-fetchRestaurants()-array check first=' + (!Array.isArray(restaurants) || restaurants.length === 0));
        //     if (!Array.isArray(restaurants) || restaurants.length === 0) {
        //         return DBHelper.getAllIndexDbRestaurants((error, restaurants) => {
        //             if (debug) console.log('dbhelper-fetchRestaurants()-array check first-return=' + (!Array.isArray(restaurants) || restaurants.length === 0));
        //             if (error) return callback(error.message, null);
        //             return restaurants;
        //         });
        //     }
        //     else return restaurants;
        // })
        //     .then(restaurants => {
        //         if (debug) console.log('dbhelper-fetchRestaurants()-array check second=' + (!Array.isArray(restaurants) || restaurants.length === 0));
        //         if (!Array.isArray(restaurants) || restaurants.length === 0) {
        //             return fetch(DBHelper.DATABASE_URL_RESTAURANTS)
        //                 .then(response => response.json())
        //                 .then(restaurants => {
        //                     for (const key in restaurants) {
        //                         restaurants[key].restaurant_id = restaurants[key].id;
        //                         restaurants[key].reviews = [];
        //                     }
        //
        //                     let key = 0;
        //                     restaurants.forEach(restaurant => {
        //                         if (restaurant) {
        //                             return DBHelper.fetchReviewsByRestaurantId(restaurant.restaurant_id, (error, result) => {
        //                                 restaurants[key].reviews = result;
        //                             });
        //                         }
        //                         key++;
        //                     });
        //
        //                     return restaurants;
        //                 });
        //         }
        //         else return restaurants;
        //     })
        //     .then(restaurants => {
        //         if (debug) console.log('dbhelper-fetchRestaurants()-array check third=' + (!Array.isArray(restaurants) || restaurants.length === 0));
        //         this.restaurants = restaurants;
        //         if (debug) console.log('dbhelper-getAllRestaurants()-this.restaurants-end=' + (this.restaurants));
        //         return callback(null, this.restaurants);
        //     })
        //     .catch(error => {
        //         // Oops!. Got an error from server.
        //         error.message = (`Request failed. Returned status of ${error.message}`);
        //         return callback(error.message, null);
        //     });

    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        //console.log('dbhelper-fetchRestaurantById()');
        // fetch all restaurants with proper error handling.
        DBHelper.getAllRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            }
            else {
                const restaurant = restaurants.find(r => r.restaurant_id == id);
                if (restaurant) { // Got the restaurant
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
        //console.log('dbhelper-fetchRestaurantByCuisine()');
        // Fetch all restaurants  with proper error handling
        DBHelper.getAllRestaurants((error, restaurants) => {
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
        //console.log('dbhelper-fetchRestaurantByNeighborhood()');
        // Fetch all restaurants
        DBHelper.getAllRestaurants((error, restaurants) => {
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
        //console.log('dbhelper-fetchRestaurantByCuisineAndNeighborhood()');
        // Fetch all restaurants
        DBHelper.getAllRestaurants((error, restaurants) => {
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
        //console.log('dbhelper-fetchNeighborhoods()');
        // Fetch all restaurants
        DBHelper.getAllRestaurants((error, restaurants) => {
            //console.log('dbhelper-fetchNeighborhoods()-restaurants-callback');
            if (error) {
                callback(error, null);
            }
            else {
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
        //console.log('dbhelper-fetchCuisines()');
        // Fetch all restaurants
        DBHelper.getAllRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            }
            else {
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
        return (`./restaurant.html?id=${restaurant.restaurant_id}`);
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
                //if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-(typeof txRestaurants)=' + ((typeof txRestaurants)));

                const restaurantsStore = txRestaurants.objectStore('restaurants');
                //if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-(typeof restaurantsStore)=' + ((typeof restaurantsStore)));

                return restaurantsStore.getAll();
            })
            .then(restaurants => {
                return (typeof restaurants !== 'undefined' && restaurants.length > 0);
            });
    }


    /**
     * get all Db .
     */
    static getAllIndexDbRestaurants(callback) {
        if (debug) console.log('dbhelper-getAllIndexDbRestaurants()');

        return dbPromise
            .then(db => {
                const txRestaurants = db.transaction('restaurants', 'readonly');
                //if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-(typeof txRestaurants)=' + ((typeof txRestaurants)));

                const restaurantsStore = txRestaurants.objectStore('restaurants');
                //if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-(typeof restaurantsStore)=' + ((typeof restaurantsStore)));

                return restaurantsStore.getAll();
            })
            .then(restaurants => {
                if (debug) console.log('dbhelper-getAllIndexDbRestaurants()- first - (typeof restaurants !== undefined && restaurants.length > 0)=' + ((typeof restaurants !== 'undefined' && restaurants.length > 0)));

                if (typeof restaurants !== 'undefined' && restaurants.length > 0) {
                    if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-restaurants.length=' + (restaurants.length));
                    for (let restaurant of restaurants) {
                        if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-restaurant_id=' + (restaurant.restaurant_id));
                        restaurant.id = restaurant.restaurant_id;
                        restaurant.latlng = [];
                        restaurant.latlng.lat = restaurant.lat;
                        restaurant.latlng.lng = restaurant.lng;
                        restaurant.operating_hours = [];
                        restaurant.reviews = [];
                    }
                }
                return restaurants;
            })
            .then(restaurants => {
                if (debug) console.log('dbhelper-getAllIndexDbRestaurants()- second - (typeof restaurants !== undefined && restaurants.length > 0)=' + ((typeof restaurants !== 'undefined' && restaurants.length > 0)));

                return dbPromise.then(db => {
                    if (typeof restaurants !== 'undefined' && restaurants.length > 0) {
                        const txOperatingHours = db.transaction('operating_hours', 'readonly');
                        const operatingHoursStore = txOperatingHours.objectStore('operating_hours');
                        operatingHoursStore.getAll()
                            .then(all_operating_hours => {
                                for (let restaurant of restaurants) {
                                    if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-restaurant_id for operating_hours=' + (restaurant.restaurant_id));
                                    for (let restaurant of restaurants) {
                                        const operating_hours = all_operating_hours.filter(r => r.restaurant_id == restaurant.restaurant_id);
                                        if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-restaurants.operating_hours.length=' + (operating_hours.length));
                                        restaurant.operating_hours = operating_hours;
                                    }
                                }
                            });

                    }
                    return restaurants;
                });

            })
            .then(restaurants => {
                if (debug) console.log('dbhelper-getAllIndexDbRestaurants()- third - (typeof restaurants !== undefined && restaurants.length > 0)=' + ((typeof restaurants !== 'undefined' && restaurants.length > 0)));

                return dbPromise.then(db => {
                    if (typeof restaurants !== 'undefined' && restaurants.length > 0) {
                        for (let restaurant of restaurants) {
                            if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-restaurant_id for reviews=' + (restaurant.restaurant_id));
                            const txReviews = db.transaction('reviews', 'readonly');
                            const reviewsStore = txReviews.objectStore('reviews');
                            reviewsStore.getAll()
                                .then(all_reviews => {
                                    for (let restaurant of restaurants) {
                                        const reviews = all_reviews.filter(r => r.restaurant_id == restaurant.restaurant_id);
                                        if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-restaurants.reviews.length=' + (reviews.length));
                                        restaurant.reviews = reviews;
                                    }
                                });
                        }
                    }
                    return restaurants;
                });
            })
            .then(restaurants => {
                if (debug) console.log('dbhelper-getAllIndexDbRestaurants()- fourth - (typeof restaurants !== undefined && restaurants.length > 0)=' + ((typeof restaurants !== 'undefined' && restaurants.length > 0)));

                callback(null, restaurants);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message}`);
                console.log(error.message);
                callback(error, null);
            });

        // return dbPromise.then(db => {
        //
        //     const restaurants = restaurantsStore.getAll();
        //     if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-(typeof restaurants !== undefined && restaurants.length > 0)=' + ((typeof restaurants !== 'undefined' && restaurants.length > 0)));
        //     return restaurants;
        // })
        // .then(restaurants => {
        //     if (typeof restaurants !== 'undefined' && restaurants.length > 0)
        //     {
        //         if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-restaurants.length=' + (restaurants.length));
        //         for (let restaurant of restaurants) {
        //             const restaurant_id = restaurant.restaurant_id;
        //             if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-restaurant_id=' + (restaurant_id));
        //             restaurant.id = restaurant_id;
        //             restaurant.latlng = [];
        //             restaurant.latlng.lat = restaurant.lat;
        //             restaurant.latlng.lng = restaurant.lng;
        //
        //             let operating_hours = [];
        //             const operating_hours_list = operatingHoursStore.getAll(['restaurant_id', restaurant_id]);
        //             // for (const indx in operating_hours_list) {
        //             //     operating_hours[indx] = [operating_hours_list[indx]];
        //             // }
        //             restaurant.operating_hours = operating_hours_list;
        //
        //             let reviews = [];
        //             const review_list = reviewsStore.getAll('restaurant_id', restaurant_id);
        //             // for (const review in review_list) {
        //             //     const rItem = {
        //             //         "review_id": review.review_id,
        //             //         "name": review.name,
        //             //         "createdAt": review.createdAt,
        //             //         "updatedAt": review.updatedAt,
        //             //         "rating": review.rating,
        //             //         "comments": review.comments
        //             //     };
        //             //     reviews.push(rItem);
        //             // }
        //             restaurant.reviews = review_list;
        //         }
        //     }

        // for (const restaurant of restaurants) {
        //     if (restaurant) {
        //         if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-restaurant.restaurant_id=' + (restaurant.restaurant_id));
        //         DBHelper.getIndexDbRestaurantById(restaurant.restaurant_id, (error, result) => {
        //             if (debug) console.log('dbhelper-getAllIndexDbRestaurants()-result=' + (result));
        //             if (result) {
        //                 restaurants.push(result);
        //             }
        //             return;
        //         });
        //     }
        // }
        //     return restaurants;
        // }).then(restaurants => {
        //     callback(null, restaurants);
        // })
        //     .catch(error => {
        //         // Oops!. Got an error from server.
        //         error.message = (`Request failed. Returned status of ${error.message}`);
        //         console.log(error.message);
        //         callback(error, null);
        //     });

        // return fetch(DBHelper.DATABASE_URL_RESTAURANTS, {
        //     headers: {'Content-Type': 'application/json'}
        // })
        //     .then(networkResponse => {
        //         if (debug) console.log('dbhelper-fetchRestaurants()-networkResponse' + (networkResponse));
        //         return networkResponse;
        //     })
        //     .then(response => response.json())
        //     .then(restaurants => {
        //         for (const key in restaurants) {
        //             restaurants[key].restaurant_id = restaurants[key].id;
        //             restaurants[key].reviews = [];
        //         }
        //
        //         let key = 0;
        //         restaurants.forEach(restaurant => {
        //             if (restaurant) {
        //                 return DBHelper.fetchReviewsByRestaurantId(restaurant.restaurant_id, (error, result) => {
        //                     restaurants[key].reviews = result;
        //                 });
        //             }
        //             key++;
        //         });
        //
        //         return restaurants;
        //     })
        //     .then(jsonData => {
        //         if (debug) console.log('dbhelper-fetchRestaurants()-data.length=' + (jsonData.length));
        //         if (debug) console.log('dbhelper-fetchRestaurants()-data=' + (jsonData));
        //         return callback(null, jsonData);
        //     })
        //     .catch(error => {
        //         // Oops!. Got an error from server.
        //         error.message = (`Request failed. Returned status of ${error.message} - dbhelper-fetchRestaurants()`);
        //         return callback(error.message, null);
        //     });

    }


    /**
     * Fetch review by ID.
     */
    static getIndexDbRestaurantById(restaurant_id, callback) {
        if (debug) console.log('dbhelper-getIndexDbRestaurantById()-input-restaurant_id=' + (restaurant_id));

        if (!restaurant_id || restaurant_id.length === 0) {
            let error_message = (`Request failed. Missing restaurant id`);
            return callback(error_message, null);
        }

        let restaurantsArr = [];
        dbPromise.then(db => {

            const txRestaurants = db.transaction('restaurants', 'readonly');
            if (debug) console.log('dbhelper-getIndexDbRestaurantById()-txRestaurants=' + (txRestaurants));

            let restaurantsStore = txRestaurants.objectStore('restaurants');
            if (debug) console.log('dbhelper-getIndexDbRestaurantById()-restaurantsStore=' + (restaurantsStore));

            const restaurant = restaurantsStore.get(restaurant_id);
            if (debug) console.log('dbhelper-getIndexDbRestaurantById()-restaurant=' + (restaurant));


            if (debug) console.log('dbhelper-getIndexDbRestaurantById()-restaurant.restaurant_id=' + (restaurant.restaurant_id));

            if (!restaurant || restaurant.length === 0) {
                return [];
            }

            let item =
                {
                    "restaurant_id": restaurant.restaurant_id,
                    "name": restaurant.name,
                    "neighborhood": restaurant.neighborhood,
                    "photograph": restaurant.photograph,
                    "address": restaurant.address,
                    "latlng": {
                        "lat": restaurant.lat,
                        "lng": restaurant.lng,
                    },
                    "cuisine_type": restaurant.cuisine_type,
                };

            let operating_hours = [];
            let reviews = [];
            if (restaurant.restaurant_id) {
                const txOperatingHours = db.transaction('operating_hours', 'readonly');
                let operatingHoursStore = txOperatingHours.objectStore('operating_hours');
                const operating_hours_list = operatingHoursStore.getAll(['restaurant_id', restaurant.restaurant_id]);
                for (const indx in operating_hours_list) {
                    operating_hours[indx] = [operating_hours_list[indx]];
                }

                const txReviews = db.transaction('reviews', 'readonly');
                let reviewsStore = txReviews.objectStore('reviews');
                const review_list = reviewsStore.getAll('restaurant_id', restaurant.restaurant_id);
                for (const review in review_list) {
                    const rItem = {
                        "review_id": review.review_id,
                        "name": review.name,
                        "createdAt": review.createdAt,
                        "updatedAt": review.updatedAt,
                        "rating": review.rating,
                        "comments": review.comments
                    };
                    reviews.push(rItem);
                }
            }
            item["operating_hours"] = operating_hours;
            item["reviews"] = reviews;

            restaurantsArr.push(item);


            if (debug) console.log('dbhelper-getIndexDbRestaurantById()-restaurantsArr=' + (restaurantsArr));

            callback(null, restaurantsArr);
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
                error.message = (`Request failed v1AddRestaurantsData. Returned status of ${error.message}`);
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

        return dbPromise.then(db => {
            if (debug) console.log('restaurant-restaurant-start');
            const txRestaurants = db.transaction('restaurants', 'readwrite');
            let restaurantsStore = txRestaurants.objectStore('restaurants');

            restaurantsStore
                .get(restaurant.restaurant_id)
                .then(function (item) {
                    if (!item) {
                        const rtNewItem = [{
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
                    return cache.delete(new Request('/restaurant.html?id=' + restaurant.restaurant_id));
                });
        }).then(function () {
            if (debug) console.log('Adding index file cache');
            return fetch(new Request('/'))
                .then(function () {
                    return fetch(new Request('/restaurant.html?id=' + restaurant.restaurant_id));
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
        if (debug) console.log('dbhelper-fetchReviewsByRestaurantId()');
        if (debug) console.log('dbhelper-fetchReviewsByRestaurantId()-restaurant_id=' + (restaurant_id));

        if (debug) console.log('call-fetch');

        const review_url = DBHelper.DATABASE_URL_REVIEWS + '?restaurant_id=' + restaurant_id;
        if (debug) console.log('dbhelper-fetchReviewsByRestaurantId()-review_url=' + (review_url));

        return fetch(review_url)
            .then(response => response.json())
            .then(reviews => {
                if (debug) console.log('dbhelper-fetchReviewsByRestaurantId()-reviews=' + (reviews));
                //reviews.forEach(review => {
                //    console.log('dbhelper-fetchReviewsByRestaurantId()-reviews-review=' + (review.id));
                //});
                //callback(null, reviews);
                return reviews;
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed-1. Returned status of ${error.message}`);
                console.log(error.message);
                callback(error, null);
            });
    }


    /**
     * get all restaurants.
     */
    static getAllRestaurants(callback) {
        if (debug) console.log('dbhelper-getAllRestaurants()');

        if (debug) console.log('dbhelper-getAllRestaurants()-this.restaurants=' + (this.restaurants));

        return dbPromise
            .then(() => {
                return this.restaurants;
            })
            .then((restaurants) => {
                if (debug) console.log('dbhelper-getAllRestaurants()- is restaurants array empty - first =' + ((!Array.isArray(restaurants) || restaurants.length === 0)));
                if (debug) console.log('dbhelper-getAllRestaurants()- is restaurants array empty - first - restaurants =' + (restaurants));
                if (!Array.isArray(restaurants) || restaurants.length === 0) {
                    return DBHelper.getAllIndexDbRestaurants((error, results) => {
                        if (error) callback(error.message, null);
                        if (debug) console.log('dbhelper-getAllRestaurants()- is restaurants array empty - first-sub =' + ((!Array.isArray(results) || results.length === 0)));
                        if (debug) console.log('dbhelper-getAllRestaurants()- is restaurants array empty - first-sub - results =' + (results));
                        if (Array.isArray(results) && results.length > 0) this.restaurants = results;
                        return this.restaurants;
                    });
                }
                else return this.restaurants;
            })
            .then((restaurants) => {
                if (debug) console.log('dbhelper-getAllRestaurants()- is restaurants array empty - second =' + ((!Array.isArray(restaurants) || restaurants.length === 0)));
                if (debug) console.log('dbhelper-getAllRestaurants()- is restaurants array empty - second - restaurants =' + (restaurants));
                if (!Array.isArray(restaurants) || restaurants.length === 0) {
                    return DBHelper.fetchRestaurants((error, results) => {
                        if (error) return callback(error.message, null);
                        if (debug) console.log('dbhelper-getAllRestaurants()- is restaurants array empty - second-sub =' + ((!Array.isArray(results) || results.length === 0)));
                        if (debug) console.log('dbhelper-getAllRestaurants()- is restaurants array empty - second-sub - results =' + (results));
                        if (Array.isArray(results) && results.length > 0) this.restaurants = results;
                        return this.restaurants;
                    });
                }
                else return this.restaurants;
            })
            .then(restaurants => {
                if (debug) console.log('dbhelper-getAllRestaurants()- is restaurants array empty - third =' + ((!Array.isArray(restaurants) || restaurants.length === 0)));
                if (debug) console.log('dbhelper-getAllRestaurants()- is restaurants array empty - third - restaurants =' + (restaurants));
                this.restaurants = restaurants;
                return callback(null, this.restaurants);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                error.message = (`Request failed. Returned status of ${error.message}`);
                return callback(error.message, null);
            });
    }

    /**
     * get restaurant by ID.
     */
    static getRestaurantById(restaurant_id, callback) {
        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-getRestaurantById()');
        if (debug) console.log('dbhelper-getRestaurantById()-restaurant_id=' + (restaurant_id));

        if (debug) console.log('dbhelper-getRestaurantById()-this.restaurants=' + (this.restaurants));

        let error_message = '';

        let restaurants = this.restaurants;
        return dbPromise
            .then(restaurants, () => {
                if (!Array.isArray(restaurants) || restaurants.length === 0) {
                    if (debug) console.log('dbhelper-getRestaurantById()-getAllRestaurants()');
                    return DBHelper
                        .getAllRestaurants((error, restaurants) => {
                            if (debug) console.log('-----------------------------------');
                            if (debug) console.log('dbhelper-getRestaurantById()-getAllRestaurants()-restaurants=' + (restaurants));
                            return restaurants;
                        });
                }
                else {
                    return restaurants;
                }
            })
            .then(restaurants, () => {
                // if restaurants array exists then use that
                if (debug) console.log('dbhelper-getRestaurantById()-restaurants=' + (restaurants));

                if (!restaurants) {
                    // Oops!. Got an error from server.
                    const error_message = (`Request failed. Restaurants could not be retrived`);
                    return callback(error_message, null);
                }
                if (debug) console.log('dbhelper-getRestaurantById()-restaurants[0]=' + (restaurants[0]));
                if (debug) console.log('dbhelper-getRestaurantById()-restaurants.name=' + (restaurants.name));

                let restaurant = restaurants.filter(r => r.id == restaurant_id);
                if (debug) console.log('dbhelper-getRestaurantById()-restaurant.filter()=' + (restaurant));

                if (!restaurants) {
                    // Oops!. Got an error from server.
                    error_message = (`Request failed. Restaurant by id could not be located`);
                    return callback(error_message, null);
                }

                restaurant = restaurant[0];
                if (debug) console.log('dbhelper-getRestaurantById()-restaurant.filter()=' + (restaurant));
                return callback(null, restaurant);
            });
    }


    /**
     * get all reviews.
     */
    static getAllReviews(callback) {

        if (debug) console.log('-----------------------------------');
        if (debug) console.log('dbhelper-getAllReviews()');

        let reviews = this.reviews;
        return dbPromise
            .then(reviews, () => {
                if (!Array.isArray(reviews) || reviews.length === 0) {
                    return DBHelper.getAllIndexDbReviews((error, restaurant_reviews) => {
                        return restaurant_reviews;
                    });
                }
                else {
                    return reviews;
                }
            })
            .then(reviews => {
                if (debug) console.log('reviews=' + (reviews));

                if (!reviews) return callback('No reviews found', null);

                // update reviews
                this.reviews = reviews;

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
        return dbPromise
            .then(reviews, () => {
                if (!Array.isArray(reviews) || reviews.length === 0) {
                    return DBHelper.getAllReviews((error, restaurant_reviews) => {
                        return restaurant_reviews;
                    });
                }
                else {
                    return reviews;
                }
            })
            .then(reviews, () => {
                if (debug) console.log('reviews=' + (reviews));

                if (!reviews) return callback('No reviews found', null);

                // if reviews array exists then use that to filter out restaurant specific reviews
                const restaurant_reviews = reviews.filter(r => r.restaurant_id == restaurant_id);
                return callback(null, restaurant_reviews);
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