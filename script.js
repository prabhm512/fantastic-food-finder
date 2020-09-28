"use strict";
const RESULTS_STORAGE_NAME = "searchResults";

window.map = undefined;
var service, lat, lng;
var savedPlaces = [];

var zomatoResponse = [
  { collection_id: "1", images: [], name: [], latitude: [], longitude: [] },
  { collection_id: "434", images: [], name: [], latitude: [], longitude: [] },
  { collection_id: "46", images: [], name: [], latitude: [], longitude: [] },
];

let slides, caption; // Updates gallery images & restaurant name

var mapMarkers = [];
var infoWindow;

var counter = 0; // To uniquely identify gallery buttons

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
  infoWindow = new google.maps.InfoWindow();
}

function moveToLocation(lat, lng) {
  const center = new google.maps.LatLng(lat, lng);
  window.map.panTo(center);

  service = new google.maps.places.PlacesService(map);
  // when the map is set up do the call
  getRestaurants();
  createGalleries(); // Zomato collections for user location
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

// show the info window for the given marker
function doClickMarker(marker) {
  infoWindow.setOptions({
    content: marker.descrip,
  });

  infoWindow.open(map, marker);
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

  // construct an info string to add to the marker based on the place data
  var contentString =
    '<div id="content">' +
    '<h5 id="firstHeading" class="firstHeading">' +
    place.name +
    "</h5>" +
    '<div id="bodyContent">';

  if (place.vicinity) {
    contentString += "<p><b>Address:</b> " + place.vicinity + "</p>";
  } else {
    contentString += "<p><b>No Address provided...</b> ";
  }

  if (place.rating) {
    contentString +=
      "<p><b>Rating:</b> " +
      place.rating +
      "/5 from " +
      place.user_ratings_total +
      " reviews</p>";
  } else {
    contentString += "<p><b>No Ratings...</b> ";
  }

  // finish off the string
  contentString += "</div>" + "</div>";

  // then create the marker using the place data
  var marker = new google.maps.Marker({
    map: map,
    icon: image,
    title: place.name,
    position: place.geometry.location,
    descrip: contentString,
    animation: google.maps.Animation.DROP,
  });
  // hook up the click event for each marker
  google.maps.event.addListener(marker, "click", function () {
    doClickMarker(marker);
  });

  // keep track of markers
  mapMarkers.push(marker);
}

// clean up the map markers
function clearMapMarkers() {
  for (let i = 0; i < mapMarkers.length; i++) {
    mapMarkers[i].setMap(null);
  }

  mapMarkers = [];
}

// fired on the click off each button in the places list
function doClickButton() {
  // buttons are given an id of "button-" + i so slice off the last char (or 2 if > 9) to get the number (index to array)
  var btnId = $(this).attr("id");
  var btnIndex =
    btnId.length == 8
      ? $(this).attr("id").slice(-1)
      : $(this).attr("id").slice(-2);
  console.log(btnIndex);
  doClickMarker(mapMarkers[btnIndex]);
}

// deal with the returned array of places
function processResults(places) {
  // save to local storage
  localStorage.setItem(RESULTS_STORAGE_NAME, JSON.stringify(places));
  // and then load the saved places into the array
  loadSearchResults();

  // before displaying apply the sort
  sortPlaces("rating"); // use rating by default until we get the html in

  // first clear the list items
  $(".list-group").innerHTML = "";
  // and any existing map markers
  clearMapMarkers();

  // process each returned place
  for (var i = 0; i < savedPlaces.length; i++) {
    // add a marker to the map
    createMarker(savedPlaces[i]);
    // Display results on list
    var li = $("<li>").attr("class", "list-group-item");
    var button = $("<button>").attr("id", "button-" + i);
    button.append(savedPlaces[i].name);
    button.on("click", doClickButton);
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

// sort the savedPlaces array based on the input parameter
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
    // radius: distance, //for textSearch
    // query: "restaurant" //for textSearch
    type: ["restaurant"], // for nearbySearch
    rankBy: google.maps.places.RankBy.DISTANCE, // for nearbySearch
  };

  // service.textSearch(request, callback);
  service.nearbySearch(request, callback);

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

// Trending this week , Cheap Eats & Date Night Galleries

function createGalleries() {
  for (let i = 0; i < zomatoResponse.length; i++) {
    $.ajax({
      url:
        "https://developers.zomato.com/api/v2.1/search?collection_id=" +
        zomatoResponse[i].collection_id +
        "&lat=" +
        lat +
        "&lon=" +
        lng,
      dataType: "json",
      async: true,
      beforeSend: function (xhr) {
        xhr.setRequestHeader("user-key", "709ae1f9e03c2b869fcad39131684dff");
      }, // This inserts the api key into the HTTP header
      success: function (response) {
        // Create Swiper
        var swiper = new Swiper(".swiper-container-" + i, {
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
          autoplay: {
            delay: 5000,
          },
          pagination: {
            el: ".swiper-pagination-" + i,
          },
        });

        // Push response to array
        for (let j = 0; j < 10; j++) {
          zomatoResponse[i].images.push(
            response.restaurants[j].restaurant.featured_image
          );
          zomatoResponse[i].name.push(response.restaurants[j].restaurant.name);
          zomatoResponse[i].latitude.push(
            response.restaurants[j].restaurant.location.latitude
          );
          zomatoResponse[i].longitude.push(
            response.restaurants[j].restaurant.location.longitude
          );
        }

        // Render response on Swiper
        for (let k = 0; k < 10; k++) {
          render();

          caption.append(zomatoResponse[i].name[k]); // Restaurant name retreived from zomato database

          slides.attr(
            "style",
            "background-image: url(" + zomatoResponse[i].images[k] + ")"
          );

          slides.attr("id", "button-idx-" + counter);
          counter++;

          slides.append(caption);
          $(".swiper-container-" + i + " > .swiper-wrapper").append(slides);
        }

        // Create marker on map at location of restaurant clicked

        swiper.on("click", function () {
          // Change marker image based on clicked collection
          if (swiper.el.classList.contains("swiper-container-0")) {
            var myLatLng = new google.maps.LatLng(
              zomatoResponse[0].latitude[swiper.activeIndex],
              zomatoResponse[0].longitude[swiper.activeIndex]
            );
            var title = zomatoResponse[0].name[swiper.activeIndex];
            var image = {
              url:
                "https://images.vexels.com/media/users/3/143495/isolated/preview/6b80b9965b1ec4d47c31d7eccf8ce4b0-yellow-lightning-bolt-icon-by-vexels.png",
              size: new google.maps.Size(71, 71),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(17, 34),
              scaledSize: new google.maps.Size(40, 40),
            };
          } else if (swiper.el.classList.contains("swiper-container-1")) {
            var myLatLng = new google.maps.LatLng(
              zomatoResponse[1].latitude[swiper.activeIndex],
              zomatoResponse[1].longitude[swiper.activeIndex]
            );
            var title = zomatoResponse[1].name[swiper.activeIndex];
            var image = {
              url:
                "http://icons.iconarchive.com/icons/google/noto-emoji-objects/1024/62881-money-with-wings-icon.png",
              size: new google.maps.Size(71, 71),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(17, 34),
              scaledSize: new google.maps.Size(40, 40),
            };
          } else if (swiper.el.classList.contains("swiper-container-2")) {
            var myLatLng = new google.maps.LatLng(
              zomatoResponse[2].latitude[swiper.activeIndex],
              zomatoResponse[2].longitude[swiper.activeIndex]
            );
            var title = zomatoResponse[2].name[swiper.activeIndex];
            var image = {
              url:
                "http://icons.iconarchive.com/icons/succodesign/love-is-in-the-web/512/heart-icon.png",
              size: new google.maps.Size(71, 71),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(17, 34),
              scaledSize: new google.maps.Size(40, 40),
            };
          }
          var marker = new google.maps.Marker({
            map: map,
            icon: image,
            title: title,
            position: myLatLng,
            // descrip: contentString,
          });

          mapMarkers.push(marker);
          window.map.panTo(myLatLng);
        });
      },
    });
  }
}
