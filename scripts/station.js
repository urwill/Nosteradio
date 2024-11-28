const arrStations = [];

function initStation() {
    let station = getLocalStorageItem('activeStation');
    if(station) {
        const carousel = new bootstrap.Carousel('#stationCarousel');
        const index = arrStations.findIndex(stationObj => stationObj.stationName === station);
        if(index === -1) {    // activeStation nicht in arrStations gefunden
            const activeSlide = document.getElementById('stationCarousel').querySelector('.carousel-item.active');
            station = activeSlide.querySelector('#stationTitle').getAttribute('data-title');
            startStation(station);
        } else {
            carousel.to(index);
            if(index === 0) {
                // Carousel war schon auf dem gewünschten Slide, weshalb kein Event ausgelöst wird
                startStation(station);  // also manuell starten
            }
        }
    } else {
        const activeSlide = document.getElementById('stationCarousel').querySelector('.carousel-item.active');
        station = activeSlide.querySelector('#stationTitle').getAttribute('data-title');
        startStation(station);
    }

    const playIcon = document.getElementById('playIcon');
    playIcon.addEventListener("click", function() {
        playIcon_clicked(this);
    });

    const rewindIcon = document.getElementById('rewindIcon');
    rewindIcon.addEventListener("click", function() {
        rewindIcon_clicked();
    });

    const forwardIcon = document.getElementById('forwardIcon');
    forwardIcon.addEventListener("click", function() {
        startNextSong();
    });

    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.getElementById('volumeIcon');
    let initialVolume = getLocalStorageItem('currentVolume');
    if(!initialVolume) {
        initialVolume = 50;
    }
    volumeSlider.value = initialVolume;
    setVolume(initialVolume);
    
    // Ändern der Lautstärke, wenn der Slider bewegt wird
    volumeSlider.addEventListener('input', function() {
        let volume = parseInt(this.value);

        setVolume(volume);
        if(volume > 0) {
            mute(false);   // Player wieder unmuten, falls er beim Songwechsel gemutet und wegen User-Einstellungen nicht entmutet wurde
        }

        switch (true) {
            case (volume === 0):
                volumeIcon.className = 'playerControl bi bi-volume-mute-fill';
                break;
            case (volume > 50):
                volumeIcon.className = 'playerControl bi bi-volume-up-fill';
                break;
            default:
                volumeIcon.className = 'playerControl bi bi-volume-down-fill';
                break;
        }
    });

	// Mute/Unmute, wenn man auf das Icon klickt
    volumeIcon.addEventListener('click', function() {
        let volume = parseInt(volumeSlider.value);
        
        if(volume === 0) {
            volumeSlider.value = volumeSlider.oldvalue;
        } else {
            volumeSlider.oldvalue = volume;
            volumeSlider.value = 0;
        }

        volumeSlider.dispatchEvent(new Event('input'));
    });
}

function startStation(station) {
    pause();    // Player anhalten, damit nicht z.B. Youtube weiterläuft, wenn man auf einen lokalen Song wechselt

    document.title = `${station} - ${APP_NAME}`;

    songQueue = [];
    songQueueOrig = [];

    const stationObject = arrStations.find(stationObj => stationObj.stationName === station);
    if (stationObject) {
        for(const song of stationObject.stationSongs) {
            const videoId = getVideoId(getSong(song));
            songQueue.push(videoId);
            songQueueOrig.push(videoId);
        }

        const currentVideoId = getVideoId(stationObject.currentSong);
        let timeStamp = stationObject.currentTime || 0;
        if(timeStamp) {
            try {
                timeStamp = parseInt(timeStamp);
            }
            catch(err) {
                bsAlert(err.message, alertType.danger, false);
            }
        }
        while(songQueue.length > 0) {
            if(songQueue[0] === currentVideoId) {
                startNextSong(timeStamp);
                return;
            } else {
                songQueue.shift();
            }
        }
        if(songQueue.length === 0) {    // Song nicht in Queue gefunden. Eventuell schon neuer Song geladen bevor der alte gespeichert wurde
            songQueue = JSON.parse(JSON.stringify(songQueueOrig));  // Original-Queue auf aktuelle Queue übertragen ohne Referenz auf das Original
            startNextSong();
        }
    } else {
        console.log(`Kein Objekt mit stationName ${station} gefunden.`);
    }
}

function setSongTitle(videoData) {
    const activeSlide = document.getElementById('stationCarousel').querySelector('.carousel-item.active');
    const station = activeSlide.querySelector('#stationTitle').getAttribute('data-title');

    const stationObject = arrStations.find(stationObj => stationObj.stationName === station);
    if (stationObject) {
        for(const song of stationObject.stationSongs) {
            const videoId = getVideoId(getSong(song));
            if(videoId === videoData.video_id) {
                let artist = song.artist;
                if(!artist) {
                    artist = videoData.author;
                }
                let title = song.title;
                if(!title) {
                    title = videoData.title;
                }
                const currentSongElem = activeSlide.querySelector('#currentSong');
                currentSongElem.innerHTML = `${artist} - ${title}`;
                marquee(currentSongElem);
                return;
            }
        }
        activeSlide.querySelector('#currentSong').innerHTML = ``;
        console.log(`Kein Song mit videoId ${videoData.video_id} gefunden.`);
    } else {
        console.log(`Kein Objekt mit stationName ${station} gefunden.`);
    }
}

function saveCurrentSong() {
    const activeSlide = document.getElementById('stationCarousel').querySelector('.carousel-item.active');
    const station = activeSlide.querySelector('#stationTitle').getAttribute('data-title');
    //alert(station);
    const currentSong = getCurrentSong();
    const currentTime = getCurrentTime();

    if(currentSong) {
        const stationObject = arrStations.find(stationObj => stationObj.stationName === station);
        if (stationObject) {
            stationObject.currentSong = currentSong;
            stationObject.currentTime = currentTime;
        } else {
            console.log(`Kein Objekt mit stationName ${station} gefunden.`);
        }
    } else {
        // Kein Song gefunden, weil der Player noch leer war. In diesem Fall würde sonst ein "leerer" Song in currentSong gespeichert werden
    }
}