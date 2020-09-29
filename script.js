"use strict";
const RESULTS_STORAGE_NAME = "searchResults";

window.map = undefined;
var service, lat, lng;
var savedPlaces = [];

var zomatoResponse = [
  {
    collection_id: "1",
    icon:
      "https://images.vexels.com/media/users/3/143495/isolated/preview/6b80b9965b1ec4d47c31d7eccf8ce4b0-yellow-lightning-bolt-icon-by-vexels.png",
    images: [],
    name: [],
    latitude: [],
    longitude: [],
    address: [],
    rating: [],
    reviewNo: [],
  },
  {
    collection_id: "434",
    icon:
      "http://icons.iconarchive.com/icons/google/noto-emoji-objects/1024/62881-money-with-wings-icon.png",
    images: [],
    name: [],
    latitude: [],
    longitude: [],
    address: [],
    rating: [],
    reviewNo: [],
  },
  {
    collection_id: "46",
    icon:
      "http://icons.iconarchive.com/icons/succodesign/love-is-in-the-web/512/heart-icon.png",
    images: [],
    name: [],
    latitude: [],
    longitude: [],
    address: [],
    rating: [],
    reviewNo: [],
  },
];

var mapMarkers = [];
var infoWindow;
var dropMarker;
var bounds;

// hard code location for initial testing
// var currLocation = { lat: -33.8665433, lng: 151.1956316 }; // pyrmont

// this is the callback function for the api initialisation.
// The map and service vars have to be set here as the method isn't run until the api returns.
// Any use of the map and service must be done after this method fires.
function initMap() {
  const mapOptions = {
    center: new google.maps.LatLng(0, 0),
    zoom: 10,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  };

  window.map = new google.maps.Map(document.getElementById("map"), mapOptions);
  infoWindow = new google.maps.InfoWindow();
  service = new google.maps.places.PlacesService(map);
  dropMarker = new google.maps.Marker({
    map: map,
    descrip: "",
    animation: google.maps.Animation.BOUNCE,
  });
  bounds = new google.maps.LatLngBounds();
  // hook up the click event for the drop marker
  google.maps.event.addListener(dropMarker, "click", function () {
    doClickMarker(dropMarker);
  });
}

function moveToLocation(lat, lng) {
  const center = new google.maps.LatLng(lat, lng);
  window.map.panTo(center);

  // when the map is set up do the call
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
  getRestaurants();
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
    '<h6 id="firstHeading" class="firstHeading">' +
    place.name +
    "</h6>" +
    '<div id="bodyContent">';

  // place has vicinity in nearbySearch and formatted_address in textSearch
  if (place.vicinity) {
    contentString += "<p><b>Address:</b> " + place.vicinity + "<br>";
    // if (place.formatted_address) {
    //   contentString += "<p><b>Address:</b> " + place.formatted_address + "</p>";
  } else {
    contentString += "<b>No Address provided...</b><br>";
  }

  if (place.rating) {
    contentString +=
      "<b>Rating:</b> " +
      place.rating +
      "/5 from " +
      place.user_ratings_total +
      " reviews<br>";
  } else {
    contentString += "<b>No Ratings...</b><br>";
  }

  if (place.price_level) {
    contentString += "<b>Price Level:</b> " + place.price_level + "/5<br>";
  } else {
    contentString += "<b>No Price info...</b><br>";
  }

  // finish off the string
  contentString += "</p>" + "</div>" + "</div>";

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

  bounds.extend(marker.position);
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
  // console.log(btnIndex);
  doClickMarker(mapMarkers[btnIndex]);
}

// deal with the returned array of places
function processResults(places) {
  // save to local storage
  localStorage.setItem(RESULTS_STORAGE_NAME, JSON.stringify(places));
  // and then load the saved places into the array
  loadSearchResults();

  // before displaying apply the sort
  sortPlaces($("#search-type").val()); // use rating by default. Can only search by price if using nearbySearch

  // first clear the list items
  $(".list-group").empty();
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

  map.fitBounds(bounds);
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
      if (a.price_level) {
        return b.price_level == null
          ? a.price_level
          : a.price_level - b.price_level;
      } else {
        // a is not defined so check b
        return b.price_level == null ? 0 : b.price_level;
      }
      // return a.price_level - b.price_level;
    });
  } else if (sortType === "priceHiLo") {
    // search by price high to low
    savedPlaces.sort(function (a, b) {
      if (b.price_level) {
        return a.price_level == null
          ? b.price_level
          : b.price_level - a.price_level;
      } else {
        // b is not defined so check a
        return a.price_level == null ? 0 : a.price_level;
      }
      // return b.price_level - a.price_level;
    });
  } else if (sortType === "rating") {
    // search by rating high to low
    savedPlaces.sort(function (a, b) {
      if (b.rating) {
        return a.rating == null ? b.rating : b.rating - a.rating;
      } else {
        // b.rating is not defined so check a
        return a.rating == null ? 0 : a.rating;
      }
      // return b.rating - a.rating;
    });
  }
  // sorting by distance is the default so we don't have to make changes for it
} // sortPlaces

function getRestaurants() {
  var request = {
    location: window.map.center,
    // radius: $("#distance").val(), //for textSearch
    // query: "restaurant" //for textSearch
    // the following properties are for the nearbySearch
    type: ["restaurant"], // for nearbySearch
    rankBy: google.maps.places.RankBy.DISTANCE, // for nearbySearch
  };

  // service.textSearch(request, callback);
  service.nearbySearch(request, callback);

  function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      console.log(results);
      processResults(results);
    } else {
      console.log("return status is NOT OK");
      // first clear the list items
      $(".list-group").empty();
      // add a list item that shows the user the result
      var li = $("<li>").attr("class", "list-group-item");
      $(li).text("No results found");
      $(".list-group").append(li);
      // and any existing map markers
      clearMapMarkers();
    }
  }
}

document
  .getElementById("submit-btn")
  .addEventListener("click", function (event) {
    event.preventDefault();
    $(".list-group").text("");
    getRestaurants();
  });

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
          zomatoResponse[i].address.push(
            response.restaurants[j].restaurant.location.address
          );
          zomatoResponse[i].rating.push(
            response.restaurants[j].restaurant.user_rating.aggregate_rating
          );
          zomatoResponse[i].reviewNo.push(
            response.restaurants[j].restaurant.all_reviews_count
          );
        }

        // Render response on Swiper
        for (let k = 0; k < 10; k++) {
          let slides, caption; // Updates gallery images & restaurant name
          let counter = 0; // To uniquely identify gallery buttons

          caption = $("<div>").attr("class", "text");
          caption.css("font-weight", "bold");
          caption.css("background-color", "black");
          caption.css("color", "white");
          caption.css("font-size", "19px");
          caption.css("margin-top", "50%");
          caption.css("text-align", "center");

          slides = $("<a>");
          slides.attr("href", "#map");
          slides.attr("class", "swiper-slide");

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

        // update the drop marker and move it to map location of restaurant clicked
        swiper.on("click", function () {
          if (swiper.el.classList.contains("swiper-container-" + i)) {
            var myLatLng = new google.maps.LatLng(
              zomatoResponse[i].latitude[swiper.activeIndex],
              zomatoResponse[i].longitude[swiper.activeIndex]
            );

            // get content to display on the click off the marker
            var title = zomatoResponse[i].name[swiper.activeIndex];
            var contentString =
              '<div id="content">' +
              '<h5 id="firstHeading" class="firstHeading">' +
              title +
              "</h5>" +
              '<div id="bodyContent">' +
              "<p><b>Address:</b> " +
              zomatoResponse[i].address[swiper.activeIndex] +
              "</p>" +
              "<p><b>Rating:</b> " +
              zomatoResponse[i].rating[swiper.activeIndex] +
              "/5 from " +
              zomatoResponse[i].reviewNo[swiper.activeIndex] +
              " reviews</p>" +
              "</div>" +
              "</div>";

            // set up the image for the marker's icon
            var image = {
              url: zomatoResponse[i].icon,
              size: new google.maps.Size(71, 71),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(17, 34),
              scaledSize: new google.maps.Size(40, 40),
            };

            // update the drop marker
            dropMarker.descrip = contentString;
            dropMarker.setPosition(myLatLng);
            dropMarker.setIcon(image);
            dropMarker.setTitle(title);

            // Re-center map to location of clicked restaurant
            window.map.panTo(myLatLng);
            doClickMarker(dropMarker);
          }
        });
      },
    });
  }
}
