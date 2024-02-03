
//@ts-check
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  GAME_MAX_SPEED,
  GAME_GASOLINA_INICIAL,
  GAME_TEMPO_MAXIMO_PARADO,
} from "./config.js"

import * as ui from "./coisas/Ui.js"

// nota: esse módulo não é público!!!!!!!!
// usar o dummy abaixo para rodar o jogo localmente.
 import * as leaderboard from "./deixar_do_lado_de_fora/Leaderboard.js"
// import * as leaderboard from "./coisas/LeaderboardDummy.js"
import {
  LEADERBOARD_API_KEY,
  LEADERBOARD_URL,
  LEADERBOARD_GAME_ID
} from "./leaderboard.config.js"

import { RoadSegment } from "./coisas/RoadSegment.js"
import { Carro } from "./coisas/Carro.js"
import { Camera } from "./coisas/Camera.js"
import * as tresD from "./coisas/TresDe.js"
import * as audio from "./coisas/Audio.js"
import { fazer, vec2_angle, vec2_add, vec2_mul, vec2_sub, $, show,hide, gerarTrecho } from "./coisas/util.js"

import { game_step } from "./game_step.js"

import { host } from "./coisas/AndroidHost.js"

const android = host()

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

audio.init()
const sfx = {
  engine : new audio.Engine(audio.context),
  bomb : new audio.Clip(audio.context,"./sfx/honk.m4a"),
  check : new audio.Clip(audio.context,"./sfx/checkpoint.ogg",0.06),
  skid : new audio.Skid(audio.context)
}



function initGame(){
  let maiorDistanciaSalva = localStorage.getItem("maiorDistancia")
  if(maiorDistanciaSalva !== null)
    game.maiorDistancia = parseFloat( maiorDistanciaSalva )
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
  let parts = Array.from({length:7}, gerarTrecho)
  let segment = game.road, i = 0
  let startingPosition = [0,0]
  while( parts.length > 0){
    i++
    segment = segment.continue( parts.pop() )
    // o quarto pedacinho é o que vai fazer a estrada crescer
    // quando a gente chegar nele.
    if(i==2){
      startingPosition = vec2_mul( vec2_add( segment.startPoint,segment.clockwise?segment.startPointRight:segment.startPointLeft ), 0.5 )
      game.carro.heading = (segment.from + (segment.clockwise ? 0.5 : -0.5)) * Math.PI
    }
    if(i==4)
      game.targetSegment=segment
    tresD.addRoadSegment( segment )
  }
  game.lastSegment = segment
  tresD.posicionarFimDaLinha(
    segment.startPoint[0],
    segment.startPoint[1],
    segment.startOrientation
  )
  tresD.posicionarArco(
    game.targetSegment.endPoint[0],
    game.targetSegment.endPoint[1],
    game.targetSegment.endOrientation
  )
  game.carro.position = startingPosition
  game.camera.setPos( startingPosition )  
}

const keyboard = {
  _holding : {},
  /**
   * @param {string} key
   */
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
  android.showAd()

  // primeiro a gente salva só localmente
  let vouMandar=false
  if(game.distancia > game.maiorDistancia){
    game.maiorDistancia = game.distancia
    vouMandar = true
  }
  localStorage.setItem("maiorDistancia", game.maiorDistancia.toString())
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
    show($("leaderboard"))
    let medalha = ["", "🥇", "🥈","🥉"];
    let html = "<tr><td>#</td><td></td><td></td></tr>"
    $("tb_Leaderboard").innerHTML = ""
    for(let {place,player_name,total_score,you} of placar){
      player_name = player_name.replace(/[<>]/g,'')
      html += `<tr${you ? ' class="table-info"' : ""}><td>${place+(medalha[place] ?? "")}</td><td>${player_name}</td><td>${(parseFloat(total_score)/1000).toFixed(2)}km</td></tr>`
    }
    $("tb_Leaderboard").innerHTML = html  
  }catch(e){
    show($("leaderboard"))
    $("tb_Leaderboard").innerHTML = ""
    console.log("não enviei o score porque: ", e)
  }
}

function tentarDenovo(){
  android.hideAd()
  $("touchControls").style.display="block"
  hide($("leaderboard"))
  tresD.resetarCarro()
  initGame()  
}

function tick(){
  game.frames++
  const ctx = game.ctx
  const {camera,carro, targetSegment} = game
  const {screenWidth,screenHeight} = camera
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)

  if(keyboard.hit("r"))
    tentarDenovo()

  // game.road.draw(ctx, game.camera)
  game_step(game,keyboard,sfx,mandarHighScore)

  // renderização...
  tresD.posicionarCarro(carro.position[0],carro.position[1],carro.heading)
  tresD.setZoom(camera.zoom)
  tresD.render()

  if(!game.carroExplodiu){  

    if(game.valendo){
      if(game.distToTarget > 20){
        let angulo =  vec2_angle( vec2_sub( targetSegment.endPoint, carro.position ) ) // Math.atan2( dY, dX )
        ui.indicadorPalhaco(ctx,
          screenWidth/2,
          screenHeight/2,
          angulo
        ) 
      }  
    }

    // indicador de drift
    if( game.driftLength > 0 ){
      ctx.save()
      ctx.fillStyle ="black"
      ctx.textAlign="right"
      ctx.textBaseline="bottom"
      ctx.translate(screenWidth -20,screenHeight*0.7)
      const s = 3 + Math.abs(Math.cos(game.frames*0.2)*0.25)
      ctx.scale(s,s)
      ctx.fillText("DRIFTING!",0,0)
      ctx.fillText(game.driftLength.toFixed(2),0,20)
      ctx.restore()
    }
    ui.velocimetro(ctx, 85, 170, carro.absVel,GAME_MAX_SPEED, game.velocidadeAlvo)
    ui.medidorDeGasolina(ctx, 85, 200, game.carro.gasolina)

    if(game.framesParado)
      ui.mostrarBomba(ctx,screenWidth/2,screenHeight/2-60,(GAME_TEMPO_MAXIMO_PARADO - (game.framesParado/60)).toFixed(2))   

    ctx.save()
    ctx.fillStyle = "black"
    ctx.font = "48px monospace"
    ctx.fillText((game.distancia/1000).toFixed(2)+"km", 20, 60)
    if(game.maiorDistancia){
      ctx.font = "36px monospace"
      ctx.fillText((Math.max(game.distancia,game.maiorDistancia)/1000).toFixed(2)+"km", 20, 100)
    }
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
        show($("manual"))
        $("btn_hideManual").onclick = ()=>{
          hide($("manual"))
          ok()
        }
      },
      ok =>{
        // pergunta o nome do jogador...
        show($("playerName"))
        // se a pessoa conseguir forçar o jogo a aceitar <b>isso</b>, a
        // pessoa simplesmente não vai poder mandar o highscore nunca.
        $("fm_playerName").onsubmit = event =>{
          event.preventDefault()
          // @ts-ignore
          let nome = $("in_playerName").value.trim().replace(/[<>]/g,'')
          if(nome.length < 3 || nome.length > 20){
            return
          }
          leaderboard.getPlayerId( LEADERBOARD_URL, nome ).then(resposta =>{
            // não é usado em lugar nenhum.
            game.identidade = resposta
          }).catch(
            erro => console.log("não pude obter identidade porque: ", erro)
          ).finally( ()=>{
            hide(
              $("playerName")
            )
            game.tutorial=false
            initGame()
            ok()
          })
        }
      }
    )
    fitCanvas()
    tresD.init(game.canvas)
    initGame()
    
    tick()
});

function initInput(){
  document.onclick = function(){
    audio.resume()
    document.onclick = undefined
  }
  document.ontouchstart = function(){
    audio.resume()
    document.ontouchstart=undefined
  }
  // TODO: fazer os controles de toque!
  document.onkeydown = ({key}) => keyboard[ key ] = true
  document.onkeyup = ({key}) => keyboard[ key ] = false
  // controles de toque/botão
  $("btn_tryAgain").onclick = tentarDenovo
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