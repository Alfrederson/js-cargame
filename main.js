
const SCREEN_WIDTH = 600
const SCREEN_HEIGHT = 600

import { RoadSegment } from "./coisas/RoadSegment.js"
import { Carro } from "./coisas/Carro.js"

/** @interface */
class Camera {
  x = 0
  y = 0
  zoom = 20
  translate(pos){
    return [
      (pos[0]-this.x)*this.zoom + SCREEN_WIDTH/2,
      (pos[1]-this.y)*this.zoom + SCREEN_WIDTH/2
    ]
  }
}

const camera = new Camera()

// const parts = [
//   { radius : 160, to : 0.2 },
//   { radius : 170, to : 0.2 },
//   { radius : 180, to: 0.2 },
//   { radius : 220, to: 0.2 },
//   { radius : 220, to: 0.2 },
//   { radius : 220, to: -0.2 },
// ].reverse()

const parts = []
for(let i = 0; i < 7; i ++){
  parts.push({
    radius : (2 + (Math.random()*10)|0)*20,
    to : (Math.random()-0.5)*0.4
  })
}

/** @type {RoadSegment} */
let road
/** @type {RoadSegment} */
let targetSegment
/** @type {RoadSegment} */
let lastSegment, firstSegment

let currentWaypoint = 0
let startingPosition = {
  pos : [0,0],
  angle : 0
}
function initRoad(){
  road = new RoadSegment({
    center: [0,0],
    radius: 30,
    from  : 0,
    to    : -0.5,
    width : 10
  })

  firstSegment = road

  let segment = road
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
      targetSegment=segment
    }
  }
  lastSegment = segment
  
  ;[camera.x, camera.y] = road.endPoint

  currentWaypoint = 0
}

let velocidade = 0
let steer = 0
function drawRoad(ctx){




  let segment = road
  while(segment){
    segment.draw( ctx, camera )
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

let carro

function tick(){
  ctx.fillStyle = "#CFFDBC"
  ctx.fillRect(0,0,600,600)

  if(mouse.button[0]){
    camera.x += mouse.speedX
    camera.y += mouse.speedY 
  }

  carro.input.left = 0
  carro.input.right = 0
  if(keyboard.a){
    carro.input.left = 1
  }
  if(keyboard.d){
    carro.input.right = 1
  }
  carro.input.throttle = 0
  carro.input.brake = 0
  if(keyboard.w){
    carro.input.throttle = 1
  }
  if(keyboard.s){
    carro.input.throttle = 0
    carro.input.brake = 1
  }

  // faz a camerinha seguir os waypoints
  

  drawRoad(ctx)



  ctx.fillText( `${mouse.x} ${mouse.y}`, 20,20)

  let [x,y] = carro.position
  let dX = x - camera.x
  let dY = y - camera.y

  camera.x += dX * 0.2
  camera.y += dY * 0.2

  camera.zoom = (1 - carro.absVel / 100 )*20 + 5
  
  carro.update(1000/60/1000)

  // faz a pista crescer
  let endPoint = targetSegment.endPoint
  dX = endPoint[0] - carro.position[0]
  dY = endPoint[1] - carro.position[1]


  
  if(Math.sqrt( dX*dX + dY*dY) <= road.width*1.2){
    // tira um do começo
    road = road.next
    targetSegment = targetSegment.next

    // põe mais um no fim
    lastSegment = lastSegment.continue({
      radius : (2 + (Math.random()*10)|0)*20,
      to : (Math.random()-0.5)
    })


  }

  carro.draw(ctx, camera)
  ctx.moveTo( ...camera.translate(carro.position))
  ctx.lineTo( ...camera.translate(targetSegment.endPoint))
  ctx.stroke()
  requestAnimationFrame( tick )
}

document.addEventListener("DOMContentLoaded", function () {
    carro = new Carro({})
    initRoad()
    carro.position = startingPosition.pos
    carro.heading = startingPosition.angle 
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