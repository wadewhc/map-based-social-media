// get users device location
function getallLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(getPosition);
    } else {
        alert("device not supported location");
    }
}

    ////////// map set up
function getPosition(position) {
    //get my curr location (optional)
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    console.log("latitude: " + latitude)
    console.log("longitude: " + longitude)
    //

    mapboxgl.accessToken = 'pk.eyJ1IjoianlrMTk5OTEyMjIiLCJhIjoiY2x0M2FqODhkMWdhZzJscDhsNnlzYTFyaCJ9.eSPui_SEdaclP0xtujBzvw';
    const center = [longitude, latitude];
    const map = new mapboxgl.Map({
        container: 'map',
        zoom: 12.5,
        center: center,
        pitch: 60,

        style: 'mapbox://styles/mapbox/light-v11'
    });
    //////////
    map.addControl(new mapboxgl.NavigationControl());
    new mapboxgl.Marker().setLngLat(center).addTo(map);


    // features = [];

    fetch('/showlocations')
        .then(response => response.json())
        .then(data => {
            console.log(data);

            features = []
            // var Content = document.getElementById('content');
            // var listings = document.getElementById('listings');

            for (let i = 0; i < data.length; i++) {
                let item = data[i];

                // const listings = document.getElementById('listings');

                // var newItemDiv = document.createElement('div');
                // newItemDiv.classList.add('item');
                // newItemDiv.innerHTML = `
                //     <div class="item-row" id="listing-${item.post_id}">
                //         <a href="#" id="link-${item.post_id}" class="title-leftsidebar">${item.user_name}</a>
                //         <div>${item.content} · Published on ${item.time}</div>
                //     </div>
                //     `;
                // const listing = listings.appendChild(newItemDiv);




                // var newItemDiv = document.createElement('div');
                // // newItemDiv.classList.add('item');
                // newItemDiv.innerHTML = `
                //     <div class="item-row">
                //         <div>${item.user_id}</div>
                //         <br />
                //         <div>${item.content}</div>
                //         <br />
                //     </div>
                //     <br />
                //     `;
                // Content.appendChild(newItemDiv);


                // /* Add a new listing section to the sidebar. */
                const listings = document.getElementById('listings');
                const listing = listings.appendChild(document.createElement('div'));
                /* Assign a unique `id` to the listing. */
                listing.id = `listing-${item.post_id}`;
                /* Assign the `item` class to each listing for styling. */
                listing.className = 'item-row';

                /* Add the link to the individual listing created above. */
                const link = listing.appendChild(document.createElement('a'));
                link.href = `#`;
                // link.href = `/user/${item.user_id}`;
                link.className = 'title-leftsidebar';
                link.id = `link-${item.post_id}`;
                link.innerHTML = `${item.user_name}`;

                /* Add details to the individual listing. */
                const details = listing.appendChild(document.createElement('div'));
                details.innerHTML = `${item.content}`;
                if (item.time) {
                    details.innerHTML += ` · Published on ${item.time}`;
                }
                if (item.latitude) {
                    distance = calculateDistance(item.latitude, item.longitude, position.coords.latitude, position.coords.longitude);
                    details.innerHTML += `<div><strong>${distance.toFixed(2)} meters away</strong></div>`;
                }



                let feature = {
                    'type': 'Feature',
                    'properties': {
                        'description': `
                                <div class="mapboxgl-popup-content">
                                    <h3>
                                        <a href="/user/${item.user_id}">${item.user_name}</a>
                                        <h5 class="post-date">${item.time}</h5>
                                    </h3><br>
                                    <h4 class="post-content">
                                        ${item.content}
                                    </h4><br>

                        `,
                        'icon': 'attraction',
                        'id': `${item.post_id}`,
                        'user_id': `${item.user_id}`,
                        'iuser_name': `${item.user_name}`,
                        'content': `${item.content}`,
                        'time': `${item.time}`
                    },
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [item.longitude, item.latitude]
                    }
                };

                //     <img class="images" src="data:image;base64,${item.img}">
                // </div >

                if (item.img != "") {
                    feature['properties']['description'] += `<img class="images" src="data:image;base64,${item.img}"></div >`;
                } else {
                    feature['properties']['description'] += `</div >`;
                }

                features.push(feature);




                link.addEventListener('click', function () {
                    for (const cur_feature of features) {
                        if (this.id === `link-${cur_feature.properties.id}`) {
                            flyToStore(cur_feature);
                            createPopUp(cur_feature);
                        }
                    }
                    const activeItem = document.getElementsByClassName('active');
                    if (activeItem[0]) {
                        activeItem[0].classList.remove('active');
                    }
                    this.parentNode.classList.add('active');
                });


                // let feature = {
                //     'type': 'Feature',
                //     'properties': {
                //         'description': `
                //             <div class="mapboxgl-popup">
                //                 <div><strong>${item.user_id}</strong></div>

                //                 <div class="popup-main">
                //                     <div class="popup-left">
                //                         <img src="data:image/jpeg;base64,${item.img}">"
                //                     </div>
                //                     <div class="popup-right">
                //                         <p>${item.content}</p>
                //                     </div>
                //                 </div>

                //                 <div class="popup-bottom"><p>${item.time}</p></div>
                //             </div>
                //             `,
                //         'icon': 'attraction'
                //     },
                //     'geometry': {
                //         'type': 'Point',
                //         'coordinates': [item.longitude, item.latitude]
                //     }
                // };
                // features.push(feature);
            }

            geojson_data = {
                'type': 'FeatureCollection',
                'features': features
            }



            console.log(features);
            addAdditionalSourceAndLayer()


            map.on('click', 'placesLayer', (e) => {

                // copied
                const coordinates = e.features[0].geometry.coordinates.slice();
                const description = e.features[0].properties.description;

                // copied
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(description)
                    .addTo(map);
            });


            map.on('click', (event) => {
                const cur_features = map.queryRenderedFeatures(event.point, {
                    layers: ['placesLayer']
                });
                if (!cur_features.length) return;

                const clickedPoint = cur_features[0];

                flyToStore(clickedPoint);
                createPopUp(clickedPoint);

                const activeItem = document.getElementsByClassName('active');
                if (activeItem[0]) {
                    activeItem[0].classList.remove('active');
                }
                const listing = document.getElementById(
                    `listing-${clickedPoint.properties.id}`
                );
                listing.classList.add('active');
            });

            map.on('mouseenter', 'placesLayer', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'placesLayer', () => {
                map.getCanvas().style.cursor = '';
            });

        })
        .catch(error => console.error('Error:', error));

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Radius of the Earth in meters
        const φ1 = lat1 * Math.PI / 180; // Convert latitude 1 from degrees to radians
        const φ2 = lat2 * Math.PI / 180; // Convert latitude 2 from degrees to radians
        const Δφ = (lat2 - lat1) * Math.PI / 180; // Difference in latitude
        const Δλ = (lon2 - lon1) * Math.PI / 180; // Difference in longitude

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c; // Distance in meters
        return distance;
    }

    function buildLocationList(places) {
        for (const place of places.features) {

            const listings = document.getElementById('listings');
            const listing = listings.appendChild(document.createElement('div'));
            listing.id = `listing-${place.properties.id}`;
            listing.className = 'item-row';

            const link = listing.appendChild(document.createElement('a'));
            link.href = '#';
            link.className = 'title-leftsidebar';
            link.id = `link-${place.properties.id}`;
            link.innerHTML = `${place.properties.user_name}`;

            const details = listing.appendChild(document.createElement('div'));
            details.innerHTML = `${place.properties.content}`;
            if (place.properties.time) {
                details.innerHTML += ` · Published on ${place.properties.time}`;
            }
            if (place.geometry.coordinates) {
                distance = calculateDistance(place.geometry.coordinates[1], place.geometry.coordinates[0], position.coords.latitude, position.coords.longitude);
                // console.log('Distance:', distance.toFixed(2), 'meters');
                // const roundedDistance = Math.round(store.properties.distance * 100) / 100;
                details.innerHTML += `<div><strong>${distance.toFixed(2)} meters away</strong></div>`;
            }

            link.addEventListener('click', function () {
                for (const cur_feature of features) {
                    if (this.id === `link-${cur_feature.properties.id}`) {
                        flyToStore(cur_feature);
                        createPopUp(cur_feature);
                    }
                }
                const activeItem = document.getElementsByClassName('active');
                if (activeItem[0]) {
                    activeItem[0].classList.remove('active');
                }
                this.parentNode.classList.add('active');
            });
        }
    }

    function addAdditionalSourceAndLayer() {
        console.log(geojson_data);


        map.addSource('placesSource', {
            'type': 'geojson',
            'data': geojson_data
        })

        map.addLayer({
            'id': 'placesLayer',
            'type': 'symbol',
            'source': 'placesSource',
            'layout': {
                'icon-image': ['get', 'icon'],
                'icon-size': 2.50,
                'icon-allow-overlap': true
            }
        });

    }

    const layerList = document.getElementById('basemap-menu');
    const inputs = layerList.getElementsByTagName('input');

    for (const input of inputs) {
        input.onclick = (layer) => {
            const layerId = layer.target.id;
            map.setStyle('mapbox://styles/mapbox/' + layerId);

            map.on('style.load', () => {
                addAdditionalSourceAndLayer();
            });
        };
    }

    function toggleSidebar(side) {
        const elem = document.getElementById(side);
        const collapsed = elem.classList.toggle('collapsed');
        const padding = {};
        padding[side] = collapsed ? 0 : 300;
        map.easeTo({
            padding: padding,
            duration: 1000 // In ms.
        });
    }



    // function buildLocationList(geojson_data) {
    //     for (const post_place of geojson_data.features) {
    //         /* Add a new listing section to the sidebar. */
    //         const listings = document.getElementById('listings');
    //         const listing = listings.appendChild(document.createElement('div'));
    //         /* Assign a unique `id` to the listing. */
    //         listing.id = `listing-${post_place.properties.id}`;
    //         /* Assign the `item` class to each listing for styling. */
    //         listing.className = 'item';

    //         /* Add the link to the individual listing created above. */
    //         const link = listing.appendChild(document.createElement('a'));
    //         link.href = '#';
    //         link.className = 'title';
    //         link.id = `link-${post_place.properties.id}`;
    //         link.innerHTML = `${post_place.properties.address}`;

    //         /* Add details to the individual listing. */
    //         const details = listing.appendChild(document.createElement('div'));
    //         details.innerHTML = `${post_place.properties.city}`;
    //         if (post_place.properties.phone) {
    //             details.innerHTML += ` · ${post_place.properties.phoneFormatted}`;
    //         }
    //         if (post_place.properties.distance) {
    //             const roundedDistance = Math.round(post_place.properties.distance * 100) / 100;
    //             details.innerHTML += `<div><strong>${roundedDistance} miles away</strong></div>`;
    //         }
    //     }
    // }
    function flyToStore(currentFeature) {
        map.flyTo({
            center: currentFeature.geometry.coordinates,
            zoom: 15
        });
    }
    function createPopUp(currentFeature) {
        const popUps = document.getElementsByClassName('mapboxgl-popup-content');
        /** Check if there is already a popup on the map and if so, remove it */
        if (popUps[0]) popUps[0].remove();

        const popup = new mapboxgl.Popup({ closeOnClick: false })
            .setLngLat(currentFeature.geometry.coordinates)
            .setHTML(currentFeature.properties.description)
            .addTo(map);
    }


    map.on('load', () => {
        toggleSidebar('left');
        // buildLocationList(geojson_data);
    });
}
window.onload = function () {
    getallLocation();
};