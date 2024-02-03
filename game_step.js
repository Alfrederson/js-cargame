//@ts-check
import { dist2d, gerarTrecho, $ } from "./coisas/util"
import * as tresD from "./coisas/TresDe"
import { GAME_TEMPO_MAXIMO_PARADO } from "./config"



export function game_step(game,keyboard,sfx,mandarHighScore){
    const {camera,carro, road, targetSegment} = game
  
    carro.input.left = keyboard.a ? 1 : 0
    carro.input.right = keyboard.d ? 1 : 0
    carro.input.throttle = keyboard.w ? 1 : 0
    carro.input.brake = keyboard.s ? 1 : 0
    carro.input.eBrake = keyboard.m ? 1 : 0
  
    // carro explodiu
    if(!game.carroExplodiu){
        carro.update(0.016) // 1 frame em segundos
        sfx.engine.on()
        sfx.engine.setFrequency(carro.rpm)      
    }else{
        sfx.engine.off()
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
      // usa a orientação a objetos para orientar os objetos
      tresD.posicionarFimDaLinha(
        game.lastSegment.startPoint[0],
        game.lastSegment.startPoint[1],
        game.lastSegment.startOrientation
      )
      tresD.posicionarArco(
        game.targetSegment.endPoint[0],
        game.targetSegment.endPoint[1],
        game.targetSegment.endOrientation
      )    
      // aumenta a gasolina
      game.carro.refuel(30)
      // faz um sonzinho
      sfx.check.play()
    }
        // tempo que a pessoa pode ficar parada.
    if(!game.valendo && --game.framesAteValer == 0 && !game.tutorial)
      game.valendo = true
    
    if(game.valendo){
      if(!game.carroExplodiu){
        game.distancia += carro.absVel * 0.016
        if(carro.absVel <= game.velocidadeAlvo){
          game.framesParado++
        }else{
          if(game.velocidadeAlvo < 30)
            game.velocidadeAlvo += carro.absVel * 0.0001
          if(--game.framesParado<0)
            game.framesParado = 0
        }
        // 2 segundos e BUM
        if(game.framesParado > 60*GAME_TEMPO_MAXIMO_PARADO){
          sfx.bomb.play()
          tresD.explodirCarro()
          game.carroExplodiu=true
          $("touchControls").style.display="none"
          mandarHighScore()
        }
      }  
      // drifting
      if(Math.abs(carro.velocity_c[1]) > Math.abs(carro.velocity_c[0]*0.4) && Math.abs(carro.velocity_c[0]) > 4){
        if(game.driftHysteresis < 30){
          game.driftHysteresis += 1
        }
        if(!game.drifting && game.driftHysteresis >= 3){
          game.drifting=true
          sfx.skid.start()
          tresD.startDrifting()
        }
      }else{
        if(game.driftHysteresis > 0){
          game.driftHysteresis -= 1
        }
        if(game.driftHysteresis <= 0){
          game.driftHysteresis=0
          if(game.drifting){
            tresD.endDrifting()
          }
          game.drifting=false
          game.carro.refuel( game.driftLength*0.2 )
          game.driftLength = 0
          sfx.skid.stop()
        }
      }
      if(game.drifting){
        game.driftLength += carro.absVel * 0.016
      }
    }
  }