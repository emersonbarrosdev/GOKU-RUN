import { defineConfig } from 'vite';
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {PATHS,SFX}=require('./js/game.js');
export default defineConfig({
  base:'./',publicDir:false,
  server:{port:5173,strictPort:true},
  build:{target:'es2020',chunkSizeWarningLimit:1600},
  plugins:[{
    name:'offline-game-assets',
    async closeBundle(){
      const files=new Set([...Object.values(PATHS),...Object.values(SFX).map(s=>'assets/sfx/'+s+'.wav'),
        'assets/sounds/trilha.ogg','assets/sounds/trilha.mp3']);
      for(const file of files){const output=path.join('dist',file);await mkdir(path.dirname(output),{recursive:true});await copyFile(file,output);}
    }
  }]
});
