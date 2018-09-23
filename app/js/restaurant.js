// js/restaurant.js

if (debug) console.log('start /js/restaurant.js');

let restaurant;
let reviews;
let map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    //console.log('restaurant_info-initMap()');
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        }
        else {
            self.map = new google.maps.Map(document.getElementById('map'), {
                zoom: 16,
                center: restaurant.latlng,
                scrollwheel: false
            });
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        }
    });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (debug) console.log('restaurant-fetchRestaurantFromURL()');
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant);
        return;
    }
    const id = getParameterByName('id');
    if (debug) console.log('restaurant_id=' + (id));
    let error;
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL'
        callback(error, null);
    }
    else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant)
        });
    }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    if (debug) console.log('restaurant-fillRestaurantHTML()');
    const elmFavorite = createFavoriteHTML(restaurant);

    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name + '&nbsp;';
    name.append(elmFavorite);

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const img = DBHelper.imageUrlForRestaurant(restaurant);

    const image = document.getElementById('restaurant-img');
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

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    //console.log('restaurant_info-fillRestaurantHoursHTML()');
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    if (debug) console.log('restaurant-fillReviewsHTML()');
    if (debug) console.log('restaurant-fillReviewsHTML()-reviews=' + (reviews));
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';

    const addReviewButton = document.createElement('a');
    addReviewButton.id = 'addReview';
    addReviewButton.className = 'add-review';
    addReviewButton.onclick = (event) => {
    };
    addReviewButton.innerHTML = 'Add Review';

    // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_alert_role
    addReviewButton.setAttribute("role", "button");
    addReviewButton.setAttribute("tabindex", "0");
    addReviewButton.setAttribute("aria-pressed", "false");
    addReviewButton.setAttribute("aria-label", 'Add review');
    title.appendChild(addReviewButton);

    container.appendChild(title);

    const lineBreak = document.createElement('br');
    container.appendChild(lineBreak);

    if (!reviews || reviews.length === 0) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        const br = document.createElement('br');
        container.appendChild(br);
        return;
    }
    const ul = document.getElementById('reviews-list');
    // reviews.forEach(review => {
    //     ul.appendChild(createReviewHTML(review));
    // });
    for (let i=0; i<=reviews.length; i++) {
        ul.appendChild(createReviewHTML(reviews[i]));
    }
    container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    if (debug) console.log('restaurant-createReviewHTML()');
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const createdAt = document.createElement('p');
    createdAt.innerHTML = formattedUnixTime(review.createdAt);
    createdAt.title = review.createdAt;
    li.appendChild(createdAt);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    if (debug) console.log('restaurant-fillBreadcrumb()');
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    li.setAttribute("aria-label", restaurant.name);
    li.setAttribute("aria-current", 'page');
    breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
    if (debug) console.log('restaurant-getParameterByName()');
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};


/**
 * Create restaurant HTML.
 */
createFavoriteHTML = (restaurant) => {
    if (!restaurant) {
        return false;
    }

    if (debug) console.log('app-createFavoriteHTML-restaurant.restaurant_id=' + (restaurant.restaurant_id));
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
    if (debug) console.log('app-setRestaurantFavorite-restaurant.restaurant_id=' + (restaurant.restaurant_id));

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


function saveNewReview(callback) {
    const restaurant_id = getParameterByName('id', document.location.href);
    if (debug) console.log('restaurant_id=' + (restaurant_id));
    const name = document.getElementById('d_name').value;
    const ratingObj = document.getElementById("d_rating");
    const rating = ratingObj.options[ratingObj.selectedIndex].value;
    const comment = document.getElementById('d_comment').value;

    const review = {
        id: '',
        restaurant_id: restaurant_id,
        name: name,
        rating: rating,
        comment: comment,
        updatedAt: Date.now(),
        createdAt: Date.now(),
    };
    DBHelper.addUpdateReviewById(review, (error, result) => {
        if (error) return callback(error, null);
        return callback(null, result);
    });

}

// example copied from
// https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
function formattedUnixTime(unix_timestamp) {
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

if (debug) console.log('end /js/restaurant.js');