async function importTemplates() {
    const stationsInOPFS = await doesPathExist(['station']);
    if(stationsInOPFS) {
        loadStations();
    } else {
        $.getJSON(`station/stations.json`, function(stations) {
            stationListToOPFS(stations);
        }).fail(function(){
            bsAlert(`Sender-Liste konnte nicht geladen werden.`, alertType.danger, false);
        });
    }
}

// In externen Funktion durchlaufen, da sonst die korrekte Reihenfolge nicht gegegeben ist und das Thumbnail nicht zum Inhalt passen könnte
async function loadStations() {
    const stations = await getSubdirectories('station');
    const previousStations = getLocalStorageItem('arrStations');

    let radio = await readFileFromFolder(['station', 'radio.json']);
    if(radio) {
        radio = await radio.text();
        radio = JSON.parse(radio);

        if(radio.title) {
            APP_NAME = radio.title;
        }
    }
    const navBarData = {
        appName: APP_NAME,
        localhost: (location.host === 'localhost')
    };
    await fetchAndInsertHtml('./html/navBar.html', navBarData, document.body, 'afterbegin');
    document.getElementById('selectTheme').value = getTheme();

    // Kann es oben nicht machen, weil da die Navbar noch nicht geladen ist
    if(radio) {
        if(radio.logo) {
            const logoFile = await readFileFromFolder(['station', radio.logo]);
            if(logoFile) {
                document.getElementById('favicon').setAttribute('href', URL.createObjectURL(logoFile));
                document.getElementById('navBarLogo').src = URL.createObjectURL(logoFile);
            }
        }
    }

    for (const [index, station] of stations.entries()) {
        const firstItem = index === 0;

        const dynamicData = {
            stationName: station,
            firstItem: firstItem,
            index: index,
            banner: URL.createObjectURL(await readFileFromFolder(['station', station, 'banner.png']))
        };

        await fetchAndInsertHtml('./html/station.html', dynamicData, document.getElementById('stationCarouselInner'));
        await fetchAndInsertHtml('./html/thumbnail.html', dynamicData, document.getElementById('stationCarouselIndicators'));
        
        try {
            const file = await readFileFromFolder(['station', station, 'songlist.json']);
            const text = await file.text();
            // JSON parsen
            const songs = JSON.parse(text);
            //const songs = await fetchJSON(`station/${station}/songlist.json`);
            let currentSong = songs[0].url;
            if(previousStations && previousStations.length > 0) {
                const previousStationObject = previousStations.find(stationObj => stationObj.stationName === station);
                if (previousStationObject) {
                    currentSong = previousStationObject.currentSong;
                }
            }
            const stationObject = {
                stationName: station,
                stationSongs: songs,
                currentSong: currentSong
            };
            arrStations.push(stationObject);
        } catch(error) {
            bsAlert(`Songliste von ${station} konnte nicht geladen werden.`, alertType.danger, false);
        }
    }

    await fetchAndInsertHtml('./html/controls.html', {isLocal: isLocal}, document.getElementById('stationCarouselInner'));

    for(const stationTitle of document.querySelectorAll('#stationTitle')) {
        marquee(stationTitle);
    }

    const thumbnailHeight = document.getElementById('stationCarouselIndicators').offsetHeight;
    document.querySelector('.carousel-control-prev').style.marginTop = `-${thumbnailHeight}px`;
    document.querySelector('.carousel-control-next').style.marginTop = `-${thumbnailHeight}px`;
    initYoutubePlayer();
}

// Eine Funktion, die eine HTML-Datei ausliest und einfügt
function fetchAndInsertHtml(url, data, parentElem, insertAt = 'beforeend') {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => response.text())
            .then(html => {
                // Ersetze Platzhalter mit den entsprechenden Daten
                Object.keys(data).forEach(key => {
                    const regex = new RegExp(`{${key}}`, 'g');
                    html = html.replace(regex, data[key]);
                });
                // Ersetze Anzeige/Ausblendungs-Platzhalter und steuere die Sichtbarkeit der Elemente
                Object.keys(data).forEach(key => {
                    const regex = new RegExp(`{#${key}}(.*?){/${key}}`, 'gs');
                    html = html.replace(regex, data[key] ? '$1' : '');  // Zeige oder blende das Element aus
                });

                // Füge das HTML mit ersetzen Platzhaltern ein
                parentElem.insertAdjacentHTML(insertAt, html);
                resolve();
            })
            .catch(error => {
                reject(error);
            });
    });
}

// Eine Funktion, die eine JSON-Datei ausliest und diese zurückgibt
function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
        .then(response => response.json())
        .then(json => {
            resolve(json);
        })
        .catch(error => {
            reject(error);
        });
    });
}

// Eine Funktion, die eine Datei ausliest und diese zurückgibt
function fetchFileBlob(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
        .then(response => response.blob())
        .then(file => {
            resolve(file);
        })
        .catch(error => {
            reject(error);
        });
    });
}