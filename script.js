"use strict";
const RESULTS_STORAGE_NAME = "searchResults";

window.map = undefined;
var service, lat, lng;
var savedPlaces = [];
var zomatoResponse = {
  zomatoTrending: {
    images: [],
    name: [],
  },

  zomatoCheapEats: {
    images: [],
    name: [],
  },

  zomatoDateNight: {
    images: [],
    name: [],
  },
};

let slides, caption; // Updates gallery images & restaurant name

// hard code location for initial testing
// var currLocation = { lat: -33.8665433, lng: 151.1956316 }; // pyrmont

// this is the callback function for the api initialisation.
// The map and service vars have to be set here as the method isn't run until the api returns.
// Any use of the map and service must be done after this method fires.
function initMap() {
  const mapOptions = {
    center: new google.maps.LatLng(0, 0),
    zoom: 12,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  };

  window.map = new google.maps.Map(document.getElementById("map"), mapOptions);
}

function moveToLocation(lat, lng) {
  const center = new google.maps.LatLng(lat, lng);
  window.map.panTo(center);

  service = new google.maps.places.PlacesService(map);
  // when the map is set up do the call
  getRestaurants();
  trending(); // Zomato collections for user location
  cheapEats();
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showPosition(position) {
  lat = position.coords.latitude;
  lng = position.coords.longitude;
  moveToLocation(lat, lng);
}

getLocation();

function doClickMarker(marker) {
  console.log(
    "marker clicked at " + marker.getPosition() + ": " + marker.title
  );
}

// add a marker to the map for the given place
function createMarker(place) {
  // first create the image for the marker
  var image = {
    url: place.icon,
    size: new google.maps.Size(71, 71),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(17, 34),
    scaledSize: new google.maps.Size(25, 25),
  };

  // then create the marker using that image
  var marker = new google.maps.Marker({
    map: map,
    icon: image,
    title: place.name,
    position: place.geometry.location,
  });

  // hook up the click event for each marker
  google.maps.event.addListener(marker, "click", function () {
    doClickMarker(marker);
  });
}

// deal with the returned array of places
function processResults(places) {
  // save to local storage
  localStorage.setItem(RESULTS_STORAGE_NAME, JSON.stringify(places));
  // and then load the saved places into the array
  loadSearchResults();

  // before displaying apply the sort
  sortPlaces("rating"); // use rating by default until we get the html in
  //console.log("after sorting: " + JSON.stringify(savedPlaces));

  // first clear the list items
  $(".list-group").innerHTML = "";

  // process each returned place
  for (var i = 0; i < savedPlaces.length; i++) {
    // add a marker to the map
    createMarker(savedPlaces[i]);
    // Display results on list
    var li = $("<li>").attr("class", "list-group-item");
    var button = $("<button>").attr("id", "button-" + i);
    button.append(savedPlaces[i].name);
    li.append(button);
    $(".list-group").append(li);
  }
}

// get results from local storage and load them into the array
function loadSearchResults() {
  // load the items from storage
  var storedPlaces = localStorage.getItem(RESULTS_STORAGE_NAME);
  if (storedPlaces) {
    savedPlaces = JSON.parse(storedPlaces);
  }
} // loadSearchResults

// sort the savedPlaces array based on hte input parameter
function sortPlaces(sortType) {
  if (sortType === "priceLoHi") {
    // search by price low to high
    savedPlaces.sort(function (a, b) {
      return a.price_level - b.price_level;
    });
  } else if (sortType === "priceHiLo") {
    // search by price high to low
    savedPlaces.sort(function (a, b) {
      return b.price_level - a.price_level;
    });
  } else if (sortType === "rating") {
    // search by rating high to low
    savedPlaces.sort(function (a, b) {
      return b.rating - a.rating;
    });
  }
} // sortPlaces

function getRestaurants() {
  var request = {
    location: window.map.center,
    radius: "200",
    query: "restaurant",
  };

  service.textSearch(request, callback);

  function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      console.log(results);
      processResults(results);
    }
  }
}
// Renders 3D cubes displaying restaurants
function render() {
  caption = $("<div>").attr("class", "text");
  caption.css("font-weight", "bold");
  caption.css("background-color", "black");
  caption.css("color", "white");
  caption.css("font-size", "19px");

  slides = $("<button>");
  slides.attr("class", "swiper-slide");
}

function trending() {
  $.ajax({
    url:
      "https://developers.zomato.com/api/v2.1/search?collection_id=1&lat=" +
      lat +
      "&lon=" +
      lng,
    dataType: "json",
    async: true,
    beforeSend: function (xhr) {
      xhr.setRequestHeader("user-key", "709ae1f9e03c2b869fcad39131684dff");
    }, // This inserts the api key into the HTTP header
    success: function (response) {
      for (var i = 0; i < 10; i++) {
        zomatoResponse.zomatoTrending.images.push(
          response.restaurants[i].restaurant.featured_image
        );
        zomatoResponse.zomatoTrending.name.push(
          response.restaurants[i].restaurant.name
        );
      }
      appendTrending();
    },
  });
}

function appendTrending() {
  for (let i = 0; i < zomatoResponse.zomatoTrending.images.length; i++) {
    render();

    caption.append(zomatoResponse.zomatoTrending.name[i]); // Restaurant name retreived from zomato database

    slides.attr(
      "style",
      "background-image: url(" + zomatoResponse.zomatoTrending.images[i] + ")"
    );
    slides.append(caption);
    $(".swiper-container-0 > .swiper-wrapper").append(slides);
  }
}

// Swiper 1
new Swiper(".swiper-container-0", {
  // Initially, swiper API rendered only when the page was resized.
  // observer & observeParents allow swiper to render on page load.
  observer: true,
  observeParents: true,

  // Basic swiper paraemeters
  effect: "cube",
  grabCursor: true,
  cubeEffect: {
    shadow: true,
    slideShadows: true,
    shadowOffset: 20,
    shadowScale: 0.94,
  },
  pagination: {
    el: ".swiper-pagination-0",
  },
});

function cheapEats() {
  $.ajax({
    url:
      "https://developers.zomato.com/api/v2.1/search?collection_id=434&lat=" +
      lat +
      "&lon=" +
      lng,
    dataType: "json",
    async: true,
    beforeSend: function (xhr) {
      xhr.setRequestHeader("user-key", "709ae1f9e03c2b869fcad39131684dff");
    }, // This inserts the api key into the HTTP header
    success: function (response) {
      for (var i = 0; i < 10; i++) {
        zomatoResponse.zomatoCheapEats.images.push(
          response.restaurants[i].restaurant.featured_image
        );
        zomatoResponse.zomatoCheapEats.name.push(
          response.restaurants[i].restaurant.name
        );
      }
      appendCheapEats();
    },
  });
}

function appendCheapEats() {
  for (let i = 0; i < zomatoResponse.zomatoCheapEats.images.length; i++) {
    render();
    caption.append(zomatoResponse.zomatoCheapEats.name[i]); // Restaurant name retreived from zomato database

    slides.attr(
      "style",
      "background-image: url(" + zomatoResponse.zomatoCheapEats.images[i] + ")"
    );
    slides.append(caption);
    $(".swiper-container-1 > .swiper-wrapper").append(slides);
  }
}

// Swiper 2
new Swiper(".swiper-container-1", {
  // Initially, swiper API rendered only when the page was resized.
  // observer & observeParents allow swiper to render on page load.
  observer: true,
  observeParents: true,

  // Basic swiper paraemeters
  effect: "cube",
  grabCursor: true,
  cubeEffect: {
    shadow: true,
    slideShadows: true,
    shadowOffset: 20,
    shadowScale: 0.94,
  },
  pagination: {
    el: ".swiper-pagination-1",
  },
});
