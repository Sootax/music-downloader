const Store = require('electron-store')

const config = {
  name: 'config',
  fileExtension: 'json',
  cwd: './src'
}

const storage = new Store(config)

function getBounds() {
  const defaultBounds = {
    height: 405,
    widht: 493,
    x: 0,
    y: 0
  }
  const customBounds = storage.get('bounds')
  if (customBounds) {
    return customBounds
  } else {
    storage.set('bounds', defaultBounds)
    return defaultBounds
  }
}

function saveBounds(bounds) {
  storage.set('bounds', bounds)
}

function getPath() {
  const defaultPath = {
    path: ''
  }
  const customPath = storage.get('path')
  if (customPath) {
    return customPath
  } else {
    storage.set('path', defaultPath)
    return defaultPath
  }
}

function savePath(path) {
  storage.set('path', path)
}

function saveSettings(settings) {
  storage.set('settings', settings)
}

function getSettings() {
  const defaultSettings = {
    batchSize: 5,
  };
  const customSettings = storage.get('settings')
  if (customSettings) {
    return customSettings
  } else {
    storage.set('settings', defaultSettings)
    return defaultSettings
  }
}

module.exports = {
  getBounds,
  saveBounds,
  getPath,
  savePath,
  saveSettings,
  getSettings
}