const electron = require("electron");
const path = require('path');

console.log(path)

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
  });

  mainWindow.openDevTools();

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
});
