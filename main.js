
//@ts-check
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  GAME_MAX_SPEED,
  GAME_GASOLINA_INICIAL,
  GAME_TEMPO_MAXIMO_PARADO,
} from "./config.js"
/**
 * @param {string} id
 */
function $(id){
  return document.getElementById(id)
}
// @ts-ignore
HTMLElement.prototype.show = function(){
  this.classList.remove("hidden")
}
// @ts-ignore
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
  getPlayerId(url,playerName){
    return new Promise ( (resolve, _)=>{
      resolve({
        playerName : playerName,
        playerId : 123456
      })
    })
  },
  /**
   * @param {string} bla
   * @param {string} blabla
   */
  submitScore(bla,blabla,{gameId,score}){
    this.meu_score=score
    return new Promise( (resolve,reject) => resolve() )
  },
  /**
   * @param {string} url
   * @param {string} gameId
   */
  getLeaderboard(url,gameId){
    return [
      {place : 1, player_name : "El Gato", total_score : 1000},
      {place : 2, player_name : "El Gato", total_score : 1000},
      {place : 3, player_name : "El Gato", total_score : 1000},
      {place : 9999, player_name : "jogando local", total_score : this.meu_score, you : true},
    ]
  }
}


import { RoadSegment } from "./coisas/RoadSegment.js"
import { Carro } from "./coisas/Carro.js"
import { Camera } from "./coisas/Camera.js"
import * as tresD from "./coisas/TresDe.js"
import { dist2d, fazer, vec2_angle, vec2_dp, vec2_add, vec2_mul, vec2_sub } from "./coisas/util.js"

const game = {
  /** @type { Camera } */
  camera : new Camera(SCREEN_WIDTH,SCREEN_HEIGHT),
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

  // contador de frames pra coisas aleatórias
  frames :0,

  distToTarget : 0,

  // contador de frames de drifting. não serve pra nada!
  driftHysteresis:0,
  driftLength:0,

  tutorial : false,
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
    this.driftHysteresis=0,
    this.driftLength=0,
    this.camera.zoom = 10
  }
}

function gerarTrecho(){
  const comprimento = 40*Math.round( (1+Math.random()*9) )/10
  const angulo = 0.4*Math.round( 1+Math.random()*9 )/10
  const radius = comprimento/angulo
  return {
    radius,
    to : Math.random() > 0.5 ? angulo : -angulo
  }
}



function initGame(){
  let maiorDistanciaSalva = localStorage.getItem("maiorDistancia")
  if(maiorDistanciaSalva !== null){
    game.maiorDistancia = parseFloat( maiorDistanciaSalva )
  }
  tresD.clearRoad()
  game.carro = new Carro()
  game.reset()
  game.firstSegment = game.road = new RoadSegment({
    center: [0,0],
    radius: 30,
    from  : 0,
    to    : -0.2,
    width : 10,
    prev : undefined
  })
  let parts = Array.from({length : 8}, gerarTrecho)
  let segment = game.road, i = 0
  let startingPosition = [0,0]
  while( parts.length > 0){
    i++
    segment = segment.continue( parts.pop() )
    // o quarto pedacinho é o que vai fazer a estrada crescer
    // quando a gente chegar nele.
    if(i==2){
      startingPosition = vec2_mul( vec2_add( segment.startPoint, segment.clockwise ? segment.startPointRight : segment.startPointLeft ), 0.5 )
      game.carro.heading = (segment.from + (segment.clockwise ? 0.5 : -0.5)) * Math.PI
    }
    if(i==5)
      game.targetSegment=segment
    tresD.addRoadSegment( segment )
  }

  game.lastSegment = segment
  game.carro.position = startingPosition
  game.camera.setPos( startingPosition )

  // gera o mesh da rua...
  
}

const keyboard = {
  _holding : {},
  hit(key){
    if(this[key] && !this._holding[key]){
      this._holding[key] = true
      return true
    }
    this._holding[key] = this[key]
    return false
  }
}


async function mandarHighScore(){
  // primeiro a gente salva só localmente
  let vouMandar=false
  if(game.distancia > game.maiorDistancia){
    game.maiorDistancia = game.distancia
    vouMandar = true
  }
  localStorage.setItem("maiorDistancia", game.maiorDistancia)
  // sim, isso vai ter um comportamento bizarro se o servidor não responder.
  // por sorte, o cloudflare é bem rápido.
  // depois a gente manda pro leaderboard, que na verdade ignora esse valor salvo.
  // tem que demorar uns 2 segundos e depois mostrar a tabela.
  // se a pessoa reiniciar antes disso, não mostra.
  try{
    if(vouMandar){
      await leaderboard.submitScore(LEADERBOARD_URL, LEADERBOARD_API_KEY, { gameId: LEADERBOARD_GAME_ID, score: game.distancia})
    }
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
    for(let {place,player_name,total_score,you} of placar){
      html += `<tr${you ? ' class="table-info"' : ""}><td>${place+(medalha[place] ?? "")}</td><td>${player_name}</td><td>${(parseFloat(total_score)/1000).toFixed(2)}km</td></tr>`
    }
    $("tb_Leaderboard").innerHTML = html  
  }catch(e){
    console.log("não enviei o score porque: ", e)
  }
}

function game_step(game){

  const {ctx,camera,carro, road, targetSegment} = game

  const {screenWidth,screenHeight} = camera

  carro.input.left = keyboard.a ? 1 : 0
  carro.input.right = keyboard.d ? 1 : 0
  carro.input.throttle = keyboard.w ? 1 : 0
  carro.input.brake = keyboard.s ? 1 : 0
  carro.input.eBrake = keyboard.m ? 1 : 0

  // guzzuloine
  game.gasolina -= 0.08 * carro.input.throttle
  if(game.gasolina <= 0){
    carro.input.throttle = 0
    carro.input.reverse = 0
    game.gasolina = 0
  }

  // carro explodiu
  if(!game.carroExplodiu){
    carro.update(0.016) // 1 frame em segundos
  }

  // faz a camera olhar o carro.
  camera.lookAt( carro.position )
  camera.zoom = (-carro.absVel / 100 )*10 + 10

  // faz a pista crescer quando chega no tanque.
  let endPoint = targetSegment.endPoint
  game.distToTarget = dist2d(endPoint, carro.position)
  if(game.distToTarget <= game.road.width*0.5){
    game.distancia += game.targetSegment.length    
    // tira um do começo
    game.road = road.next
    game.targetSegment = game.targetSegment.next
    tresD.removeRoadStart()
    // põe mais um no fim
    game.lastSegment = game.lastSegment.continue(gerarTrecho())

    tresD.addRoadSegment(game.lastSegment)

    // aumenta a gasolina
    game.gasolina = Math.min(GAME_GASOLINA_INICIAL, game.gasolina + 30)
  }
  
  let lentoDemais = false
  // tempo que a pessoa pode ficar parada.
  if(!game.valendo && --game.framesAteValer == 0 && !game.tutorial)
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
        $("touchControls").style.display="none"
      }
    }  


    // drifting
    if(Math.abs(carro.velocity_c[1]) > Math.abs(carro.velocity_c[0]*0.4)){
      if(game.driftHysteresis < 30){
        game.driftHysteresis += 1
      }
      if(!game.drifting && game.driftHysteresis >= 3){
        game.drifting=true
        tresD.startDrifting()
      }
    }else{
      if(game.driftHysteresis > 0){
        game.driftHysteresis -= 0.75
      }
      if(game.driftHysteresis <= 0){
        if(game.drifting){
          tresD.endDrifting()
        }
        game.drifting=false
        game.driftLength = 0
      }
    }
    if(game.drifting){
      game.driftLength += carro.absVel * 0.016
    }

    // a gente tá misturando operação de desenho onde não é pra ter operação de desenho.
    ctx.save()
    ctx.font = "48px monospace"
    ctx.fillText((game.distancia/1000).toFixed(2)+"km", 20, 60)
    if(game.maiorDistancia){
      ctx.font = "36px monospace"
      ctx.fillText((Math.max(game.distancia,game.maiorDistancia)/1000).toFixed(2)+"km", 20, 100)
    }
    ctx.restore()
  }

  ui.velocimetro(ctx, screenWidth*0.3, screenHeight-60, carro.absVel,GAME_MAX_SPEED, game.velocidadeAlvo)
  ui.medidorDeGasolina(ctx, screenWidth*0.3+120, screenHeight-8, game.gasolina)
  if(lentoDemais)
    ui.mostrarBomba(ctx,screenWidth/2,screenHeight/2-60,(GAME_TEMPO_MAXIMO_PARADO - (game.framesParado/60)).toFixed(2))   
}

function tentarDenovo(){
  $("leaderboard").hide()
  tresD.resetarCarro()
  initGame()  
}

function tick(){
  game.frames++
  const ctx = game.ctx
  const {camera,carro, road, targetSegment} = game
  const {screenWidth,screenHeight} = camera
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)

  if(keyboard.hit("r")){
    tentarDenovo()
  }

  // game.road.draw(ctx, game.camera)

  game_step(game)
  const endPoint = targetSegment.endPoint
  const endpointProjetado = tresD.projetar(endPoint, camera.screenWidth, camera.screenHeight)
  ctx.save()
  ctx.translate(endpointProjetado[0],endpointProjetado[1])
  ctx.scale(4,4)
  ctx.fillText( "⛽", 0, 0)
  ctx.restore()

  if(game.distToTarget > 20){
    let angulo =  vec2_angle( vec2_sub( endPoint, carro.position ) ) // Math.atan2( dY, dX )
    ui.indicadorPalhaco(ctx,
      screenWidth/2,
      screenHeight/2,
      angulo
    ) 
  }

  // carro.draw(ctx, camera)

  // NOTA: o carro 3D está em um espaço diferente.
  tresD.posicionarCarro(carro.position[0],carro.position[1],carro.heading)
  tresD.setZoom(camera.zoom)
  tresD.renderizar3D()

  // indicador de drift

  if( game.driftLength > 0 ){
    ctx.save()
    ctx.textAlign="center"
    ctx.textBaseline="bottom"
    ctx.translate(screenWidth*0.5,screenHeight*0.1)
    const s = 3 + Math.abs(Math.cos(game.frames*0.2)*0.25)
    ctx.scale(s,s)
    ctx.fillText("DRIFTING!",0,0)
    ctx.fillText(game.driftLength.toFixed(2),0,20)
    ctx.restore()
  }

  requestAnimationFrame( tick )
}


// A gente tem que dar um jeito de deixar isso bonito no celular também.
document.addEventListener("DOMContentLoaded", function (event) {
    /** @ts-expect-error */
    game.canvas = $("myCanvas");
    /** @type {CanvasRenderingContext2D} */
    game.ctx = game.canvas.getContext("2d");
    function fitCanvas(){
      // idealmente a gente tem que limpar camera...
      game.ctx.clearRect(0,0,game.canvas.width,game.canvas.height)
      const {height,width} = document.body.getBoundingClientRect()
      if(height > width){
        game.camera.screenWidth = SCREEN_WIDTH
        game.camera.screenHeight = SCREEN_WIDTH * (height/width)
      }else{
        game.camera.screenHeight = SCREEN_HEIGHT
        game.camera.screenWidth = SCREEN_HEIGHT * (width/height)
      }
      game.canvas.width = game.camera.screenWidth
      game.canvas.height = game.camera.screenHeight
    }

    window.addEventListener("resize", event =>{
      fitCanvas()
      tresD.handleResize(game.canvas)
    })

    initInput()
    // se a pessoa nunca jogou:
    // - mostra o manual
    // - deixa a pessoa dirigir sem valer
    // - pergunta o nome
    fazer("ver_o_manual").uma_so_vez(
      ok =>{
        game.tutorial=true
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
          game.tutorial=false
          initGame()
          ok()
        }
      }
    )
    
    
    fitCanvas()
    tresD.init(game.canvas)
    initGame()
    
    tick()
});

function initInput(){
  // TODO: fazer os controles de toque!
  document.onkeydown = ({key}) => keyboard[ key ] = true
  document.onkeyup = ({key}) => keyboard[ key ] = false

  // controles de toque/botão
  $("btn_tryAgain").onclick = function(){
    $("touchControls").style.display="block"
    tentarDenovo()
  }

  document.querySelectorAll("[data-kb]").forEach( (/** @type {HTMLElement} */elemento) =>{
    const key = elemento.getAttribute("data-kb")
    elemento.ontouchstart = function(){
      keyboard[key]=true
    }
    elemento.ontouchend = function(){
      keyboard[key]=false
    }
  })
}

export { Camera }