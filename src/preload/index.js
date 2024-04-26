import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
const os = require('os')

const user = os.userInfo().username
const dotenv = require('dotenv').config({
    path: `C:\\Users\\${user}\\AppData\\Local\\AWS-Image-Uploader\\.env`
})

// Custom APIs for renderer
const api = {
    send: (channel, ...data) => ipcRenderer.invoke(channel, ...data),
    handle: (channel, ...data) => ipcRenderer.on(channel, ...data)
}

let envVars = {
    cloudfrontUrl: process.env.CLOUDFRONT_URL
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
        contextBridge.exposeInMainWorld('envVars', envVars)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
        // @ts-ignore (define in dts)
    window.api = api
}

window.addEventListener('DOMContentLoaded', () => {
    if (document.title == 'License Gate') {
        const gate = document.getElementById('license-gate')

        gate.addEventListener('submit', async(event) => {
            event.preventDefault()

            const data = new FormData(gate)
            const key = data.get('key')

            ipcRenderer.invoke('GATE_SUBMIT', { key })
        })
    }
    if (document.title == 'S3 Credentials') {
        const s3Gate = document.getElementById('s3-gate')

        s3Gate.addEventListener('submit', async(event) => {
            event.preventDefault()

            const s3Data = new FormData(s3Gate)

            const s3Bucket = s3Data.get('s3-bucket')
            const cloudfrontURL = s3Data.get('cloudfront')
            const accessKey = s3Data.get('access-key')
            const secretAccessKey = s3Data.get('secret-access-key')

            envVars.cloudfrontUrl = cloudfrontURL

            ipcRenderer.invoke('S3_CREDENTIAL_SUBMIT', {
                s3Bucket,
                cloudfrontURL,
                accessKey,
                secretAccessKey
            })
        })
    }
})