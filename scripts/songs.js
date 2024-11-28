let currentSongType;

function getVideoId(song) {
    let videoId = getYouTubeVideoId(song);
    if(!videoId) {  // Kein Youtube Link gefunden
        videoId = song; //  Filename von lokalem Song
    }

    return videoId;
}

function getSong(song) {
    let videoId;
    if(song.url) {
        videoId = song.url;
    } else {
        videoId = song.fileName;
    }

    return videoId;
}

function getCurrentVideoId() {
    let currentVideoId;
    switch(currentSongType) {
        case 'youtube':
            currentVideoId = getYouTubeVideoId(youtubePlayer.getVideoUrl());
        break;
        case 'local':
            currentVideoId = audioPlayer.dataset.filename;
        break;
    }
    return currentVideoId;
}

function getCurrentTime() {
    let currentTime = 0;
    switch(currentSongType) {
        case 'youtube':
            currentTime = youtubePlayer.getCurrentTime();
        break;
        case 'local':
            currentTime = audioPlayer.currentTime;
        break;
    }
    return currentTime;
}

function getCurrentSong() {
    const currentVideoId = getCurrentVideoId();
    if(currentVideoId) {
        let currentSong;
        switch(currentSongType) {
            case 'youtube':
                currentSong = `https://youtube.com/watch?v=${currentVideoId}`;
            break;
            case 'local':
                currentSong = currentVideoId;
            break;
        }
        return currentSong;
    }
}

function getVideoData() {
    let videoData;
    switch(currentSongType) {
        case 'youtube':
            videoData = youtubePlayer.getVideoData();
            break;
        case 'local':
            videoData = {
                'video_id': audioPlayer.dataset.filename,
                'author': '',   // wird später aus Songlist ausgelesen
                'title': '' // wird später aus Songlist ausgelesen
            };
            break;
    }
    return videoData;
}

function seekTo(seconds = 0) {
    switch(currentSongType) {
        case 'youtube':
            youtubePlayer.seekTo(seconds);
        break;
        case 'local':
            audioPlayer.currentTime = seconds;
        break;
    }
}

function setVolume(volume) {
    youtubePlayer.setVolume(volume);
    audioPlayer.volume = volume / 100;
}

function mute(muted = true) {
    switch(currentSongType) {
        case 'youtube':
            if(muted) {
                youtubePlayer.mute();
            } else {
                youtubePlayer.unMute();
            }
        break;
        case 'local':
            audioPlayer.muted = muted;
        break;
    }
}

function play() {
    switch(currentSongType) {
        case 'youtube':
            youtubePlayer.playVideo();
        break;
        case 'local':
            audioPlayer.play();
        break;
    }
}

function pause() {
    switch(currentSongType) {
        case 'youtube':
            youtubePlayer.pauseVideo();
        break;
        case 'local':
            audioPlayer.pause();
        break;
    }
}

async function startNextSong(timeStamp = 0) {
    pause();    // Player anhalten, damit nicht z.B. Youtube weiterläuft, wenn man auf einen lokalen Song wechselt
    
    const activeSlide = document.getElementById('stationCarousel').querySelector('.carousel-item.active');
    removeMarquee(activeSlide.querySelector('#currentSong'));
    activeSlide.querySelector('#currentSong').innerHTML = 'Loading...';

    if(songQueue.length > 0) {
        const videoId = songQueue.shift();
        videoStarted = false;
        if(videoId.includes('.')) { // Wenn es einen Punkt hat, ist es ein Dateiname und keine Youtube VideoId
            currentSongType = 'local';
            mute();   // Player muten, damit im pausierten Zustand der Song nicht erst kurz beginnt bevor er pausiert wird
            const station = activeSlide.querySelector('#stationTitle').getAttribute('data-title');
            loadLocalFile(station, videoId, timeStamp);
        } else {
            currentSongType = 'youtube';
            mute();   // Player muten, damit im pausierten Zustand der Song nicht erst kurz beginnt bevor er pausiert wird
            youtubePlayer.loadVideoById(videoId, timeStamp);
        }
    } else {
        //alert('Radio leer');
        //nextStation();
        songQueue = JSON.parse(JSON.stringify(songQueueOrig));  // Original-Queue auf aktuelle Queue übertragen ohne Referenz auf das Original
        startNextSong();
    }
}

function playIcon_clicked(elem) {
    if(elem.classList.contains('bi-play-fill')) {
        isPaused = false;
        play();
    } else {
        isPaused = true;
        pause();
    }
}

function rewindIcon_clicked() {
    const currentTime = getCurrentTime();
    if(currentTime > 2) {   // Wenn der Song schon länger als 2 Sekunden läuft, an den Anfang springen
        seekTo(0);
    } else {    // Ansonsten vorherigen Song starten
        const currentVideoId = getCurrentVideoId();
        songQueue = JSON.parse(JSON.stringify(songQueueOrig));  // Original-Queue auf aktuelle Queue übertragen ohne Referenz auf das Original

        if(songQueue[0] === currentVideoId) {   // aktuell läuft der erste Song
            songQueue = songQueue.slice(-1);  // letzten Song auswählen
            startNextSong();
            return;
        } else {
            while(songQueue.length > 1) {
                if(songQueue[1] === currentVideoId) {
                    startNextSong();
                    return;
                }
                songQueue.shift();
            }

            bsAlert('Vorherigen Song nicht gefunden.', alertType.danger, false);
        }
    }
}

function onPlaying(songType) {
    console.log("Audio-Datei gestartet.", songType);

    if(isPaused) {
        pause();
    } else {
        if(!document.getElementById('volumeIcon').classList.contains('bi-volume-mute-fill')) {
            mute(false);    // Player wieder entmuten, wenn er nicht durch den User gemutet wurde
        }
    }
    if(!videoStarted) {
        videoStarted = true;
        const videoData = getVideoData();
        setSongTitle(videoData);
    }
    const playIcon = document.getElementById('playIcon');
    playIcon.classList.remove('bi-play-fill');
    playIcon.classList.add('bi-pause-fill');
}

function onPaused(songType) {
    console.log("Audio-Datei pausiert.", songType);

    if(!document.getElementById('volumeIcon').classList.contains('bi-volume-mute-fill')) {
        setTimeout(() => {  // Song ist noch nicht wirklich pausiert. Also mit Delay entmuten, damit beim Songwechsel nichts zu hören ist, wenn eigentlich pausiert ist
            mute(false);   // Player wieder entmuten, wenn pausiert wurde und nicht durch den User gemutet wurde
        }, 100);
    }
    const playIcon = document.getElementById('playIcon');
    playIcon.classList.remove('bi-pause-fill');
    playIcon.classList.add('bi-play-fill');
}

function onEnded(songType) {
    console.log("Audio-Datei fertig.", songType);

    if(songType === 'local') {
        const src = audioPlayer.src;    // Datenquelle zwischenspeichern, um sie freizugeben
        audioPlayer.src = '';   // Datenquelle entfernen
        audioPlayer.load(); // Element zurücksetzen
        audioPlayer.dataset.filename = '';  // Dateiname zurücksetzen
        URL.revokeObjectURL(src);   // Blob freigeben
        console.log("Blob-URL freigegeben.");
    }
    
    startNextSong();
}