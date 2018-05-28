import idb from 'idb';

export default class DbHelperRestaurnats {

  static get DATABASE_URL_RESTAURANTS() {
    return `http://localhost:1337/restaurants`;
  }

  /**
 * Restaurant page URL.
 */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }
  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/images/${restaurant.id}.webp`);
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    
    fetch(DbHelperRestaurnats.DATABASE_URL_RESTAURANTS).then(function(response){
      return response.json();
    }).then(function(response) {
      var restaurants;
      DbHelperRestaurnats.openDatabase().then(function (db) {
        if (!db) return;
        var tx = db.transaction('restaurant', 'readwrite');
        var store = tx.objectStore('restaurant');
        response.forEach(function (restouran) {
          store.put(restouran);
        });
      });
      DbHelperRestaurnats.openDatabase().then(function (db) {
        var index = db.transaction('restaurant').objectStore('restaurant').index('by-data');
        return index.getAll();
      }).then(function (resp) {
        if(resp.length > 1) {
          callback(null, resp)
        } else {
          callback(null, response)
        }
      });
    }).catch(function(err){
      DbHelperRestaurnats.openDatabase().then(function (db) {
        var index = db.transaction('restaurant').objectStore('restaurant').index('by-data');
        return index.getAll();
      }).then(function (resp) {
        callback(null, resp)
      });
    });
  }

  /**
   * Fetch a restaurant by its ID from idb.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    var restaurants;
    DbHelperRestaurnats.openDatabase().then(function (db) {
        var index = db.transaction('restaurant').objectStore('restaurant').index('by-data');
        return  index.openCursor();
    }).then(function restById (cursor) {
      if(!cursor) return;
      if(cursor.value.id == id) {
        return cursor.value;
      }
      return cursor.continue().then(restById);
    }).then(function(resp){
      callback(null, resp);
      })
  }
  /**
   * Fetch a restaurant by its ID from db.
   */
  static fetchRestaurantByIdFromdb(id, callback) {
      fetch(DbHelperRestaurnats.DATABASE_URL_RESTAURANTS+"/"+id).then(function(response) {
        return response.json();
      }).then(function(response) {
        return callback(null, response);
      });
  }
  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    var restaurants;
    DbHelperRestaurnats.openDatabase().then(function (db) {
      var index = db.transaction('restaurant').objectStore('restaurant').index('by-data');
      return index.getAll();
    }).then(function (resp) {
       // Filter restaurants to have only given cuisine type
      const results = resp.filter(r => r.cuisine_type == cuisine);
      callback(null, results);
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants

    var restaurants;
    DbHelperRestaurnats.openDatabase().then(function (db) {
      var index = db.transaction('restaurant').objectStore('restaurant').index('by-data');
      return index.getAll();
    }).then(function (resp) {
      const results = resp.filter(function(r){
        if (r.neighborhood == neighborhood)
          return true;
      });
      callback(null, results);
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    var restaurants;
    DbHelperRestaurnats.fetchRestaurants((error, resp) => { 
      // Filter restaurants to have only given cuisine type   
      let results = resp;
      if (cuisine != 'all') { // filter by cuisine
        results = results.filter(r => r.cuisine_type == cuisine);
      }
      if (neighborhood != 'all') { // filter by neighborhood
        results = results.filter(r => r.neighborhood == neighborhood);
      }
      callback(null, results);
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    var restaurants;
    DbHelperRestaurnats.openDatabase().then(function (db) {
      var index = db.transaction('restaurant').objectStore('restaurant').index('by-data');
      return index.getAll();
    }).then(function (resp) {
      // Filter restaurants to have only given cuisine type
      const neighborhoods = resp.map((v, i) => resp[i].neighborhood);
      const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
      callback(null, uniqueNeighborhoods);
    });

  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    var restaurants;
    DbHelperRestaurnats.openDatabase().then(function (db) {
      var index = db.transaction('restaurant').objectStore('restaurant').index('by-data');
      return index.getAll();
    }).then(function (resp) {
      // Filter restaurants to have only given cuisine type
      const cuisines = resp.map((v, i) => resp[i].cuisine_type)
      // Remove duplicates from cuisines
      const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
      callback(null, uniqueCuisines);
    });
  }


  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DbHelperRestaurnats.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  //Change restaurant favorite status 
  static restaurantFavorite(id, favorite, callback) {
    var url = DbHelperRestaurnats.DATABASE_URL_RESTAURANTS + "/" + id + "/?is_favorite=" + favorite;
    fetch(url, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    }).catch(error => {
      DbHelperRestaurnats.openDatabase().then(function (db) {
        let store = db.transaction('restaurant', 'readwrite').objectStore('restaurant');
        store.get(id).then(function (data) {
          data.is_favorite = favorite;
          let updateTitleRequest = store.put(data);
        });
        let offlineUpdate = {
          id: id,
          is_favorite: favorite
        };
        DbHelperRestaurnats.openDatabase_notSaved_restUpdates().then(function (db) {
          let txOffline = db.transaction('notSavedRestUpdate', 'readwrite');
          let storeOffline = txOffline.objectStore('notSavedRestUpdate');
          storeOffline.put(offlineUpdate);
          callback(null, offlineUpdate);
        });
      })
    }).then(response => {
      DbHelperRestaurnats.openDatabase().then(function (db) {
        let store = db.transaction('restaurant', 'readwrite').objectStore('restaurant');
        store.get(id).then(function(data){
          data.is_favorite = favorite;
          var updateTitleRequest = store.put(data);
        });
        callback(null, response);
      })
    });
  }

  static openDatabase() {
 
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
    if (navigator.onLine != true) {
      var x = document.getElementById("snackbar");
      x.className = "show";
      setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
    } 
    return idb.open('restaurant', 1, function (upgradeDb) {
      var store = upgradeDb.createObjectStore('restaurant', {
        keyPath: 'id'
      });
      store.createIndex('by-data', 'updatedAt');
    });
  }


  static openDatabase_notSaved_restUpdates() {
   
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
    if (navigator.onLine != true) {
      var x = document.getElementById("snackbar");
      x.className = "show";
      setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
    } 
    return idb.open('notSavedRestUpdate', 1, function (upgradeDb) {
      var store = upgradeDb.createObjectStore('notSavedRestUpdate', {
        keyPath: 'id'
      });
    });
  }
}
