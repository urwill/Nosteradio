const THEME_KEY = 'color_theme';

// Theme (dark/light/system)
function getTheme() {
    const value = getLocalStorageItem(THEME_KEY) || 'system';   // Systemeinstellung verwenden, falls kein Wert festgelegt wurde
    return value;
}

function setTheme(value) {
    setLocalStorageItem(THEME_KEY, value);
    changeTheme(value);
}