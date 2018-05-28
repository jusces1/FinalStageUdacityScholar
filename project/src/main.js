import idb from 'idb';
import DbHelperRestaurnats from './dbhelper_restaurants';
import restInfo from './restaurant_info';
import reviews from './reviews';

let restaurants, neighborhoods, cuisines;
let map;
let markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  DbHelperRestaurnats.openDatabase_notSaved_restUpdates().then(function (db) {
    if (!db) return;
    let tx = db.transaction('notSavedRestUpdate', 'readwrite');
    let store = tx.objectStore('notSavedRestUpdate');

    return store.getAll();
  }).then(function (resp) {
    if (resp.length > 0) {
      resp.map(res => {
        DbHelperRestaurnats.restaurantFavorite(res.id, res.is_favorite, function (error, restaurants) {
          DbHelperRestaurnats.openDatabase_notSaved_restUpdates().then(function (db) {
            let tx = db.transaction('notSavedRestUpdate', 'readwrite');
            let store = tx.objectStore('notSavedRestUpdate');
            store.delete(res.id);
          });
        });
      });
    }
  });
  if (!restInfo.getParameterByName('id')) {
    fetchNeighborhoods();
    fetchCuisines();
    updateRestaurants()
    document.getElementById('neighborhoods-select').addEventListener('change', (event) => {
      updateRestaurants();
    });
    document.getElementById('cuisines-select').addEventListener('change', (event) => {
      updateRestaurants();
    });  
  } else {
    let stars = document.querySelectorAll('.star');
    stars.forEach(function (star) {
      star.addEventListener('click', restInfo.setRating);
    });

    let rating = parseInt(document.querySelector('.stars').getAttribute('data-rating'));
    let target = stars[rating - 1];
    target.dispatchEvent(new MouseEvent('click'));
    
    //add event listener on click to submit review 
    document.getElementById('send').addEventListener('click', (event) => {
      reviews.SubmitReview();
    });
  }
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(function (reg) {
      console.log('Service worker registration succeeded:', reg);
      if (!navigator.serviceWorker.controller) {
        return;
      }
      if (reg.installing) {
        reg.installing.addEventListener('statechange', function (worker) {
          if (worker.state == "installed") {
            console.log('changed');
          }
        }).catch(function (error) {
          console.log('Service worker registration failed:', error);
        });
        return;
      }
      reg.addEventListener('updatefound', function () {
        reg.installing.addEventListener('statechange', function (worker) {
          if (worker.state == "installed") {
            console.log('changed');
          }
        });
        return;
      });
    }, function (err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
}


/**
 * Fetch all neighborhoods and set their HTML.
 */
function fetchNeighborhoods() {
  DbHelperRestaurnats.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
function fillNeighborhoodsHTML(neighborhoods = self.neighborhoods) {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
function fetchCuisines() {
  DbHelperRestaurnats.fetchCuisines(function (error, cuisines) {
      self.cuisines = cuisines;
      fillCuisinesHTML();
  });
};

/**
 * Set cuisines HTML.
 */
function fillCuisinesHTML(cuisines = self.cuisines) {
  const select = document.getElementById('cuisines-select');
  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = function () {

  var loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  if (restInfo.getParameterByName('id')) {
    restInfo.fetchRestaurantFromURL((error, restaurant) => {
      if (error) { // Got an error!
        console.error(error);
      } else { 
        self.map = new google.maps.Map(document.getElementById('map'), {
          zoom: 16,
          center: restaurant.latlng,
          scrollwheel: false
        });
        restInfo.fillBreadcrumb();
        DbHelperRestaurnats.mapMarkerForRestaurant(self.restaurant, self.map);
      }
    });
  } else {
    updateRestaurants();
  }
};

/**
 * Update page and map for current restaurants.
 */
function updateRestaurants() {
  var cSelect = document.getElementById('cuisines-select');
  var nSelect = document.getElementById('neighborhoods-select');
  var cIndex = cSelect.selectedIndex;
  var nIndex = nSelect.selectedIndex;

  var cuisine = cSelect[cIndex].value;
  var neighborhood = nSelect[nIndex].value;

  DbHelperRestaurnats.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, function (error, restaurants) {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
function resetRestaurants(restaurants) {
  // Remove all restaurants
  self.restaurants = [];
  var ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if(self.markers) {
    self.markers.forEach(function (m) {
      return m.setMap(null);
    });
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
function fillRestaurantsHTML() {
  var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

  var ul = document.getElementById('restaurants-list');
  restaurants.forEach(function (restaurant) {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
function createRestaurantHTML(restaurant) {
  var li = document.createElement('li');
  var image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = image.src = DbHelperRestaurnats.imageUrlForRestaurant(restaurant).split('.')[0] + "_medium." + DbHelperRestaurnats.imageUrlForRestaurant(restaurant).split('.')[1];
  image.alt = restaurant.name;

  li.append(image);

  var name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  var neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  var address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  var more = document.createElement('a');
  more.setAttribute('role', 'button');
  more.setAttribute('aria-label', restaurant.name + "View Details");
  more.innerHTML = 'View Details';
  more.href = DbHelperRestaurnats.urlForRestaurant(restaurant);
  li.append(more);

  let favorite = restInfo.facoriteChange('notFavorite', 'Favorite',restaurant.id, restaurant.is_favorite, restaurant.name);
  li.append(favorite);


  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
function addMarkersToMap() {
  var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

  restaurants.forEach(function (restaurant) {
    // Add marker to the map
    var marker = DbHelperRestaurnats.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', function () {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};



