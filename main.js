
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  VIRTUAL_SCREEN_WIDTH, // não sei o que vou fazer com isso ainda.
  VIRTUAL_SCREEN_HEIGHT,
  GAME_MAX_SPEED,
  GAME_GASOLINA_INICIAL,
  GAME_TEMPO_MAXIMO_PARADO
} from "./config.js"

import * as ui from "./coisas/Ui.js"

import { RoadSegment } from "./coisas/RoadSegment.js"
import { Carro } from "./coisas/Carro.js"
import { Camera } from "./coisas/Camera.js"
import * as tresD from "./coisas/TresDe.js"
import { dist2d, uma_so_vez, vec2_angle, vec2_sub } from "./coisas/util.js"

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

  valendo : false,
  framesAteValer : 60,
  gasolina : GAME_GASOLINA_INICIAL,
  framesParado : 0,
  carroExplodiu : false,
  velocidadeAlvo : 3,
  distancia : 0,
  maiorDistancia : 0,

  reset(){
    this.velocidadeAlvo = 3
    this.distancia = 0
    this.valendo = false
    this.framesAteValer = 60
    this.gasolina = GAME_GASOLINA_INICIAL
    this.framesParado = 0
    this.carroExplodiu = false

    this.camera.zoom = 10
  }
}

function estradaInicial(){
  const parts = []
  for(let i = 0; i < 7; i ++){
    parts.push({
      radius : (2 + (Math.random()*10)|0)*20,
      to : (Math.random()-0.5)*0.4
    })
  }
  return parts  
}

function initGame(){
  let maiorDistanciaSalva = localStorage.getItem("maiorDistancia")
  if(maiorDistanciaSalva !== null){
    game.maiorDistancia = parseFloat( maiorDistanciaSalva )
  }
  tresD.resetarCarro()
  game.carro = new Carro({})
  game.camera = new Camera(SCREEN_WIDTH,SCREEN_HEIGHT)
  game.reset()
  game.firstSegment = game.road = new RoadSegment({
    center: [0,0],
    radius: 30,
    from  : 0,
    to    : -0.5,
    width : 10
  })
  let parts = estradaInicial()

  let segment = game.road
  let i = 0
  while( parts.length > 0){
    i++
    segment = segment.continue( parts.pop() )
    // o quarto pedacinho é o que vai fazer a estrada crescer
    // quando a gente chegar nele.
    if(i==1){
      game.carro.position = segment.startPoint
      game.carro.heading = (segment.from + (segment.clockwise ? 0.5 : -0.5)) * Math.PI
    }
    if(i==5)
      game.targetSegment=segment
  }

  game.lastSegment = segment
  game.camera.setPos( game.road.endPoint )
}

const keyboard = {
  _holding : {},
  hit(key){
    if(this[key] && !this._holding[key]){
      this._holding[key] = true
      return true
    }else{
      if(!this[key]){
        this._holding[key] = false
      }
      return false
    }
  }
}


function mandarHighScore(){
  // primeiro a gente salva só localmente
  if(game.distancia > game.maiorDistancia){
    game.maiorDistancia = game.distancia
  }
  localStorage.setItem("maiorDistancia", game.maiorDistancia)
  // depois a gente manda pro leaderboard, que na verdade ignora esse valor salvo.
}

function tick(){
  const ctx = game.ctx
  const {camera,carro, road, targetSegment} = game

  ctx.clearRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT)

  if(keyboard.hit("r")){
    initGame()
  }
  carro.input.left = keyboard.a ? 1 : 0
  carro.input.right = keyboard.d ? 1 : 0
  carro.input.throttle = keyboard.w ? 1 : 0
  carro.input.brake = keyboard.s ? 1 : 0
  carro.input.eBrake = keyboard.m ? 1 : 0

  game.gasolina -= 0.08 * carro.input.throttle
  if(game.gasolina <= 0){
    carro.input.throttle = 0
    carro.input.reverse = 0
    game.gasolina = 0
  }

  camera.lookAt( carro.position )
  camera.zoom = (-carro.absVel / 100 )*10 + 10
  
  // carro explodiu
  if(!game.carroExplodiu){
    carro.update(0.016) // 1 frame em segundos
  }

  // faz a pista crescer
  let endPoint = targetSegment.endPoint

  const distToTarget = dist2d(endPoint, carro.position)
  if(distToTarget <= game.road.width*0.5){
    game.distancia += game.targetSegment.length    
    // tira um do começo
    game.road = road.next
    game.targetSegment = game.targetSegment.next

    // põe mais um no fim
    game.lastSegment = game.lastSegment.continue({
      radius : (2 + (Math.random()*10)|0)*20,
      to : (Math.random()-0.5)
    })

    // aumenta a gasolina
    game.gasolina = Math.min(GAME_GASOLINA_INICIAL, game.gasolina + 30)
  }

  game.road.draw(ctx, game.camera)
  // carro.draw(ctx, camera)

  ctx.fillText( "⛽", ...camera.translate(targetSegment.endPoint ))
  if(distToTarget > 20){
    let angulo =  vec2_angle( vec2_sub( endPoint, carro.position ) ) // Math.atan2( dY, dX )
    ui.indicadorPalhaco(ctx,
      SCREEN_WIDTH/2 + Math.cos(angulo)*50,
      SCREEN_HEIGHT/2 + Math.sin(angulo)*50,
      angulo
    ) 
  }
  let lentoDemais = false
  // tempo que a pessoa pode ficar parada.
  if(!game.valendo && --game.framesAteValer == 0)
    game.valendo = true
  
  if(game.valendo){
    if(!game.carroExplodiu){
      game.distancia += carro.absVel * 0.016
      if(carro.absVel <= game.velocidadeAlvo){
        game.framesParado++
        lentoDemais=true
      }else{
        if(game.velocidadeAlvo < 30){
          game.velocidadeAlvo += carro.absVel * 0.0001
        }
        if(--game.framesParado<0)
          game.framesParado = 0
      }
      // 2 segundos e BUM
      if(game.framesParado > 60*GAME_TEMPO_MAXIMO_PARADO){
        tresD.explodirCarro()
        mandarHighScore()
        game.carroExplodiu=true
        game.gasolina=0
      }
    }  
    ctx.save()
    ctx.font = "20px monospace"
    ctx.fillText((game.distancia/1000).toFixed(2)+"km", 20, 40)
    if(game.maiorDistancia){
      ctx.font = "12px monospace"
      ctx.fillText((game.maiorDistancia/1000).toFixed(2)+"km", 20, 60)
    }
    ctx.restore()
  }
  // NOTA: o carro 3D está em um espaço diferente.
  tresD.girarCarro(carro.heading)
  tresD.setZoom(camera.zoom)
  tresD.renderizar3D()

  ui.velocimetro(ctx, 40, SCREEN_HEIGHT-40, carro.absVel,GAME_MAX_SPEED, game.velocidadeAlvo)
  ui.medidorDeGasolina(ctx, 90, SCREEN_HEIGHT-40, game.gasolina)

  if(lentoDemais)
    ui.mostrarBomba(ctx,SCREEN_WIDTH/2,SCREEN_HEIGHT/2-60,(GAME_TEMPO_MAXIMO_PARADO - (game.framesParado/60)).toFixed(2))   

  requestAnimationFrame( tick )
}

// A gente tem que dar um jeito de deixar isso bonito no celular também.
document.addEventListener("DOMContentLoaded", function (event) {
    game.canvas = document.getElementById("myCanvas");

    game.canvas.width = SCREEN_WIDTH
    game.canvas.height = SCREEN_HEIGHT

    /** @type {CanvasRenderingContext2D} */
    game.ctx = game.canvas.getContext("2d");
    game.ctx.font = "14px serif";

    tresD.init3D(game.canvas)
    initInput()
    initGame()
    tick()
});

function initInput(){
  let touchX, oldTouchX
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
  document.onkeydown = ({key}) => keyboard[ key ] = true
  document.onkeyup = ({key}) => keyboard[ key ] = false
  // esconder manualzinho

  // a pessoa já jogou alguma vez?
  uma_so_vez("ver_o_manual", ()=>{
    document.getElementById("manual").classList.remove("hidden")
  })

  document.getElementById("btn_hideManual").onclick = ()=>{
    document.getElementById("manual").classList.add("hidden")
  }


  // se a pessoa morrer, vai mostrar isso aqui.
}

export { Camera }