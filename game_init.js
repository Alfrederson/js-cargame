//@ts-check
import { GameState } from "./GameState"
import { Carro } from "./coisas/Carro"
import { RoadSegment } from "./coisas/RoadSegment"
import { gerarTrecho, pick_any } from "./coisas/util"

import * as vec2 from "./coisas/vec2"
import * as tresD from "./coisas/TresDe"
import { CarroZumbi } from "./coisas/CarroZumbi"

import { sfx } from "./sfx.js"

/**
 * 
 * @param {GameState} game 
 */
export function game_init(game){
    const maiorDistanciaSalva = localStorage.getItem("maiorDistancia")
    game.maiorDistancia = parseFloat( maiorDistanciaSalva ?? "0" )
    tresD.road.clear()
    tresD.reset()
  
    game.carro = new Carro() // joga o carro velho fora e deixa o GC lidar com ele!
    const carro = game.carro


    carro.obj = tresD.addObject("carro",{recolor:true})
  
    game.firstSegment = game.road = new RoadSegment({
      center: [0,0],
      radius: 30,
      from  : 0,
      to    : -0.2,
      width : 8.5,
      prev : undefined
    })
    tresD.road.addSegment( game.firstSegment )
    let parts = Array.from({length:7}, gerarTrecho)
    let segment = game.road, i = 0
  
    game.trafego = []
  
    /**
     * @param {RoadSegment} seg
     * @param {number} side
     * @param {number} pos
     */
    function botarCaminhao(seg, side, pos) {
      if(game.tutorial)
        return

      game.trafego.push(
        new CarroZumbi(seg, {
          velocidade: 0.4 * -side,
          percurso: pos,
          side,
          obj: tresD.addObject(pick_any('caminhao','van'), {})
        })
      )
    }
  
    while( parts.length > 0){
      i++
      segment = segment.continue( parts.pop() )
      if(i==1){
        carro.position = vec2.avg(
          segment.startPoint,
          segment.clockwise ? segment.startPointRight : segment.startPointLeft
        )
        carro.heading = (segment.from + (segment.clockwise ? 0.5 : -0.5)) * Math.PI
      }
      // o quarto pedacinho é o que vai fazer a estrada crescer
      // quando a gente chegar nele.
      if(i==4)
        game.targetSegment=segment
      if(i>2)
        botarCaminhao(segment, pick_any(-1,1), 0)
          
      tresD.road.addSegment( segment )
    }
    game.lastSegment = segment
  
    tresD.road.posicionarFimDaLinha(...segment.startPoint,segment.startOrientation)
    tresD.road.posicionarArco(...game.targetSegment.endPoint,game.targetSegment.endOrientation)
    tresD.lookAt( carro.position[0], 0, carro.position[1] )
  
    sfx.skid.stop()
    sfx.engine.on()
  }