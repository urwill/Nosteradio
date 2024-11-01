function importTemplates() {
    if(location.host + location.pathname === 'localhost/apps/Nosteradio/') {
        $.ajax({
            url: "station",
            success: function(data){
                console.log(data);
                let stations = [];

                $(data).find("img[alt='[DIR]']").closest("tr").find("a").each(function() {
                    const stationName = decodeURI($(this).attr('href')).replace('/', '');
                    stations.push(stationName);
                }).promise().done(function() {
                    if(isStorageAvailable) {
                        const storageStations = getLocalStorageItem('stations');
                        if(JSON.stringify(stations) !== JSON.stringify(storageStations)) {
                            setLocalStorageItem('stations', stations);
                            const blob = new Blob([JSON.stringify(stations)], { type: "text/json" });
                            downloadFile(blob, 'stations.json');
                        }
                    } else {
                        downloadFile(blob, 'stations.json');
                    }
                    loadStations(stations);
                });
            }
        });
    } else {
        $.getJSON(`station/stations.json`, function(stations){
            loadStations(stations);
        }).fail(function(){
            alert(`Stations-Liste konnte nicht geladen werden.`)
        });
    }
}

// In externen Funktion durchlaufen, da sonst die korrekte Reihenfolge nicht gegegeben ist und das Thumbnail nicht zum Inhalt passen könnte
async function loadStations(stations) {
    const previousStations = getLocalStorageItem('arrStations');

    for (const [index, station] of stations.entries()) {
        const firstItem = index === 0;

        const dynamicData = {
            stationName: station,
            firstItem: firstItem,
            index: index
        };

        await fetchAndInsertHtml('./html/station.html', dynamicData, document.getElementById('stationCarouselInner'));
        await fetchAndInsertHtml('./html/thumbnail.html', dynamicData, document.getElementById('stationCarouselIndicators'));
        
        try {
            const songs = await fetchJSON(`station/${station}/songlist.json`);
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
            alert(`Songliste von ${station} konnte nicht geladen werden.`);
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
function fetchAndInsertHtml(url, data, parentElem) {
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
                parentElem.insertAdjacentHTML('beforeend', html);
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