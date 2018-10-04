// js/index.js

//DBHelper.debugObject('', 'start /js/index.js');

let neighborhoods,
    cuisines;
let map;
let markers = [];
let is_map_to_be_loaded = false;

// debug = true;

let is_append_properties = !navigator.onLine;
/**
 * document content load
 */
document.addEventListener('DOMContentLoaded', (event) => {
    //DBHelper.debugObject('', 'index-DOMContentLoaded()');


    lazyLoadImages();

    new Promise((resolve, reject) => {
        //DBHelper.debugObject('', 'index-DOMContentLoaded()-1-v1LoadData()-call');
        const load_all_restaurants = true;
        //DBHelper.debugObject(load_all_restaurants, 'index-DOMContentLoaded()-load_all_restaurants');
        DBHelper.v1LoadData(load_all_restaurants, (error, result) => {
            //DBHelper.debugObject(error, 'index-DOMContentLoaded()-v1LoadData-error');
            //DBHelper.debugObject(result, 'index-DOMContentLoaded()-v1LoadData-result');
            if (error || !result) resolve(false);
            resolve(result);
        });
    })
        .then((restaurants) => {
            //DBHelper.debugObject(restaurants, 'index-DOMContentLoaded()-2-1-restaurants');

            return new Promise((resolve2, reject2) => {
                //DBHelper.debugObject('', 'index-DOMContentLoaded()-2-2-processPendingRequests()-call');

                DBHelper.processPendingRequests((error, result) => {
                    //DBHelper.debugObject(result, 'index-DOMContentLoaded()-2-3-processPendingRequests()-result');
                    resolve2(true);
                });
            });
        })
        .then((restaurants) => {
            //DBHelper.debugObject(restaurants, 'index-DOMContentLoaded()-3-1-restaurants');

            return new Promise((resolve3, reject3) => {
                //DBHelper.debugObject('', 'index-DOMContentLoaded()-3-2-fetchNeighborhoods()-call');

                fetchContent(is_append_properties, (error, result) => {
                    //DBHelper.debugObject(result, 'index-DOMContentLoaded()-3-3-fetchNeighborhoods()-result');
                    resolve3(true);
                });
            });
        })
        .catch(error => {
            console.log('Error: ' + (error));
        });

});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchContent = (is_append_properties, callback) => {

    return new Promise((resolve2, reject2) => {
        //DBHelper.debugObject('', 'index-DOMContentLoaded()-2-2-fetchNeighborhoods()-call');

        fetchNeighborhoods(is_append_properties, (error, result) => {
            //DBHelper.debugObject(result, 'index-DOMContentLoaded()-2-3-fetchNeighborhoods()-result');
            resolve2(true);
        });
    })
        .then((result) => {
            //DBHelper.debugObject(result, 'index-DOMContentLoaded()-3-1-result');

            return new Promise((resolve3, reject3) => {
                //DBHelper.debugObject('', 'index-DOMContentLoaded()-3-2-fetchCuisines()-call');
                fetchCuisines(is_append_properties, (error, result) => {
                    //DBHelper.debugObject(result, 'index-DOMContentLoaded()-3-3-fetchCuisines()-result');
                    resolve3(true);
                });
            });
        })
        .then((result) => {
            //DBHelper.debugObject(result, 'index-DOMContentLoaded()-4-1-result');

            //DBHelper.debugObject('', 'index-DOMContentLoaded()-4-1-updateRestaurants()-call');
            updateRestaurants();
            return true;
        })
        .catch(error => {
            console.log('Error: ' + (error));
        });
};

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = (is_append_properties, callback) => {
    //DBHelper.debugObject('', 'index-fetchNeighborhoods()');

    return new Promise((resolve, reject) => {
        //DBHelper.debugObject('', 'index-fetchNeighborhoods()-1-fetchNeighborhoods()-call');
        DBHelper.fetchNeighborhoods(is_append_properties, (error, neighborhoods) => {
            //DBHelper.debugObject(error, 'index-fetchNeighborhoods()-1-fetchNeighborhoods-error');
            //DBHelper.debugObject(neighborhoods, 'index-fetchNeighborhoods()-1-fetchNeighborhoods-neighborhoods');

            if (error) reject(false);
            resolve(neighborhoods);
        });
    }).then((neighborhoods) => {
        //DBHelper.debugObject(neighborhoods, 'index-fetchNeighborhoods()-2-neighborhoods');
        if (neighborhoods) {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
        else {
            console.log('Error: data missing -index-fetchNeighborhoods()');
        }
        callback(null, neighborhoods);
    })
        .catch(error => {
            // Oops!. Got an error from server.
            console.log(error + '-index-fetchNeighborhoods()-catch');
            callback(error.message, null);
        });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    //DBHelper.debugObject('', 'index-fillNeighborhoodsHTML()');
    //DBHelper.debugObject(neighborhoods, 'index-fillNeighborhoodsHTML()-neighborhoods');

    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = (is_append_properties, callback) => {
    //DBHelper.debugObject('', 'index-fetchCuisines()');

    return new Promise((resolve, reject) => {
        //DBHelper.debugObject('', 'index-fetchCuisines()-1-fetchCuisines()-call');
        DBHelper.fetchCuisines(is_append_properties, (error, cuisines) => {
            //DBHelper.debugObject(error, 'index-fetchCuisines()-1-2-fetchCuisines()-error');
            //DBHelper.debugObject(cuisines, 'index-fetchCuisines()-1-2-fetchCuisines()-cuisines');

            if (error) reject(false);
            resolve(cuisines);
        });
    }).then((cuisines) => {
        //DBHelper.debugObject(cuisines, 'index-fetchCuisines()-2-cuisines');
        if (cuisines) {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
        callback(null, cuisines);
    })
        .catch(error => {
            // Oops!. Got an error from server.
            console.log(error + '-index-fetchCuisines()-catch');
            callback(error.message, null);
        });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
    //DBHelper.debugObject('', 'index-fillCuisinesHTML()');
    //DBHelper.debugObject(cuisines, 'index-fillCuisinesHTML()-cuisines');

    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    //DBHelper.debugObject('', 'index-initMap()');

    self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: new google.maps.LatLng(0, 0),
        scrollwheel: false
    });
    //updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
    //DBHelper.debugObject('', 'index-updateRestaurants()');

    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    //DBHelper.debugObject(cuisine, 'index-updateRestaurants()-1-1-cuisine');
    //DBHelper.debugObject(neighborhood, 'index-updateRestaurants()-1-1-neighborhood');

    new Promise((resolve, reject) => {
        DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, is_append_properties, (error, result) => {
            //DBHelper.debugObject(error, 'index-updateRestaurants()-1-2-fetchRestaurantByCuisineAndNeighborhood()-error');
            //DBHelper.debugObject(result, 'index-updateRestaurants()-1-2-fetchRestaurantByCuisineAndNeighborhood()-result');
            if (error) reject(error);
            resolve(result);
        })
    })
        .then((restaurants) => {
            //DBHelper.debugObject(restaurants, 'index-updateRestaurants()-2-restaurants');
            if (restaurants) {
                resetRestaurants(restaurants);
                fillRestaurantsHTML();
            }
        })
        .catch(error => {
            // Oops!. Got an error from server.
            console.log(error + '-index-updateRestaurants()-catch');
        });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
    //DBHelper.debugObject('', 'index-resetRestaurants()');
    //DBHelper.debugObject(restaurants, 'index-fillRestaurantsHTML()-restaurants');

    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    if (typeof self.markers != 'undefined' && self.markers != 'undefined') {
        self.markers.forEach(m => m.setMap(null));
    }
    self.markers = [];
    self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
    //DBHelper.debugObject('', 'index-fillRestaurantsHTML()');
    //DBHelper.debugObject(restaurant, 'index-fillRestaurantsHTML()-restaurant');

    if (!restaurants) return;

    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
    //DBHelper.debugObject('', 'index-createRestaurantHTML()');
    //DBHelper.debugObject(restaurant, 'index-createRestaurantHTML()-restaurant');

    if (!restaurant) {
        return false;
    }
    const li = document.createElement('li');

    const img = DBHelper.imageUrlForRestaurant(restaurant);

    const image = document.createElement('img');
    image.className = 'restaurant-img lazy';
    image.alt = restaurant.name;
    if (img) {
        img_parts = img.split('/');

        image.src = img_parts[0] + '/320/' + img_parts[1];
        //https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/
        //https://stackoverflow.com/questions/16449445/how-can-i-set-image-source-with-base64
        image.setAttribute('data-sizes', 'auto');
        image.setAttribute('data-src', img_parts[0] + '/320/' + img_parts[1]);
        image.setAttribute('data-srcset', '' + img_parts[0] + '/320/' + img_parts[1] + ' 300w,' + img_parts[0] + '/640/' + img_parts[1] + ' 600w,' + img_parts[0] + '/1024/' + img_parts[1] + ' 1000w,' + img_parts[0] + '/1600/' + img_parts[1] + ' 1600w');
    }
    else {
        image.src = 'img/placeholder.png';
    }
    li.append(image);

    const elmFavorite = createFavoriteHTML(restaurant);

    const name = document.createElement('h3');
    name.innerHTML = restaurant.name + '&nbsp;';
    name.append(elmFavorite);
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);

    // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_alert_role
    more.setAttribute("role", "button");
    more.setAttribute("tabindex", "0");
    more.setAttribute("aria-pressed", "false");
    more.setAttribute("aria-label", restaurant.name);

    li.append(more);

    return li
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
    //DBHelper.debugObject('', 'index-addMarkersToMap()');
    //DBHelper.debugObject(restaurants, 'index-addMarkersToMap()-restaurants');

    //DBHelper.debugObject(navigator.onLine, 'index-addMarkersToMap()-navigator.onLine');
    if ( ! navigator.onLine) return;

    //DBHelper.debugObject(is_map_to_be_loaded, 'index-addMarkersToMap()-is_map_to_be_loaded');
    if ( !is_map_to_be_loaded) {

        const map = document.getElementById('map');
        map.innerHTML = '<img class="lazy" src="/img/google-map.png" alt="Map">';

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function (event) {
            window.onclick = null;
            const map = document.getElementById('map');
            map.innerHTML = '';
            window.initMap();
            updateRestaurants();
        };

        is_map_to_be_loaded = true;
        return;
    }
    //DBHelper.debugObject(is_map_to_be_loaded, 'index-addMarkersToMap()-is_map_to_be_loaded');

    //DBHelper.debugObject(restaurants, 'index-addMarkersToMap()-restaurants');
    if (restaurants) {
        const map_bounds = new google.maps.LatLngBounds();
        new Promise((resolve, reject) => {
            //DBHelper.debugObject(self.map.getBounds(), 'index-addMarkersToMap()-1-self.map.getBounds()');
            restaurants.forEach(restaurant => {
                //DBHelper.debugObject(restaurant.name, 'index-addMarkersToMap()-1-restaurant.name');
                // Add marker to the map
                if (restaurant) {
                    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
                    google.maps.event.addListener(marker, 'click', () => {
                        window.location.href = marker.url;
                    });
                    map_bounds.extend(marker.position);
                    self.markers.push(marker);
                }
            });
            resolve(true);
        })
            .then(() => {
                //DBHelper.debugObject('', 'index-addMarkersToMap().then()');
                self.map.fitBounds(map_bounds);
            })
            .catch(error => {
                // Oops!. Got an error from server.
                console.log(error + '-index-addMarkersToMap()-catch');
            });
    }
};


//DBHelper.debugObject('', 'index-end');
