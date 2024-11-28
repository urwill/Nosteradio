const isLocal = location.host + location.pathname === 'localhost/apps/Nosteradio/';
let testYoutubePlayer;
let testAudioPlayer;
let allSongs = [];
let songCount = 0;

async function test() {
    //readFileFromFolder(['myRadio', 'Logo.png']);
    //await clearDirectory(['station', 'MCM']);
    await listDirectory();
    //const file = await readFileFromFolder(['station', 'Test', 'songlist.json']);
    //getSubdirectories('station');
}

function testLinks() {
    if(!testAudioPlayer) {
        testAudioPlayer = document.getElementById('testAudioPlayer');
        testAudioPlayer.muted = true;
        testAudioPlayer.addEventListener("play", function() {
            testNextSong();
        });
        testAudioPlayer.addEventListener("error", function() {
            onTestAudioPlayerError();
        });
    }

    if(testYoutubePlayer) {
        onTestYoutubePlayerReady();
    } else {
        testYoutubePlayer = new YT.Player('testYoutubePlayer', {
            events: {
                'onReady': onTestYoutubePlayerReady,
                'onStateChange': onTestYoutubePlayerStateChange,
                'onError': onTestYoutubePlayerError
            }
        });
    }
}

async function onTestYoutubePlayerReady(event) {
    testYoutubePlayer.mute();

    allSongs = [];

    for(const stationObject of arrStations) {
        if (stationObject) {
            for(const song of stationObject.stationSongs) {
                const videoId = getVideoId(getSong(song));
                if(videoId.includes('.')) { // Wenn es einen Punkt hat, ist es ein Dateiname und keine Youtube VideoId
                    allSongs.push(`${stationObject.stationName}/${videoId}`);
                } else {
                    allSongs.push(videoId);
                }
            }
        }
    }

    if(allSongs.length > 0) {
        songCount = allSongs.length;
        await startProcessing();
        testNextSong();
    } else {
        bsAlert('Keine Songs vorhanden.', alertType.info, false);
    }
}

function onTestYoutubePlayerStateChange(event) {
	switch(event.data) {
		case YT.PlayerState.PLAYING:
            testNextSong();
			break;
		case YT.PlayerState.PAUSED:
			break;
		case YT.PlayerState.ENDED:
			break;
	}
}

function onTestYoutubePlayerError(event) {
    let foundId = false;
    let title = '';
    let artist = '';
    const videoId = event.target.getVideoData().video_id;

loop1:
    for(const stationObject of arrStations) {
        if (stationObject) {
loop2:
            for(const song of stationObject.stationSongs) {
                if(getYouTubeVideoId(song.url) === videoId) {
                    if(song.title) {
                        title = `Titel: ${song.title}\n`;
                    }
                    if(song.artist) {
                        artist = `Interpret: ${song.artist}\n`;
                    }
                    foundId = true;
                    break loop1;
                }
            }
        }
    }

    if(foundId) {
        bsAlert(`Song konnte nicht geladen werden:\n${title}${artist}Link: https://youtube.com/watch?v=${videoId}`, alertType.danger, false);
    } else {
        bsAlert(`Song konnte nicht geladen werden: https://youtube.com/watch?v=${videoId}`, alertType.danger, false);
    }
    testNextSong();
}

function onTestAudioPlayerError() {
    let foundId = false;
    let title = '';
    let artist = '';
    const videoId = testAudioPlayer.dataset.filename;

loop1:
    for(const stationObject of arrStations) {
        if (stationObject) {
loop2:
            for(const song of stationObject.stationSongs) {
                if(song.fileName === videoId) {
                    if(song.title) {
                        title = `Titel: ${song.title}\n`;
                    }
                    if(song.artist) {
                        artist = `Interpret: ${song.artist}\n`;
                    }
                    foundId = true;
                    break loop1;
                }
            }
        }
    }

    if(foundId) {
        bsAlert(`Song konnte nicht geladen werden:\n${title}${artist}Dateiname: ${videoId}`, alertType.danger, false);
    } else {
        bsAlert(`Song konnte nicht geladen werden: ${videoId}`, alertType.danger, false);
    }
    testNextSong();
}

async function testNextSong() {
    if(allSongs.length > 0) {
        const videoId = allSongs.shift();
        if(videoId.includes('/')) { // Wenn es einen Slash hat, ist es ein Dateiname und keine Youtube VideoId
            const stationSong = videoId.split('/');
            testAudioPlayer.dataset.filename = stationSong[1]; // Dateiname im Audio-Element hinterlegen, um später darauf zugreifen zu können
            const audioFile = await readFileFromFolder(['station', stationSong[0], stationSong[1]]);
            if(audioFile) {
                const audioBlob = URL.createObjectURL(audioFile);
                testAudioPlayer.src = audioBlob;
            } else {
                onTestAudioPlayerError();
            }
        } else {
            testYoutubePlayer.loadVideoById(videoId);
        }
    } else {
        testYoutubePlayer.pauseVideo();
        testAudioPlayer.pause();
        bsAlert('Prüfung abgeschlossen', alertType.success);
    }
    await updateProgress(songCount - allSongs.length - 1, songCount);
}