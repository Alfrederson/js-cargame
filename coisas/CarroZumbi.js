/**
 * Carros nos quais o jogador pode bater (e perder o jogo)
 * A única coisa que eles fazem é seguir a estrada
 */


import { RoadSegment } from "./RoadSegment"
import { GameObject } from "./TresDe"

import * as collision from "./Collision"

export class CarroZumbi {

    /** @type {GameObject} */
    obj = undefined

    position = [0,0]
    orientation = 0

    side = 1
    velocidade = -0.25
    percurso = 0

    /** @type {RoadSegment} */
    rua

    /**
     * 
     * @param {RoadSegment} rua 
     */
    constructor(rua){
        this.rua = rua
        this.position = this.rua.startPoint
    }


    get shapes(){
        return [{
            type : collision.RECT,
            position : this.position,
            width : 1.4,
            depth : 2.5,
            angle : this.orientation,
        }]
    }

    /**
     * 
     * @param {number} dt - delta time. a gente vai usar no futuro pra fazer o movimento ser independente de framerate... 
     */
    update(dt){
        if(!this.rua)
            return
        this.percurso += this.velocidade
        const {position,rotation,segment,nextPos} = this.rua.evalPoint(this.percurso, this.side)
        this.position = position
        this.orientation = rotation
        if(this.rua !== segment){
            if(segment){
                this.percurso = nextPos
                this.rua = segment                    
            }else{
                this.velocidade*=-1
                this.side *= -1
            }
        }
    }


    draw(ctx, camera){
        ctx.save()

        ctx.translate( ...camera.translate(this.position) )
        ctx.scale(camera.zoom, camera.zoom)
        ctx.rotate( -this.orientation )
        ctx.fillRect(-1.6,-0.8,3.2,1.6)
        ctx.restore()
    }
}