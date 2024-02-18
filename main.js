
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
// import * as leaderboard from "./coisas/LeaderboardDummy.js"
import {
  LEADERBOARD_API_KEY,
  LEADERBOARD_URL,
  LEADERBOARD_GAME_ID
} from "./leaderboard.config.js"

import { RoadSegment } from "./coisas/RoadSegment.js"
import { Carro } from "./coisas/Carro.js"

import * as tresD from "./coisas/TresDe.js"
import * as audio from "./coisas/Audio.js"

import * as vec2 from "./coisas/vec2.js"

import { show,hide, gerarTrecho, passo_a_passo, agora_ja, nunca } from "./coisas/util.js"
import { game_step } from "./game_step.js"

import { host } from "./coisas/AndroidHost.js"

import { GameState } from "./GameState.js"
import { CarroZumbi } from "./coisas/CarroZumbi.js"

const android = host()

const game = new GameState()

const sfx = {
  engine : new audio.Engine(audio.context),
  bomb : new audio.Clip(audio.context,"./sfx/honk.m4a"),
  check : new audio.Clip(audio.context,"./sfx/checkpoint.ogg",0.06),
  skid : new audio.Skid(audio.context)
}

function init_game(){
  const maiorDistanciaSalva = localStorage.getItem("maiorDistancia")
  game.maiorDistancia = parseFloat( maiorDistanciaSalva ?? "0" )
  tresD.road.clear()

  game.carro = new Carro() // joga o carro velho fora e deixa o GC lidar com ele!
  game.carro.obj = tresD.addObject("carro",{scale: 1.2, rotation: Math.PI*0.5})

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

  let segCaminhao = game.road

  while( parts.length > 0){
    i++
    segment = segment.continue( parts.pop() )
    if(i==2){
      segCaminhao = segment
      game.carro.position = vec2.avg(
        segment.startPoint,
        segment.clockwise ? segment.startPointRight : segment.startPointLeft
      )

      game.carro.heading = (segment.from + (segment.clockwise ? 0.5 : -0.5)) * Math.PI
    }
    // o quarto pedacinho é o que vai fazer a estrada crescer
    // quando a gente chegar nele.
    if(i==4)
      game.targetSegment=segment
    tresD.road.addSegment( segment )
  }
  game.lastSegment = segment

  tresD.road.posicionarFimDaLinha(...segment.startPoint,segment.startOrientation)
  tresD.road.posicionarArco(...game.targetSegment.endPoint,game.targetSegment.endOrientation)

  tresD.lookAt( game.carro.position[0], 0, game.carro.position[1] )


  // arrente vai ponha um caminhão!
  const caminhaoPos = vec2.avg(
    segCaminhao.endPoint,
    segCaminhao.clockwise ? segCaminhao.endPointLeft : segCaminhao.endPointRight
  )

  game.caminhao = new CarroZumbi(game.targetSegment)
  game.caminhao.velocidade = 0.4
  game.caminhao.side = -1

  game.caminhao.obj = tresD.addObject('caminhao',{scale:1.2, rotation: Math.PI*0.5})

  sfx.engine.on()
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
  tresD.reset()
  init_game()  
}

function tick(){
  game.frames++
  const ctx = game.ctx
  const {camera,carro, targetSegment, keyboard} = game
  const {screenWidth,screenHeight} = camera
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)

  if(keyboard.hit("r"))
    tentarDenovo()

  // game.road.draw(ctx, game.camera)
  game_step(game,sfx,mandarHighScore)

  // renderização...

  tresD.posicionarCarro(carro, carro.obj )

  // botar o caminhão no final da rua

  game.caminhao.update(0.016)

  if(game.caminhao.rua.removed){
    game.caminhao.rua = game.lastSegment
    game.caminhao.percurso = game.lastSegment.length/2
  }

  game.caminhao.obj.setPos(
    game.caminhao.position[0],
    0,
    game.caminhao.position[1]
  ).setRot(
    0,
    (game.caminhao.orientation-game.caminhao.side) * Math.PI,
    0
  )

  // if(game.caminhaoSegment && game.caminhaoSegment.prev == null){
  //   game.caminhaoSegment = game.lastSegment

  //   const caminhaoSegment = game.caminhaoSegment

  //   // arrente vai ponha um caminhão!
  //   const caminhaoPos = vec2.avg(
  //     caminhaoSegment.endPoint,
  //     caminhaoSegment.clockwise ? caminhaoSegment.endPointLeft : caminhaoSegment.endPointRight
  //   )

  //   game.caminhao.setPos(caminhaoPos[0], 0, caminhaoPos[1])
  //   game.caminhao.setRot(
  //     0,
  //     -caminhaoSegment.endOrientation
  //     ,0)
  // }

  // carro.obj.setPos( carro.position[0], 0, carro.position[1] )
  // carro.obj.setRot( 0, -carro.heading, 0)

  tresD.setZoom(
    (-carro.absVel / 80 )*10 + 10
  )
  let {x,y,z} = carro.obj.root.position
  tresD.lookAt(x,y,z)
  tresD.render()

  if(!game.carroExplodiu){  
    if(game.valendo){
      if(game.distToTarget > 20){
        let angulo =  vec2.angle( vec2.sub( targetSegment.endPoint, carro.position ) )
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

  document.onkeydown = ({key}) => game.keyboard[ key ] = 1
  document.onkeyup = ({key}) => game.keyboard[ key ] = 0

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
      game.keyboard[key]=1
    }
    elemento.ontouchend = function(){
      elemento.classList.remove("touch-down")
      game.keyboard[key]=0
    }
  })
}