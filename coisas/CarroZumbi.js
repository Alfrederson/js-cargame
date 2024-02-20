/**
 * Carros nos quais o jogador pode bater (e perder o jogo)
 * A única coisa que eles fazem é seguir a estrada
 */


import { RoadSegment } from "./RoadSegment"
import { GameObject } from "./TresDe"

import * as collision from "./Collision"
import * as vec2 from "./vec2"

export class CarroZumbi {

    /** @type {GameObject} */
    obj = undefined

    // isso é o dX/dT , dY/dT.
    // a velocidade lá embaixo é só a velocidade com que
    // o carro segue o percurso.
    velocity = [0,0]
    position = [0,0]
    orientation = 0

    side = 0.5
    velocidade = -0.25
    percurso = 0

    colBoxWidth = 1.1
    colBoxDepth = 2.5

    ticks=0

    saiuDoPercurso = false

    bebado = Math.random() > 0.9

    /** @type {RoadSegment} */
    rua

    /**
     * 
     * @param {RoadSegment} rua
     * @param {any} initial 
     */
    constructor(rua, initial){
        this.rua = rua
        this.position = this.rua.startPoint

        Object.entries(initial).forEach ( ([key,value]) =>{
            if(this.hasOwnProperty(key))
                this[key] = value
        })
    }


    get shapes(){
        return [{
            type : collision.RECT,
            position : this.position,
            width : this.colBoxWidth,
            depth : this.colBoxDepth,
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
        this.ticks++

        let oldpos = [...this.position]

        // motorista bêbado
        let desvio = this.bebado ? Math.cos(this.ticks*0.025)*0.5 : 0

        this.percurso += this.velocidade
        const {position,rotation,segment,nextPos} = this.rua.evalPoint(this.percurso, this.side+desvio)
        this.position = position

        this.velocity = vec2.sub(position, oldpos)

        this.orientation = rotation 
        if(this.rua !== segment){
            if(segment){
                this.saiuDoPercurso = false

                this.percurso = nextPos
                this.rua = segment                    
            }else{
                this.saiuDoPercurso = true

                // looping
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