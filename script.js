"use strict";

window.map = undefined;
var service, lat, lng;

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
  // first clear the list items
  $(".list-group").innerHTML = "";

  // process each returned place
  for (var i = 0; i < places.length; i++) {
    // add a marker to the map
    createMarker(places[i]);
    // Display results on list
    var li = $("<li>").attr("class", "list-group-item");
    var button = $("<button>").attr("id", "button-" + i);
    button.append(places[i].name);
    li.append(button);
    $(".list-group").append(li);
  }
}

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
      images();
    }
  }
}

var slideIndex = 1;
showSlides(slideIndex);

function currentSlide(n) {
  showSlides((slideIndex = n));
}

function images() {
  console.log(lat, lng);
  $.ajax({
    url:
      "https://developers.zomato.com/api/v2.1/search?lat=" +
      lat +
      "&lon=" +
      lng +
      "&radius=1000",
    dataType: "json",
    async: true,
    beforeSend: function (xhr) {
      xhr.setRequestHeader("user-key", "709ae1f9e03c2b869fcad39131684dff");
    }, // This inserts the api key into the HTTP header
    success: function (response) {
      console.log(response);
    },
  });
}

// Show images in gallery
function showSlides(n) {
  var i;
  var slides = document.getElementsByClassName("mySlides");
  var dots = document.getElementsByClassName("dot");
  if (n > slides.length) {
    slideIndex = 1;
  }
  if (n < 1) {
    slideIndex = slides.length;
  }
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex - 1].style.display = "block";
  dots[slideIndex - 1].className += " active";
}

$(".next").on("click", function () {
  // ** Covert back to 1 on reaching last image.
  slideIndex += 1;
  showSlides();
  console.log(slideIndex);
});

$(".prev").on("click", function () {
  slideIndex -= 1;
  showSlides();
});
