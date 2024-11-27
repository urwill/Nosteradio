const isLocal = location.host + location.pathname === 'localhost/apps/Nosteradio/';
let testYoutubePlayer;
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
    allSongs = [];

    for(const stationObject of arrStations) {
        if (stationObject) {
            for(const song of stationObject.stationSongs) {
                allSongs.push(getYouTubeVideoId(song.url));
            }
        }
    }

    if(allSongs.length > 0) {
        songCount = allSongs.length;
        await startProcessing();
        const videoId = allSongs.shift();
        testYoutubePlayer.mute();
        testYoutubePlayer.loadVideoById(videoId);
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

async function testNextSong() {
    await updateProgress(songCount - allSongs.length - 1, songCount);
    if(allSongs.length > 0) {
        const videoId = allSongs.shift();
        testYoutubePlayer.loadVideoById(videoId);
    } else {
        testYoutubePlayer.pauseVideo();
        bsAlert('Prüfung abgeschlossen', alertType.success);
    }
}