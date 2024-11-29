function initCarousel() { 
    const stationCarouselElem = document.getElementById('stationCarousel');

    stationCarouselElem.addEventListener('slide.bs.carousel', event => {
        if(videoStarted === true) { // Senderwechsel "deaktivieren" bis Song geladen wurde, da Fehler auftreten können, wenn man schnell durch Songs skippt
            saveCurrentSong();
        } else {
            console.log('Bitte warten');
            event.preventDefault();
        }
    });

    stationCarouselElem.addEventListener('slid.bs.carousel', event => {
        const station = event.relatedTarget.querySelector('#stationTitle').getAttribute('data-title');
        startStation(station);
    });
}

function nextStation() {
    const stationCarouselElem = document.getElementById('stationCarousel');
    const stationCarousel = new bootstrap.Carousel(stationCarouselElem);
    stationCarousel.next();
}