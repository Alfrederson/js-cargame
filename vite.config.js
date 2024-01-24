import { viteSingleFile } from 'vite-plugin-singlefile'

/** @type {import('vite').UserConfig} */
export default {
    // ...
    build:{
        outDir : "docs"
    },
    plugins:[
        viteSingleFile()
    ]
}