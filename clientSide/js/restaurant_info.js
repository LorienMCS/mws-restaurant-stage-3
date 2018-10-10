let restaurant;
var newMap;
const faveButton = document.getElementById("fave-restaurant");

/**
 * Initialize Leaflet map as soon as page loads.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
 * Initialize Leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      const loc = restaurant.latlng;
      self.newMap = L.map('map', {
        center: [loc.lat, loc.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoibG9yaWVucyIsImEiOiJjamtkZWYxZmcwYWFpM3F0NjE0NGp0NHkzIn0.FuldsUxriKMJPEiEsTj-hA',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
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

/* ====================== START DEVELOPMENT ONLY ====================== */

/**
* DEVELOPMENT ONLY: For testing IDB addIsFave function
*/
addRestaurantWithoutIsFave = () => {
 const restaurantURL = `${DBHelper.RESTAURANT_DB_URL}/`;
 const data = {
   "name": "Kang Ho Dong Baekjeong",
   "neighborhood": "Manhattan",
   "photograph": "3",
   "address": "1 E 32nd St, New York, NY 10016",
   "latlng": {
     "lat": 40.747143,
     "lng": -73.985414
   },
   "cuisine_type": "Asian",
   "operating_hours": {
     "Monday": "11:30 am - 2:00 am",
     "Tuesday": "11:30 am - 2:00 am",
     "Wednesday": "11:30 am - 2:00 am",
     "Thursday": "11:30 am - 2:00 am",
     "Friday": "11:30 am - 6:00 am",
     "Saturday": "11:30 am - 6:00 am",
     "Sunday": "11:30 am - 2:00 am"
   },
   "createdAt": 1504095571434,
   "updatedAt": "2018-10-04T22:49:46.195Z",
   "id": 3,
 };
 fetch(restaurantURL, {
   method: "POST",
   body: JSON.stringify(data)
 })
 .then((response) => {
   response.json();
 })
 .catch(error => {
   console.error('Offline, or:', error);
 });
}

removeIsFaveFromRestaurantThree = () => {
  const restaurantURL = `${DBHelper.RESTAURANT_DB_URL}/3/`;
  fetch(restaurantURL, {
    method: "DELETE"
  })
  .then((response) => {
    response.json();
  })
  .then(() => {
    addRestaurantWithoutIsFave();
  })
  .catch(error => {
    console.error('Offline, or:', error);
  });
}

/**
* DEVELOPMENT ONLY: For deleting test reviews from server by review id
*/
deleteReview = (id) => {
  const reviewsURL = `${DBHelper.REVIEW_DB_URL}/${id}/`;
  fetch(reviewsURL, {
    method: "DELETE"
  })
  .then(() => {
    console.log(`Review with id of ${id} deleted`);
  })
  .catch(error => {
    console.error('Offline, or:', error);
  });
}

/* ====================== END DEVELOPMENT ONLY ====================== */

/**
 * Get data from review form, and put it in database
 */
window.addEventListener("load", () => {
  // Access the form element
  const form = document.getElementById("review-form");

  // Take over the form element's submit event
  form.addEventListener("submit", (event) => {
    // Stop the form from actually submitting itself
    event.preventDefault();
    sendData();
  })

  sendData = (restaurant = self.restaurant) => {

    //DEVELOPEMENT ONLY: For deleting reviews from server
    //deleteReview();

    const reviewsURL = `${DBHelper.REVIEW_DB_URL}/`;

    // FormData object for uploading to server; can't be stringified
    const formData = new FormData(form);

    // Get data that can be added to IDB, since formData can't be stringified
    const nameInput = document.getElementById("first-name");
    const ratingInput = document.querySelector("input[name=rating]:checked");
    const commentInput = document.getElementById("comments");

    formData.append("restaurant_id", restaurant.id);
    fetch(reviewsURL, {
      method: "POST",
      body: formData
    })
    .then(() => {
      console.log('Review posted to server');
      form.reset();
    })
    .catch(error => {
      console.error('Offline, or:', error);
    });

    //console.log(restaurant.id, nameInput.value, ratingInput.value, commentInput.value);
    //form.reset();
  }
});

/**
 * If is_favorite is missing on a restaurant, POST it to server
 */
addIsFave = (restaurant) => {
  const restaurantURL = `${DBHelper.RESTAURANT_DB_URL}/${restaurant.id}/`;
  const data = {
    "is_favorite": "false"
  }
  fetch(restaurantURL, {
    method: "POST",
    body: JSON.stringify(data)
  })
  .then((response) => {
    response.json();
  })
  .catch(error => {
    console.error('Offline, or:', error);
    const item = {
      name: restaurant.name,
      neighborhood: restaurant.neighborhood,
      photograph: restaurant.photograph,
      address: restaurant.address,
      latlng: restaurant.latlng,
      cuisine_type: restaurant.cuisine_type,
      operating_hours: restaurant.operating_hours,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
      id: restaurant.id,
      is_favorite: 'false'
    };
    idb.open('restaurant-data', 1).then(db => {
      return db.transaction('restaurants', 'readwrite').objectStore('restaurants').put(item);
    })
    .then(() => {
      console.log('Added isFave to IDB');
    });
  });
}

/**
 * Set fave button to match database is_favorite=true
 */
yesFaveButton = (restaurant = self.restaurant) => {
  faveButton.style.backgroundColor = "#fef5e0";
  faveButton.innerHTML = `Remove ${restaurant.name} from Favorites`;
  faveButton.setAttribute("aria-pressed", "true");
}

/**
 * Set fave button to match database is_favorite=false
 */
noFaveButton = (restaurant = self.restaurant) => {
  faveButton.style.backgroundColor = "#ebf8ff";
  faveButton.innerHTML = `Add ${restaurant.name} to Favorites`;
  faveButton.setAttribute("aria-pressed", "false");
}

/**
 * Set fave button to yes or no
 */
toggleFaveButton = (isFave) => {
  if(isFave.toString() === 'false') {
    noFaveButton(restaurant);
  } else {
    yesFaveButton(restaurant);
  };
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  const isFave = restaurant.is_favorite;
  name.innerHTML = restaurant.name;

  if(isFave) {
    toggleFaveButton(isFave);
    //DEVELOPEMENT ONLY: For testing addIsFave function
    //removeIsFaveFromRestaurantThree();
  } else {
    addIsFave(restaurant);
  }
  faveButton.setAttribute("onClick", "addToOrRemoveFromFavorites()");

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `${restaurant.name} restaurant`;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  // fill reviews
  DBHelper.fetchReviewByRestaurantId(restaurant.id, (error, reviews) => {
    if (!reviews) {
      console.error(error);
      return;
    }
    fillReviewsHTML(reviews);
  });
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
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
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
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

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute("aria-current", "page");
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
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

/**
 * Change is_favorite in server-side and client-side databases
 */
changeFaveInDb = (restaurantID, serverFave, idbFave, restaurant = self.restaurant) => {
  const faveRestaurantURL = `${DBHelper.RESTAURANT_DB_URL}/${restaurantID}/?${serverFave}`;
  fetch(faveRestaurantURL, {
    method: 'PUT'
  }).then(res => res.json())
  .catch(error => {
    console.error('Offline, or:', error);
    restaurant.is_favorite = idbFave;
    idb.open('restaurant-data', 1).then(db => {
      return db.transaction('restaurants', 'readwrite').objectStore('restaurants').put(restaurant);
    })
    .then(() => {
      console.log('Changed is_favorite in IDB');
    });
  });
}

/**
 * Add a restaurant to Favorites, or remove it from Favorites
 */
addToOrRemoveFromFavorites = (restaurant = self.restaurant) => {
  if (faveButton.getAttribute("aria-pressed") === "false") {
    const yesFave = 'is_favorite=true';
    const yesFaveBool = 'true';
    changeFaveInDb(restaurant.id, yesFave, yesFaveBool);
    yesFaveButton(restaurant);
  } else {
    const noFave = 'is_favorite=false';
    const noFaveBool = 'false';
    changeFaveInDb(restaurant.id, noFave, noFaveBool);
    noFaveButton(restaurant);
  }
}
