// js/app.js

let debug = true;
if (debug) console.log('start /js/app.js');

document.addEventListener('DOMContentLoaded', (event) => {
  if (debug) console.log('app-DOMContentLoaded()');
  dbPromise.then(() => {
    lazyLoadImages();
  });
});

lazyLoadImages = () => {
  if (debug) console.log('app-lazyLoadImages()');
  let lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));

  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.srcset = lazyImage.dataset.srcset;
          lazyImage.classList.remove("lazy");
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    // Possibly fall back to a more compatible method here
  }
};

/**
 * Create restaurant HTML.
 */
createFavoriteHTML = (restaurant) => {
    if (!restaurant) {
        return false;
    }

    if (debug) console.log('app-createFavoriteHTML-restaurant.id=' + (restaurant.id));
    if (debug) console.log('app-createFavoriteHTML-restaurant.is_favorite=' + (restaurant.is_favorite));

    let is_favorite = ((restaurant.is_favorite) && restaurant.is_favorite.toString() === 'true') ? true : false;
    if (debug) console.log('app-createFavoriteHTML-is_favorite=' + (is_favorite));

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

function debugObject(obj) {
    let result = '';
    result += ('obj=' + (obj)) + '\n';
    for (const key of Object.keys(obj)) {
        result += ('' + (key) + '=' + obj[key]) + '\n';
    }

    return result;
}

if (debug) console.log('end /js/app.js');