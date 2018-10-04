let restaurant;
var newMap;

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

/**
 * Set fave button to match database is_favorite=true
 */
yesFaveButton = (restaurant = self.restaurant) => {
  faveButton = document.getElementById("fave-restaurant");
  faveButton.style.backgroundColor = "#fef5e0";
  faveButton.innerHTML = `Remove ${restaurant.name} from Favorites`;
  faveButton.setAttribute("aria-pressed", "true");
}

/**
 * Set fave button to match database is_favorite=false
 */
noFaveButton = (restaurant = self.restaurant) => {
  faveButton = document.getElementById("fave-restaurant");
  faveButton.style.backgroundColor = "#ebf8ff";
  faveButton.innerHTML = `Add ${restaurant.name} to Favorites`;
  faveButton.setAttribute("aria-pressed", "false");
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  const isFave = restaurant.is_favorite;
  name.innerHTML = restaurant.name;

  const fave = document.getElementById('fave-restaurant');
  if(isFave.toString() === 'false') {
    noFaveButton(restaurant);
  } else {
    yesFaveButton(restaurant);
  };
  fave.setAttribute("onClick", "addToOrRemoveFromFavorites()");

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
changeFaveInDb = (restaurantID, faveBoolean) => {
  const faveRestaurantURL = `${DBHelper.RESTAURANT_DB_URL}/${restaurantID}/?${faveBoolean}`;
  fetch(faveRestaurantURL, {
    method: 'PUT'
  }).then(res => res.json())
  .then(() => {
    // TODO:
    // Implement saving fave to IDB
  })
  .catch(error => {
    console.error('Offline, or:', error);
  });
}

/**
 * Add a restaurant to Favorites, or remove it from Favorites
 */
addToOrRemoveFromFavorites = (restaurant = self.restaurant) => {
  faveButton = document.getElementById("fave-restaurant");
  if (faveButton.getAttribute("aria-pressed") === "false") {
    const yesFave = 'is_favorite=true';
    changeFaveInDb(restaurant.id, yesFave);
    yesFaveButton(restaurant);
  } else {
    const noFave = 'is_favorite=false';
    changeFaveInDb(restaurant.id, noFave);
    noFaveButton(restaurant);
  }
}
