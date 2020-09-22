"use strict";

var map;
var service;

// hard code location for initial testing
var currLocation = { lat: -33.8665433, lng: 151.1956316 }; // pyrmont

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: currLocation,
        zoom: 14,
    });
    service = new google.maps.places.PlacesService(map);
    // when the map is set up do the call
    getRestaurants();
}

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
        location: currLocation,
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
            }
        }
    }
}