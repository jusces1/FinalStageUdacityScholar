import idb from 'idb';

export default class DbHelperReviews {

    static get DATABASE_URL_REWIEWS() {
        return `http://localhost:1337/reviews`;
    }

    //Get all reviews for a restaurant from idb
    static fetchReviewsByRestaurant(RestId, callback) {
        var reviews;
        DbHelperReviews.openDatabase_reviews().then(function (db) {
            var index = db.transaction('reviews').objectStore('reviews').index('by-data');
            return index.getAll();
        }).then(function (resp) {
            const results = resp.filter(r => r.restaurant_id == RestId);
            if(results.length > 0) {
                callback(null, results);
            } else {
                DbHelperReviews.fetchReviewsByRestaurantFromDb(RestId, callback);
            }
        });
    }

    //Fetch reviews by restaurant from database 
    static fetchReviewsByRestaurantFromDb(RestId, callback) {
        fetch(DbHelperReviews.DATABASE_URL_REWIEWS +'?restaurant_id='+RestId).then(function (response) {
            return response.json();
        }).then(function (resp){
            DbHelperReviews.openDatabase_reviews().then(function (db) {
                if (!db) return;
                var tx = db.transaction('reviews', 'readwrite');
                var store = tx.objectStore('reviews');
                resp.forEach(function (review) {
                    store.put(review);
                });
            });
            callback(null, resp);
        }).catch(function (err){
            callback(err, null);
        });
    }



    //Post review to idb database 
    static postReviewToIdb(name, comment, rating, restId,saveidb, callback){
        fetch(DbHelperReviews.DATABASE_URL_REWIEWS, {
            method: 'POST', // or 'PUT'
            body: JSON.stringify({
                "restaurant_id": restId,
                "name": name,
                "rating": rating,
                "comments": comment
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            return response.json();
        }).catch(error => {
               
        }).then(response => {
            if(response) {
                DbHelperReviews.openDatabase_reviews().then(function (db) {
                    var tx = db.transaction('reviews', 'readwrite');
                    var store = tx.objectStore('reviews');
                    store.put(response);
                    callback(null, response);
                });
            } else {
                if (saveidb) {
                    let id = Math.random().toString(36).substr(2, 9);
                    let notSavedReview = {
                        "id": id,
                        "restaurant_id": restId,
                        "name": name,
                        "rating": rating,
                        "comments": comment,
                        "createdAt": Date.now(),
                        "updatedAt": Date.now()
                    };
                    DbHelperReviews.openDatabase_reviews().then(function (db) {
                        var tx = db.transaction('reviews', 'readwrite');
                        var store = tx.objectStore('reviews');
                        store.put(notSavedReview);
                    });
                    DbHelperReviews.openDatabase_notSaved_reviews().then(function (db) {
                        let txOffline = db.transaction('notSaved', 'readwrite');
                        let storeOffline = txOffline.objectStore('notSaved');
                        storeOffline.put(notSavedReview);
                        callback(null, notSavedReview);
                    });
                }
            }
        });
    }

    //Open Local database for reviews
    static openDatabase_reviews() {
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        }
        if (navigator.onLine != true) {
            var x = document.getElementById("snackbar");
            x.className = "show";
            setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
        } 
        return idb.open('reviews', 1, function (upgradeDb) {
            var store = upgradeDb.createObjectStore('reviews', {
                keyPath: 'id'
            });
            store.createIndex('by-data', 'updatedAt');
        });
    }

    //Open Local database for reviews
    static openDatabase_notSaved_reviews() {
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        }
        if (navigator.onLine != true) {
            var x = document.getElementById("snackbar");
            x.className = "show";
            setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
        } 
        return idb.open('notSaved', 1, function (upgradeDb) {
            var store = upgradeDb.createObjectStore('notSaved', {
                keyPath: 'id'
            });
            store.createIndex('by-data', 'updatedAt');
        });
    }
}