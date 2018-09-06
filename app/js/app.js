// js/app.js

let debug = false;
if (debug) console.log('start /js/app.js');

/**
 * Create restaurant HTML.
 */
createFavoriteHTML = (restaurant) => {
    if (!restaurant) {
        return false;
    }

    if (debug) console.log('restaurant.id=' + (restaurant.id));
    if (debug) console.log('restaurant.is_favorite=' + (restaurant.is_favorite));

    let is_favorite = ((restaurant.is_favorite) && restaurant.is_favorite.toString() === 'true') ? true : false;
    if (debug) console.log('is_favorite=' + (is_favorite));

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
debug = true;
    if (debug) console.log('setRestaurantFavorite()');
    if (debug) console.log('is_favorite=' + (is_favorite));
    if (debug) console.log('typeof objFavorite=' + (typeof objFavorite));

    // toggel favorite value
    is_favorite = !is_favorite;
    if (debug) console.log('is_favorite.toggle()=' + (is_favorite));

    if (debug) console.log('typeof restaurant=' + (typeof restaurant));
    if (debug) console.log('restaurant.id=' + (restaurant.id));

    let dataObj = restaurant;
    dataObj.is_favorite = is_favorite;

    DBHelper.addUpdateRestaurantById(restaurant, (error, result) => {
        if (error) {
            // Oops!. Got an error from server.
            error.message = (`Request failed. Returned status of ${error.message}`);
            throw error;
        }

        if (debug) console.log('result=' + (result));

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
        if (debug) console.log('Updated icon');

    });
    if (debug) console.log('fetch process done');
}

function debugObject(obj) {
    let result = '';
    result += ('obj=' + (obj)) + '\n';
    for (const key of Object.keys(obj)) {
        result += ('' + (key) + '=' + obj[key]) + '\n';
    }

    return result;
}

if (debug) console.log('end /js/app.js');