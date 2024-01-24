
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "./config.js"
import { RoadSegment } from "./coisas/RoadSegment.js"
import { Carro } from "./coisas/Carro.js"
import { Camera } from "./coisas/Camera.js"
import { init3D,renderizar3D, girarCarro, setZoom } from "./coisas/TresDe.js"


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
  firstSegment: undefined
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

let velocidade = 0
let steer = 0
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

const canvas = document.getElementById("myCanvas");
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

ctx.font = "14px serif";


function tick(){
  ctx.fillStyle = "#CFFDBC"
  ctx.fillRect(0,0,600,600)

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
    carro.input.throttle = 0
    carro.input.brake = 1
  } else{
    carro.input.throttle = 0
    carro.input.brake = 0
  }

  // faz a camerinha seguir os waypoints
  drawRoad(ctx)

  ctx.fillText( `${mouse.x} ${mouse.y}`, 20,20)
  camera.lookAt( carro.position )
  camera.zoom = (1 - carro.absVel / 100 )*20 + 5
  carro.update(1000/60/1000)

  // faz a pista crescer
  let endPoint = targetSegment.endPoint
  const dX = endPoint[0] - carro.position[0]
  const dY = endPoint[1] - carro.position[1]
  if(Math.sqrt( dX*dX + dY*dY) <= game.road.width*1.2){
    // tira um do começo
    game.road = road.next
    game.targetSegment = game.targetSegment.next

    // põe mais um no fim
    game.lastSegment = game.lastSegment.continue({
      radius : (2 + (Math.random()*10)|0)*20,
      to : (Math.random()-0.5)
    })
  }

  // carro.draw(ctx, camera)
  ctx.moveTo( ...camera.translate(carro.position))
  ctx.lineTo( ...camera.translate(targetSegment.endPoint))
  ctx.stroke()

  // gira o 3D lá.
  girarCarro(carro.heading)
  // zoom
  setZoom(camera.zoom)
  renderizar3D()

  requestAnimationFrame( tick )
}

document.addEventListener("DOMContentLoaded", function (event) {
    initGame()
    init3D(canvas)
    game.carro.position = startingPosition.pos
    game.carro.heading = startingPosition.angle 
    tick()
});

canvas.addEventListener("mousemove", function(/** @type {MouseEvent} */ event ){
  const rect = canvas.getBoundingClientRect();
  mouse.oldX = mouse.x
  mouse.oldY = mouse.y

  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;

  mouse.speedX = mouse.x - mouse.oldX
  mouse.speedY = mouse.y - mouse.oldY
})

canvas.addEventListener("mousedown", function (/** @type {MouseEvent} */ event){
  mouse.button[ event.button ] = true
})
canvas.addEventListener("mouseup", function (/** @type {MouseEvent} */ event){
  mouse.button[ event.button ] = false
})

document.addEventListener("keydown",event =>{
  keyboard[ event.key ] = true
})
document.addEventListener("keyup",event =>{
  keyboard[ event.key ] = false
})

export { Camera }