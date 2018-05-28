

import swal from 'sweetalert2';
import DbHelperReviews from './dbhelper_reviews';
import restInfo from './restaurant_info';

export default class Reviews {

    static fetchRestaurantReviews(id) {
        DbHelperReviews.openDatabase_notSaved_reviews().then(function (db) {
            if (!db) return;
            let tx = db.transaction('notSaved', 'readwrite');
            let store = tx.objectStore('notSaved');
            let index = store.index('by-data');
            return index.getAll();
        }).then(function (resp){
            if(resp.length > 0) {
                resp.map(res => {
                    DbHelperReviews.postReviewToIdb(res.name, res.comments, res.rating, res.restaurant_id, false, function (error, restaurants) {
                        DbHelperReviews.openDatabase_notSaved_reviews().then(function (db) {
                            let tx = db.transaction('notSaved', 'readwrite');
                            let store = tx.objectStore('notSaved');
                            store.delete(res.id);
                        });
                    });
                });
                DbHelperReviews.fetchReviewsByRestaurant(id, (error, reviews) => {
                    self.reviews = reviews;
                    restInfo.fillRestaurantHTML();
                });
            } else {
                DbHelperReviews.fetchReviewsByRestaurant(id,(error, reviews) => {
                    self.reviews = reviews;
                    restInfo.fillRestaurantHTML();
                });
            }
        });
    }

    /**
     * Create all reviews HTML and add them to the webpage.
     */
    static fillReviewsHTML(reviews = self.reviews) {
        const container = document.getElementById('reviews-container');
        if(container.innerHTML.length < 40) {
            const title = document.createElement('h2');
            title.innerHTML = 'Reviews';
            container.appendChild(title);
        } 
        const me = this;
        if (!reviews) {
            const noReviews = document.createElement('p');
            noReviews.innerHTML = 'No reviews yet!';
            container.appendChild(noReviews);
            return;
        }
        const ul = document.getElementById('reviews-list');
        reviews.forEach(review => {
            ul.appendChild(me.createReviewHTML(review));
        });
        container.appendChild(ul);
    }

    /**
     * Create review HTML and add it to the webpage.
     */
    static createReviewHTML(review) {
        const li = document.createElement('li');
        const name = document.createElement('p');
        name.innerHTML = review.name;
        li.appendChild(name);

        const rating = document.createElement('p');
        rating.innerHTML = `Rating: ${review.rating}`;
        li.appendChild(rating);

        const comments = document.createElement('p');
        comments.innerHTML = review.comments;
        li.appendChild(comments);

        return li;
    }

    static SubmitReview() {
        let name = document.getElementById('name');
        let comment = document.getElementById('comment');
        let rating = document.querySelectorAll('.star.rated').length;
        let restId = restInfo.getParameterByName('id');
        let me = this;
        if(this.validate(name)) {
            DbHelperReviews.postReviewToIdb(name.value, comment.value, rating, restId, true, function (error, restaurants) {
                let review = [{ name: name.value, comments: comment.value, rating: rating }];
                me.fillReviewsHTML(review);
            });
        }
    }

    static validate(name) {
        if(name.value == "") {
            swal({
                type: 'error',
                title: 'Empty field',
                text: 'You must fill name!',
            })
            return false;
        }  else {
            return true;
        }
    }
}