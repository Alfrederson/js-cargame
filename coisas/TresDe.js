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
    PlaneGeometry,
    Vector4,
    Material,
} from 'three'

import {
    GLTFLoader 
// @ts-ignore
} from 'three/addons/loaders/GLTFLoader';

import { RoadSegment } from './RoadSegment';
import { Carro } from './Carro';

/** @interface */
class Particula{
    object = undefined
    finished = false
    tick(){}
}

const bola = new BoxGeometry(1,1,1)
const plano = new PlaneGeometry(1,1)

class Explosao{
    /** @type {Mesh} */
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
            // @ts-ignore
            this.object.material.opacity *= 0.5
        }
        this.object.scale.set(this.scale, this.scale, this.scale)
        this.finished = (++this.lifeTime > 160)
    }
}


class Fumaca{
    /** @type {Mesh} */
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
        // @ts-ignore
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

    /** @type {GameObject[]} */
    objects : [],

    carro : new Object3D(), // isso é só o centro do carro.


    /** @type {Mesh?} */
    carroBody : undefined, // isso é o modelo.

    /** @type {WebGLRenderer?} */
    renderer : undefined,

    /** @type {PerspectiveCamera?} */
    camera : undefined,

    /** @type {Object3D} */
    cameraRoot : new Object3D(),


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
 * @typedef {Object} DownloadedModel
 * @property {boolean} [loading]
 * @property {string} [modelName]
 * @property {Mesh} [mesh]
 * @property {Material} [material]
 * @property {Array<function(DownloadedModel): void>} [queue]
 * 
*/

/**
 * @type {Map<string,DownloadedModel>}
 */
const meshMap = new Map()

export class GameObject {
    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     */
    setColor(r, g, b) {
        this.material && this.material.color.set(r,g,b)
    }
    root = new Object3D()

    /** @type {Object3D?} */
    model = undefined

    /** @type {MeshStandardMaterial?} */
    material = undefined

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setPos(x,y,z){
        this.root.position.set(x,y,z)
        return this
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setRot(x,y,z){
        this.root.rotation.set(x,y,z)
        return this
    }
    /**
     * marca o objeto para ser removido no próximo loop.
     */
    remove(){
        if(this.material){
            this.material.dispose()
        }
        cena.scene.remove(this.root)
    }


    hide(){
        this.root.visible = false
    }
}

/**
 * 
 * @param {string} modelName 
 * @returns {GameObject}
 */
export function addObject(modelName, {scale=1, rotation=Math.PI*0.5, width=undefined, depth=undefined, recolor=false}){
    const obj = new GameObject()

    // bounding box
    // if(width && depth){
    //     const boxGeom = new BoxGeometry(depth,1.2,width)
    //     const boxMesh = new Mesh(boxGeom, new MeshBasicMaterial({color: 0xFF0000, wireframe: true}))
    //     boxMesh.position.y = 0.6
    
    //     obj.root.add(boxMesh)    
    // }

    // pega um mesh...
    const existing = meshMap.get(modelName)
    if(!existing){
        // carrega.

        const pendingMesh = {
            modelName,
            loading:true,
            queue : [],
            mesh : undefined
        }

        meshMap.set(modelName,pendingMesh)

        loader.load( `./${modelName}.gltf`, function({scene,scenes,cameras,animations,asset}){
            console.log("carregado",modelName)
            scene.rotation.y = rotation
            scene.scale.set(scale,scale,scale)
            let material = scene.children[0].material
            if(material && material.map)
                pixelate(material.map)
            else
                material = new MeshStandardMaterial({color:0xFF00FF})
            // essa não é a primeira vez que pediram esse modelo.
            let existing = meshMap.get(modelName)
            if(existing)
                existing.queue.forEach(
                    callback => callback({modelName, mesh:scene, material})
                )
            meshMap.set(modelName,{
                modelName,
                mesh : scene,
                material,
                loading: false,
                queue: []
            })            
            // clonba a cena...
            const copy = scene.clone()
            if(recolor){
                const copyMat = material.clone()
                copy.children[0].material = copyMat
                obj.material = copyMat
            }
    
            obj.root.add(copy)
            obj.model = copy
        })
    }else{
        const useExisting = (/** @type{ DownloadedModel } */ existing) => {
            const {mesh,material} = existing
            const copy = mesh.clone()   
    
            if(recolor){
                const copyMat = material.clone()
                // @ts-ignore
                copy.children[0].material = copyMat
                // @ts-ignore
                obj.material = copyMat            
            }
    
            obj.root.add(copy)
            obj.model = copy
        }

        if(existing.loading)
            existing.queue.push(useExisting)
        else
            useExisting(existing)
    }

    cena.objects.push(obj)
    cena.scene.add(obj.root)
    return obj
}

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

    cena.cameraRoot.add( cena.camera )

    cena.scene.add( cena.cameraRoot )

     cena.camera.position.z = 5
     cena.camera.position.y = 5
     cena.camera.lookAt(new Vector3(0,0,0))
}

// como o carro vai ser só um mesh "estático", isso é aceitável.
let oldX = 0, oldY = 0, driftCounter=0
/**
 * @param {Carro} carro
 * @param {GameObject} obj
 */
export function posicionarCarro( carro, obj ){
    const [x,y] = carro.position
    const angulo = carro.heading

    obj.setPos(x,0,y).setRot(0,-angulo,0)

    if(cena.state.drifting){
        if( ++driftCounter == 2){
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
    return this
}

export function lookAt( x,y,z ){
    // let delta = new Vector3(x,y,z).sub(cena.cameraRoot.position).multiplyScalar(0.2)
    // cena.cameraRoot.position.add(delta)
    cena.cameraRoot.position.set( x,y,z )
}


export function reset(){
    for(let p of cena.particulas){
        cena.scene.remove(p.object)
    }
    cena.particulas = []
    for(let o of cena.objects){
        o.remove()
    }
    cena.objects = []
    
    cena.state.drifting = false
}

export const fx = {
    /**
     * @param {number} x
     * @param {any} y
     * @param {number} z
     */
    explosao(x,y,z){
        cena.addParticula(
            new Explosao(x,y,z)
        )
        let spreadX = 1.2
        let spreadZ = 1
        for(let i = 0; i < 10; i++){
            cena.addParticula(
                new Fumaca(
                    x + spreadX * (Math.random() -0.5),
                    0.1,
                    z + spreadZ * (Math.random() -0.5)
                )
            )
        }
    }
}

export function startDrifting(){
    cena.state.drifting=true
    return this
}
export function endDrifting(){
    cena.state.drifting=false
    return this
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


    const vp = new Vector4()
    cena.renderer.getViewport(vp)

    cena.renderer.render( cena.scene, cena.camera )

    return this
}

/**
 * @param {number} zoom
 */
export function setZoom(zoom){
    cena.camera.position.z = 5 + (1- zoom/12)*11
    cena.camera.position.y = 5 + (1- zoom/12)*11
    return this
}


export const road = {
    clear(){
        cena.road.forEach( x => {
            cena.scene.remove(x.mesh)
            x.geometry.dispose()
        })
        return this
    },
    /**
     * Adiciona um segmento de rua no 3D...
     * @param {RoadSegment} segment 
     */
    addSegment(segment){
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
        return this
    },
    posicionarFimDaLinha(x,y,a){
        cena.fimDaLinha.position.set(x,1,y)
        cena.fimDaLinha.rotation.set(0,-a+Math.PI*0.5,0)
        return this
    },
    posicionarArco(x,y,a){
        cena.arco.position.set(x,3,y)    
        cena.arco.rotation.set(0,-a+Math.PI*0.5,0)
        return this
    },
    removeRoadStart(){
        let trecho = cena.road.shift()
        if(trecho){
            cena.scene.remove(trecho.mesh)
            trecho.geometry.dispose()
        }
        return this
    }    
}

// faz exatamente o que parece.
/**
 * @param {number[]} point
 * @param {number} width
 * @param {number} height
 */
export function projetar([x,y], width,height){
    const ponto = new Vector3(x,0,y)
    const projetado = ponto.project( cena.camera )
    return [(projetado.x+1)*0.5*width, (1-projetado.y)*0.5*height]
}