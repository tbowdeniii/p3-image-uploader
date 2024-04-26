import { defineConfig, externalizeDepsPlugin, loadEnv } from 'electron-vite'

import { resolve } from 'path'

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()]
    },
    preload: {
        plugins: [externalizeDepsPlugin()]
    },
    renderer: {
        build: {
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'src/renderer/index.html'),
                    license: resolve(__dirname, 'src/renderer/license_gate.html'),
                    license_render: resolve(__dirname, 'src/renderer/src/gate_renderer.js'),
                    s3: resolve(__dirname, 'src/renderer/s3_credentials.html'),
                    s3_render: resolve(__dirname, 'src/renderer/src/s3_credentials.js')
                }
            }
        }
    }
})