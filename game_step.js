//@ts-check
import { dist2d, gerarTrecho } from "./coisas/util"
import * as tresD from "./coisas/TresDe"
import { GAME_TEMPO_MAXIMO_PARADO } from "./config"

export function game_step(game,keyboard,sfx,mandarHighScore){
    const {camera,carro, road, targetSegment} = game

    function gameOver(){
      sfx.engine.off()
      sfx.skid.stop()
      sfx.bomb.play()
      tresD.explodirCarro()
      game.carroExplodiu=true
      setTimeout( mandarHighScore, 300)     
    }    
  
    carro.input.left = keyboard.a
    carro.input.right = keyboard.d
    carro.input.throttle = keyboard.w
    carro.input.brake = keyboard.s
    carro.input.eBrake = keyboard.m
  
    if(!game.carroExplodiu){
      carro.update(0.016)
      sfx.engine.setFrequency(carro.rpm)      
    }
  
    camera.lookAt( carro.position )
    camera.zoom = (-carro.absVel / 80 )*10 + 10

    if(!game.valendo && --game.framesAteValer == 0 && !game.tutorial)
      game.valendo = true
    
    // faz a pista crescer quando chega no arco.
    let endPoint = targetSegment.endPoint
    game.distToTarget = dist2d(endPoint, carro.position)
    if(game.distToTarget <= game.road.width*0.5){
      game.distancia += game.targetSegment.length   
      game.distancia += game.driftLength*3 
      // tira um do começo
      game.road = road.next
      game.targetSegment = game.targetSegment.next
      game.lastSegment = game.lastSegment.continue(gerarTrecho())
      // faz as mudanças no mundo 3D..
      tresD.removeRoadStart()
      tresD.addRoadSegment(game.lastSegment)
      tresD.posicionarFimDaLinha(...game.lastSegment.startPoint,game.lastSegment.startOrientation)
      tresD.posicionarArco(...game.targetSegment.endPoint,game.targetSegment.endOrientation)    
      // aumenta a gasolina
      game.carro.refuel(30)

      // faz um sonzinho
      sfx.check.play()
    }
    // tempo que a pessoa pode ficar parada.
    
    if(game.valendo){
      if(!game.carroExplodiu){
        // saiu da rua = bum
        let saiuDaEstrada=true
        let road = game.road
        while(road){
          if(road.containsAnyPoint(carro.corners)){
            saiuDaEstrada=false
            break
          }
          road = road.next
        }

        // se estiver dentro da estrada e acima
        // da velocidade, ok!
        if(carro.absVel <= game.velocidadeAlvo || saiuDaEstrada){
          game.framesParado++
        }else{
          game.framesParado = 0
        }

        // A pessoa tem 120 frames pra ficar parada.
        if(game.framesParado > 60*GAME_TEMPO_MAXIMO_PARADO)
          gameOver()

        // contabiliza a velocidade.
        game.distancia += carro.absVel * 0.016
        if(game.velocidadeAlvo < 30)
          game.velocidadeAlvo += carro.absVel * 0.0001  
      }  
      // drifting
      if(Math.abs(carro.velocity_c[1]) > Math.abs(carro.velocity_c[0]*0.4) && Math.abs(carro.velocity_c[0]) > 4){
        if(++game.driftHysteresis > 30){
          game.driftHysteresis = 30
        }
        if(!game.drifting && game.driftHysteresis >= 3){
          game.drifting=true
          sfx.skid.start()
          tresD.startDrifting()
        }
      }else{
        if(game.driftHysteresis > 0)
          game.driftHysteresis -= 1
        if(game.driftHysteresis <= 0){
          game.driftHysteresis=0
          if(game.drifting){
            tresD.endDrifting()
            game.distancia+=game.driftLength*5
            game.drifting=false
            game.driftLength = 0
            sfx.skid.stop()
          }
        }
      }
      if(game.drifting){
        game.driftLength += carro.absVel * 0.016
      }
    }
  }