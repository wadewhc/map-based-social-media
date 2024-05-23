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
});