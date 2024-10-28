const arrStations = [];
let stationLoaded = false;

function startStation(station) {
    console.log(arrStations);
    document.title = `${station} - Nosteradio 2.0`;

    songQueue = [];
    songQueueOrig = [];

    const stationObject = arrStations.find(stationObj => stationObj.stationName === station);
    if (stationObject) {
        for(song of stationObject.stationSongs) {
            songQueue.push(getYouTubeVideoId(song.url));
            songQueueOrig.push(getYouTubeVideoId(song.url));
        }
        stationLoaded = true;
        console.log(songQueue);
        console.log(youtubePlayer);
        if(youtubePlayerLoaded) {
            const currentVideoId = getYouTubeVideoId(stationObject.currentSong);
            let timeStamp = getParam('t', stationObject.currentSong);
            console.log(stationObject.currentSong);
            console.log(timeStamp);
            if(timeStamp) {
                try {
                    timeStamp = parseInt(timeStamp);
                }
                catch(err) {
                    alert(err.message);
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
    const station = activeSlide.querySelector('#stationTitle').innerHTML;
    console.log(activeSlide);
    console.log(videoData);

    const stationObject = arrStations.find(stationObj => stationObj.stationName === station);
    if (stationObject) {
        for(song of stationObject.stationSongs) {
            if(getYouTubeVideoId(song.url) === videoData.video_id) {
                let artist = song.artist;
                if(!artist) {
                    artist = videoData.author;
                }
                let title = song.title;
                if(!title) {
                    title = videoData.title;
                }
                activeSlide.querySelector('#currentSong').innerHTML = `${artist} - ${title}`;
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
    const station = activeSlide.querySelector('#stationTitle').innerHTML;
    //alert(station);
    const currentSong = youtubePlayer.getVideoUrl();    // Liefert die aktuelle Zeit nicht zuverlässig. Also Link mit Timestamp selbst zusammenbauen
    const currentTime = youtubePlayer.getCurrentTime();
    const currentVideoId = getYouTubeVideoId(currentSong);
    console.log('currentSong', currentSong);
    console.log('currentTime', currentTime);

    const stationObject = arrStations.find(stationObj => stationObj.stationName === station);
    if (stationObject) {
        stationObject.currentSong = `https://youtube.com/watch?t=${currentTime}&v=${currentVideoId}`;
    } else {
        console.log(`Kein Objekt mit stationName ${station} gefunden.`);
    }
}