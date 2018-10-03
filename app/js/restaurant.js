// js/restaurant.js

DBHelper.debugObject('', 'restaurant-start /js/restaurant.js');

let restaurant;
let reviews;
let map;

// debug = true;

/**
 * document content load
 */
document.addEventListener('DOMContentLoaded', (event) => {
    DBHelper.debugObject('', 'restaurant-DOMContentLoaded()');

    lazyLoadImages();

    new Promise((resolve, reject) => {
        DBHelper.debugObject('', 'restaurant-DOMContentLoaded()-1-v1LoadData()-call');
        const load_all_restaurants = false;
        DBHelper.debugObject(load_all_restaurants, 'index-DOMContentLoaded()-load_all_restaurants');
        DBHelper.v1LoadData(load_all_restaurants, (error, result) => {
            DBHelper.debugObject(error, 'restaurant-DOMContentLoaded()-v1LoadData-error');
            DBHelper.debugObject(result, 'restaurant-DOMContentLoaded()-v1LoadData-result');
            if (error || !result) resolve(false);
            resolve(result);
        });
    })
        .then((restaurants) => {
            DBHelper.debugObject(restaurants, 'restaurant-DOMContentLoaded()-2-1-restaurants');

            return new Promise((resolve2, reject2) => {
                //DBHelper.debugObject('', 'restaurant-DOMContentLoaded()-2-2-processPendingRequests()-call');

                DBHelper.processPendingRequests((error, result) => {
                    //DBHelper.debugObject(result, 'restaurant-DOMContentLoaded()-2-3-processPendingRequests()-result');
                    resolve2(true);
                });
            });
        })
        .catch(error => {
            console.log('restaurant-Error: ' + (error));
        });
});


/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    //DBHelper.debugObject('', 'restaurant-initMap()');

    new Promise((resolve, reject) => {
        getRestaurantFromURL((error, restaurant) => {
            //DBHelper.debugObject(error, 'restaurant-initMap()-getRestaurantFromURL()-error');
            //DBHelper.debugObject(restaurant, 'restaurant-initMap()-getRestaurantFromURL()-restaurant');
            if (restaurant) {
                fillBreadcrumb();
                // Add marker to the map
                self.map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 16,
                    center: new google.maps.LatLng(0, 0),
                    scrollwheel: false
                });
                DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);

                resolve(restaurant);
            }
            else reject(error);
        });

    })
        .then((restaurant) => {
            if (restaurant) {
                //DBHelper.debugObject(restaurant.id, 'restaurant-window.initMap()-restaurant.id');
                addReviewModalListener(restaurant.id);
            }
        })
        .catch(error => {
            console.log('restaurant-window.initMap-Error: ' + (error));
        });
};

/**
 * Get current restaurant from page URL.
 */
getRestaurantFromURL = (callback) => {
    DBHelper.debugObject('', 'restaurant-getRestaurantFromURL()');

    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant);
        return;
    }
    const id = getParameterByName('id');
    //DBHelper.debugObject(id, 'restaurant-getRestaurantFromURL()-id');

    let error;
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL';
        callback(error, null);
    }
    else {
        new Promise((resolve, reject) => {
            DBHelper.debugObject('', 'restaurant-getRestaurantFromURL()-getRestaurantById() - call');
            DBHelper.getRestaurantById(id, (error, result) => {
                DBHelper.debugObject(error, 'restaurant-getRestaurantFromURL()-getRestaurantById()-error');
                DBHelper.debugObject(result, 'restaurant-getRestaurantFromURL()-getRestaurantById()-result');
                if (error) reject(false);
                resolve(result);
            });
        })
            .then((restaurant) => {
                DBHelper.debugObject(restaurant, 'restaurant-getRestaurantFromURL()-restaurant');
                if (!restaurant) {
                    return;
                }

                self.restaurant = restaurant;
                self.restaurant.reviews = restaurant.reviews;
                self.restaurant.operating_hours = restaurant.operating_hours;

                DBHelper.debugObject('', 'restaurant-getRestaurantFromURL()-fillRestaurantHTML() - call');
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
    //DBHelper.debugObject('', 'restaurant-fillRestaurantHTML()');
    //DBHelper.debugObject(restaurant, 'restaurant-fillRestaurantHTML()-restaurant');

    if (!restaurant) {
        return;
    }

    const elmFavorite = createFavoriteHTML(restaurant);

    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name + '&nbsp;';
    name.append(elmFavorite);

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    // start date check
    // //DBHelper.debugObject(restaurant.createdAt, 'restaurant-fillRestaurantHTML()-1-restaurant.createdAt');
    // const date_created_at = formattedUnixTime(restaurant.createdAt);
    // //DBHelper.debugObject(date_created_at, 'restaurant-fillRestaurantHTML()-1-date_created_at');
    //
    // //DBHelper.debugObject(restaurant.updatedAt, 'restaurant-fillRestaurantHTML()-1-restaurant.updatedAt');
    // const date_updated_at = formattedUnixTime(restaurant.updatedAt);
    // //DBHelper.debugObject(date_updated_at, 'restaurant-fillRestaurantHTML()-1-date_updated_at');
    //
    // address.innerHTML += '<br>' + date_created_at;
    // address.innerHTML += '<br>' + date_updated_at;
    // end date check

    const img = DBHelper.imageUrlForRestaurant(restaurant);

    const image = document.getElementById('restaurant-img');
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
    //DBHelper.debugObject('', 'restaurant-fillRestaurantHoursHTML()');
    //DBHelper.debugObject(operatingHours, 'restaurant-fillRestaurantHoursHTML()-operatingHours');

    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        //DBHelper.debugObject(key, 'restaurant-fillRestaurantHoursHTML()-operatingHours-key');

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
    //DBHelper.debugObject('', 'restaurant-fillReviewsHTML()');
    //DBHelper.debugObject(reviews, 'restaurant-fillReviewsHTML()-reviews');


    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';

    const modalButton = document.createElement('a');
    modalButton.id = 'modalAddReview';
    modalButton.className = 'add-review';
    //modalButton.onclick = (event) => {
    //};
    modalButton.innerHTML = 'Add Review';

    // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_alert_role
    modalButton.setAttribute("role", "button");
    modalButton.setAttribute("tabindex", "0");
    modalButton.setAttribute("aria-pressed", "false");
    modalButton.setAttribute("aria-label", 'Add review');
    title.appendChild(modalButton);

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
            // sort reviews
            // reviews.sort((a,b) => {
            //     const c = new Date(a.updatedAt);
            //     const d = new Date(b.updatedAt);
            //     return c-d;
            // });

            // create reviews html
            reviews.forEach(review => {
                //DBHelper.debugObject(review.restaurant_id, 'restaurant-fillReviewsHTML()-review.restaurant_id');
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
    //DBHelper.debugObject('', 'restaurant-createReviewHTML()');
    //DBHelper.debugObject(review, 'restaurant-createReviewHTML()-review');

    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date_created_at = formattedUnixTime(review.createdAt);

    const createdAt = document.createElement('p');
    createdAt.innerHTML = date_created_at;
    createdAt.title = date_created_at;
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
    //DBHelper.debugObject('', 'restaurant-fillBreadcrumb()');
    //DBHelper.debugObject(restaurant, 'restaurant-fillBreadcrumb()-restaurant');

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
    //DBHelper.debugObject('', 'restaurant-getParameterByName()');
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

function saveNewReview(restaurant_id, callback) {
    //DBHelper.debugObject('', 'restaurant-saveNewReview()');
    //DBHelper.debugObject(restaurant_id, 'restaurant-saveNewReview()-input-restaurant_id');

    const name = document.getElementById('d_name').value;
    const ratingObj = document.getElementById("d_rating");
    const rating = ratingObj.options[ratingObj.selectedIndex].value;
    const comments = document.getElementById('d_comments').value;

    //DBHelper.debugObject(name, 'restaurant-saveNewReview()-1-name');
    //DBHelper.debugObject(rating, 'restaurant-saveNewReview()-1-rating');
    //DBHelper.debugObject(comments, 'restaurant-saveNewReview()-1-comments');

    // add current time as updated at
    const unix_now = new Date().getTime();
    //DBHelper.debugObject(unix_now, 'restaurant-saveNewReview()-1-unix_now');

    const review = {
        id: '',
        review_id: '',
        restaurant_id: parseInt(restaurant_id),
        name: name,
        createdAt: unix_now,
        updatedAt: unix_now,
        rating: parseInt(rating),
        comments: comments,
    };
    //DBHelper.debugObject(review, 'restaurant-saveNewReview()-1-review');

    new Promise((resolve, reject) => {
        DBHelper.addUpdateReviewById(review, (error, result) => {
            //DBHelper.debugObject(error, 'restaurant-saveNewReview()-addUpdateReviewById()-error');
            //DBHelper.debugObject(result, 'restaurant-saveNewReview()-addUpdateReviewById()-result');
            if (error) reject(error);
            resolve(result);
        });
    })
        .then((result) => {
            //DBHelper.debugObject(result, 'restaurant-saveNewReview()-result');
            if (result) callback(null, result);
            else callback('Unable to complete request', null);
        })
        .catch(error => {
            // Oops!. Got an error from server.
            console.log(error + '-restaurant-addReviewModalListener()-catch');
            callback(error.message, null);
        });

}

// example copied from
// https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
function formattedUnixTime(unix_timestamp) {
    try {
        //DBHelper.debugObject('', 'restaurant-formattedUnixTime()');
        //DBHelper.debugObject(unix_timestamp, 'restaurant-formattedUnixTime()-input-unix_timestamp');
        //DBHelper.debugObject(Number.isInteger(unix_timestamp), 'restaurant-formattedUnixTime()-input-Number.isInteger(unix_timestamp)');

        // Create a new JavaScript Date object based on the timestamp
        // multiplied by 1000 so that the argument is in milliseconds, not seconds.
        let date;
        if (Number.isInteger(unix_timestamp)) date = (new Date(unix_timestamp));
        else date = Date.parse(unix_timestamp);
        //DBHelper.debugObject(date, 'restaurant-formattedUnixTime()-date');
        //DBHelper.debugObject(Number.isInteger(date), 'restaurant-formattedUnixTime()-1-Number.isInteger(date)');

        let year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        const date_now = new Date();
        if (year > date_now.getFullYear()) {
            year = date_now.getFullYear();
        }

        // Hours part from the timestamp
        const hours = date.getHours();
        // Minutes part from the timestamp
        const minutes = "0" + date.getMinutes();
        // Seconds part from the timestamp
        const seconds = "0" + date.getSeconds();

        const display_date = (month + '/' + day + '/' + year + ' ' + (hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2)).toString());
        //DBHelper.debugObject(display_date, 'restaurant-formattedUnixTime()-2-display_date');

        // Will display time in 10:30:23 format
        return display_date;
        //return (hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2));
    }
    catch (ex) {
        console.log('Error format: ' + (ex));
    }
}

function addReviewModalListener(restaurant_id) {
    //DBHelper.debugObject('', 'restaurant-addReviewModalListener()');
    //DBHelper.debugObject(restaurant_id, 'restaurant-addReviewModalListener()-restaurant_id');

    // Get the modal
    const modal = document.getElementById('myModal');

    // Get the button that opens the modal
    const btn = document.getElementById("modalAddReview");

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
        // const restaurant_id = getParameterByName('id');
        // const msg = getParameterByName('msg');
        // const params = {
        //     restaurant_id: restaurant_id,
        //     msg: msg,
        // };
        modalReviewSubmit.onclick = (() => {
            modalReviewSubmit.onclick = null;
            modalReviewSubmit.innerHTML = 'Wait...';

            const restaurant_id = getParameterByName('id');
            //DBHelper.debugObject(restaurant_id, 'restaurant-addReviewModalListener()-restaurant_id');

            const msg = getParameterByName('msg');
            //DBHelper.debugObject(msg, 'restaurant-addReviewModalListener()-msg');

            new Promise((resolve, reject) => {

                //DBHelper.debugObject('', 'shared-addReviewModalListener()-2-saveNewReview()-call');
                saveNewReview(restaurant_id, (error, result) => {
                    //DBHelper.debugObject(error, 'shared-addReviewModalListener()-2-error');
                    //DBHelper.debugObject(result, 'shared-addReviewModalListener()-2-result');
                    if (error) reject(error);
                    resolve(result);
                });
            })
                .then((result) => {
                    if (result) {
                        //DBHelper.debugObject(msg, 'restaurant-addReviewModalListener()-msg');

                        let url = window.location;
                        if (msg !== 'Review+saved') url += '&msg=Review+saved!';
                        //DBHelper.debugObject(url, 'restaurant-addReviewModalListener()-url');

                        window.location = url;
                    }
                    else alert('Unable to process Review! Please try again later. -el');
                })
                .catch(error => {
                    // Oops!. Got an error from server.
                    console.log(error + '-restaurant-addReviewModalListener()-catch');
                    alert('Unable to process Review! Please try again later. -cx');
                });
        });
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}

//DBHelper.debugObject('', 'restaurant-end /js/restaurant.js');