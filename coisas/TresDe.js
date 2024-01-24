/*
    Isso serve SÓ PARA BOTAR O CARRINHO NA TELA, e de um jeito errado
*/
import {
    Mesh,
    WebGLRenderer,
    Scene,
    DirectionalLight,
    Vector3,
    PerspectiveCamera,
    BoxGeometry,
    MeshStandardMaterial,
} from 'three'
import { 
    GLTFLoader 
} from 'three/addons/loaders/GLTFLoader.js';


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

/**
 * 
 * @param {HTMLCanvasElement} element 
 */
function init3D(element){
    const rect = element.getClientRects().item(0)
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

    window.addEventListener("resize", event=>{
        const rect = element.getBoundingClientRect()
        r.style.left = rect.left + "px"
        r.style.top = rect.top + "px"
        r.style.width = rect.width + "px"
        r.style.height = rect.height + "Px"
    })
    document.body.appendChild( r )

    cena.scene = new Scene()
    const directionalLight = new DirectionalLight( 0xffffff, 0.5 );
    
    directionalLight.position.z = 3
    directionalLight.position.x = 4
    directionalLight.position.y = 10
    directionalLight.lookAt(new Vector3(0,0,0))

    cena.scene.add( directionalLight );

    cena.camera = new PerspectiveCamera(
        75,
        rect.width / rect.height, // isso vai ser 1 sempre.
        0.1, 
        1000
    )

    const geometry = new BoxGeometry( 1, 0.4, 0.4)
    const material = new MeshStandardMaterial({ color : 0x00FF00 , wireframe: false})

    cena.carro = new Mesh( geometry, material )
    cena.scene.add( cena.carro )

    cena.camera.position.z = 3
    cena.camera.position.y = 3
    cena.camera.lookAt(new Vector3(0,0,0))
}

// como o carro vai ser só um mesh "estático", isso é aceitável.
function girarCarro( angulo ){
    cena.carro.rotation.y = -(((angulo*10)|0)/10)
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
