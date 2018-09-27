---------------------
Wasay [MWS] [10:29 AM]
The fetch results return valid record but the parent following then turns the restaurant into undefined. Can someone help as to what I am missing or not understanding about the ".then()"? Does it not wait till all the fetch process is done before the next ".then()" is called?
Untitled 
dbPromise
.then((restaurant) => {
	// current restaurant = undefined
	if (!restaurant) {
		return DBHelper
			.fetchRestaurantById(restaurant_id, (error, result) => {
				if (error) return false;
				return result; // returns restaurant object with valid restaurant.id value
			});
	}
	else return restaurant;
})
.then((restaurant) => {
	// current value of restaurant = undefined
	// shouldn't it contain the value from fetchRestaurantById result???
});
---------------------
prowebsive (MWS Graduate) [11:26 AM]
@Wasay [MWS] Okay, after playing a while with your code, now I know how to solve the problem of mixing callbacks with Promises.

If in your Promise you need to return the result from a callback function, return it as a `new Promise((resolve, reject) => {})`. That way in your callback function you `resolve` with the result, or `reject` with the error.

I hope this helps.

dbPromise
.then((restaurant) => {
	// If current restaurant === undefined
	if (!restaurant) {
    // return a new Promise, because DBHelper.fetchRestaurantsById is not
	// a promise, but a callback function. In that callback function resolve
    // to result, or reject with error
    return new Promise((resolve, reject) => {
      DBHelper
			.fetchRestaurantById(restaurant_id, (error, result) => {
				if (error) reject(false);
				resolve(result); // resolve to restaurant object with valid restaurant.id value
			});
    });
		
	}
	else return restaurant;
})
.then((restaurant) => {
	// current value of restaurant = undefined
	// shouldn't it contain the value from fetchRestaurantById result???
});
---------------------