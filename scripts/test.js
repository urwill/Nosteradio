const isLocal = location.host + location.pathname === 'localhost/apps/Nosteradio/';
let testYoutubePlayer;
let allSongs = [];

async function test() {
    //readFileFromFolder(['myRadio', 'Logo.png']);
    //await clearDirectory();
    await listDirectory();
    getSubdirectories('station');
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

function onTestYoutubePlayerReady(event) {
    allSongs = [];

    for(const stationObject of arrStations) {
        if (stationObject) {
            for(const song of stationObject.stationSongs) {
                allSongs.push(getYouTubeVideoId(song.url));
            }
        }
    }

    if(allSongs.length > 0) {
        const videoId = allSongs.shift();
        testYoutubePlayer.mute();
        testYoutubePlayer.loadVideoById(videoId);
    } else {
        alert('Keine Songs vorhanden.');
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
        alert(`Song konnte nicht geladen werden:\n${title}${artist}Link: https://youtube.com/watch?v=${videoId}`);
    } else {
        alert(`Song konnte nicht geladen werden: https://youtube.com/watch?v=${videoId}`);
    }
    testNextSong();
}

function testNextSong() {
    if(allSongs.length > 0) {
        const videoId = allSongs.shift();
        testYoutubePlayer.loadVideoById(videoId);
    } else {
        testYoutubePlayer.pauseVideo();
        alert('Fertig.');
    }
}