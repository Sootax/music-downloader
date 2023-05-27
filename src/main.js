const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const async = require('async');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { SoundCloud } = require('scdl-core');
const { getPath, savePath, getBounds, saveBounds, getSettings, saveSettings } = require('./settings');

import validateFilename from './helpers/validateFilename.js';

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
  console.log(bounds)
  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 405,
    minHeight: 601,
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
  if (process.env.environment === 'dev') {
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

let isCancelled = false;

ipcMain.on('CANCEL_DOWNLOAD', (event) => {
  isCancelled = true;
})

ipcMain.on('START_DOWNLOAD', async (event, downloadObject) => {
  isCancelled = false;
  const path = getPath();
  const settings = getSettings();
  let completedDownloads = 0;
  let totalSongs = 0;

  const progressCallback = (progress = 0, isPlaylist) => {
    const progressCeil = Math.ceil(progress);
    const progressData = isPlaylist
      ? { progress: Math.ceil((++completedDownloads / totalSongs) * 100) }
      : { progress: progressCeil };
    event.reply('STATUS', progressData);
  };

  const download = async (sourceType, url, playlist = false) => {
    const downloadFn = sourceType === 'youtube' ? downloadYoutubeSong : downloadSoundCloudSong;

    if (!playlist) {
      if (sourceType === 'soundcloud') {
        await SoundCloud.connect();
      }
      const info = await downloadInfo[sourceType](url);
      const song = formatSong(info, sourceType);
      event.reply('STATUS', { currentSong: song });
      await downloadFn(song, path, progressCallback, false, event);
    } else {
      let songs;
      if (sourceType === 'soundcloud') {
        await SoundCloud.connect();
        const results = await downloadInfo[sourceType + 'Playlist'](url);
        songs = results.tracks.map((result) => formatSong(result, sourceType, playlist));
      } else if (sourceType === 'youtube') {
        const results = await downloadInfo[sourceType + 'Playlist'](url);
        songs = results.items.map((result) => formatSong(result, sourceType, playlist));
      }
      totalSongs = songs.length;
      const batchSize = settings.batchSize > 1 ? settings.batchSize : 1;
      async.eachLimit(songs, batchSize, async (song) => {
        if (!isCancelled) {
          event.reply('STATUS', { currentSong: song });
          await downloadFn(song, path, progressCallback, true, event);
        } else {
          console.log('DOWNLOAD IS CANCELED', song);
        }
      });
    }
  };

  const type = downloadObject.match.replace(/Singular|Playlist/, '');
  const isPlaylist = /Playlist/.test(downloadObject.match);
  await download(type, downloadObject.url, isPlaylist);
});

// downloadInfo functions can be stored in an object for easy lookup
const downloadInfo = {
  youtube: ytdl.getInfo,
  youtubePlaylist: ytpl,
  soundcloud: SoundCloud.tracks.getTrack,
  soundcloudPlaylist: SoundCloud.playlists.getPlaylist,
};

// Helper function to format the song object
const formatSong = (info, sourceType, isPlaylist) => {
  if (sourceType === 'youtube') {
    return {
      title: isPlaylist ? info.title : info.videoDetails.title,
      url: isPlaylist ? info.shortUrl : info.videoDetails.video_url,
      thumbnail: isPlaylist ? info.bestThumbnail.url : info.videoDetails.thumbnails[4].url,
    };
  } else if (sourceType === 'soundcloud') {
    return {
      title: info.title,
      url: info.permalink_url,
      thumbnail: info.artwork_url,
      duration: info.media.transcodings[0].duration / 1000,
    };
  }
};

async function downloadYoutubeSong(song, path, progressCallback, isPlaylist, event) {
  return new Promise(async (resolve) => {
    const title = validateFilename(song.title);
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
        event.reply('STATUS', { errorMessage: error });
        resolve();
      });
  });
}

async function downloadSoundCloudSong(song, path, progressCallback, isPlaylist, event) {
  return new Promise(async (resolve) => {
    const title = validateFilename(song.title);
    const filePath = `${path}\\${title}.mp3`;
    const videoStream = await SoundCloud.download(song.url);

    let totalDuration = song.duration;
    let totalDownloadPercentage = 0;

    videoStream.on('progress', (chunkLength) => {
      if (!isPlaylist) {
        let chunkLengthSeconds = chunkLength.duration / 1000;
        let percentage = (chunkLengthSeconds / totalDuration) * 100;
        totalDownloadPercentage += percentage;
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
        event.reply('STATUS', { errorMessage: error });
        resolve();
      });
  });
}

// Save the path to the configuration file.
// TODO: Merge with saveSettings
ipcMain.on('selectPath', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (!result.canceled) {
    const newPath = result.filePaths[0];
    savePath(newPath);
  }
});

// Saves the settings to the configuration file.
ipcMain.on('saveSettings', (event, settings) => {
  saveSettings(settings);
});

// Gets the settings from the configuration file and sends back the settings.
ipcMain.on('getSettings', (event) => {
  const settings = getSettings();
  event.reply('getSettings', settings);
});

// Opens the github repo.
ipcMain.on('openGithub', (event) => {
  shell.openExternal('https://github.com/Sootax/music-downloader');
});

// Waits for react to be lodaded before showing mainWindow.
ipcMain.on('componentReady', (event) => {
  mainWindow.show();
});
