let isStorageAvailable = false;

$(document).ready(function() { 
    checkPermissions();
    importTemplates();
    initCarousel();
});

function checkPermissions() {
    if (storageAvailable("localStorage")) {
        isStorageAvailable = true;
    } else {
        console.log('localStorage nicht verfügbar', 'Damit die Anwendung ordnungsgemäß funktioniert, muss localStorage verfügbar sein.<br><br>Aktivieren Sie localStorage in Ihrem Browser und klicken Sie dann auf "OK" oder verwenden Sie einen anderen Browser.');
    }
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