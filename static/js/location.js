window.addEventListener("load", ()=> {
    document.getElementById("curr-location").addEventListener("click", getLocation);
});

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setPosition);
    } else {
        alert("Location not supported on device")
    }
}

function setPosition(pos) {
    document.getElementById("create-lat").value=pos.coords.latitude;
    document.getElementById("create-long").value=pos.coords.longitude;
}
