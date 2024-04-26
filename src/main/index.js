const { app, shell, BrowserWindow, ipcMain, dialog, clipboard } = require('electron')
const path = require('path')
const { electronApp, optimizer, is } = require('@electron-toolkit/utils')
import icon from '../../resources/icon1.png?asset'
const sharp = require('sharp')
const os = require('os')
const user = os.userInfo().username
const fs = require('fs').promises
const fssync = require('fs')
const { autoUpdater } = require('electron-updater')
const Store = require('electron-store')
const keyStore = new Store()

var dotenv = require('dotenv')

async function validateLicenseKey(key) {
  const validation = await fetch(
    `https://api.keygen.sh/v1/accounts/microlandcomputers-com/licenses/actions/validate-key`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        meta: { key }
      })
    }
  )
  const { meta, errors } = await validation.json()
  if (errors) {
    return null
  }

  return meta.code
}

const {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  ListObjectsCommand
} = require('@aws-sdk/client-s3')

var s3Client

async function listAllObjectsFromS3Bucket(s3, bucket, prefix) {
  let isTruncated = true
  let marker
  const elements = []
  const prefixes = []
  let i = 0
  while (isTruncated) {
    let params = { Bucket: bucket, Delimiter: '/' }
    if (i > 0 && elements[i] == null) isTruncated = false

    if (elements.length > 1) {
      params.Prefix = elements[i]
      i++
    }
    //console.log('Prefix:' + elements[i])
    if (elements[i] != null) {
      if (elements[i].split('/').length > 3) continue
    }
    try {
      const response = await s3.send(new ListObjectsV2Command(params))
      if (response.CommonPrefixes) {
        response.CommonPrefixes.forEach((element) => {
          elements.push(element.Prefix)

          //console.log(response)
        })
      }
    } catch (error) {
      throw error
    }
  }

  return elements
}

function s3CreateWindow(createWindow) {
  const gateWindow = new BrowserWindow({
    resizable: false,
    width: 600,
    height: 600,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  gateWindow.on('ready-to-show', () => {
    gateWindow.show()
  })

  gateWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    gateWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    gateWindow.loadFile(path.join(__dirname, '../renderer/s3_credentials.html'))
  }

  ipcMain.handle(
    'S3_CREDENTIAL_SUBMIT',
    async (event, { s3Bucket, cloudfrontURL, accessKey, secretAccessKey }) => {
      fs.writeFile(
        `C:\\Users\\${user}\\AppData\\Local\\AWS-Image-Uploader\\.env`,
        `S3_BUCKET="${s3Bucket}"\nCLOUDFRONT_URL="${cloudfrontURL}"\nACCESS_KEY="${accessKey}"\nSECRET_ACCESS_KEY="${secretAccessKey}"`,
        (err) => {
          if (err) return console.error(err)
        }
      ).then(await createWindow(s3Bucket, accessKey, secretAccessKey))
      gateWindow.close()
    }
  )
}

async function createWindow(s3Bucket, accessKey, secretAccessKey) {
  dotenv.config({
    path: `C:\\Users\\${user}\\AppData\\Local\\AWS-Image-Uploader\\.env`
  })
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
  console.log(path.join(app.getPath('temp'), 'temp_image'))

  fs.mkdir(path.join(app.getPath('temp'), 'temp_image'), { recursive: true }, (err) => {
    if (err) return console.error(err)
  })

  console.log(os.userInfo().username)

  s3Client = new S3Client({
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretAccessKey
    },
    region: 'us-west-1'
  })

  let objects = await listAllObjectsFromS3Bucket(s3Client, s3Bucket)

  mainWindow.webContents.send('s3', objects)

  let key = keyStore.get('key')

  mainWindow.webContents.send('update', 'checking for updates')
  autoUpdater.addAuthHeader(`License ${key}`)
  autoUpdater.checkForUpdatesAndNotify()
}

async function gateCreateWindowWithLicense(s3CreateWindow, createWindow) {
  const gateWindow = new BrowserWindow({
    resizable: false,
    width: 500,
    height: 280,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  gateWindow.on('ready-to-show', () => {
    gateWindow.show()
  })

  gateWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    gateWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    gateWindow.loadFile(path.join(__dirname, '../renderer/license_gate.html'))
  }

  ipcMain.handle('GATE_SUBMIT', async (event, { key }) => {
    if (key != '') {
      const code = await validateLicenseKey(key)

      switch (code) {
        case 'VALID':
          // Close the license gate window

          keyStore.set('key', key)
          gateWindow.close()

          // Create our main window
          if (process.env.S3_BUCKET == '' || process.env.S3_BUCKET == null) {
            s3CreateWindow(createWindow)
          } else {
            createWindow(
              process.env.S3_BUCKET,
              process.env.ACCESS_KEY,
              process.env.SECRET_ACCESS_KEY
            )
          }

          break

        case 'SUSPENDED':
          gateWindow.webContents.send('key-suspended')
          break

        case 'NOT_FOUND':
          gateWindow.webContents.send('key-not-found')

          break
        default:
          // Exit the application
          app.exit(1)

          break
      }
    } else {
      gateWindow.webContents.selectAll('key-empty')
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  if (!fssync.existsSync(`C:\\Users\\${user}\\AppData\\Local\\AWS-Image-Uploader`)) {
    fssync.mkdirSync(`C:\\Users\\${user}\\AppData\\Local\\AWS-Image-Uploader`)
    fs.writeFile(
      `C:\\Users\\${user}\\AppData\\Local\\AWS-Image-Uploader\\.env`,
      `S3_BUCKET=""\nCLOUDFRONT_URL=""\nACCESS_KEY=""\nSECRET_ACCESS_KEY=""`,
      (err) => {
        if (err) return console.error(err)
      }
    )
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  dotenv.config({
    path: `C:\\Users\\${user}\\AppData\\Local\\AWS-Image-Uploader\\.env`
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  if (keyStore.has('key') && process.env.S3_BUCKET != '' && process.env.S3_BUCKET != null) {
    let key = keyStore.get('key')
    const code = await validateLicenseKey(key)

    switch (code) {
      case 'VALID':
        // Close the license gate window

        keyStore.set('key', key)

        // Create our main window
        if (process.env.S3_BUCKET == '' || process.env.S3_BUCKET == null) {
          s3CreateWindow(createWindow)
        } else {
          createWindow(process.env.S3_BUCKET, process.env.ACCESS_KEY, process.env.SECRET_ACCESS_KEY)
        }
        break

      case 'SUSPENDED':
        gateCreateWindowWithLicense(s3CreateWindow, createWindow)
        break

      case 'NOT_FOUND':
        gateCreateWindowWithLicense(s3CreateWindow, createWindow)
        break

      default:
        // Exit the application
        app.exit(1)

        break
    }
    //createWindow(process.env.S3_BUCKET, process.env.ACCESS_KEY, process.env.SECRET_ACCESS_KEY)
  } else if (
    keyStore.has('key') &&
    (process.env.S3_BUCKET == '' || process.env.S3_BUCKET == null)
  ) {
    s3CreateWindow(createWindow)
  } else {
    gateCreateWindowWithLicense(s3CreateWindow, createWindow)
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    fs.readdir(path.join(app.getPath('temp'), 'temp_image'), (err, files) => {
      if (err) throw err

      for (const file of files) {
        fs.unlink(path.join(app.getPath('temp'), 'temp_image', file))
      }
    })
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
// Handle File Dialog opening on click
ipcMain.handle('fileDialog', async (event, data) => {
  const result = await dialog
    .showOpenDialog({
      properties: ['openFile', 'multiSelections']
    })
    .then((fileResult) => {
      console.log(fileResult.canceled)
      return fileResult.filePaths
    })
    .catch((err) => {
      console.log(err)
    })

  return result
})

async function executeProductSquoosh(width, imageType, cat, subCat, sku, files) {
  dotenv.config({
    path: `C:\\Users\\${user}\\AppData\\Local\\AWS-Image-Uploader\\.env`
  })
  let ingestedFiles = files

  for (let i = 0; i < ingestedFiles.length; i++) {
    let file_name = files[i].split('\\').slice(-1)
    file_name = file_name[0].split('.')[0]

    const file = await fs.readFile(files[i])

    const image = await sharp(file).resize({ width: width }).webp({ lossless: true }).toBuffer()

    const temp_path = path.join(app.getPath('temp'), 'temp_image', file_name + '.webp')

    sharp(image).toFile(temp_path, async (err, data) => {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: imageType + '/' + cat + '/' + subCat + '/' + sku + '/' + file_name + '.webp',
          Body: fssync.readFileSync(temp_path)
        })
      )
    })
  }
}

async function executeContentSquoosh(imageType, cat, files) {
  dotenv.config({
    path: `C:\\Users\\${user}\\AppData\\Local\\AWS-Image-Uploader\\.env`
  })
  let ingestedFiles = files

  for (let i = 0; i < ingestedFiles.length; i++) {
    let file_name = files[i].split('\\').slice(-1)
    file_name = file_name[0].split('.')[0]

    const file = await fs.readFile(files[i])

    const deskopImage = await sharp(file).webp({ lossless: true }).toBuffer()

    const temp_path = path.join(app.getPath('temp'), 'temp_image', file_name + '.webp')

    sharp(deskopImage).toFile(temp_path, async (err, data) => {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: imageType + '/' + cat + '/' + file_name + '.webp',
          Body: fssync.readFileSync(temp_path)
        })
      )
    })
  }
}

ipcMain.handle(
  'executeProductSquoosh',
  async (event, width, imageType, cat, subCat, sku, files) => {
    try {
      console.log(files)
      return await executeProductSquoosh(width, imageType, cat, subCat, sku, files)
    } catch (error) {
      console.log(error)
    }
  }
)

ipcMain.handle('executeContentSquoosh', async (event, imageType, cat, files) => {
  try {
    return await executeContentSquoosh(imageType, cat, files)
  } catch (error) {
    console.log(error)
  }
})

ipcMain.handle('clipboard', (event, url) => {
  clipboard.writeText(url)
})
