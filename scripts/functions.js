function uploadFile(callbackFunction, acceptedExtension = '*') {
	// Erstellen Sie ein unsichtbares <input type="file"> Element
	const fileInput = document.createElement('input');
	fileInput.type = 'file';
	fileInput.style.display = 'none';
	fileInput.accept = acceptedExtension;

	// Fügen Sie das Element zum Dokument hinzu
	document.body.appendChild(fileInput);

	// Fügen Sie einen Event-Listener für die Änderung des Datei-Eingabe-Elements hinzu
	fileInput.addEventListener('change', function (event) {
		const selectedFile = event.target.files[0];

		if (selectedFile) {
			callbackFunction(selectedFile);
		} else {
			console.error('Es wurde keine Datei ausgewählt.');
		}

		// Entfernen Sie das Datei-Eingabe-Element nach der Auswahl der Datei
		document.body.removeChild(fileInput);
	});

	// Klicken Sie auf das unsichtbare Datei-Eingabe-Element, um den Datei-Auswahldialog zu öffnen
	fileInput.click();
}

async function importRadio(file) {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    try {
        switch (fileExtension) {
            case 'zip':
                await clearDirectory(['station']); // Vorherige Einträge löschen, falls vorhanden
                await zipToOPFS(file, 'station');
                reloadPage();   // Seite neu laden, um vorhandene Sender zurückzusetzen. Die neuen Sender werden dann aus dem OPFS ausgelesen
                break;
            default:
                bsAlert(`Nicht unterstützte Dateiendung: ${fileExtension}`, alertType.danger, false);
        }
    } catch (error) {
        console.error(error);
        bsAlert(`Error: ${error.message}`, alertType.danger, false);
    }
}

async function zipToOPFS(file, rootDirectory) {
    if (rootDirectory) {
        rootDirectory += '/';
    } else {
        await createFolder(rootDirectory);
        rootDirectory = '';
    }
    
    try {
        const blobReader = new zip.BlobReader(file);
        const zipReader = new zip.ZipReader(blobReader);
        const entries = await zipReader.getEntries();

        for (const entry of entries) {
            if (!entry.directory) {
                // Entpacke Datei
                const blob = await entry.getData(new zip.BlobWriter());

                // Speichere Datei im OPFS
                const pathParts = (rootDirectory + entry.filename).split("/");
                await saveFileToFolder(pathParts, blob);
            }
        }

        await zipReader.close();
        console.log("Alle Dateien gespeichert!");
    } catch (error) {
        console.error("Fehler beim Speichern:", error);
        bsAlert(`Fehler beim Lesen der Datei: ${error.message}`, alertType.danger, false);
    }
}

async function stationListToOPFS(stations) {
    await createFolder('station');

    for (const [index, station] of stations.entries()) {        
        try {
            const songslist = await fetchFileBlob(`station/${station}/songlist.json`);
            const banner = await fetchFileBlob(`station/${station}/banner.png`);

            await saveFileToFolder(['station', station, 'songlist.json'], songslist);
            await saveFileToFolder(['station', station, 'banner.png'], banner);
            
        } catch(error) {
            bsAlert(`Sender ${station} konnte nicht geladen werden.`, alertType.danger, false);
        }
    }

    loadStations();
}

function reloadPage() {
	// Seite neu laden
	//location.reload();
	location.href = location;
}

function showModal(modalId) {
	return new Promise((resolve) => {
		const modalElement = document.getElementById(modalId);

		modalElement.addEventListener('shown.bs.modal', () => {
			resolve();
		})

		const modal = new bootstrap.Modal(modalElement);
		modal.show();
	});
}

function hideModal(modalId) {
	return new Promise((resolve) => {
		const modalElement = document.getElementById(modalId);

		modalElement.addEventListener('hidden.bs.modal', () => {
			resolve();
		})

		//const modal = new bootstrap.Modal(modalElement);	// funktioniert nicht. Vermutlich weil das Modal durch showModal schon existiert
		const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
		modal.hide();
	});
}

async function generateSonglist(file) {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    try {
        switch (fileExtension) {
            case 'zip':
                await clearDirectory(['songlist']); // Vorherige Einträge löschen, falls vorhanden
                await zipToOPFS(file, 'songlist');
                const songFiles = await getDirectoryFiles('songlist');
                const songlist = [];
                for(const songFile of songFiles) {
                    if (songFile.match(/\.(mp3|mp4|flac)$/i)) {
                        try {
                            const metadata = await getAudioMetadata(await readFileFromFolder(['songlist', songFile]));
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
                console.log('songlist', songlist);
                const blob = new Blob([JSON.stringify(songlist, null, 2)], { type: "text/json" });
                downloadFile(blob, 'songlist.json');
                break;
            default:
                bsAlert(`Nicht unterstützte Dateiendung: ${fileExtension}`, alertType.danger, false);
        }
    } catch (error) {
        console.error(error);
        bsAlert(`Error: ${error.message}`, alertType.danger, false);
    }
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