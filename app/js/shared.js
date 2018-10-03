lazyLoadImages = () => {
    //DBHelper.debugObject('', 'index-lazyLoadImages()');

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
 * Create restaurant HTML.
 */
createFavoriteHTML = (restaurant) => {
    //DBHelper.debugObject('', 'shared-createFavoriteHTML()');
    //DBHelper.debugObject(restaurant, 'shared-createFavoriteHTML()-restaurant');

    if (!restaurant) {
        return false;
    }
    //DBHelper.debugObject(restaurant.id, 'shared-createFavoriteHTML()-restaurant.id');

    let is_favorite = ((restaurant && restaurant.is_favorite && restaurant.is_favorite.toString() === 'true') ? true : false);
    //DBHelper.debugObject(is_favorite, 'shared-createFavoriteHTML()-is_favorite');

    const objFavorite = document.createElement('a');
    objFavorite.className = 'favorite ' + (is_favorite ? 'is-favorite' : 'not-favorite');
    objFavorite.title = (is_favorite ? 'is favorite' : 'is not favorite');
    objFavorite.onclick = (event) => {
        setRestaurantFavorite(restaurant, objFavorite, is_favorite);
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
    //DBHelper.debugObject('', 'shared-setRestaurantFavorite()');
    //DBHelper.debugObject(restaurant, 'shared-setRestaurantFavorite()-input-restaurant');
    //DBHelper.debugObject(objFavorite, 'shared-setRestaurantFavorite()-input-objFavorite');
    //DBHelper.debugObject(is_favorite, 'shared-setRestaurantFavorite()-input-is_favorite');

    let dataObj = restaurant;

    // toggel favorite value
    dataObj.is_favorite = !is_favorite;

    // delete object property
    if (dataObj.restaurant_id) delete dataObj.restaurant_id;
    if (dataObj.lat) delete dataObj.lat;
    if (dataObj.lng) delete dataObj.lng;
    if (dataObj.reviews) delete dataObj.reviews;

    // add current time as updated at
    dataObj.updatedAt = Math.floor(new Date() / 1000);
    //DBHelper.debugObject(dataObj.updatedAt, 'shared-setRestaurantFavorite()-dataObj.updatedAt');

    // delete array property
    // if (dataObj['restaurant_id']) delete dataObj['restaurant_id'];
    // if (dataObj['lat']) delete dataObj['lat'];
    // if (dataObj['lng']) delete dataObj['lng'];
    // if (dataObj['reviews']) delete dataObj['reviews'];

    //DBHelper.debugObject(dataObj, 'shared-setRestaurantFavorite()-1-dataObj');

    DBHelper.addUpdateRestaurantById(dataObj, (error, result) => {
        if (error) {
            // Oops!. Got an error from server.
            error.message = (`Request failed. Returned status of ${error.message}`);
            throw error;
        }
        //DBHelper.debugObject(result, 'shared-setRestaurantFavorite()-result');

        objFavorite.className = 'favorite ' + (dataObj.is_favorite ? 'is-favorite' : 'not-favorite');
        objFavorite.title = (dataObj.is_favorite ? 'is favorite' : 'is not favorite');
        objFavorite.onclick = (event) => {
            setRestaurantFavorite(restaurant, objFavorite, dataObj.is_favorite);
        };
        const icon = document.createElement('i');
        icon.className = 'far fa-heart';
        // clear previous icon
        objFavorite.innerHTML = '';
        objFavorite.append(icon);
        //DBHelper.debugObject('', 'shared-setRestaurantFavorite()-icon-updated');

    });
    //DBHelper.debugObject('', 'shared-setRestaurantFavorite()-done');
}