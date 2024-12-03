let songlistYoutubePlayer;
let songlistVideoIds = [];
let songlist = [];

async function generateSonglist(file) {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    try {
        switch (fileExtension) {
            case 'zip':
                await generateSonglistLocal(file);
                break;
            case 'txt':
                await generateSonglistYoutube(file);
                break;
            default:
                bsAlert(`Nicht unterstützte Dateiendung: ${fileExtension}`, alertType.danger, false);
        }
    } catch (error) {
        console.error(error);
        bsAlert(`Error: ${error.message}`, alertType.danger, false);
    }
}

async function generateSonglistLocal(file) {
    await clearDirectory(['songlist']); // Vorherige Einträge löschen, falls vorhanden
    await zipToOPFS(file, 'songlist');
    let subFolders = await getSubdirectories('songlist');
    if(subFolders.length === 0)
    {
        subFolders = ['songlist'];
    } else {
        for(let i = 0; i < subFolders.length; i++) {
            subFolders[i] = 'songlist/' + subFolders[i];
        }
    }
    for(const subFolder of subFolders) {
        const songFiles = await getDirectoryFiles(subFolder);
        songlist = [];
        for(const songFile of songFiles) {
            if (songFile.match(/\.(mp3|mp4|flac)$/i)) {
                try {
                    const metadata = await getAudioMetadata(await readFileFromFolder([subFolder, songFile]));
                    const song = {
                        fileName: songFile,
                        artist: metadata.artist || "",  // Falls kein Künstler vorhanden ist
                        title: metadata.title || songFile.replace(/\.[^/.]+$/, "")   // Falls kein Titel vorhanden ist, Dateinamen nehmen
                    };
                    songlist.push(song);
                } catch (error) {
                    console.error("Fehler beim Auslesen der Metadaten für " + songFile, error);
                }
            }
        }
        console.log(subFolder, songlist);
        const blob = new Blob([JSON.stringify(songlist, null, 2)], { type: "text/json" });
        downloadFile(blob, `${subFolder.replace('/', '_')}.json`);
    }
}

async function generateSonglistYoutube(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;

        // Regex für YouTube-VideoId
        const youtubeRegex = /(?:watch\?.*?&?v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/g;

        // Links extrahieren
        const matches = [...content.matchAll(youtubeRegex)];

        // Nur die VideoIds ins Array packen
        songlistVideoIds = matches.map(match => match[1]);
        console.log(songlistVideoIds);

        if(songlistYoutubePlayer) {
            onSonglistYoutubePlayerReady();
        } else {
            songlistYoutubePlayer = new YT.Player('songlistYoutubePlayer', {
                events: {
                    'onReady': onSonglistYoutubePlayerReady,
                    'onStateChange': onSonglistYoutubePlayerStateChange,
                    'onError': onSonglistYoutubePlayerError
                }
            });
        }
    };

    reader.onerror = function() {
        bsAlert('Fehler beim Lesen der Datei.', alertType.danger, false);
    };

    reader.readAsText(file);
}

async function onSonglistYoutubePlayerReady(event) {
    songlistYoutubePlayer.mute();

    if(songlistVideoIds.length > 0) {
        songCount = songlistVideoIds.length;
        await startProcessing();
        songlist = [];
        songlistNextSong();
    } else {
        bsAlert('Keine Youtube-Links gefunden.', alertType.info, false);
    }
}

function onSonglistYoutubePlayerStateChange(event) {
	switch(event.data) {
		case YT.PlayerState.PLAYING:
            const videoData = songlistYoutubePlayer.getVideoData();
            const song = {
                url: `https://www.youtube.com/watch?v=${videoData.video_id}`,
                artist: videoData.author,
                title: videoData.title
            };
            songlist.push(song);

            songlistNextSong();
			break;
		case YT.PlayerState.PAUSED:
			break;
		case YT.PlayerState.ENDED:
			break;
	}
}

function onSonglistYoutubePlayerError(event) {
    const videoId = event.target.getVideoData().video_id;
    bsAlert(`Song konnte nicht geladen werden: https://youtube.com/watch?v=${videoId}`, alertType.danger, false);
    songlistNextSong();
}

async function songlistNextSong() {
    if(songlistVideoIds.length > 0) {
        const videoId = songlistVideoIds.shift();
        songlistYoutubePlayer.loadVideoById(videoId);
    } else {
        songlistYoutubePlayer.pauseVideo();
        console.log('songlist', songlist);
        const blob = new Blob([JSON.stringify(songlist, null, 2)], { type: "text/json" });
        downloadFile(blob, 'songlist.json');
    }
    await updateProgress(songCount - songlistVideoIds.length - 1, songCount);
}

// Funktion zum Auslesen der Audiodateimetadaten mit jsmediatags
function getAudioMetadata(file) {
    return new Promise((resolve, reject) => {
        new jsmediatags.Reader(file).read({
            onSuccess: function(tag) {
                const metadata = tag.tags;
                resolve(metadata);  // Gibt die Metadaten zurück
            },
            onError: function(error) {
                reject(error);  // Gibt einen Fehler zurück, wenn das Auslesen der Metadaten nicht klappt
            }
        });
    });
}

async function readID3v1Tags(file) {
    try {
        // Letzte 128 Bytes der Datei lesen
        const fileSize = file.size;
        const start = fileSize - 128;
        const end = fileSize;

        // Datei mit FileReader als ArrayBuffer laden
        const arrayBuffer = await file.slice(start, end).arrayBuffer();
        const view = new DataView(arrayBuffer);

        // Prüfen, ob ein ID3v1-Tag vorhanden ist
        const tag = new TextDecoder().decode(view.buffer.slice(0, 3));
        if (tag !== "TAG") {
            console.warn("Keine ID3v1-Tags gefunden.");
            return null;
        }

        // Felder auslesen
        const title = new TextDecoder().decode(view.buffer.slice(3, 33)).replace(/\u0000/g, "").trim();
        const artist = new TextDecoder().decode(view.buffer.slice(33, 63)).replace(/\u0000/g, "").trim();
        const album = new TextDecoder().decode(view.buffer.slice(63, 93)).replace(/\u0000/g, "").trim();
        const year = new TextDecoder().decode(view.buffer.slice(93, 97)).replace(/\u0000/g, "").trim();

        // Ergebnisse zurückgeben
        return {
            title: title || "Unbekannter Titel",
            artist: artist || "Unbekannter Künstler",
            album: album || "Unbekanntes Album",
            year: year || "Unbekanntes Jahr",
        };
    } catch (error) {
        console.error("Fehler beim Lesen der ID3v1-Tags:", error);
        return null;
    }
}