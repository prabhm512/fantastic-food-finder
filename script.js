"use strict";
const RESULTS_STORAGE_NAME = "searchResults";

window.map = undefined;
var service, userLat, userLng;
var savedPlaces = [];
var mapMarkers = [];
var infoWindow;
var dropMarker;
var locationMarker;
var bounds;

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
  locationMarker = new google.maps.Marker({
    map: map,
    title: "Your Location",
    animation: google.maps.Animation.DROP,
  });
  bounds = new google.maps.LatLngBounds();
  // hook up the click event for the drop marker
  google.maps.event.addListener(dropMarker, "click", function () {
    doClickMarker(dropMarker);
  });
}

// center the map at and move marker to the given lat,lng
function moveToLocation(lat, lng) {
  const center = new google.maps.LatLng(lat, lng);
  window.map.panTo(center);
  locationMarker.setPosition(center);
}

// get users current location
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(afterGetPosition);
  } else {
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

// the callback method for the getCurrentPosition method
function afterGetPosition(position) {
  userLat = position.coords.latitude;
  userLng = position.coords.longitude;
  moveToLocation(userLat, userLng);
  getRestaurants();
  // when the map is set up do the call
  createGalleries(); // Zomato collections for user location
}

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

// for each place, create a map marker and add it as a button to the list
function renderPlaces() {
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
}

// deal with the returned array of places
function processResults(places) {
  // save to local storage
  localStorage.setItem(RESULTS_STORAGE_NAME, JSON.stringify(places));
  // and then load the saved places into the array
  loadSearchResults();

  renderPlaces();

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
  if (sortType === "rating") {
    // search by rating high to low. have to account for null as not all entries have values.
    savedPlaces.sort(function (a, b) {
      return (
        (a.rating === null) - (b.rating === null) ||
        -(a.rating > b.rating) ||
        +(a.rating < b.rating)
      );
    });
  } else if (sortType === "distance") {
    // sorting by distance is the default so we don't have to make changes for it, just reload the returned results to reorder the array
    loadSearchResults();
  }
} // sortPlaces

// use the google nearbySearch to get restaurants near the users current location
function getRestaurants() {
  var request = {
    location: new google.maps.LatLng(userLat, userLng),
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
      // and clear any existing map markers
      clearMapMarkers();
    }
  }
}

// this is called on the load of the page
function initialise() {
  getLocation();
}

// set up the event handler for the buttons in the list
document
  .getElementById("submit-btn")
  .addEventListener("click", function (event) {
    event.preventDefault();
    renderPlaces();
  });

// Trending this week , Cheap Eats & Date Night Galleries
function createGalleries() {
  var loading;
  for (let i = 0; i < zomatoResponse.length; i++) {
    $.ajax({
      url:
        "https://developers.zomato.com/api/v2.1/search?collection_id=" +
        zomatoResponse[i].collection_id +
        "&lat=" +
        userLat +
        "&lon=" +
        userLng,
      dataType: "json",
      async: true,
      error: function () {
        $(".gallery-container").text("");
        $(".gallery-container").text(
          "No results found. Check your internet connection."
        );
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader("user-key", "709ae1f9e03c2b869fcad39131684dff");
        // $(".gallery-container").text("");
        loading = $("<div>").attr("class", "loader");
        $(".swiper-" + i).append(loading);
      }, // This inserts the api key into the HTTP header
      success: function (response) {
        $(".loader").remove();
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

        var maxTodo =
          response.restaurants.length < 10 ? response.restaurants.length : 10;
        // Push response to array
        for (let j = 0; j < maxTodo; j++) {
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
        for (let k = 0; k < maxTodo; k++) {
          let slides, caption; // Updates gallery images & restaurant name
          let counter = 0; // To uniquely identify gallery buttons

          caption = $("<div>").attr("class", "text");

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

initialise();
