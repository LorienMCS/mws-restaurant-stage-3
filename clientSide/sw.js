self.importScripts('js/idb.js', 'js/dbhelper.js');
let cacheName = 'restaurants-cache-v1';
let urlsToCache = [
  '/',
  '/restaurant.html',
  '/manifest.json',
  '/css/styles.css',
  '/css/responsive.css',
  '/js/idb.js',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/img/'
];
let restaurants = [];
let reviews = [];

function getRestaurants() {
  fetch(DBHelper.RESTAURANT_DB_URL).then(function(response) {
    if(response.ok) {
      return response.json();
    }
    throw new Error('Network response was not okay.')
  }).then(function(json) {
    restaurants = json;
    return restaurants;
  }).catch(function(error) {
    console.log('Fetch in service worker had an error:', error.message);
  });
}

function getReviews() {
  fetch(DBHelper.REVIEW_DB_URL).then(function(response) {
    if(response.ok) {
      return response.json();
    }
    throw new Error('Network response was not okay.')
  }).then(function(json) {
    reviews = json;
    return reviews;
  }).catch(function(error) {
    console.log('Fetch in service worker had an error:', error.message);
  });
}

function createAndFillDB() {
  'use strict';
  idb.open('restaurant-data', 1, upgradeDb => {
    if (!upgradeDb.objectStoreNames.contains('restaurants')) {
      console.log('making a new restaurants object store');
      let restaurantStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
      restaurants.map(restaurant => {
        restaurantStore.add(restaurant);
      });
      console.log('Restaurants added successfully');
    }
    if (!upgradeDb.objectStoreNames.contains('reviews')) {
      console.log('making a new reviews object store');
      let reviewStore = upgradeDb.createObjectStore('reviews', {keyPath: 'id', autoIncrement:true});
      reviews.map(review => {
        reviewStore.add(review);
      });
      console.log('Reviews added successfully');
    }
  });
}

// The install event is the first event a svc worker gets, and it only happens once.
// It can be used to start the process of populating an IndexedDB, and caching site assets
self.addEventListener('install', event => {
  event.waitUntil(
    getRestaurants()
  );
  event.waitUntil(
    getReviews()
  );
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      cache.addAll(urlsToCache);
    })
  );
});

// The service worker activation event is a good time to create a database
self.addEventListener('activate', event => {
  event.waitUntil(
    createAndFillDB()
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  )
});


