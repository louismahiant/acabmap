mapboxgl.accessToken =
  "pk.eyJ1Ijoib29lYWNhYiIsImEiOiJja2JvdDZzY2MyNWg2MnNxdmk1N3hra2Z2In0.L5jcDKJyDKGj7K6trS9-tQ";
var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/ooeacab/clhypgdy602b001qycjfa6lz2",
  center: [4.72, 46.42],
  zoom: 4.13,
  attributionControl: !1,
  maxZoom: 18.6,
  hash: !0,
});

var map_co = new Vue({
  el: "#app",
  data() {
    return {
      archive: 1,
      maptab: 0,
      dir: "l",
      place: "",
      placeid: "",
      content: "",
      center_lat: "",
      center_lng: "",
      zoom: "",
      lat: "",
      lng: "",
      near: [],
      adresse: "",
      large: false,
    };
  },

  methods: {
    offset(dir) {
      var padding = {};
      if (window.innerWidth < 700) {
        var lr = "bottom";
        var pad = 300;
      } else {
        var lr = "left";
        var pad = 500;
      }
      if (dir == "left") {
        padding[lr] = pad;
        map.easeTo({ padding: padding, duration: 500 });
      } else {
        padding[lr] = 0;
        map.easeTo({ padding: padding, duration: 500 });
      }
    },
    color() {
      map.flyTo({ center: map_co.point, speed: 0.4, maxDuration: 1500 });
      if (map_co.maptab == 0) {
        map_co.offset("left");
      }
    },
    markerclean() {
      map_co.zoomscroll();
      var marker = document.querySelector("#add");
      if (marker) {
        marker.classList.add("out");
        setTimeout(function () {
          marker.parentNode.removeChild(marker);
        }, 400);
      }
    },
    zoomscroll() {
      map.scrollZoom.enable();
    },
  },
});

// Events

map.on("load", function () {
  var zoom = map.getZoom();
  var lat = map.getCenter().lat;
  var lng = map.getCenter().lng;
  (map_co.center_lat = lat), (map_co.center_lng = lng), (map_co.zoom = zoom);
});

map.on("moveend", function () {
  if (!map.isMoving()) var zoom = map.getZoom();
  var lat = map.getCenter().lat;
  var lng = map.getCenter().lng;
  (map_co.center_lat = lat), (map_co.center_lng = lng), (map_co.zoom = zoom);
});

map.on("click", function (a) {
  var b = map.queryRenderedFeatures(a.point, {
    layers: ["places"],
  });

  if (b.length) {
    var c = b[0],
      d = c.geometry.coordinates,
      e = c.properties.description;

    map_co.markerclean();
    map_co.point = d;
    map_co.color();
    map_co.maptab = 1;
    map_co.place = c.properties.title;
    map_co.placeid = c.properties.id;
    map_co.content = e;
  }
}),
  map.on("mouseenter", "places", function () {
    map.getCanvas().style.cursor = "pointer";
  }),
  map.on("mouseleave", "places", function () {
    map.getCanvas().style.cursor = "";
  });

// Geocoder

var search;
fetch("/acabmap/search.json")
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    search = data;
  })
  .catch((err) => {
    console.log("Error");
  });

function forwardGeocoder(query) {
  var matchingFeatures = [];
  for (var i = 0; i < search.features.length; i++) {
    var feature = search.features[i];
    if (
      feature.properties.description
        .toLowerCase()
        .search(query.toLowerCase()) !== -1
    ) {
      feature["place_name"] = "Ⓐ " + feature.properties.description;
      feature["center"] = feature.geometry.coordinates;
      feature["place_type"] = ["acab_tag"];
      matchingFeatures.push(feature);
    }
  }
  return matchingFeatures;
}

var geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  localGeocoder: forwardGeocoder,
  countries: "be, fr, de, it, ch, es, gb, pt, ro, lu, at, ie, dk, nl",
  placeholder: "Search",
  limit: 30,
  marker: false,
  flyTo: {
    offset: [0, 0],
    maxDuration: 1,
  },
  mapboxgl: mapboxgl,
});

geocoder.on("result", function (result) {
  var coordinates = result.result.center;
  var point = map.project(coordinates);

  geocoder.clear();
  map_co.maptab = 1;
  map_co.place = "";
  map_co.content = '<div class="loading_s"></div>';

  function checkloaded() {
    if (map.loaded() == false) {
      window.setTimeout(checkloaded, 100);
    } else {
      var b = map.queryRenderedFeatures(point, { layers: ["places"] });

      if (result.result.place_type == "acab_tag") {
        var c = b[0],
          d = c.geometry.coordinates.slice(),
          e = c.properties.description;

        map_co.markerclean();
        map_co.point = d;
        map_co.color();

        map_co.place = c.properties.title;
        map_co.placeid = c.properties.id;
        map_co.content = e;

        document.activeElement.blur();
      } else {
        map_co.markerclean();
        map_co.point = coordinates;
        map_co.color();
        map_co.content = result.result.place_name;
      }
    }
  }
  checkloaded();
});

document.getElementById("geocoder").appendChild(geocoder.onAdd(map));

map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
  }),
  "bottom-right"
);
