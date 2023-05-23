const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const async = require('async');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { SoundCloud } = require('scdl-core');
const { getPath, savePath, getBounds, saveBounds, getSettings, saveSettings } = require('./settings');

require('dotenv').config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let ffmpegPath;

if (app.isPackaged) {
  ffmpegPath = path.join(process.resourcesPath, 'ffmpeg.exe');
} else {
  ffmpegPath = require('ffmpeg-static');
}

ffmpeg.setFfmpegPath(ffmpegPath);

let mainWindow;

const createWindow = () => {
  const bounds = getBounds();
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 405,
    minHeight: 583,
    show: false,
    x: bounds.x,
    y: bounds.y,
    icon: './src/icon.ico',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

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

ipcMain.on('download', async (event, downloadObject) => {
  const path = getPath();
  const settings = getSettings();
  let completedDownloads = 0;
  let totalSongs = 0;

  const progressCallback = (progress = 0, isPlaylist) => {
    if (isPlaylist) {
      completedDownloads += 1;
      const overAllProgress = (completedDownloads / totalSongs) * 100;
      event.reply('progress', overAllProgress);
    } else {
      event.reply('progress', progress);
    }
  };

  if (downloadObject.match === 'youtubeSingular') {
    totalSongs = 1;
    const info = await ytdl.getInfo(downloadObject.url);
    const song = {
      title: info.videoDetails.title,
      url: downloadObject.url,
      thumbnail: info.videoDetails.thumbnails[4].url,
    };
    event.reply('getCurrentSong', song);
    await downloadYoutubeSong(song, path, progressCallback);
  } else if (downloadObject.match === 'youtubePlaylist') {
    const results = await ytpl(downloadObject.url, { limit: 9999 });
    const songs = results.items.map((result) => ({
      title: result.title,
      url: result.shortUrl,
      thumbnail: result.bestThumbnail.url,
    }));
    totalSongs = songs.length;

    if (settings.batchSize > 1) {
      async.eachLimit(songs, settings.batchSize, async (song) => {
        event.reply('getCurrentSong', song);
        await downloadYoutubeSong(song, path, progressCallback, true);
      });
    } else {
      async.eachLimit(songs, 1, async (song) => {
        await downloadYoutubeSong(song, path, progressCallback, true);
      });
    }
  } else if (downloadObject.match === 'soundCloudSingular') {
    await SoundCloud.connect();
    const result = await SoundCloud.tracks.getTrack(downloadObject.url);
    const song = {
      title: result.title,
      url: result.permalink_url,
      thumbnail: result.artwork_url,
      duration: result.media.transcodings[0].duration / 1000,
    };
    event.reply('getCurrentSong', song);
    await downloadSoundCloudSong(song, path, progressCallback, false);
  } else if (downloadObject.match === 'soundCloudPlaylist') {
    await SoundCloud.connect();
    const results = await SoundCloud.playlists.getPlaylist(downloadObject.url);
    const songs = results.tracks.map((result) => ({
      title: result.title,
      url: result.permalink_url,
      thumbnail: result.artwork_url,
    }));
    totalSongs = songs.length;

    if (settings.batchSize > 1) {
      async.eachLimit(songs, settings.batchSize, async (song) => {
        event.reply('getCurrentSong', song);
        await downloadSoundCloudSong(song, path, progressCallback, true);
      });
    } else {
      async.eachLimit(songs, 1, async (song) => {
        await downloadSoundCloudSong(song, path, progressCallback, true);
      });
    }
  }
});

async function downloadYoutubeSong(song, path, progressCallback, isPlaylist) {
  return new Promise(async (resolve) => {
    const title = filterCharacters(song.title);
    const filePath = `${path}\\${title}.mp3`;
    const videoStream = await ytdl(song.url, { quality: 'highestaudio' });

    let totalBytes = 0;
    let downloadedSize = 0;
    videoStream.on('response', (response) => (totalBytes = response.headers['content-length']));

    videoStream.on('progress', (chunkLength) => {
      if (!isPlaylist) {
          downloadedSize += chunkLength;
          let downloadedPercent = (downloadedSize / totalBytes) * 100;
          progressCallback(downloadedPercent, isPlaylist);
      }
    });

    ffmpeg(videoStream)
      .audioBitrate(128)
      .save(filePath)
      .on('end', () => {
        if (isPlaylist) {
          progressCallback(0, isPlaylist);
        }
        resolve();
      })
      .on('error', (error) => {
        if (isPlaylist) {
          progressCallback(0, isPlaylist);
        }
        console.error(error);
        resolve();
      });
  });
}

async function downloadSoundCloudSong(song, path, progressCallback, isPlaylist) {
  return new Promise(async (resolve) => {
    const title = filterCharacters(song.title);
    const filePath = `${path}\\${title}.mp3`;
    const videoStream = await SoundCloud.download(song.url);

    let totalDuration = song.duration;   
    let totalDownloadPercentage = 0;   
    videoStream.on('response', (response) => (totalBytes = response.headers['content-length']));

    videoStream.on('progress', (chunkLength) => {
      if (!isPlaylist) {
        let chunkLengthSeconds = chunkLength.duration / 1000;
        let percentage = (chunkLengthSeconds / totalDuration) * 100;
        totalDownloadPercentage += percentage;
        console.log(Math.ceil(totalDownloadPercentage));
        progressCallback(Math.ceil(totalDownloadPercentage), isPlaylist);
      }
    });
    
    ffmpeg(videoStream)
      .audioBitrate(128)
      .save(filePath)
      .on('end', () => {
        if (isPlaylist) {
          progressCallback(0, isPlaylist);
        }
        resolve();
      })
      .on('error', (error) => {
        if (isPlaylist) {
          progressCallback(0, isPlaylist);
        }
        console.log(error);
        resolve();
      });
  });
}

function filterCharacters(originalTitle) {
  return originalTitle.replace(/[/\\?%*:|"<>]/g, ' ');
}

ipcMain.on('selectPath', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (!result.canceled) {
    const newPath = result.filePaths[0];
    savePath(newPath);
  }
});

ipcMain.on('saveSettings', (event, settings) => {
  saveSettings(settings);
});

ipcMain.on('getSettings', (event) => {
  const settings = getSettings();
  event.reply('getSettings', settings);
});

ipcMain.on('openGithub', (event) => {
  shell.openExternal('https://github.com/Sootax/music-downloader');
});

ipcMain.on('componentReady', (event) => {
  mainWindow.show();
})
