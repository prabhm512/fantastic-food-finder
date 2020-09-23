"use strict";

window.map = undefined;
var service, lat, lng;

// hard code location for initial testing
// var currLocation = { lat: -33.8665433, lng: 151.1956316 }; // pyrmont

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
      for (var i = 0; i < results.length; i++) {
        //var place = results[i];
        createMarker(results[i]);

        // Get names of restaurants within specified radius
        var name = results[i].name;

        // Display results on list
        var li = $("<li>").attr("class", "list-group-item");
        var button = $("<button>").attr("id", "button-" + i);
        button.append(name);
        li.append(button);
        $(".list-group").append(li);
      }
    }
  }
}
