let audio = {
    context : undefined,
    failed : false
}

const init_funcs = []
export function init(){
    if(audio.context || audio.failed)
        return
    try{
        audio.context = new (window.AudioContext || window.webkitAudioContext)
        if(!audio.context){
            audio.failed = true
            return
        }
        for(let l of init_funcs){
            l()
        }    
    }catch(e){
        // como eu mando isso?
        audio.failed = true
        alert(e.error)
    }
}

class SFX {
    audiocontext = undefined
    ready =false
    constructor(){
        if(audio.context){
            this.audioContext = audio.context
        }else{
            init_funcs.push(()=>{
                this.audioContext = audio.context
                this.init()
            })
        }
    }
    init(){
    }
}

function createOsc(ctx,type,hz){
    let osc = ctx.createOscillator()
    osc.type = type
    if(hz!== undefined)
        osc.frequency.value = hz
    return osc
}

function createGain(ctx,val){
    const g = ctx.createGain()
    g.gain.value = val
    return g
}

function loadClip( ctx, filePath, callback ){
    const request = new XMLHttpRequest()
    request.open('GET',filePath,true)
    request.responseType = 'arraybuffer'
    request.onload = function(){
        ctx.decodeAudioData(request.response, function (buffer){
            callback(buffer)
        })
    }
    request.send()
}

function playBuffer( ctx, buffer, node ){
    const bufferSource = ctx.createBufferSource()
    bufferSource.buffer = buffer
    bufferSource.connect( node )
    bufferSource.start()
}

export class Engine extends SFX {
    isOn = false
    freq = 0
    init(){
        const ctx = this.audioContext
        this.gainNode = ctx.createGain()
        this.gainNode.gain.value = 0

        this.lowPass = ctx.createBiquadFilter()
        this.lowPass.type = 'notch'
        this.lowPass.frequency.value = 2000
        this.lowPass.connect( this.gainNode )
        loadClip(ctx, './sfx/motor.wav', buffer =>{
            const bufferSource = ctx.createBufferSource()
            bufferSource.buffer = buffer
            this.bufferSource = bufferSource  
            bufferSource.loop=true
            bufferSource.connect( this.lowPass )
            bufferSource.start()
            this.ready = true
            if(this.isOn){
                this.setFrequency(this.freq)
            }
        })
        this.gainNode.connect( ctx.destination )
    }
    on(){
        this.isOn = true
        if(!this.ready) return;
        this.gainNode.gain.value = 1
    }
    off(){
        this.isOn = false
        if(!this.ready) return;
        this.gainNode.gain.value = 0
    }
    setFrequency(freq){
        this.freq = freq
        if(!this.ready) return;
        this.bufferSource.playbackRate.value = freq/2
    }
}


export class Bomb extends SFX {
    init(){
        const ctx = this.audioContext
        this.vol = ctx.createGain()
        this.vol.gain.value = 0
        loadClip(ctx, './sfx/honk.m4a', buffer =>{
            this.buffer = buffer
            this.ready = true
        })
        this.vol.connect( ctx.destination )
    }
    explode(){
        if(!this.ready)
            return
        this.vol.gain.value = 0.1
        playBuffer( this.audioContext, this.buffer, this.vol )
    }
}

export class Skid extends SFX {
    init(){
        const ctx = this.audioContext
        // onda triangular, 500hz
        this.oscBase = createOsc(ctx,"triangle",700)

        // modular a frequencia daquela onda
        this.oscFM = createOsc(ctx,"triangle",15)
        
        this.oscFMgain = ctx.createGain()
        this.oscFMgain.gain.value = 80
        this.oscFM.connect( this.oscFMgain )
        this.oscFMgain.connect( this.oscBase.frequency)

        // o ganho desse nó vem do oscilador de baixo...
        this.varIntensidade = ctx.createGain()

        // onda quadrada, 4 hertz, que vai dar uma tremidinha
        this.oscIntensidade = createOsc(ctx,"sine",15)
        this.oscIntensidade.connect( this.varIntensidade )

        this.intensidade = ctx.createGain()
        this.intensidade.gain.value = 0.06
        this.oscBase.connect( this.varIntensidade )

        this.globalVolume = ctx.createGain()
        this.globalVolume.gain.value = 0   
        this.globalVolume.connect(ctx.destination)
        
        this.varIntensidade.connect(this.intensidade)
        this.intensidade.connect( this.globalVolume )

        this.oscFM.start()
        this.oscBase.start();
        this.oscIntensidade.start()
        this.ready=true
    }
    start(){
        if(!this.ready) return;
        this.globalVolume.gain.value=0.1
    }
    stop(){
        if(!this.ready) return;
        this.globalVolume.gain.value=0
    }
}