let youtubePlayer;
let songQueueOrig = [];
let songQueue = [];
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
		events: {
			'onReady': onYoutubePlayerReady,
			'onStateChange': onYoutubePlayerStateChange,
			'onError': onYoutubePlayerError
		}
	});
}

function onYoutubePlayerReady(event) {
    initStation();
}

function onYoutubePlayerStateChange(event) {
	switch(event.data) {
		case YT.PlayerState.PLAYING:
            onPlaying('youtube');
			break;
		case YT.PlayerState.PAUSED:
            onPaused('youtube');
			break;
		case YT.PlayerState.ENDED:
            onEnded('youtube');
			break;
	}
}

function onYoutubePlayerError(event) {
	startNextSong();    // Es wird zwar vorab geprüft, dass jeder Song funktioniert, aber wenn sich nachträglich etwas ändert, nicht abspielbare Songs überspringen
}

function getYouTubeVideoId(url) {
	//const match = url.match(/(?:watch\?v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    const match = url.match(/(?:watch\?.*?&?v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}