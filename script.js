"use strict";

var map;
// hard code location for initial testing
var currLocation = { lat: -33.8665433, lng: 151.1956316 }; // pyrmont

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


function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: currLocation,
        zoom: 12,
    });

    getRestaurants();
}

function getRestaurants() {
    var request = {
        location: currLocation,
        radius: "200",
        query: "restaurant",
    };

    var service = new google.maps.places.PlacesService(map);
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

initMap();
