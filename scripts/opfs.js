async function saveFileToOPFS(fileName, blob) {
    // Zugriff auf den Root-Ordner des OPFS
    const root = await navigator.storage.getDirectory();

    // Datei erstellen oder öffnen
    const fileHandle = await root.getFileHandle(fileName, { create: true });

    // Datei schreiben
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();

    console.log(`Datei ${fileName} gespeichert.`);
}

async function readFileFromOPFS(fileName) {
    // Zugriff auf den Root-Ordner des OPFS
    const root = await navigator.storage.getDirectory();

    // Datei öffnen
    const fileHandle = await root.getFileHandle(fileName);
    const file = await fileHandle.getFile();

    console.log(`Datei ${fileName} gelesen.`);
    return file;
}

async function saveFileToFolder(pathParts, blob) {
    let currentDir = await navigator.storage.getDirectory();

    // Ordnerstruktur durchlaufen
    for (let i = 0; i < pathParts.length - 1; i++) {
        currentDir = await currentDir.getDirectoryHandle(pathParts[i], { create: true });
    }

    // Datei im letzten Ordner speichern
    const fileHandle = await currentDir.getFileHandle(pathParts.at(-1), { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
}

async function readFileFromFolder(pathParts) {
    let currentDir = await navigator.storage.getDirectory();

    // Ordnerstruktur durchlaufen
    for (let i = 0; i < pathParts.length - 1; i++) {
        currentDir = await currentDir.getDirectoryHandle(pathParts[i]);
    }

    // Datei im letzten Ordner abrufen
    const fileHandle = await currentDir.getFileHandle(pathParts.at(-1));
    const file = await fileHandle.getFile();

    console.log(`Datei ${pathParts.join("/")} gelesen.`);
    return file;
}

async function createFolder(folderName, directoryHandle = null) {
    if (!directoryHandle) {
        directoryHandle = await navigator.storage.getDirectory();
    }

    directoryHandle = await directoryHandle.getDirectoryHandle(folderName, { create: true });
    return directoryHandle;
}

async function doesPathExist(pathParts) {
    try {
        let currentDir = await navigator.storage.getDirectory();
        for (const part of pathParts) {
            currentDir = await currentDir.getDirectoryHandle(part);
        }
        return true; // Pfad existiert
    } catch (error) {
        if (error.name === "NotFoundError") {
            return false; // Pfad existiert nicht
        }
    }
}

async function listDirectory(directoryHandle = null, path = "") {
    // Falls kein Handle übergeben wurde, starte im Root-Ordner
    if (!directoryHandle) {
        directoryHandle = await navigator.storage.getDirectory();
    }

    console.log(`Inhalt von: ${path || "Root"}`);

    for await (const entry of directoryHandle.values()) {
        if (entry.kind === "file") {
            console.log(`Datei: ${path}/${entry.name}`);
        } else if (entry.kind === "directory") {
            console.log(`Verzeichnis: ${path}/${entry.name}`);
            // Rekursive Auflistung von Unterverzeichnissen
            await listDirectory(await directoryHandle.getDirectoryHandle(entry.name), `${path}/${entry.name}`);
        }
    }
}

async function getSubdirectories(subfolderName) {
    try {
        const rootDirectory = await navigator.storage.getDirectory();
        const subDirectory = await rootDirectory.getDirectoryHandle(subfolderName);
        const subdirectories = [];

        for await (const entry of subDirectory.values()) {
            if (entry.kind === "directory") {
                subdirectories.push(entry.name); // Nur die Namen der Verzeichnisse speichern
            }
        }
        console.log(`Unterordner in ${subfolderName}:`, subdirectories);
        return subdirectories;
    } catch (error) {
        if (error.name === "NotFoundError") {
            console.error(`Das Verzeichnis ${subfolderName} existiert nicht.`);
        } else {
            console.error("Fehler:", error);
        }
    }
}

async function clearDirectory(directoryHandle = null) {
    // Falls kein Handle übergeben wurde, starte im Root-Verzeichnis
    if (!directoryHandle) {
        directoryHandle = await navigator.storage.getDirectory();
    }

    for await (const entry of directoryHandle.values()) {
        if (entry.kind === "file") {
            // Datei löschen
            await directoryHandle.removeEntry(entry.name);
            console.log(`Datei gelöscht: ${entry.name}`);
        } else if (entry.kind === "directory") {
            // Unterverzeichnis leeren und löschen
            const subDirHandle = await directoryHandle.getDirectoryHandle(entry.name);
            await clearDirectory(subDirHandle);
            await directoryHandle.removeEntry(entry.name);
            console.log(`Verzeichnis gelöscht: ${entry.name}`);
        }
    }
}