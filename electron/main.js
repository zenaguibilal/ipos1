const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development'
           || process.argv.includes('--dev');

function createWindow() {
    const win = new BrowserWindow({
        width:     1360,
        height:    768,
        minWidth:  1024,
        minHeight: 600,
        autoHideMenuBar: true,
        icon: path.join(__dirname, '../public/icon.png'),
        title: 'iPOS Zen',
        backgroundColor: '#FFF8E7',
        webPreferences: {
            preload:          path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration:  false,
            webSecurity:      true,
        },
    });

    // Supprimer la barre de menu native
    Menu.setApplicationMenu(null);

    if (isDev) {
        win.loadURL('http://localhost:3000');
    } else {
        // Charge le static export Next.js
        win.loadFile(path.join(__dirname, '../out/index.html'));
    }

    // Liens externes → navigateur système
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
