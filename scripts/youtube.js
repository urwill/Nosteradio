const initialVideoID = '_qSNa9Tlrjk';
let youtubePlayer;
let songQueueOrig = [];
let songQueue = [];
let youtubePlayerLoaded = false;
let isPaused = true;
let videoStarted = false;

function initYoutubePlayer() {
    if (document.getElementById('youtubePlayer').tagName.toLowerCase() == 'div') {	//YouTube iFrame API Script laden, wenn noch nicht geschehen
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
}

function onYouTubeIframeAPIReady() {	
	youtubePlayer = new YT.Player('youtubePlayer', {
		height: '204',
		width: '362',
		videoId: initialVideoID,
		events: {
			'onReady': onYoutubePlayerReady,
			'onStateChange': onYoutubePlayerStateChange,
			'onError': onYoutubePlayerError
		}
	});
}

function onYoutubePlayerReady(event) {
    youtubePlayerLoaded = true;
    if(stationLoaded) {
        startNextSong();
    }

    const playIcon = document.getElementById('playIcon');
    playIcon.addEventListener("click", function() {
        if(this.classList.contains('bi-play-fill')) {
            isPaused = false;
            youtubePlayer.playVideo();
        } else {
            isPaused = true;
            youtubePlayer.pauseVideo();
        }
    });

    const rewindIcon = document.getElementById('rewindIcon');
    rewindIcon.addEventListener("click", function() {
        const currentTime = youtubePlayer.getCurrentTime();
        if(currentTime > 2) {   // Wenn der Song schon länger als 2 Sekunden läuft, an den Anfang springen
            youtubePlayer.seekTo(0);
        } else {    // Ansonsten vorherigen Song starten
            const currentVideoId = getYouTubeVideoId(youtubePlayer.getVideoUrl());
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

                alert('Vorherigen Song nicht gefunden.')
            }
        }
    });

    const forwardIcon = document.getElementById('forwardIcon');
    forwardIcon.addEventListener("click", function() {
        startNextSong();
    });

    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.getElementById('volumeIcon');
    const initialVolume = 50;
    volumeSlider.value = initialVolume;
    
    // Ändern der Lautstärke, wenn der Slider bewegt wird
    volumeSlider.addEventListener('input', function() {
        let volume = parseInt(this.value);

        youtubePlayer.setVolume(volume);
        if(volume > 0) {
            youtubePlayer.unMute();   // Player wieder unmuten, falls er beim Songwechsel gemutet und wegen User-Einstellungen nicht entmutet wurde
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

function onYoutubePlayerStateChange(event) {
    const playIcon = document.getElementById('playIcon');

	switch(event.data) {
		case YT.PlayerState.PLAYING:
            if(isPaused) {
                event.target.pauseVideo();
            } else {
                if(!document.getElementById('volumeIcon').classList.contains('bi-volume-mute-fill')) {
                    youtubePlayer.unMute();   // Player wieder entmuten, wenn er nicht durch den User gemutet wurde
                }
            }
            if(!videoStarted) {
                videoStarted = true;
                setSongTitle(event.target.getVideoData());
            }
            playIcon.classList.remove('bi-play-fill');
            playIcon.classList.add('bi-pause-fill');
			break;
		case YT.PlayerState.PAUSED:
            if(!document.getElementById('volumeIcon').classList.contains('bi-volume-mute-fill')) {
                setTimeout(() => {  // Song ist noch nicht wirklich pausiert. Also mit Delay entmuten, damit beim Songwechsel nichts zu hören ist, wenn eigentlich pausiert ist
                    youtubePlayer.unMute();   // Player wieder entmuten, wenn pausiert wurde und nicht durch den User gemutet wurde
                }, 100);
                
            }
            playIcon.classList.remove('bi-pause-fill');
            playIcon.classList.add('bi-play-fill');
			break;
		case YT.PlayerState.ENDED:
            /*playIcon.classList.remove('bi-pause-fill');
            playIcon.classList.add('bi-play-fill');*/
            startNextSong();
			break;
	}
}

function onYoutubePlayerError(event) {
	
}

function startNextSong(timeStamp = 0) {
    const activeSlide = document.getElementById('stationCarousel').querySelector('.carousel-item.active');
    activeSlide.querySelector('#currentSong').innerHTML = 'Loading...';

    if(songQueue.length > 0) {
        const videoId = songQueue.shift();
        videoStarted = false;
        youtubePlayer.mute();   // Player muten, damit im pausierten Zustand der Song nicht erst kurz beginnt bevor er pausiert wird
        youtubePlayer.loadVideoById(videoId, timeStamp);
    } else {
        //alert('Radio leer');
        //nextStation();
        songQueue = JSON.parse(JSON.stringify(songQueueOrig));  // Original-Queue auf aktuelle Queue übertragen ohne Referenz auf das Original
        startNextSong();
    }
}

function getYouTubeVideoId(url) {
    console.log(url);
	//const match = url.match(/(?:watch\?v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    const match = url.match(/(?:watch\?.*?&?v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}