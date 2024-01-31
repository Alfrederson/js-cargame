//@ts-check
/*
    Isso serve SÓ PARA BOTAR O CARRINHO NA TELA, e de um jeito errado
*/
import {
    Mesh,
    WebGLRenderer,
    Scene,
    DirectionalLight,
    AmbientLight,
    Vector3,
    PerspectiveCamera,
    BoxGeometry,
    MeshStandardMaterial,
    Object3D,
    AdditiveBlending,
    MeshBasicMaterial,
    BufferGeometry,
    BufferAttribute,
    DoubleSide,
    TextureLoader,
    NearestFilter,
    RepeatWrapping,
    PlaneGeometry
} from 'three'

import {
    GLTFLoader 
// @ts-ignore
} from 'three/addons/loaders/GLTFLoader';

import { RoadSegment } from './RoadSegment';

/** @interface */
class Particula{
    object = undefined
    finished = false
    tick(){}
}

const bola = new BoxGeometry(1,1,1)
const plano = new PlaneGeometry(1,1)

class Explosao{
    /** @type {Object3D} */
    object = undefined
    finished = false
    scale = 0
    lifeTime = 0
    constructor(x,y,z){
        let material = new MeshBasicMaterial({
            color : 0xFFFF00,
            transparent: true,
            blending: AdditiveBlending,
            depthTest: false
        })
        this.object = new Mesh(bola, material)
        this.object.position.set(x,y,z)
        this.scale = 1
    }
    tick(){
        if(this.lifeTime < 15){
            this.scale *= 1.1
        }else{
            this.scale += 0.2
            this.object.material.opacity *= 0.5
        }
        this.object.scale.set(this.scale, this.scale, this.scale)
        this.finished = (++this.lifeTime > 160)
    }
}

class Fumaca{
    /** @type {Object3D} */
    object = undefined
    finished = false
    scale = 0.4
    lifeTime = 0
    sY = 0
    constructor(x,y,z){
        this.object = new Mesh(bola, new MeshStandardMaterial({
            color : 0x222222,
            transparent: true,
        }))  
        this.object.position.set(x,y,z)     
        this.sy = 0.02 + Math.random() * 0.05 
    }
    tick(){
        if(this.lifeTime < 10){
            this.scale *= 1.1
        }else{
            this.scale -= 0.01
            if(this.scale <= 0) this.scale = 0
        }
        this.object.material.opacity *= 0.99
        this.object.scale.set(this.scale, this.scale, this.scale)
        this.object.position.y += this.sy
        this.object.rotation.x += 0.05
        this.object.rotation.y += 0.05
        this.object.rotation.z += 0.05
        this.finished = ++this.lifeTime > 120
    }    
}

class SkidMark {
    /** @type {Object3D} */
    object = undefined
    finished = false
    lifeTime = 0
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} a
     * @param {number} l
     */
    constructor(x,y,z, a, l){
        this.object = new Mesh(plano, cena.mat.skid)  
        this.object.position.set(x,y,z)
        this.object.rotation.set(-Math.PI/2,0,a)
        this.object.scale.set(1,l,1)
    }
    tick(){
        this.finished = ++this.lifeTime > 120
    }        
}


let cena = {
    mat : {
        skid : new MeshBasicMaterial({
            color: 0xFFFFFF,
            opacity: 0.5,
            transparent: true,
        }),
        road : new MeshBasicMaterial({wireframe: true, color: 0x00FF00}),
        arco : new MeshBasicMaterial({transparent: true, side: DoubleSide}),
        fimDaLinha : new MeshBasicMaterial({transparent: true, side: DoubleSide})
    },

    /** @type {Mesh?} */
    fimDaLinha : undefined, // plaquinha pra não deixar a pessoa sair da estrada
    /** @type {Mesh?} */
    arco : undefined,

    carro : new Object3D(), // isso é só o centro do carro.


    /** @type {Mesh?} */
    carroBody : undefined, // isso é o modelo.

    /** @type {WebGLRenderer?} */
    renderer : undefined,

    /** @type {PerspectiveCamera?} */
    camera : undefined,

    /** @type {Scene?} */
    scene : undefined,

    /** @type {Particula[]} */
    particulas : [],

    /** @type {{mesh: Object3D, geometry: BufferGeometry}[]} */
    road: [],


    // coisas de estado que não deveriam estar aqui...
    state : {
        drifting: false
    },
    /**
     * 
     * @param {Particula} p 
     */
    addParticula( p ){
        if(p.object){
            this.particulas.push( p )
            this.scene.add( p.object )    
        }
    }
}

/** @type {GLTFLoader} */
const loader = new GLTFLoader()

/**
 * Faz o three.js ficar na proporção certa pra ficar responsável
 * @param {HTMLCanvasElement} element 
 */
export function handleResize(element){
    const {width,height} = element.getBoundingClientRect()
    cena.renderer.setSize(width,height)
    cena.renderer.setPixelRatio((element.height / height)*0.5)
    cena.camera.aspect = width/height
    cena.camera.updateProjectionMatrix()
}

const pixelate = textura =>{
    textura.magFilter = NearestFilter
    textura.minFilter = NearestFilter
}

const paint = (mat,textura) =>{
    mat.map = textura
    mat.needsUpdate = true
}

/**
 * 
 * @param {HTMLCanvasElement} element 
 */
export function init(element){
    const rect = element.getBoundingClientRect()
    cena.renderer = new WebGLRenderer({
        alpha: true,
        antialias: false,
    })
    cena.renderer.setSize( rect.width, rect.height )
    cena.renderer.setPixelRatio((element.height /rect.height)*0.5)
    let r = cena.renderer.domElement

    r.className = "tresDe"
    document.body.appendChild( r )

    cena.scene = new Scene()
    cena.scene.add(
        new AmbientLight(0xFFFFFF,0.5)
    )
    const directionalLight = new DirectionalLight( 0xffffff, 1 );
    directionalLight.position.set(3,4,10)
    directionalLight.lookAt(new Vector3(0,0,0))

    if(!/Android/i.test(navigator.userAgent)){
        cena.scene.add( directionalLight );
    }

    cena.camera = new PerspectiveCamera(
        75,
        rect.width / rect.height, // isso vai ser 1 sempre.
        0.1, 
        1000
    )

    // não estou usando isso aqui ainda por causa do base do vite.
    loader.load( "./carro.gltf", function({scene,scenes,cameras,animations,asset}){
        scene.rotation.y = Math.PI*0.5
        scene.scale.set(1.2,1.2,1.2)
        let mat = scene.children[0].material
        pixelate(mat.map)
        cena.carroBody = scene
        cena.carro.add(scene)
    })

    // texturas e etc.
    const textureLoader = new TextureLoader()



    textureLoader.load("./rua.png", textura =>{
        textura.wrapS = RepeatWrapping
        textura.wrapT = RepeatWrapping
        cena.mat.road.wireframe=false
        cena.mat.road.color.set(0xFFFFFF)
        pixelate(textura)
        paint(cena.mat.road, textura )
    })
    textureLoader.load("./skid.png", textura =>{
        pixelate(textura)
        paint(cena.mat.skid, textura )
    })

    cena.fimDaLinha = new Mesh( plano, cena.mat.fimDaLinha )
    cena.fimDaLinha.scale.set(4,2,2)
    cena.scene.add( cena.fimDaLinha )
    textureLoader.load('./road_end.png', textura =>{
        pixelate(textura)
        paint(cena.mat.fimDaLinha, textura)
    })

    cena.arco = new Mesh( plano, cena.mat.arco )
    cena.arco.scale.set(6,6,6)
    cena.scene.add( cena.arco )
    textureLoader.load('./arco.png', textura =>{
        pixelate(textura)
        paint(cena.mat.arco,textura)
    })    

    cena.scene.add( cena.carro )
    cena.carro.add( cena.camera )

    cena.camera.position.z = 5
    cena.camera.position.y = 5
    cena.camera.lookAt(new Vector3(0,0,0))
}

// como o carro vai ser só um mesh "estático", isso é aceitável.
let oldX = 0, oldY = 0, driftCounter=0
/**
 * @param {number} x
 * @param {number} y
 * @param {number} angulo
 */
export function posicionarCarro( x,y, angulo ){
    
    cena.carro.position.set(x,0,y)
    if(cena.carroBody){
        cena.carroBody.rotation.y = -angulo + Math.PI*0.5
    }
    
    if(cena.state.drifting){
        if(++driftCounter==2){
            let dX = x-oldX
            let dY = y-oldY
            let comprimento = Math.sqrt(
                dX*dX + dY*dY
            )
            let anguloSkid = Math.atan2(-dY,dX)+Math.PI/2
            cena.addParticula(
                new SkidMark(
                    (x+oldX)/2 - dX*2.2,
                    0.1,
                    (y+oldY)/2 - dY*2.2,
                    anguloSkid,
                    comprimento*2.2
                )
            )
            driftCounter=0
        }
    }
    oldX = x
    oldY = y    
}

export function resetarCarro(){
    cena.state.drifting = false
    // limpar as explosões...
    for(let p of cena.particulas){
        cena.scene.remove(p.object)
    }
    cena.particulas = []
    // resetar o carro...
    cena.carro.visible=true
}

export function explodirCarro(){
    let {x,z} = cena.carro.position
    let particulas = [
        new Explosao(x,0,z),
    ]    
    let spreadX = 1.2
    let spreadZ = 1
    for(let i = 0; i < 10; i++){
        particulas.push(
            new Fumaca(
                x + spreadX * (Math.random() -0.5),
                0.1,
                z + spreadZ * (Math.random() -0.5)
            )
        )
    }
    for(let particula of particulas){
        cena.addParticula( particula )
    }
    cena.carro.visible=false
}

export function startDrifting(){
    cena.state.drifting=true
}
export function endDrifting(){
    cena.state.drifting=false
}

export function render(){
    cena.renderer.clear()
    // atualizar as explosões...
    let particulas = []
    for(let p of cena.particulas){
        p.tick()
        if(p.finished){
            cena.scene.remove( p.object )
        }else{
            particulas.push( p )
        }
    }
    cena.particulas = particulas
    cena.renderer.render( cena.scene, cena.camera )
}

export function setZoom(zoom){
    cena.camera.position.z = 5 + (1- zoom/12)*11
    cena.camera.position.y = 5 + (1- zoom/12)*11
}

/**
 * Adiciona um segmento de rua no 3D...
 * @param {RoadSegment} segment 
 */
export function addRoadSegment(segment){
    const {vertices,indices,uvs} = segment.generateVertexBuffer(),
        geometry = new BufferGeometry(),
        verticesArray = new Float32Array(vertices)
    geometry
        .setIndex( indices )
        .setAttribute('position', new BufferAttribute(verticesArray,3))
        .setAttribute('uv',new BufferAttribute(new Float32Array(uvs),2))

    // usa um material de rua...
    const mesh = new Mesh(geometry, cena.mat.road)
    cena.scene.add( mesh )
    cena.road.push({mesh,geometry})
}

export function posicionarFimDaLinha(x,y,a){
    cena.fimDaLinha.position.set(x,1,y)
    cena.fimDaLinha.rotation.set(0,-a,0)
}

export function posicionarArco(x,y,a){
    cena.arco.position.set(x,3,y)    
    cena.arco.rotation.set(0,-a,0)
}

// não consegui pensar em um jeito melhor de fazer isso.
export function removeRoadStart(){
    let trecho = cena.road.shift()
    if(trecho){
        cena.scene.remove(trecho.mesh)
        trecho.geometry.dispose()
    }
}

export function clearRoad(){
    cena.road.forEach( x => {
        cena.scene.remove(x.mesh)
        x.geometry.dispose()
    })
}

// faz exatamente o que parece.
export function projetar([x,y], width,height){
    const ponto = new Vector3(x,0,y)
    const projetado = ponto.project( cena.camera )
    return [(projetado.x+1)*0.5*width, (1-projetado.y)*0.5*height]
}