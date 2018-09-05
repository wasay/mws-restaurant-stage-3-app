// js/app.js

const appPrefix = 'mws-restaurant-stage-3';
const staticCacheName = 'mws-restaurant-stage-3' + '-v1';
const contentImgsCache = 'mws-restaurant-stage-3' + '-content-imgs';
const allCaches = [
    staticCacheName,
    contentImgsCache
];
const dbName = 'topRestaurants3';
const dbVersion = 1;
let debug = true;

if (debug) console.log('appPrefix=' + (appPrefix));
if (debug) console.log('staticCacheName=' + (staticCacheName));
if (debug) console.log('contentImgsCache=' + (contentImgsCache));
if (debug) console.log('allCaches=' + (allCaches));
if (debug) console.log('dbName=' + (dbName));
if (debug) console.log('dbVersion=' + (dbVersion));
if (debug) console.log('debug=' + (debug));

const dbPromise = idb.open(dbName);
if (debug) console.log('dbPromise=' + (dbPromise));

// assign dbPromise object to dbhelper class
DBHelper.dbPromise = dbPromise;

/**
 * Create restaurant HTML.
 */
createFavoriteHTML = (restaurant) => {
    if (!restaurant) {
        return false;
    }

    console.log('restaurant.id=' + (restaurant.id));
    console.log('restaurant.is_favorite=' + (restaurant.is_favorite));

    let is_favorite = ((restaurant.is_favorite) && restaurant.is_favorite.toString() === 'true') ? true : false;
    console.log('is_favorite=' + (is_favorite));

    const objFavorite = document.createElement('a');
    objFavorite.className = 'favorite ' + (is_favorite ? 'is-favorite' : 'not-favorite');
    objFavorite.title = (is_favorite ? 'is favorite' : 'is not favorite');
    objFavorite.onclick = (event) => {
        setRestaurantFavorite(restaurant, objFavorite, is_favorite)
    };
    const icon = document.createElement('i');
    icon.className = 'fas fa-heart';
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

    console.log('setRestaurantFavorite()');
    console.log('is_favorite=' + (is_favorite));
    console.log('typeof objFavorite=' + (typeof objFavorite));

    // toggel favorite value
    is_favorite = !is_favorite;
    console.log('is_favorite.toggle()=' + (is_favorite));

    console.log('typeof restaurant=' + (typeof restaurant));
    console.log('restaurant.id=' + (restaurant.id));

    let dataObj = restaurant;
    dataObj.is_favorite = is_favorite;

    DBHelper.addUpdateRestaurantById(restaurant, (error, result) => {
        if (error) {
            // Oops!. Got an error from server.
            error.message = (`Request failed. Returned status of ${error.message}`);
            throw error;
        }
        else {
            console.log('result=' + (result));

            objFavorite.className = 'favorite ' + (is_favorite ? 'is-favorite' : 'not-favorite');
            objFavorite.title = (is_favorite ? 'is favorite' : 'is not favorite');
            objFavorite.onclick = (event) => {
                setRestaurantFavorite(restaurant, objFavorite, is_favorite);
            };
            const icon = document.createElement('i');
            icon.className = 'fas fa-heart';
            // clear previous icon
            objFavorite.innerHTML = '';
            objFavorite.append(icon);
            console.log('Updated icon');
        }
    });
    console.log('fetch process done');
}

function debugObject(obj) {
    let result = '';
    result += ('obj=' + (obj)) + '\n';
    for (const key of Object.keys(obj)) {
        result += ('' + (key) + '=' + obj[key]) + '\n';
    }

    return result;
}
