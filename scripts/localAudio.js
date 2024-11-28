let audioPlayer;

function initLocalAudio() {
    audioPlayer = document.getElementById('audioPlayer');

    audioPlayer.addEventListener("loadeddata", function() {
        console.log("Audio-Datei geladen.");
    });

    audioPlayer.addEventListener("play", function() {
        onPlaying('local');
    });

    audioPlayer.addEventListener("pause", function() {
        onPaused('local');
    });

    audioPlayer.addEventListener("ended", function() {
        onEnded('local');
    });

    audioPlayer.addEventListener("error", function() {
        if (audioPlayer.src === "" || audioPlayer.src === window.location.origin + window.location.pathname) {
            console.log("Ignoriere Fehler: src wurde geleert.");
        } else {
            console.error("Fehler beim Laden der Audio-Datei.", audioElement.error);
        }
        startNextSong();
    });
}

async function loadLocalFile(station, videoId, timeStamp) {
    const audioFile = await readFileFromFolder(['station', station, videoId]);
    const audioBlob = URL.createObjectURL(audioFile);
    audioPlayer.dataset.filename = videoId; // Dateiname im Audio-Element hinterlegen, um später darauf zugreifen zu können
    audioPlayer.src = audioBlob;
    audioPlayer.currentTime = timeStamp;
}