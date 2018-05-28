let restaurant;
var map;

import DbHelperRestaurnats from './dbhelper_restaurants';
import DbHelperReviews from './dbhelper_reviews';
import Reviews from './reviews';

export default class Restaurant_info {

  static fetchRestaurantFromURL(callback) {
    if (self.restaurant) { // restaurant already fetched!
      callback(null, self.restaurant)
      return;
    }
    const id = this.getParameterByName('id');
    if (!id) { // no id found in URL
      error = 'No restaurant id in URL'
      callback(error, null);
    } else {
      DbHelperRestaurnats.fetchRestaurantById(id, (error, restaurant) => {
        self.restaurant = restaurant;
        if (!restaurant) {
          DbHelperRestaurnats.fetchRestaurantByIdFromdb(id, (error, res) => {
            self.restaurant = res;
            Reviews.fetchRestaurantReviews(id);
            callback(null, res)
          });
        } else {
          Reviews.fetchRestaurantReviews(id);
          callback(null, restaurant)
        }
      });
    }
  }

/**
 * Create restaurant HTML and add it to the webpage
 */
static fillRestaurantHTML(restaurant = self.restaurant) {

  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;


  const image = document.createElement('img');
  image.id = 'restaurant-img';
  image.alt = restaurant.name;
  const picture = document.getElementById('restourant-picture');

  const sourceSmall = document.createElement('source');
  sourceSmall.media = "(max-width: 800px)";
  sourceSmall.srcset = DbHelperRestaurnats.imageUrlForRestaurant(restaurant).split('.')[0] + "_small." + DbHelperRestaurnats.imageUrlForRestaurant(restaurant).split('.')[1];
  const sourceMedium = document.createElement('source');
  sourceMedium.media = "(min-width: 801px) and (max-width: 1100px)";
  sourceMedium.srcset = DbHelperRestaurnats.imageUrlForRestaurant(restaurant).split('.')[0] + "_medium." + DbHelperRestaurnats.imageUrlForRestaurant(restaurant).split('.')[1];
  const sourceLarge = document.createElement('source');
  sourceLarge.media = "(min-width: 1101px)";
  sourceLarge.srcset = DbHelperRestaurnats.imageUrlForRestaurant(restaurant).split('.')[0] + "_large." + DbHelperRestaurnats.imageUrlForRestaurant(restaurant).split('.')[1];

  picture.append(sourceSmall);
  picture.append(sourceMedium);
  picture.append(sourceLarge);
  picture.append(image);


  image.className = 'restaurant-img'
  image.src = DbHelperRestaurnats.imageUrlForRestaurant(restaurant).split('.')[0] + "_medium." + DbHelperRestaurnats.imageUrlForRestaurant(restaurant).split('.')[1];

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    this.fillRestaurantHoursHTML();
  }
  // fill reviews
  Reviews.fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
static fillRestaurantHoursHTML(operatingHours = self.restaurant.operating_hours) {
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
}


/**
 * Add restaurant name to the breadcrumb navigation menu
 */
static fillBreadcrumb(restaurant = self.restaurant) {

  let favorite = this.facoriteChange('notFavoriteinRestInfo', 'FavoriteinRestInfo', restaurant.id, restaurant.is_favorite, restaurant.name);
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const li2 = document.createElement('li');
  li2.append(favorite);
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
  breadcrumb.appendChild(li2);
}


//change favorite 
static facoriteChange(notFavClass, FavClass, restId, restIsFav, name) {
  var favorite = document.createElement('a');
  favorite.setAttribute('role', 'button');
  if (restIsFav == true || restIsFav == "true") {
    favorite.setAttribute('class', FavClass);
  } else {
    favorite.setAttribute('class', notFavClass);
  }
  favorite.setAttribute('aria-label', name + "Add to favorite");
  favorite.innerHTML = '&#9829';
  favorite.addEventListener('click', function (e) {
    if (this.classList.contains(notFavClass)) {
      DbHelperRestaurnats.restaurantFavorite(restId, true, (error, resp) => {
        this.classList.remove(notFavClass);
        this.setAttribute('class', FavClass);
      });
    } else {
      DbHelperRestaurnats.restaurantFavorite(restId, false, (error, resp) => {
        this.classList.remove(FavClass);
        this.setAttribute('class', notFavClass);
      });
    }
  });
  return favorite;
}
/**
 * Get a parameter by name from page URL.
 */
 static getParameterByName(name, url) {
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
  }

  //rating changing function 
  static setRating(ev) {
    let span = ev.currentTarget;
    let stars = document.querySelectorAll('.star');
    let match = false;
    let num = 0;
    stars.forEach(function (star, index) {
      if (match) {
        star.classList.remove('rated');
      } else {
        star.classList.add('rated');
      }
      //are we currently looking at the span that was clicked
      if (star === span) {
        match = true;
        num = index + 1;
      }
    });
    document.querySelector('.stars').setAttribute('data-rating', num);
  }
  
}





