// js/restaurant.js

if (debug) console.log('start /js/restaurant.js');

let restaurant;
let reviews;
let map;

// debug = true;

/**
 * document content load
 */
document.addEventListener('DOMContentLoaded', (event) => {
    DBHelper.debugRestaurantInfo('', 'restaurant-DOMContentLoaded()');

    new Promise((resolve, reject) => {
        //DBHelper.debugRestaurantInfo('', 'restaurant-DOMContentLoaded()-1-v1LoadData()-call');
        DBHelper.v1LoadData((error, result) => {
            //DBHelper.debugRestaurantInfo(error, 'restaurant-DOMContentLoaded()-v1LoadData-error');
            //DBHelper.debugRestaurantInfo(result, 'restaurant-DOMContentLoaded()-v1LoadData-result');
            resolve(result);
        });
    })
        .then((result) => {
            //DBHelper.debugRestaurantInfo(result, 'restaurant-DOMContentLoaded()-5-1-result');

            //DBHelper.debugRestaurantInfo('', 'restaurant-DOMContentLoaded()-5-1-lazyLoadImages()-call');
            lazyLoadImages();
        })
        .catch(error => {
            console.log('restaurant-Error: ' + (error));
        });

});

lazyLoadImages = () => {
    DBHelper.debugRestaurantInfo('', 'index-lazyLoadImages()');

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
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    DBHelper.debugRestaurantInfo('', 'restaurant-initMap()');

    getRestaurantFromURL((error, restaurant) => {
        //DBHelper.debugRestaurantInfo(error, 'restaurant-initMap()-getRestaurantFromURL()-error');
        //DBHelper.debugRestaurantInfo(restaurant, 'restaurant-initMap()-getRestaurantFromURL()-restaurant');
        if (error) { // Got an error!
            console.error(error);
        }
        else if (restaurant) {
            fillBreadcrumb();
            // Add marker to the map
            if (restaurant) {
                let loc = {};
                if (restaurant.latlng) loc = restaurant.latlng;
                else if (restaurant.lat) loc = {lat: restaurant.lat, lng: restaurant.lng};
                if ( ! loc || typeof loc === 'undefined' || loc.length === 0) {
                    loc = {
                        lat: 40.722216,
                        lng: -73.987501
                    };
                }
                DBHelper.debugRestaurantInfo(loc, 'dbhelper-mapMarkerForRestaurant()-loc');
                self.map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 16,
                    center: loc,
                    scrollwheel: false
                });
                DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
            }
        }
        else {
            console.error('Unable to retrive restaurant info');
        }
    });
};

/**
 * Get current restaurant from page URL.
 */
getRestaurantFromURL = (callback) => {
    DBHelper.debugRestaurantInfo('', 'restaurant-getRestaurantFromURL()');

    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant);
        return;
    }
    const id = getParameterByName('id');
    DBHelper.debugRestaurantInfo(id, 'restaurant-getRestaurantFromURL()-id');

    let error;
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL';
        callback(error, null);
    }
    else {
        new Promise((resolve, reject) => {
            DBHelper.debugRestaurantInfo('', 'restaurant-getRestaurantFromURL()-getRestaurantById() - call');
            DBHelper.getRestaurantById(id, (error, result) => {
                DBHelper.debugRestaurantInfo(error, 'restaurant-getRestaurantFromURL()-getRestaurantById()-error');
                DBHelper.debugRestaurantInfo(result, 'restaurant-getRestaurantFromURL()-getRestaurantById()-result');
                if (error) reject(false);
                resolve(result);
            });
        })
            .then((restaurant) => {
                DBHelper.debugRestaurantInfo(restaurant, 'restaurant-getRestaurantFromURL()-restaurant');
                if (!restaurant) {
                    return;
                }

                self.restaurant = restaurant;
                self.restaurant.reviews = restaurant.reviews;
                self.restaurant.operating_hours = restaurant.operating_hours;

                fillRestaurantHTML();
                callback(null, restaurant);
            })
            .catch(error => {
                console.log('restaurant - ' + (error) + ' - catch');
                callback(error.message, null);
            });
    }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    DBHelper.debugRestaurantInfo('', 'restaurant-fillRestaurantHTML()');
    DBHelper.debugRestaurantInfo(restaurant, 'restaurant-fillRestaurantHTML()-restaurant');
    if (!restaurant) {
        return;
    }

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
    DBHelper.debugRestaurantInfo('', 'restaurant-fillRestaurantHoursHTML()');
    DBHelper.debugRestaurantInfo(operatingHours, 'restaurant-fillRestaurantHoursHTML()-operatingHours');
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
    DBHelper.debugRestaurantInfo('', 'restaurant-fillReviewsHTML()');
    DBHelper.debugRestaurantInfo(reviews, 'restaurant-fillReviewsHTML()-reviews');


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
    }
    else {
        const ul = document.getElementById('reviews-list');
        if (reviews && reviews.length > 0) {
            reviews.forEach(review => {
                if (debug) console.log('restaurant-fillReviewsHTML()-review.restaurant_id=' + (review.restaurant_id));
                ul.appendChild(createReviewHTML(review));
            });
        }
        container.appendChild(ul);
    }
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    DBHelper.debugRestaurantInfo('', 'restaurant-createReviewHTML()');
    DBHelper.debugRestaurantInfo(review, 'restaurant-createReviewHTML()-review');

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
    DBHelper.debugRestaurantInfo('', 'restaurant-fillBreadcrumb()');
    DBHelper.debugRestaurantInfo(restaurant, 'restaurant-fillBreadcrumb()-restaurant');

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
    DBHelper.debugRestaurantInfo('', 'restaurant-createFavoriteHTML()');

    if (!restaurant) {
        return false;
    }
    DBHelper.debugRestaurantInfo(restaurant.restaurant_id, 'restaurant-createFavoriteHTML()-restaurant.restaurant_id');
    DBHelper.debugRestaurantInfo(restaurant.is_favorite, 'restaurant-createFavoriteHTML()-restaurant.is_favorite');

    let is_favorite = ((restaurant && restaurant.is_favorite && restaurant.is_favorite.toString() === 'true') ? true : false);
    DBHelper.debugRestaurantInfo(is_favorite, 'restaurant-createFavoriteHTML()-is_favorite');

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
    DBHelper.debugRestaurantInfo('', 'restaurant-setRestaurantFavorite()');
    DBHelper.debugRestaurantInfo(restaurant, 'restaurant-setRestaurantFavorite()-restaurant');
    DBHelper.debugRestaurantInfo(objFavorite, 'restaurant-setRestaurantFavorite()-objFavorite');
    DBHelper.debugRestaurantInfo(is_favorite, 'restaurant-setRestaurantFavorite()-is_favorite');

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
    DBHelper.debugRestaurantInfo('', 'restaurant-setRestaurantFavorite()');
    const restaurant_id = getParameterByName('id', document.location.href);

    const name = document.getElementById('d_name').value;
    const ratingObj = document.getElementById("d_rating");
    const rating = ratingObj.options[ratingObj.selectedIndex].value;
    const comments = document.getElementById('d_comments').value;

    DBHelper.debugRestaurantInfo(restaurant_id, 'restaurant-setRestaurantFavorite()-restaurant_id');
    DBHelper.debugRestaurantInfo(name, 'restaurant-setRestaurantFavorite()-name');
    DBHelper.debugRestaurantInfo(rating, 'restaurant-setRestaurantFavorite()-rating');

    const review = {
        id: '',
        review_id: '',
        restaurant_id: Number(restaurant_id),
        name: name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        rating: Number(rating),
        comments: comments,
    };

    new Promise((resolve, reject) => {
        DBHelper.addUpdateReviewById(review, (error, result) => {
            DBHelper.debugRestaurantInfo(error, 'restaurant-setRestaurantFavorite()-addUpdateReviewById()-error');
            DBHelper.debugRestaurantInfo(result, 'restaurant-setRestaurantFavorite()-addUpdateReviewById()-result');
            if (error || !result) reject(error);
            resolve(result);
        });
    })
        .then((result) => {
            DBHelper.debugRestaurantInfo(result, 'restaurant-setRestaurantFavorite()-result');
            new Promise((resolve2, reject2) => {
                DBHelper.fetchReviewsByRestaurantId(restaurant_id, (error, result) => {
                    DBHelper.debugRestaurantInfo(error, 'restaurant-setRestaurantFavorite()-fetchReviewsByRestaurantId()-error');
                    DBHelper.debugRestaurantInfo(result, 'restaurant-setRestaurantFavorite()-fetchReviewsByRestaurantId()-result');
                    resolve2(result);
                });
            });
        });

    callback(null, true);

}

// example copied from
// https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
function formattedUnixTime(unix_timestamp) {
    try {

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
    catch (ex) {
        console.log('Error format: ' + (ex));
    }
}

function addReviewModalListener() {
    DBHelper.debugRestaurantInfo('', 'restaurant-addReviewModalListener()');

    // Get the modal
    const modal = document.getElementById('myModal');

    // Get the button that opens the modal
    const btn = document.getElementById("addReview");

    if (btn) {
        // When the user clicks on the button, open the modal
        btn.onclick = function () {
            modal.style.display = "block";
        };
    }

    // Get the <span> element that closes the modal
    const modalCloseSpan = document.getElementsByClassName("close")[0];

    if (modalCloseSpan) {
        // When the user clicks on <span> (x), close the modal
        modalCloseSpan.onclick = function () {
            modal.style.display = "none";
        };
    }

    // Get the <button> element that closes the modal
    const modalReviewClose = document.getElementsByClassName("review-modal-close")[0];

    if (modalReviewClose) {
        // When the user clicks on <button>, close the modal
        modalReviewClose.onclick = function () {
            modal.style.display = "none";
        };
    }

    // Get the <button> element that closes the modal
    const modalReviewSubmit = document.getElementsByClassName("review-modal-submit")[0];

    if (modalReviewSubmit) {
        // When the user clicks on <button>, close the modal
        modalReviewSubmit.onclick = function () {
            modalReviewSubmit.onclick = null;
            modalReviewSubmit.innerHTML = 'Wait...';
            saveNewReview((error, result) => {
                //if (result) alert('result=' + (result));
                if (result) {
                    window.location = window.location + '&msg=Review+saved!';
                }
            });
        };
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}


if (debug) console.log('end /js/restaurant.js');