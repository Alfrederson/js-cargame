//@ts-check
import { GameState } from "./GameState";

import * as collision from "./coisas/Collision"
import * as vec2 from "./coisas/vec2"

import { pick_any } from "./coisas/util";

let checkCollisions=false
/**
 * 
 * @param {GameState} game 
 */
export function trafego(game){
    // trafego
    checkCollisions = !checkCollisions
    for(let zumbi  of game.trafego){
      if(game.ladoDoAcidente == zumbi.side){
        continue
      }

      zumbi.update(0.016)
      if(zumbi.rua.removed || zumbi.saiuDoPercurso){
        zumbi.saiuDoPercurso=false
        zumbi.rua = game.lastSegment
        zumbi.percurso = pick_any(0.25,0.5,0.75,1) * game.lastSegment.length
        zumbi.side = pick_any(1,-1)
        zumbi.velocidade = -zumbi.side * 0.4
        continue
      }

      zumbi.obj
        .setPos(zumbi.position[0],0,zumbi.position[1])
        .setRot(0,(zumbi.orientation- Math.sign(zumbi.side) ) * Math.PI,0)
  
      const out = {}
      
      if(!checkCollisions || game.carroExplodiu)
        continue

      if(collision.colidem(zumbi,game.carro,out)){
        game.gameOver()
        game.ladoDoAcidente = zumbi.side

        zumbi.velocidade = 0

        game.carro.velocity = vec2.mul(zumbi.velocity,25)
        game.carro.yawRate = 5 * pick_any(-1,1)
      }
    }
}