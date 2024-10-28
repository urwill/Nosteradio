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

    const playIcons = document.querySelectorAll('#playIcon');
    for(const playIcon of playIcons) {
        playIcon.addEventListener("click", function() {
            if(this.classList.contains('bi-play-fill')) {
                isPaused = false;
                youtubePlayer.playVideo();
            } else {
                isPaused = true;
                youtubePlayer.pauseVideo();
            }
        });
    }

    const rewindIcons = document.querySelectorAll('#rewindIcon');
    for(const rewindIcon of rewindIcons) {
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
    }

    const forwardIcons = document.querySelectorAll('#forwardIcon');
    for(const forwardIcon of forwardIcons) {
        forwardIcon.addEventListener("click", function() {
            startNextSong();
        });
    }

    const volumeSliders = document.querySelectorAll('#volumeSlider');
    const volumeIcons = document.querySelectorAll('#volumeIcon');

    for(const volumeSlider of volumeSliders) {
        const initialVolume = 50;
        volumeSlider.value = initialVolume;
        
        // Ändern der Lautstärke, wenn der Slider bewegt wird
        volumeSlider.addEventListener('input', function() {
            let volume = parseInt(this.value);

            for(const volumeSlider of volumeSliders) {
                volumeSlider.value = volume;    // Wert an die Slider in den anderen Carousel Tabs übertragen
            }

            youtubePlayer.setVolume(volume);
            if(volume > 0) {
                youtubePlayer.unMute();   // Player wieder unmuten, falls er beim Songwechsel gemutet und wegen User-Einstellungen nicht entmutet wurde
            }

            switch (true) {
                case (volume === 0):
                    for(const volumeIcon of volumeIcons) {
                        volumeIcon.className = 'playerControl bi bi-volume-mute-fill';
                    }
                    break;
                case (volume > 50):
                    for(const volumeIcon of volumeIcons) {
                        volumeIcon.className = 'playerControl bi bi-volume-up-fill';
                    }
                    break;
                default:
                    for(const volumeIcon of volumeIcons) {
                        volumeIcon.className = 'playerControl bi bi-volume-down-fill';
                    }
                    break;
            }
        });
    }

	// Mute/Unmute, wenn man auf das Icon klickt
    for(const volumeIcon of volumeIcons) {
        volumeIcon.addEventListener('click', function() {
            let volume = parseInt(volumeSliders[0].value);
            
            if(volume === 0) {
                for(const volumeSlider of volumeSliders) {
                    volumeSlider.value = volumeSlider.oldvalue;
                }
            } else {
                for(const volumeSlider of volumeSliders) {
                    volumeSlider.oldvalue = volume;
                    volumeSlider.value = 0;
                }
            }

            volumeSliders[0].dispatchEvent(new Event('input'));
        });
    }
}

function onYoutubePlayerStateChange(event) {
    const playIcons = document.querySelectorAll('#playIcon');

	switch(event.data) {
		case YT.PlayerState.PLAYING:
            if(isPaused) {
                event.target.pauseVideo();
            } else {
                if(!document.querySelectorAll('#volumeIcon')[0].classList.contains('bi-volume-mute-fill')) {
                    youtubePlayer.unMute();   // Player wieder entmuten, wenn er nicht durch den User gemutet wurde
                }
            }
            if(!videoStarted) {
                videoStarted = true;
                setSongTitle(event.target.getVideoData());
            }
            for(const playIcon of playIcons) {
                playIcon.classList.remove('bi-play-fill');
                playIcon.classList.add('bi-pause-fill');
            }
			break;
		case YT.PlayerState.PAUSED:
            if(!document.querySelectorAll('#volumeIcon')[0].classList.contains('bi-volume-mute-fill')) {
                setTimeout(() => {  // Song ist noch nicht wirklich pausiert. Also mit Delay entmuten, damit beim Songwechsel nichts zu hören ist, wenn eigentlich pausiert ist
                    youtubePlayer.unMute();   // Player wieder entmuten, wenn pausiert wurde und nicht durch den User gemutet wurde
                }, 100);
                
            }
            for(const playIcon of playIcons) {
                playIcon.classList.remove('bi-pause-fill');
                playIcon.classList.add('bi-play-fill');
            }
			break;
		case YT.PlayerState.ENDED:
            /*for(const playIcon of playIcons) {
                playIcon.classList.remove('bi-pause-fill');
                playIcon.classList.add('bi-play-fill');
            }*/
            startNextSong();
			break;
	}
}

function onYoutubePlayerError(event) {
	
}

function startNextSong(timeStamp = 0) {
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