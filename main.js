
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  GAME_MAX_SPEED,
  GAME_GASOLINA_INICIAL,
  GAME_TEMPO_MAXIMO_PARADO,
} from "./config.js"



function $(id){
  return document.getElementById(id)
}
HTMLElement.prototype.show = function(){
  this.classList.remove("hidden")
}
HTMLElement.prototype.hide = function(){
  this.classList.add("hidden")
}

import * as ui from "./coisas/Ui.js"

// nota: esse módulo não é público!!!!!!!!
// usar o dummy abaixo para rodar o jogo localmente.
// import * as leaderboard from "./deixar_do_lado_de_fora/Leaderboard.js"

// import {
//   LEADERBOARD_API_KEY,
//   LEADERBOARD_URL,
//   LEADERBOARD_GAME_ID
// } from "./leaderboard.config.js"

const LEADERBOARD_API_KEY = "qualquer coisa"
const LEADERBOARD_URL = "qualquer coisa"
const LEADERBOARD_GAME_ID = "qualquer coisa"

// Ignora as gambiarras. Isso é só pra conseguir rodar sem o leaderboard.
const leaderboard = {
  meu_score:0,
  meu_nome:"",
  getPlayerId(url,playerName){
    this.meu_nome = "jogando local"
    return new Promise ( (resolve, _)=>{
      resolve({
        playerName : playerName,
        playerId : 123456
      })
    })
  },
  submitScore(bla,blabla,{playerName,score}){
    this.meu_score=score
    return new Promise( (resolve,reject) => resolve() )
  },
  getLeaderboard(url,gameId){
    return [
      {place : 1, player_name : "El Gato", total_score : 1000},
      {place : 2, player_name : "El Gato", total_score : 1000},
      {place : 3, player_name : "El Gato", total_score : 1000},
      {place : 9999, player_name : "jogando local", total_score : this.meu_score},
    ]
  }
}


import { RoadSegment } from "./coisas/RoadSegment.js"
import { Carro } from "./coisas/Carro.js"
import { Camera } from "./coisas/Camera.js"
import * as tresD from "./coisas/TresDe.js"
import { dist2d, fazer, vec2_angle, vec2_sub } from "./coisas/util.js"

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

  // isso é pro placar.
  identidade : {},

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


async function mandarHighScore(){
  // primeiro a gente salva só localmente
  if(game.distancia > game.maiorDistancia){
    game.maiorDistancia = game.distancia
  }else{
    // a pessoa não se superou o bastante.
    return
  }
  localStorage.setItem("maiorDistancia", game.maiorDistancia)
  // sim, isso vai ter um comportamento bizarro se o servidor não responder.
  // por sorte, o cloudflare é bem rápido.
  // depois a gente manda pro leaderboard, que na verdade ignora esse valor salvo.
  try{
    await leaderboard.submitScore(LEADERBOARD_URL, LEADERBOARD_API_KEY, { gameId: LEADERBOARD_GAME_ID, score: game.distancia})
    const placar = await leaderboard.getLeaderboard(LEADERBOARD_URL, LEADERBOARD_GAME_ID)
    // placar é assim:
    // [{
    //       "place": "1",
    //       "player_name": "El Gato",
    //       "total_score": "154.00"
    // },...]
    $("leaderboard").show()
    let medalha = ["", "🥇", "🥈","🥉"];
    let html = "<tr><td>#</td><td></td><td></td></tr>"
    $("tb_Leaderboard").innerHTML = ""
    for(let {place,player_name,total_score} of placar){
      html += `<tr><td>${place+(medalha[place] ?? "")}</td><td>${player_name}</td><td>${(parseFloat(total_score)/1000).toFixed(2)}km</td></tr>`
    }
    $("tb_Leaderboard").innerHTML = html  
  }catch(e){
    console.log("não enviei o score porque: ", e)
  }
}

function tick(){
  const ctx = game.ctx
  const {camera,carro, road, targetSegment} = game

  ctx.clearRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT)

  if(keyboard.hit("r")){
    $("leaderboard").hide()
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
    game.canvas = $("myCanvas");

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
  // perguntar o nome se a pessoa nunca jogou
  fazer("ver_o_manual").uma_so_vez(
      ok =>{
        $("manual").show()
        $("btn_hideManual").onclick = ()=>{
          $("manual").hide()
          ok()
        }
      },
      ok =>{
        $("playerName").show()
        $("fm_playerName").onsubmit = event =>{
          event.preventDefault()
          let nome = $("in_playerName").value.trim()
          if(nome.length < 3 || nome.length > 20)
            return $("in_playerName").setCustomValidity("🤔")
          // pelo código eu misturo esse estilo de promise com await porque
          // eu não fui capaz de fazer essa coisa aceitar funções asincronas.
          leaderboard.getPlayerId( LEADERBOARD_URL, nome ).then( resposta =>
            game.identidade = resposta
          ).catch(
            erro => console.log("não pude obter identidade porque: ", erro)
          )
          $("playerName").hide()
          ok()
        }
      }
  )
}

export { Camera }