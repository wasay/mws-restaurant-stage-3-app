// js/restaurant.js

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
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    //console.log('restaurant_info-fetchRestaurantFromURL()');
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant)
        return;
    }
    const id = getParameterByName('id');
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
    //console.log('restaurant_info-fillRestaurantHTML()');

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
    fetchReviewsFromURL((error, restaurant) => {});
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
 * Get current reviews from page URL.
 */
fetchReviewsFromURL = (callback) => {
    console.log('restaurant_info-fetchReviewsFromURL()');
    console.log('self.reviews=' + (self.reviews));
    if (self.reviews) { // reviews already fetched!
        callback(null, self.reviews)
        return;
    }
    const id = getParameterByName('id');
    console.log('id=' + (id));

    let error;
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL';
        callback(error, null);
    }
    else {
        console.log('fetchReviewsByRestaurantId()');
        DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
            self.reviews = reviews;
            console.log('self.reviews=' + (self.reviews));
            if (!reviews) {
                console.error(error);
                return;
            }
            fillReviewsHTML();
            callback(null, reviews)
        });
    }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
    console.log('restaurant_info-fillReviewsHTML()');

    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';

    const addReviewButton = document.createElement('a');
    addReviewButton.id = 'addReview';
    addReviewButton.className = 'add-review';
    addReviewButton.onclick = (event) => {};
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

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        const br = document.createElement('br');
        container.appendChild(br);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    //console.log('restaurant_info-createReviewHTML()');
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const createdAt = document.createElement('p');
    createdAt.innerHTML = review.createdAt;
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
    //console.log('restaurant_info-fillBreadcrumb()');
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
    //console.log('restaurant_info-getParameterByName()');
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

function onloadListener()
{
    // Get the modal
    const modal = document.getElementById('myModal');

    // Get the button that opens the modal
    const btn = document.getElementById("addReview");

    // When the user clicks on the button, open the modal
    btn.onclick = function() {
        modal.style.display = "block";
    };

    // Get the <span> element that closes the modal
    const modalClose = document.getElementsByClassName("close")[0];

    // When the user clicks on <span> (x), close the modal
    modalClose.onclick = function() {
        modal.style.display = "none";
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}
