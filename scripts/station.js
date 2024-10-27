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
            startNextSong();
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