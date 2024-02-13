/** @type {import('vite').UserConfig} */
import path from 'path'
import fs from 'fs'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [
        (function(){
            return{
                name: "trocar-pedacos",
                transformIndexHtml(code){
                    code = code.replace(/<part:([^/>]+)\/>/g, (_, partName) => {
                        const filePath = path.resolve(__dirname, `parts/${partName.trim()}.html`)
                        try{
                            return fs.readFileSync(filePath,"utf-8")
                        }catch(e){
                            return "<h1>"+e+"</h1>"
                        }
                    });
                    return code
                }
            }
        })()
    ],
    // ...
    build:{
        outDir : "docs",
        minify : "terser" 
    },
    base: "/"
})