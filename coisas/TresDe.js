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
    IcosahedronGeometry,
    MeshStandardMaterial,
    Object3D,
    InstancedMesh,
    AdditiveBlending,
    MultiplyBlending,
    MeshBasicMaterial
} from 'three'
import {
    GLTFLoader 
} from 'three/addons/loaders/GLTFLoader';

import carro_mesh from './carro_mesh';
import { PointLight } from 'three'

/** @interface */
class Particula{
    object = undefined
    finished = false
    tick(){}
}

const bola = new BoxGeometry(1,1,1)

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
        this.scale = 1.5
    }
    tick(){
        if(this.lifeTime < 15){
            this.scale -= 0.1
        }else{
            this.object.material.opacity *= 0.9
        }
        this.object.scale.set(this.scale, this.scale, this.scale)
        if(++this.lifeTime > 120){
            this.finished = true
        }
    }
}

class Fumaca{
    /** @type {Object3D} */
    object = undefined
    finished = false
    scale = 0.2
    lifeTime = 0
    sY = 0
    constructor(x,y,z){
        let material = new MeshStandardMaterial({
            color : 0x222222,
            transparent: true,
        })
        this.object = new Mesh(bola, material)  
        this.object.position.set(x,y,z)     
        this.sy = 0.02 + Math.random() * 0.05 
    }
    tick(){
        if(this.lifeTime < 5){
            this.scale += 0.1
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

        if(++this.lifeTime > 120){
            this.finished = true
        }
    }    
}


let cena = {
    /** @type {Mesh?} */
    carro : undefined,

    /** @type {WebGLRenderer?} */
    renderer : undefined,

    /** @type {PerspectiveCamera?} */
    camera : undefined,

    /** @type {Scene?} */
    scene : undefined,

    /** @type {Particula[]} */
    particulas : [],

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
 * 
 * @param {HTMLCanvasElement} element 
 */
function init3D(element){

    const rect = element.getBoundingClientRect()
    cena.renderer = new WebGLRenderer({
        alpha: true,
        antialias: false,
    })
    cena.renderer.setSize( element.width, element.height )
    cena.renderer.setPixelRatio(window.devicePixelRatio)
    let r = cena.renderer.domElement

    r.className = "tresDe"
    r.style.left = rect.left + "px"
    r.style.top = rect.top + "px"
    r.style.width = rect.width + "px"
    r.style.height = rect.height + "Px"

    window.addEventListener("resize", event=>{
        const rect = element.getBoundingClientRect()
        r.style.left = rect.left + "px"
        r.style.top = rect.top + "px"
        r.style.width = rect.width + "px"
        r.style.height = rect.height + "Px"
    })

    document.body.appendChild( r )

    cena.scene = new Scene()
    cena.scene.add(
        new AmbientLight(0xFFFFFF,0.5)
    )
    const directionalLight = new DirectionalLight( 0xffffff, 1 );
    
    directionalLight.position.z = 3
    directionalLight.position.x = 4
    directionalLight.position.y = 10
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

    // const geometry = new BoxGeometry( 1, 0.4, 0.4)
    // const material = new MeshStandardMaterial({ color : 0x00FF00 })

    

    loader.parse(carro_mesh,"", function({/** @type {Object3D} */ scene,scenes,cameras,animations,asset}){
        scene.rotation.y = Math.PI*0.5
        scene.scale.set(0.5,0.5,0.5)
        cena.carro.add(scene)
    })

    // não estou usando isso aqui ainda por causa do base do vite.
    // loader.load( "./carro.gltf", function({scene,scenes,cameras,animations,asset}){
    //     scene.rotation.y = Math.PI*0.5
    //     scene.scale.set(0.5,0.5,0.5)
    //     cena.carro.add(scene)
    // })

    cena.carro = new Object3D() // Mesh( geometry, material )
    cena.scene.add( cena.carro )

    cena.camera.position.z = 3
    cena.camera.position.y = 3
    cena.camera.lookAt(new Vector3(0,0,0))
}

// como o carro vai ser só um mesh "estático", isso é aceitável.
function girarCarro( angulo ){
    cena.carro.rotation.y = -(((angulo*16)|0)/16)
}

function resetarCarro(){
    // limpar as explosões...
    cena.renderer.clear()
    for(let p of cena.particulas){
        cena.scene.remove(p.object)
    }
    cena.particulas = []
    // resetar o carro...
    cena.carro.visible=true
}

function explodirCarro(){
    let particulas = [
        new Explosao(0,0,0),
    ]    
    let spreadX = 1.2
    let spreadZ = 1
    for(let i = 0; i < 10; i++){
        particulas.push(
            new Fumaca(
                spreadX * (Math.random() -0.5),
                0.1,
                spreadZ * (Math.random() -0.5)
            )
        )
    }
    for(let particula of particulas){
        cena.addParticula( particula )
    }
    cena.carro.visible=false
}

function renderizar3D(){
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

function setZoom(zoom){
    cena.camera.position.z = 2 + (1- zoom/12)*7
    cena.camera.position.y = 2 + (1- zoom/12)*7
    // cena.camera.lookAt(new Vector3(0,0,0))
}

export {
    init3D,
    girarCarro,
    renderizar3D,
    setZoom,
    resetarCarro,
    explodirCarro
}
