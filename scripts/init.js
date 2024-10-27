function importTemplates() {
    /*$.ajax({
        url: "station",
        success: function(data){
            let stations = [];

            $(data).find('a[href]').filter(function() {
                return $(this).attr("href") === $(this).text();
            }).each(function(index) {
                const stationURL = $(this).attr("href");
                const stationName = stationURL.slice(0, -1);
                stations.push(stationName);
            }).promise().done(loadStations(stations));
        }
    });*/

    let stations = ['MCM', 'Ranzmusik', 'rAIdo'];
    loadStations(stations);
}

// In externen Funktion durchlaufen, da sonst die korrekte Reihenfolge nicht gegegeben ist und das Thumbnail nicht zum Inhalt passen könnte
async function loadStations(stations) {
    for (const [index, station] of stations.entries()) {
        const firstItem = index === 0;

        const dynamicData = {
            stationName: station,
            firstItem: firstItem,
            index: index
        };

        await fetchAndInsertHtml('./html/station.html', dynamicData, document.getElementById('stationCarouselInner'));
        await fetchAndInsertHtml('./html/thumbnail.html', dynamicData, document.getElementById('stationCarouselIndicators'));
    
        $.getJSON(`station/${station}/songlist.json`, function(songs){
            const stationObject = {
                stationName: station,
                stationSongs: songs
            };
            arrStations.push(stationObject);
            if(firstItem) {
                startStation(station);
            }
        }).fail(function(){
            alert(`Songliste von ${station} konnte nicht geladen werden.`)
        });
    }
}

// Eine Funktion, die eine HTML-Datei holt und einfügt
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