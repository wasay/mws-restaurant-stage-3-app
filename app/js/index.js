// js/index.js

//DBHelper.debugRestaurantInfo('', 'start /js/index.js');

let neighborhoods,
    cuisines;
let map;
let markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    //DBHelper.debugRestaurantInfo('', 'index-DOMContentLoaded()');

    new Promise((resolve, reject) => {
        DBHelper.v1LoadData((error, result) => {
            DBHelper.debugRestaurantInfo(error, 'dbhelper-new Promise-v1LoadData-error');
            DBHelper.debugRestaurantInfo(result, 'dbhelper-new Promise-v1LoadData-result');
            resolve(result);
        });
    }).then(() => {
        return new Promise((resolve, reject) => {
            fetchNeighborhoods((error, result) => {
                resolve(true);
            });
        });
    }).then(() => {
        return new Promise((resolve, reject) => {
            fetchCuisines((error, result) => {
                resolve(true);
            });
        });
    }).then(() => {
        lazyLoadImages();
    })
        .catch(error => {
            console.log('Error: ' + (error));
        });

});

lazyLoadImages = () => {
    //DBHelper.debugRestaurantInfo('', 'index-lazyLoadImages()');

    let lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));

    if ("IntersectionObserver" in window) {
        let lazyImageObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    let lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.srcset = lazyImage.dataset.srcset;
                    lazyImage.classList.remove("lazy");
                    lazyImageObserver.unobserve(lazyImage);
                }
            });
        });

        lazyImages.forEach(function (lazyImage) {
            lazyImageObserver.observe(lazyImage);
        });
    }
    else {
        // Possibly fall back to a more compatible method here
    }
};

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
    //DBHelper.debugRestaurantInfo('', 'index-fetchNeighborhoods()');

    return new Promise((resolve, reject) => {
        DBHelper.fetchNeighborhoods((error, neighborhoods) => {
            DBHelper.debugRestaurantInfo(error, 'index-fetchCuisines()-DBHelper.fetchNeighborhoods-error');
            DBHelper.debugRestaurantInfo(neighborhoods, 'index-fetchCuisines()-DBHelper.fetchNeighborhoods-neighborhoods');

            if (error) reject(false);
            resolve(neighborhoods);
        });
    }).then((neighborhoods) => {
        if (neighborhoods) {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    })
        .catch(error => {
            // Oops!. Got an error from server.
            console.log(error + '-index-fetchNeighborhoods()-catch');
        });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    //DBHelper.debugRestaurantInfo('', 'index-fillNeighborhoodsHTML()');
    //DBHelper.debugRestaurantInfo(neighborhoods, 'index-fillNeighborhoodsHTML()-neighborhoods');

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
fetchCuisines = () => {
    //DBHelper.debugRestaurantInfo('', 'index-fetchCuisines()');

    return new Promise((resolve, reject) => {
        DBHelper.fetchCuisines((error, cuisines) => {
            //DBHelper.debugRestaurantInfo(error, 'index-fetchCuisines()-DBHelper.fetchCuisines-error');
            //DBHelper.debugRestaurantInfo(cuisines, 'index-fetchCuisines()-DBHelper.fetchCuisines-cuisines');

            if (error) reject(false);
            resolve(neighborhoods);
        });
    }).then((cuisines) => {
        if (cuisines) {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    })
        .catch(error => {
            // Oops!. Got an error from server.
            console.log(error + '-index-fetchCuisines()-catch');
        });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
    //DBHelper.debugRestaurantInfo('', 'index-fillCuisinesHTML()');
    //DBHelper.debugRestaurantInfo(cuisines, 'index-fillCuisinesHTML()-cuisines');

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
    //DBHelper.debugRestaurantInfo('', 'index-initMap()');

    let loc = {
        lat: 40.722216,
        lng: -73.987501
    };
    self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        scrollwheel: false
    });
    updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
    //DBHelper.debugRestaurantInfo('', 'index-updateRestaurants()');

    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    //DBHelper.debugRestaurantInfo(cuisine, 'index-updateRestaurants()-cuisine');
    //DBHelper.debugRestaurantInfo(neighborhood, 'index-updateRestaurants()-neighborhood');

    new Promise((resolve, reject) => {
        DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, result) => {
            //DBHelper.debugRestaurantInfo(error, 'index-updateRestaurants()-fetchRestaurantByCuisineAndNeighborhood()-error');
            //DBHelper.debugRestaurantInfo(result, 'index-updateRestaurants()-fetchRestaurantByCuisineAndNeighborhood()-result');
            if (error) reject(false);
            resolve(result);
        })
    })
        .then((restaurants) => {
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
    //DBHelper.debugRestaurantInfo('', 'index-resetRestaurants()');
    //DBHelper.debugRestaurantInfo(restaurants, 'index-fillRestaurantsHTML()-restaurants');

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
    if (debug) console.log('index-fillRestaurantsHTML()');
    //DBHelper.debugRestaurantInfo(restaurants, 'index-fillRestaurantsHTML()-restaurants');

    if (debug) console.log('index-fillRestaurantsHTML()');
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
    if (debug) console.log('index-createRestaurantHTML()');
    //DBHelper.debugRestaurantInfo(restaurant, 'index-createRestaurantHTML()-restaurant');

    if (!restaurant) {
        return false;
    }
    const li = document.createElement('li');

    const img = DBHelper.imageUrlForRestaurant(restaurant);

    const image = document.createElement('img');
    if (img) {
        img_parts = img.split('/');

        image.className = 'restaurant-img lazy';
        image.src = img_parts[0] + '/320/' + img_parts[1];
        //https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/
        //https://stackoverflow.com/questions/16449445/how-can-i-set-image-source-with-base64
        image.setAttribute('data-sizes', 'auto');
        image.setAttribute('data-src', img_parts[0] + '/320/' + img_parts[1]);
        image.setAttribute('data-srcset', '' + img_parts[0] + '/320/' + img_parts[1] + ' 300w,' + img_parts[0] + '/640/' + img_parts[1] + ' 600w,' + img_parts[0] + '/1024/' + img_parts[1] + ' 1000w,' + img_parts[0] + '/1600/' + img_parts[1] + ' 1600w');
        image.alt = restaurant.name;
    }
    else {
        image.src = 'img/placeholder.png';
        image.alt = '';
    }
    li.append(image);

    const elmFavorite = createFavoriteHTML(restaurant);

    const name = document.createElement('h1');
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
    if (debug) console.log('index-addMarkersToMap()');
    if (restaurants) {
        restaurants.forEach(restaurant => {
            // Add marker to the map
            if (restaurant) {
                const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
                google.maps.event.addListener(marker, 'click', () => {
                    window.location.href = marker.url
                });
                self.markers.push(marker);
            }
        });
    }
};


/**
 * Create restaurant HTML.
 */
createFavoriteHTML = (restaurant) => {
    //DBHelper.debugRestaurantInfo('', 'index-createFavoriteHTML()');
    //DBHelper.debugRestaurantInfo(restaurant, 'index-createFavoriteHTML()-restaurant');
    if (!restaurant) {
        return false;
    }

    let is_favorite = ((restaurant.is_favorite) && restaurant.is_favorite.toString() === 'true') ? true : false;
    //DBHelper.debugRestaurantInfo(is_favorite, 'index-createFavoriteHTML()-is_favorite');

    const objFavorite = document.createElement('a');
    objFavorite.className = 'favorite ' + (is_favorite ? 'is-favorite' : 'not-favorite');
    objFavorite.title = (is_favorite ? 'is favorite' : 'is not favorite');
    objFavorite.onclick = (event) => {
        setRestaurantFavorite(restaurant, objFavorite, is_favorite)
    };
    const icon = document.createElement('i');
    icon.className = 'far fa-heart';
    objFavorite.append(icon);

    // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_alert_role
    objFavorite.setAttribute("role", "button");
    objFavorite.setAttribute("tabindex", "0");
    objFavorite.setAttribute("aria-pressed", "false");
    objFavorite.setAttribute("aria-label", 'Toggle favorite for ' + restaurant.name);

    return objFavorite;
};

/**
 * set Restaurant favorite.
 */
function setRestaurantFavorite(restaurant, objFavorite, is_favorite) {
    if (debug) console.log('app-setRestaurantFavorite()');
    if (debug) console.log('app-setRestaurantFavorite-is_favorite=' + (is_favorite));
    if (debug) console.log('app-setRestaurantFavorite-typeof objFavorite=' + (typeof objFavorite));

    // toggel favorite value
    is_favorite = !is_favorite;
    if (debug) console.log('app-setRestaurantFavorite-is_favorite.toggle()=' + (is_favorite));

    if (debug) console.log('app-setRestaurantFavorite-typeof restaurant=' + (typeof restaurant));
    if (debug) console.log('app-setRestaurantFavorite-restaurant.id=' + (restaurant.id));

    let dataObj = restaurant;
    dataObj.is_favorite = is_favorite;

    DBHelper.addUpdateRestaurantById(restaurant, (error, result) => {
        if (error) {
            // Oops!. Got an error from server.
            error.message = (`Request failed. Returned status of ${error.message}`);
            throw error;
        }

        if (debug) console.log('app-setRestaurantFavorite-result=' + (result));

        objFavorite.className = 'favorite ' + (is_favorite ? 'is-favorite' : 'not-favorite');
        objFavorite.title = (is_favorite ? 'is favorite' : 'is not favorite');
        objFavorite.onclick = (event) => {
            setRestaurantFavorite(restaurant, objFavorite, is_favorite);
        };
        const icon = document.createElement('i');
        icon.className = 'far fa-heart';
        // clear previous icon
        objFavorite.innerHTML = '';
        objFavorite.append(icon);
        if (debug) console.log('app-setRestaurantFavorite-Updated icon');

    });
    if (debug) console.log('app-setRestaurantFavorite-fetch process done');
}

if (debug) console.log('end /js/index.js');
