import { SCREEN_WIDTH, SCREEN_HEIGHT, GAME_GASOLINA_INICIAL } from "./config"

import { Carro } from "./coisas/Carro"
import { Camera } from "./coisas/Camera.js"
import { Keyboard } from "./Keyboard"
import { CarroZumbi } from "./coisas/CarroZumbi"

export class GameState {
    keyboard = new Keyboard()
    camera = new Camera(SCREEN_WIDTH,SCREEN_HEIGHT)
    /** @type { Carro? } */
    carro = undefined
    /** @type { RoadSegment? } */
    road = undefined
    /** @type { RoadSegment? } */
    targetSegment = undefined
    /** @type { RoadSegment? } */
    lastSegment= undefined
    /** @type { RoadSegment? } */
    firstSegment= undefined
    /** @type { CanvasRenderingContext2D? } */
    ctx= undefined
    /** @type { HTMLCanvasElement? } */
    canvas= undefined
  
    // contador de frames pra coisas aleatórias
    frames =0
  
    distToTarget = 0
  
    // contador de frames de drifting. não serve pra nada!
    drifting=false
    driftHysteresis=0
    driftLength=0
  
    tutorial = false
    valendo = false
    framesAteValer = 60
    gasolina = GAME_GASOLINA_INICIAL
    framesParado = 0
    carroExplodiu = false
    velocidadeAlvo = 3
    distancia = 0
    maiorDistancia = 0

    ladoDoAcidente = 0

    ended=false
  
    // isso é pro placar.
    identidade = {}

    // tráfego.

    /** @type { CarroZumbi } */
    caminhao


    /** @type { CarroZumbi[] } */
    trafego = []

    

    /** @type {import("./GameState").GameEventHandler} */
    onInit = undefined

    reset(){
      this.ladoDoAcidente = 0
      this.velocidadeAlvo = 3
      this.distancia = 0
      this.valendo = false
      this.framesAteValer = 60
      this.gasolina = GAME_GASOLINA_INICIAL
      this.framesParado = 0
      this.carroExplodiu = false
      this.drifting=false
      this.driftHysteresis=0,
      this.driftLength=0,
      this.camera.zoom = 10

      if(this.onInit){
        this.onInit(this)
      }
    }


    /** @type {import("./GameState").GameEventHandler} */
    onGameOver = undefined

    gameOver(){
      if(this.carroExplodiu)
        return
      
      this.carroExplodiu=true

      if(this.onGameOver)
        this.onGameOver(this)
    }
}