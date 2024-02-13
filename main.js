
//@ts-check
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  GAME_MAX_SPEED,
  GAME_GASOLINA_INICIAL,
  GAME_TEMPO_MAXIMO_PARADO,
} from "./config.js"

import * as ui from "./coisas/Ui.js"

const h = {
  //------------------------------------------
  // canvas do jogo.
  //------------------------------------------

  /** @type {HTMLCanvasElement} */
  game_canvas :undefined,

  //------------------------------------------
  // placar
  //------------------------------------------

  /** @type {HTMLDivElement} */
  leaderboard : undefined,
  /** @type {HTMLTableElement} */
  tb_leaderboard : undefined,
  /** @type {HTMLTableElement} */
  btn_hide_leaderboard: undefined,

  //------------------------------------------
  // tentar de novo.
  //------------------------------------------
  /** @type {HTMLDivElement} */
  try_again: undefined,
  /** @type {HTMLHeadingElement} */
  h1_total_score : undefined,
  /** @type {HTMLHeadingElement} */
  h1_best_score: undefined,
  /** @type {HTMLButtonElement} */
  btn_try_again : undefined,
  /** @type {HTMLButtonElement} */
  btn_view_leaderboard : undefined,

  /** @type {HTMLDivElement} */
  manual: undefined,
  /** @type {HTMLButtonElement} */
  btn_hide_manual: undefined,

  /** @type {HTMLDivElement} */
  player_name: undefined,

  /** @type {HTMLFormElement} */
  fm_player_name: undefined,
  /** @type {HTMLInputElement} */
  in_player_name: undefined,
  /** @type {HTMLLabelElement} */
  lb_playername_feedback : undefined,

  /** @type {HTMLDivElement} */
  touch_controls: undefined
}


// nota: esse módulo não é público!!!!!!!!
// usar o dummy abaixo para rodar o jogo localmente.
 import * as leaderboard from "./deixar_do_lado_de_fora/Leaderboard.js"
//import * as leaderboard from "./coisas/LeaderboardDummy.js"
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
import { vec2_angle, vec2_add, vec2_mul, vec2_sub, show,hide, gerarTrecho, passo_a_passo, agora_ja, nunca } from "./coisas/util.js"

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

const sfx = {
  engine : new audio.Engine(audio.context),
  bomb : new audio.Clip(audio.context,"./sfx/honk.m4a"),
  check : new audio.Clip(audio.context,"./sfx/checkpoint.ogg",0.06),
  skid : new audio.Skid(audio.context)
}

function init_game(){
  const maiorDistanciaSalva = localStorage.getItem("maiorDistancia")
  game.maiorDistancia = parseFloat( maiorDistanciaSalva ?? "0" )
  tresD.clearRoad()
  game.carro = new Carro() // joga o carro velho fora e deixa o GC lidar com ele!
  game.reset()
  game.firstSegment = game.road = new RoadSegment({
    center: [0,0],
    radius: 30,
    from  : 0,
    to    : -0.2,
    width : 10,
    prev : undefined
  })
  let parts = Array.from({length:6}, gerarTrecho)
  let segment = game.road, i = 0
  while( parts.length > 0){
    i++
    segment = segment.continue( parts.pop() )
    if(i==2){
      game.carro.position = vec2_mul( vec2_add( segment.startPoint,segment.clockwise?segment.startPointRight:segment.startPointLeft ), 0.5 )
      game.carro.heading = (segment.from + (segment.clockwise ? 0.5 : -0.5)) * Math.PI
    }
    // o quarto pedacinho é o que vai fazer a estrada crescer
    // quando a gente chegar nele.
    if(i==4)
      game.targetSegment=segment
    tresD.addRoadSegment( segment )
  }
  game.lastSegment = segment
  tresD.posicionarFimDaLinha(...segment.startPoint,segment.startOrientation)
  tresD.posicionarArco(...game.targetSegment.endPoint,game.targetSegment.endOrientation)
  game.camera.setPos( game.carro.position )  
  sfx.engine.on()
}

const keyboard = {
  w : 0,
  a : 0,
  s : 0,
  d : 0,
  r : 0,
  m : 0,
  _holding : {},
  /**
   * @param {string} key
   */
  hit(key){
    if(this[key] && !this._holding[key]){
      return this._holding[key] = true
    }
    this._holding[key] = this[key]
    return false
  }
}

/**
 * @param {number} score
 * @param {number} highScore
 */
function mostrarScoreNormal(score, highScore){
  android.showAd()
  setTimeout( ()=>{
    show(h.try_again)
    h.h1_total_score.innerText = (score/1000).toFixed(2) + "km"
    h.h1_best_score.innerText = score > highScore ? "esse é seu recorde!" : "seu recorde é "+(highScore/1000).toFixed(2)+"km!"  
  },500)
}

async function mostrarPlacar(){
  android.hideAd()
  try{
    const placar = await leaderboard.getLeaderboard(LEADERBOARD_URL, LEADERBOARD_GAME_ID)
    // placar é assim:
    // [{
    //       "place": "1",
    //       "player_name": "El Gato",
    //       "total_score": "154.00"
    // },...]
    show(h.leaderboard)
    let medalha = ["🥇", "🥈","🥉"];
    let html = "<tr><td>#</td><td></td><td></td></tr>"
    h.tb_leaderboard.innerHTML = ""
    for(let {place,player_name,total_score,you} of placar){
      player_name = player_name.replace(/[<>]/g,'')
      html += `<tr${you ? ' class="table-info"' : ""}><td>${place+(medalha[place-1] ?? "")}</td><td>${player_name}</td><td>${(parseFloat(total_score)/1000).toFixed(2)}km</td></tr>`
    }
    h.tb_leaderboard.innerHTML = html  
  }catch(e){
    show(h.leaderboard)
    h.tb_leaderboard.innerHTML = "<b>Parece que estou sem internet agora...</b>"
  }
}

async function mandarHighScore(){
  h.touch_controls.style.display="none"
  if(game.distancia > game.maiorDistancia){
    game.maiorDistancia = game.distancia
    localStorage.setItem("maiorDistancia", game.maiorDistancia.toString())
    try{
      await leaderboard.submitScore(LEADERBOARD_URL, LEADERBOARD_API_KEY, { gameId: LEADERBOARD_GAME_ID, score: game.distancia})
      mostrarPlacar()
      return
    }catch(e){
      console.log("não enviei o score porque: ", e)
    }  
  }
  // deu exception ou sei lá o que.
  mostrarScoreNormal(game.distancia, game.maiorDistancia)
}

function tentarDenovo(){
  h.touch_controls.style.display="block"
  hide(h.leaderboard)
  hide(h.try_again)
  tresD.resetarCarro()
  init_game()  
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
  tresD.posicionarCarro(carro)
  tresD.setZoom(camera.zoom)
  tresD.render()

  if(!game.carroExplodiu){  
    if(game.valendo){
      if(game.distToTarget > 20){
        let angulo =  vec2_angle( vec2_sub( targetSegment.endPoint, carro.position ) )
        ui.indicadorPalhaco(ctx,screenWidth*0.5,screenHeight*0.5,angulo) 
      }  
    }
    // indicador de drift
    if( game.driftLength > 0 ){
      ctx.save()
      ctx.fillStyle ="black"
      ctx.textAlign="right"
      ctx.textBaseline="bottom"
      ctx.translate(screenWidth-20,screenHeight*0.7)
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
    document.querySelectorAll("[id]").forEach(elemento =>{
      let id = elemento.id
      if(! h.hasOwnProperty(id)){
        throw "elemento com id perdido: "+id
      }
      h[id] = elemento
    })
    Object.entries(h).forEach( ([key,e]) =>{
      if(!e){
        throw "elemento não encontrado "+key
      }
    })

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
      h.touch_controls.style.display="block"
    }else{
      h.touch_controls.style.visibility="hidden"
    }
    game.canvas = h.game_canvas;
    game.ctx = game.canvas.getContext("2d");
    function fitCanvas(){
      // idealmente a gente tem que limpar camera...
      game.ctx.clearRect(0,0,game.canvas.width,game.canvas.height)
      const [height,width] = [window.innerHeight, window.innerWidth]
      document.body.style.width = width+"px"
      document.body.style.height = height+"px"
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


    if(nunca("ver_o_manual")){
      passo_a_passo(
        proximo =>{
          game.tutorial=true
          show(h.manual)
          document.querySelectorAll("[data-tutorial]").forEach( e => e.setAttribute("data-tutorial-visible", e.getAttribute("data-tutorial")) )
          h.btn_hide_manual.onclick = ()=>{
            hide(h.manual)
            document.querySelectorAll("[data-tutorial]").forEach( e => e.removeAttribute("data-tutorial-visible") )
            proximo()
          }
        },
        proximo =>{
          // pergunta o nome do jogador...
          show(h.player_name)
          h.fm_player_name.onsubmit = event =>{
            event.preventDefault()
            let nome = h.in_player_name.value
            if (/[^\w\sÀ-ÖØ-öø-ÿ]/g.test( nome ))
              return h.lb_playername_feedback.innerText = "apenas números e letras normais, por favor"
            nome = h.in_player_name.value.trim().replace(/[<>]/g,'')
            if(nome.length < 3)
              return h.lb_playername_feedback.innerText = "nome curto demais"
            if(nome.length > 20)
              return h.lb_playername_feedback.innerText = "nome comprido demais"
            h.lb_playername_feedback.innerText = ""
            leaderboard.getPlayerId( LEADERBOARD_URL, nome ).then(resposta =>{
              game.identidade = resposta
              agora_ja("ver_o_manual")
            }).catch(
              erro => console.log("não pude obter identidade porque: ", erro)
            ).finally( ()=>{
              hide( h.player_name )
              game.tutorial=false
              init_game()
              proximo()
            })
          }          
        }
      )
    }

    fitCanvas()
    tresD.init(game.canvas)
    init_game()
    
    tick()
});

function initInput(){
  // gambi
  document.onclick = function(){
    audio.resume()
    document.onclick = undefined
  }
  document.ontouchstart = function(){
    audio.resume()
    document.ontouchstart=undefined
  }

  document.onkeydown = ({key}) => keyboard[ key ] = 1
  document.onkeyup = ({key}) => keyboard[ key ] = 0

  // controles de toque/botão
  h.btn_try_again.onclick = function(){
    android.hideAd()
    tentarDenovo()
  }

  // mostrar o placar...
  h.btn_view_leaderboard.onclick = function(){
    hide(h.try_again)
    mostrarPlacar()
  }

  h.btn_hide_leaderboard.onclick = tentarDenovo

  document.querySelectorAll("[data-kb]").forEach( (/** @type {HTMLElement} */elemento) =>{
    const key = elemento.getAttribute("data-kb")
    elemento.ontouchstart = function(){
      elemento.classList.add("touch-down")
      keyboard[key]=1
    }
    elemento.ontouchend = function(){
      elemento.classList.remove("touch-down")
      keyboard[key]=0
    }
  })
}