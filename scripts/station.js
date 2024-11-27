const arrStations = [];

function startStation(station) {
    document.title = `${station} - ${APP_NAME}`;

    songQueue = [];
    songQueueOrig = [];

    const stationObject = arrStations.find(stationObj => stationObj.stationName === station);
    if (stationObject) {
        for(const song of stationObject.stationSongs) {
            songQueue.push(getYouTubeVideoId(song.url));
            songQueueOrig.push(getYouTubeVideoId(song.url));
        }
        if(youtubePlayerLoaded) {
            const currentVideoId = getYouTubeVideoId(stationObject.currentSong);
            let timeStamp = getParam('t', stationObject.currentSong);
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
            if(getYouTubeVideoId(song.url) === videoData.video_id) {
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
    const currentSong = youtubePlayer.getVideoUrl();    // Liefert die aktuelle Zeit nicht zuverlässig. Also Link mit Timestamp selbst zusammenbauen
    const currentTime = youtubePlayer.getCurrentTime();
    const currentVideoId = getYouTubeVideoId(currentSong);

    if(currentVideoId) {
        const stationObject = arrStations.find(stationObj => stationObj.stationName === station);
        if (stationObject) {
            stationObject.currentSong = `https://youtube.com/watch?t=${currentTime}&v=${currentVideoId}`;
        } else {
            console.log(`Kein Objekt mit stationName ${station} gefunden.`);
        }
    } else {
        // Kein Song gefunden, weil der Player noch leer war. In diesem Fall würde sonst ein "leerer" Song in currentSong gespeichert werden
    }
}