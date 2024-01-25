
import { SCREEN_WIDTH, SCREEN_HEIGHT, setScreeSize } from "./config.js"
import { RoadSegment } from "./coisas/RoadSegment.js"
import { Carro } from "./coisas/Carro.js"
import { Camera } from "./coisas/Camera.js"
import { init3D,renderizar3D, girarCarro, setZoom } from "./coisas/TresDe.js"
import { TorusKnotGeometry } from "three"

const game = {
  /** @type { Camera? } */
  camera : undefined,
  /** @type { Carro? } */
  carro : undefined,
  /** @type { RoadSegment? } */
  road : undefined,
  /** @type { RoadSegment? } */
  targetSegment : undefined,
  /** @type { RoadSegment? } */
  lastSegment: undefined,
  /** @type { RoadSegment? } */
  firstSegment: undefined,
  /** @type { CanvasRenderingContext2D? } */
  ctx: undefined,
  /** @type { HTMLCanvasElement? } */
  canvas: undefined,

  gasolina : 50
}

const parts = []
for(let i = 0; i < 7; i ++){
  parts.push({
    radius : (2 + (Math.random()*10)|0)*20,
    to : (Math.random()-0.5)*0.4
  })
}
let startingPosition = {
  pos : [0,0],
  angle : 0
}
function initGame(){
  game.carro = new Carro({})
  game.camera = new Camera(SCREEN_WIDTH,SCREEN_HEIGHT)

  game.firstSegment = game.road = new RoadSegment({
    center: [0,0],
    radius: 30,
    from  : 0,
    to    : -0.5,
    width : 10
  })

  let segment = game.road
  let i = 0
  while( parts.length > 0){
    i++
    segment = segment.continue( parts.pop() )
    // o quarto pedacinho é o que vai fazer a estrada crescer
    // quando a gente chegar nele.
    if(i==1){
      startingPosition.pos = segment.startPoint
      startingPosition.angle = segment.clockwise ? (segment.from+0.5) * Math.PI : (segment.from-0.5) * Math.PI
    }
    if(i==5){
      game.targetSegment=segment
    }
  }
  game.lastSegment = segment
  game.camera.setPos( game.road.endPoint )
  
}

function drawRoad(ctx){

  let segment = game.road
  while(segment){
    segment.draw( ctx, game.camera )
    segment = segment.next
  }
  
  ctx.fillStyle = 'lime'

  ctx.beginPath()
  ctx.moveTo(SCREEN_WIDTH/2,SCREEN_HEIGHT/2)
  ctx.stroke()
}


const keyboard = {}

const mouse = {
  oldX : 0,
  oldY : 0,

  x : 0,
  y : 0,

  speedX : 0,
  speedY : 0,

  button : []
}


// o marcador vai até quanto?
/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} velocidade 
 */
function velocimetro(ctx, x,y, velocidade){
  const max = 160
  let porcentagem = Math.min(1,velocidade/max)
  let angulo = (0.8+porcentagem* 1.4)  * Math.PI

  ctx.save()
  ctx.font = "16px monospace"
  ctx.fillStyle = "black"
  ctx.textBaseline = "top"
  ctx.textAlign = "center"
  ctx.fillText(
    "0",
    x + Math.cos( (0.8+0*1.4)*Math.PI  )* 30,
    y + Math.sin( (0.8+0*1.4)*Math.PI  )* 30,
  )
  ctx.fillText(
    max,
    x + Math.cos( (0.8+1*1.4)*Math.PI  )* 30,
    y + Math.sin( (0.8+1*1.4)*Math.PI  )* 30,
  )
  ctx.restore()

  ctx.moveTo(x,y)
  ctx.strokeStyle="red"
  ctx.lineTo( x + Math.cos(angulo) * 30, y + Math.sin(angulo) * 30 )
  ctx.stroke()
}

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} gasolina 
 */
function medidorDeGasolina(ctx, x,y, gasolina){
  ctx.save()
  ctx.fillStyle = "#000000"
  ctx.fillRect(x-1,y,10,33)
  ctx.fillStyle = "#FF0000"
  ctx.fillRect(x,y+((1-gasolina/50)*32)|0,8,((gasolina/50)*32)|0)
  ctx.fillText("⛽",x+5,y+31)
  ctx.restore()
}

let a=0,b=0,g=0
let frames = 0
function tick(){
  const ctx = game.ctx
  ctx.clearRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT)

  const {camera,carro, road, targetSegment} = game

  if(keyboard.a){
    carro.input.left = 1
  }else{
    carro.input.left = 0
  }
  if(keyboard.d){
    carro.input.right = 1
  }else{
    carro.input.right = 0
  }
  if(keyboard.w){
    carro.input.throttle = 1
  } else if(keyboard.s){
    // se tá acelerando, freia.
    //carro.input.reverse = 1
    carro.input.brake = 1    
  } else{
    carro.input.throttle = 0
    carro.input.brake = 0
    //carro.input.reverse = 0
  }


  // gasolina.
  if(game.gasolina <= 0){
    carro.input.throttle = 0
    carro.input.reverse = 0
    game.gasolina = 0
  }

  game.gasolina -= 0.08 * carro.input.throttle

  // freio de mão.
  carro.input.eBrake = keyboard.m ? 1 : 0

  drawRoad(ctx)

  camera.lookAt( carro.position )
  camera.zoom = (-carro.absVel / 100 )*10 + 10
  carro.update(1000/60/1000)

  // faz a pista crescer
  let endPoint = targetSegment.endPoint
  const dX = endPoint[0] - carro.position[0]
  const dY = endPoint[1] - carro.position[1]
  const distToTarget = Math.sqrt( dX*dX + dY*dY)
  if(distToTarget <= game.road.width*0.5){
    // tira um do começo
    game.road = road.next
    game.targetSegment = game.targetSegment.next

    // põe mais um no fim
    game.lastSegment = game.lastSegment.continue({
      radius : (2 + (Math.random()*10)|0)*20,
      to : (Math.random()-0.5)
    })

    // aumenta a gasolina
    game.gasolina = Math.min(50, game.gasolina + 30)
  }

  // carro.draw(ctx, camera)

  ctx.fillText( "⛽", ...camera.translate(targetSegment.endPoint ))

  if(distToTarget > 20){
    let angulo = Math.atan2( dY, dX )
    ctx.save()
    let palhacoX =SCREEN_WIDTH/2 + Math.cos(angulo)*50
    let palhacoY =SCREEN_HEIGHT/2 + Math.sin(angulo)*50
    ctx.fillText("🤡", palhacoX|0, palhacoY|0 )    
    
    ctx.translate(palhacoX*1.1|0,palhacoY*1.1|0)
    ctx.rotate( angulo )
    ctx.fillText("👉",0,0)

    ctx.restore()    
  }

  //ctx.font = "20px serif"
  frames++
  ctx.save()
  ctx.translate(120,SCREEN_HEIGHT-14)
  ctx.textAlign="center"
  ctx.textBaseline="middle"
  ctx.scale(1 + Math.cos(frames*0.1)*0.2,1+ Math.cos(frames*0.1)*0.2)
    ctx.fillText(
       "💣" ,
      0,
      0 
    )
  ctx.restore()

  // gira o 3D lá.
  girarCarro(carro.heading)
  // zoom
  setZoom(camera.zoom)
  renderizar3D()

  velocimetro(ctx, 40, SCREEN_HEIGHT-40, carro.absVel * 3.6)
  medidorDeGasolina(ctx, 90, SCREEN_HEIGHT-40, game.gasolina)

  requestAnimationFrame( tick )
}

document.addEventListener("DOMContentLoaded", function (event) {
    game.canvas = document.getElementById("myCanvas");

    game.canvas.width = SCREEN_WIDTH
    game.canvas.height = SCREEN_HEIGHT


    /** @type {CanvasRenderingContext2D} */
    game.ctx = game.canvas.getContext("2d");
    
    game.ctx.font = "14px serif";

    initInput()
    initGame()
    init3D(game.canvas)
    game.carro.position = startingPosition.pos
    game.carro.heading = startingPosition.angle 
    tick()
});

function initInput(){
  game.canvas.addEventListener("mousemove", function(/** @type {MouseEvent} */ event ){
    const rect = game.canvas.getBoundingClientRect();
    mouse.oldX = mouse.x
    mouse.oldY = mouse.y
  
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
  
    mouse.speedX = mouse.x - mouse.oldX
    mouse.speedY = mouse.y - mouse.oldY
  })

  let touchX
  let oldTouchX
  document.addEventListener("touchstart", function(event){
    oldTouchX = touchX = event.touches[0].clientX
    keyboard.w = true
  })
  document.addEventListener("touchmove", function(event){
    event.preventDefault()
    oldTouchX = touchX
    touchX = event.touches[0].clientX
    a = touchX - oldTouchX
    if(Math.abs(touchX - oldTouchX) > 0.5){
      if(touchX > oldTouchX){
        keyboard.d = true
        keyboard.a = false
      }else{
        keyboard.a = true
        keyboard.d = false
      }  
    }else{
      keyboard.a = false
      keyboard.d = false
    }
  })
  document.addEventListener("touchend", function(event){
    keyboard.w = false
    keyboard.a = false
    keyboard.d = false
    keyboard.s = false
  })
  
  document.addEventListener("keydown",event =>{
    keyboard[ event.key ] = true
  })
  document.addEventListener("keyup",event =>{
    keyboard[ event.key ] = false
  })  
}

export { Camera }