const electron = require("electron");

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;

let mainWindow;

app.on("ready", () => {
  const appIcon = new Tray(`${__dirname}/src/imgs/icon.png`);
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: `${__dirname}/src/imgs/icon.png`,
    transparent: true,
    frame: false,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.openDevTools();

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
});
