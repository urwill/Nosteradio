function initCarousel() { 
    const stationCarouselElem = document.getElementById('stationCarousel');

    stationCarouselElem.addEventListener('slide.bs.carousel', event => {
        saveCurrentSong();
    });

    stationCarouselElem.addEventListener('slid.bs.carousel', event => {
        const station = event.relatedTarget.querySelector('#stationTitle').innerHTML;
        startStation(station);
    });
}

function nextStation() {
    const stationCarouselElem = document.getElementById('stationCarousel');
    const stationCarousel = new bootstrap.Carousel(stationCarouselElem);
    stationCarousel.next();
}