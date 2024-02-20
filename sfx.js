import * as audio from "./coisas/Audio.js"
export const sfx = {
    engine : new audio.Engine(audio.context),
    bomb : new audio.Clip(audio.context,"./sfx/honk.m4a"),
    check : new audio.Clip(audio.context,"./sfx/checkpoint.ogg",0.06),
    skid : new audio.Skid(audio.context)
}