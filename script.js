"use strict";
var mapCanvas = document.querySelector("#map");
var listResults = document.querySelector("#resultsList");
var map;
var service;

// hard code location for initial testing
var currLocation = { lat: -33.8665433, lng: 151.1956316 }; // pyrmont
// and hard code distance
var distance = 200;

function doClickMarker(marker) {
    console.log("marker clicked at " + marker.getPosition() + ": " + marker.title);
}

// this is the callback function for the api initialisation. 
// The map and service vars have to be set here as the method isn't run until the api returns.
// Any use of the map and service must be done after this method fires.
function initMap() {
    map = new google.maps.Map(mapCanvas, {
        center: currLocation,
        zoom: 15,
    });
    service = new google.maps.places.PlacesService(map);
    getRestaurants();
}

// add a marker to the map for the given place
function createMarker(place) {
    // first create the image for the marker
    var image = {
        url: place.icon,
        size: new google.maps.Size(35, 35),
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
    google.maps.event.addListener(marker, 'click', function () {
        doClickMarker(marker);
    });
}

// deal with the returned array of places
function processResults(places) {
    // first clear the list items
    listResults.innerHTML = "";

    // process each returned place
    for (var i = 0; i < places.length; i++) {
        // add a marker to the map
        createMarker(places[i]);
    }
}

function getRestaurants() {
    var request = {
        location: currLocation,
        // radius: distance, //for textSearch
        // query: "restaurant" //for textSearch
        type: ['restaurant'], // for nearbySearch
        rankBy: google.maps.places.RankBy.DISTANCE // for nearbySearch
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
