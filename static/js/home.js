function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setPosition);
    } else {
        alert("Location not supported on device")
    }
}

function setPosition(pos) {
    document.getElementById("create-lat").value = pos.coords.latitude;
    document.getElementById("create-long").value = pos.coords.longitude;
    document.getElementById("sort-form").submit();


    // var latitude = pos.coords.latitude;
    // var longitude = pos.coords.longitude;

    // console.log("latitude: " + latitude)
    // console.log("longitude: " + longitude)

    // mapboxgl.accessToken = 'pk.eyJ1IjoianlrMTk5OTEyMjIiLCJhIjoiY2x0M2FqODhkMWdhZzJscDhsNnlzYTFyaCJ9.eSPui_SEdaclP0xtujBzvw';
    // const center = [longitude, latitude];
    // const map = new mapboxgl.Map({
    //     container: 'post-map',
    //     zoom: 12.5,
    //     center: center,
    //     pitch: 60,

    //     style: 'mapbox://styles/mapbox/light-v11'
    // });
    // map.addControl(new mapboxgl.NavigationControl());

    // new mapboxgl.Marker().setLngLat(center).addTo(map);
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + ' ' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0');
}

window.addEventListener("load", () => {
    document.querySelectorAll('.post-date').forEach(element => {
        const originalTime = element.textContent;
        const formattedTime = formatTime(originalTime);
        element.textContent = formattedTime;
    });
    document.getElementById("curr-location").addEventListener("click", getLocation);
});