export let context=new (window.AudioContext || window.webkitAudioContext)

export function resume(){
    context.resume()
}

class SFX {
    /** @type {AudioContext?} */
    audiocontext = undefined
    constructor(ctx){
        this.audiocontext = ctx
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
    request.onload = () => ctx.decodeAudioData(request.response, callback )
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
    constructor(ctx){
        super(ctx)
        this.gainNode = createGain(ctx, 0)
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
            if(this.isOn){
                this.gainNode.gain.value = 1.8
                this.setFrequency(this.freq)
            }
        })
        this.gainNode.connect( ctx.destination )
    }
    on(){
        this.isOn = true
        this.gainNode.gain.value = 1.8
    }
    off(){
        this.isOn = false
        this.gainNode.gain.value = 0
    }
    setFrequency(freq){
        this.freq = freq
        if(!this.bufferSource){
            return
        }
        this.bufferSource.playbackRate.value = freq/2
    }
}


export class Bomb extends SFX {
    constructor(ctx){
        super(ctx)
        this.vol = createGain(ctx,0.125)
        loadClip(ctx, './sfx/honk.m4a', buffer =>{
            this.buffer = buffer
        })
        this.vol.connect( ctx.destination )
    }
    explode(){
        playBuffer( this.audiocontext, this.buffer, this.vol )
    }
}

export class Clip extends SFX{
    constructor(ctx, filename, gain=0.125){
        super(ctx)
        this.vol = createGain(ctx,gain)
        this.vol.connect(ctx.destination)
        loadClip(ctx, filename, buffer => this.buffer = buffer )
    }
    play(){
        playBuffer(this.audiocontext, this.buffer, this.vol)
    }
}


export class Skid extends SFX {
    constructor(ctx){
        super(ctx)
        // onda triangular, 500hz
        this.oscBase = createOsc(ctx,"triangle",700)

        // modular a frequencia daquela onda
        this.oscFM = createOsc(ctx,"triangle",15)
        
        this.oscFMgain = createGain(ctx,80)
        this.oscFM.connect( this.oscFMgain )
        this.oscFMgain.connect( this.oscBase.frequency)

        // o ganho desse nó vem do oscilador de baixo...
        this.varIntensidade = ctx.createGain()

        // onda quadrada, 4 hertz, que vai dar uma tremidinha
        this.oscIntensidade = createOsc(ctx,"sine",15)
        this.oscIntensidade.connect( this.varIntensidade )

        this.intensidade = createGain(ctx, 0.06)
        this.oscBase.connect( this.varIntensidade )

        this.globalVolume = createGain(ctx,0)
        this.globalVolume.connect(ctx.destination)
        
        this.varIntensidade.connect(this.intensidade)
        this.intensidade.connect( this.globalVolume )

        this.oscFM.start()
        this.oscBase.start();
        this.oscIntensidade.start()
    }
    start(){
        this.globalVolume.gain.value=0.1
    }
    stop(){
        this.globalVolume.gain.value=0
    }
}