/*
    Isso serve SÓ PARA BOTAR O CARRINHO NA TELA, e de um jeito errado
*/
import {
    Mesh,
    WebGLRenderer,
    Scene,
    DirectionalLight,
    SpotLight,
    AmbientLight,
    Vector3,
    PerspectiveCamera,
    BoxGeometry,
    MeshStandardMaterial,
    Object3D
} from 'three'
import {
    GLTFLoader 
} from 'three/addons/loaders/GLTFLoader';

import carro_mesh from './carro_mesh';
import { PointLight } from 'three'


let cena = {
    /** @type {Mesh?} */
    carro : undefined,

    /** @type {WebGLRenderer?} */
    renderer : undefined,

    /** @type {PerspectiveCamera?} */
    camera : undefined,

    /** @type {Scene?} */
    scene : undefined
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
    
    cena.renderer.setSize( rect.width, rect.height )
    cena.renderer.setPixelRatio(window.devicePixelRatio * 0.25)
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

    const geometry = new BoxGeometry( 1, 0.4, 0.4)
    const material = new MeshStandardMaterial({ color : 0x00FF00 , wireframe: false})

    loader.parse(carro_mesh,"", function({/** @type {Object3D} */ scene,scenes,cameras,animations,asset}){
        scene.rotation.y = Math.PI*0.5
        scene.scale.set(0.5,0.5,0.5)
        cena.carro.add(scene)
    })

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

}

function explodirCarro(){

}

function renderizar3D(){
    cena.renderer.clear()
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
