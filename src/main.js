const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const ytdl = require('ytdl-core');
const { SoundCloud } = require('scdl-core');
const { getPath, savePath } = require('./settings');
const { getBounds, saveBounds } = require('./settings');
require('dotenv').config();


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const bounds = getBounds();
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 405, 
    minHeight: 493,
    x: bounds.x,
    y: bounds.y,
    icon: './src/icon.ico',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
    }
  })

  mainWindow.on('close', () => saveBounds(mainWindow.getBounds()));

  mainWindow.setMenu(null);

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  if (process.env.enviroment === 'dev') {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on('download', async (event, downloadLink) => {
  const path = getPath();
  try {
    const info = await ytdl.getInfo(downloadLink);
    const title = info.videoDetails.title;
    const fileName = `${path}\\${title}.webm`;
    ytdl(downloadLink, { quality: 'highestaudio' })
      .pipe(fs.createWriteStream(fileName))
      .on('finish', () => event.reply('download', { finishedDownloading: true, error: false }));
  } catch (error) {
    if (!error === 'Invalid url') {
      event.reply('download', { finishedDownloading: false, error: true });
    }
  }

  try {
    await SoundCloud.connect();
    const track = await SoundCloud.tracks.getTrack(downloadLink);
    const title = track.title;
    const fileName = `${path}\\${title}.webm`;
    const stream = await SoundCloud.download(downloadLink);
    stream.pipe(fs.createWriteStream(fileName));
    stream.on('finish', () => event.reply('download', { finishedDownloading: true, error: false }));
  } catch (error) {
    if (!error === 'Invalid url') {
       event.reply('download', { finishedDownloading: false, error: true });
    }
  }
});

ipcMain.on('getPath', (event) => {
  const path = getPath()
  event.reply('getPath', path)
})

ipcMain.on('savePath', (event, path) => {
  savePath(path)
})

ipcMain.on('selectPath', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if (!result.canceled) {
    const newPath = result.filePaths[0]
    savePath(newPath)
  }
})