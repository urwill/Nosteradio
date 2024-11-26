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
                await clearDirectory(); // Vorherige Einträge löschen, falls vorhanden
                await zipToOPFS(file, 'station');
                console.log('test');
                break;
            default:
                console.error('Nicht unterstützte Dateiendung:', fileExtension);
        }
    } catch (error) {
        console.error(error);
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
            alert(`Sender ${station} konnte nicht geladen werden.`);
        }
    }
}