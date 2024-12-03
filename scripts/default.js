const DEFAULT_APP_NAME = 'Nosteradio';
let APP_NAME = DEFAULT_APP_NAME;

$(document).ready(function() {
    startUp();
});

async function  startUp() {
    const hasPermissions = await checkPermissions();
    if(!hasPermissions) {
        return;
    }
    loadTheme();
    initLocalAudio();
    importTemplates();
    initCarousel();

    window.addEventListener("beforeunload", function(e){
        saveCurrentSong();  // Aktuellen Song und Position speichern
        setLocalStorageItem('arrStations', arrStations);    // Speichern, um beim Start wieder auszulesen bei welchem Song und an welcher Stelle man war
        const activeSlide = document.getElementById('stationCarousel').querySelector('.carousel-item.active');
        const station = activeSlide.querySelector('#stationTitle').getAttribute('data-title');
        setLocalStorageItem('activeStation', station);  // Speichern, um beim Start wieder auszulesen bei welchem Sender
        let volume = parseInt(document.getElementById('volumeSlider').value);
        if(volume === 0) {
            volume = parseInt(document.getElementById('volumeSlider').oldvalue); // Falls der Player gemutet ist, die vorherige Lautstärke auslesen, um Verwirrung beim Start zu verhindern
        }
        setLocalStorageItem('currentVolume',  volume);  // Speichern, um die Lautstärke beim Start wieder auszulesen
     });
}

async function checkPermissions() {
    let isStorageAvailable = false;
    let isOPFSAvailable = false;

    if (storageAvailable("localStorage")) {
        isStorageAvailable = true;
    } else {
        //console.log('localStorage nicht verfügbar', 'Damit die Anwendung ordnungsgemäß funktioniert, muss localStorage verfügbar sein.<br><br>Aktivieren Sie localStorage in Ihrem Browser und klicken Sie dann auf "OK" oder verwenden Sie einen anderen Browser.');
        bsAlert('Damit die Anwendung ordnungsgemäß funktioniert, muss localStorage verfügbar sein.<br><br>Aktivieren Sie localStorage in Ihrem Browser und laden Sie die Seite dann neu oder verwenden Sie einen anderen Browser.', alertType.danger, false);
    }

    if (await supportsOPFS()) {
        isOPFSAvailable = true;
    } else {
        //console.log('Origin private file system nicht verfügbar', 'Damit die Anwendung ordnungsgemäß funktioniert, muss Origin private file system verfügbar sein.<br><br>Aktivieren Sie Origin private file system in Ihrem Browser und klicken Sie dann auf "OK" oder verwenden Sie einen anderen Browser.<br><br>Falls Sie den Browser im privaten Modus verwenden, könnte auch das das Problem sein.');
        bsAlert('Damit die Anwendung ordnungsgemäß funktioniert, muss Origin private file system verfügbar sein.<br><br>Aktivieren Sie Origin private file system in Ihrem Browser und laden Sie die Seite dann neu oder verwenden Sie einen anderen Browser.<br><br>Falls Sie den Browser im privaten Modus verwenden, könnte auch das das Problem sein.', alertType.danger, false);
    }

    return isStorageAvailable && isOPFSAvailable;
}

function downloadFile(blob, fileName) {
	// Erstelle einen Download-Link für die Blob-Daten
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = fileName;

	// Füge den Link zum Dokument hinzu und klicke ihn an, um den Download zu starten
	document.body.appendChild(link);
	link.click();

	// Entferne den Link aus dem Dokument
	document.body.removeChild(link);
}

function getParam(paramName, link = window.location) {
    const url = new URL(link);
    const urlParams = new URLSearchParams(url.search);
    const paramValue = urlParams.get(paramName);

    return paramValue;
}

function marquee(elem) {
    const gap = 0.3;
    const textWidth = elem.scrollWidth;
    const containerWidth = elem.clientWidth;
    const overflowWidth = textWidth - containerWidth;
    if (overflowWidth > 0) {
        elem.innerHTML = `<span>${elem.innerHTML}</span><span style="margin-left: ${gap * 100}%;">${elem.innerHTML}</span>`;
        const newTextWidth = elem.scrollWidth;

        const speed = 200; // Pixels per second
        const animationDuration = newTextWidth / speed;

        elem.style.animation = `scroll-left-${elem.id} ${animationDuration}s linear infinite`;

        // Dynamisches Keyframe-Stylesheet hinzufügen
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = `
            @keyframes scroll-left-${elem.id} {
                0% {
                    transform: translateX(0px);
                }
                100% {
                    transform: translateX(-${textWidth + (containerWidth * gap)}px);
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }
}

function removeMarquee(elem) {
    elem.style.animation = 'none';
}