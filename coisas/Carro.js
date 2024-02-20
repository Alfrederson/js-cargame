//@ts-check
import { GAME_GASOLINA_INICIAL } from "../config"
import { Camera } from "./Camera"
import * as collision from "./Collision"

import * as vec2 from "./vec2"
import { clamp } from "./util"

import { GameObject } from "./TresDe"

/**
 * @typedef {Object} CarroConfigOptions
 * @property {number} [gravity]
 * @property {number} [mass]
 * @property {number} [inertiaScale]
 * @property {number} [halfWidth]
 * @property {number} [cgToFront]
 * @property {number} [cgToRear]
 * @property {number} [cgToFrontAxle]
 * @property {number} [cgToRearAxle]
 * @property {number} [cgHeight]
 * @property {number} [wheelRadius]
 * @property {number} [wheelWidth]
 * @property {number} [tireGrip] - normal é 2.0
 * @property {number} [lockGrip] - entre 0.01 e 1.0
 * @property {number} [engineForce]
 * @property {number} [brakeForce]
 * @property {number} [eBrakeForce]
 * @property {number} [weightTransfer]
 * @property {number} [maxSteer]
 * @property {number} [cornerStiffnessFront]
 * @property {number} [cornerStiffnessRear]
 * @property {number} [airResist]
 * @property {number} [rollResist]
*/

class CarroControles{
    eBrake = 0
    throttle = 0
    brake = 0
    left = 0
    right = 0
    reverse = 0

    reset(){
        this.eBrake=0
        this.throttle=0
        this.brake=0
        this.left=0
        this.right=0
        this.reverse=0
    }
}

/**
 * 
 * @param {CarroConfigOptions} options 
 * @returns 
 */
function CarroConfig(options){
    return {
        gravity : 9.81,
        mass : 1200,
        inertiaScale : 1,
        halfWidth : 0.8,
        cgToFront : 2.0,
        cgToRear : 2.0,
        cgToFrontAxle : 1.25,
        cgToRearAxle : 1.25,
        cgHeight : 0.55,
        wheelRadius : 0.3,
        wheelWidth : 0.2,
        tireGrip : 2.0,
        lockGrip : 0.7,
        engineForce : 8000,
        brakeForce : 12000,
        eBrakeForce : 12000/2.5,
        weightTransfer : 0.2,
        maxSteer : 0.6,
        cornerStiffnessFront : 5,
        cornerStiffnessRear : 5.2,
        airResist : 2.5,
        rollResist : 8,
        ...options    
    }  
}

class Carro {

    /** @type {GameObject} */
    obj = null

    rpm = 0
    marcha = 0

    heading = 0
    position = [0,0];
    velocity = [0,0];
    velocity_c = [0,0]; // velocidade em coordenadas locais (?)
    accel = [0,0];
    accel_c = [0,0];
    absVel = 0     // velocidade absoluta em m/s
    yawRate = 0    // velocidade angular em radianos
    steer = 0      // posição do volante
    steerAngle = 0 // angulo da roda

    colBoxWidth = 0.9
    colBoxDepth = 1.88

    input = new CarroControles() // acho que são os controles

    smoothSteer = true
    safeSteer = true

    inertia = 0 // vai ser igual a massa?
    wheelBase = 0
    axleWeightRatioFront = 0
    axleWeightRatioRear = 0

    /** @type {CarroConfigOptions} */
    config = {}

    gasolina = GAME_GASOLINA_INICIAL

    get shapes(){
        return [{
            type : collision.RECT,
            position : this.position,
            width : this.colBoxWidth, //this.config.halfWidth*2,
            depth : this.colBoxDepth, //this.config.cgToFront + this.config.cgToRear,
            angle : this.heading,
        }]
    }

    get corners(){
        const cos = Math.cos(this.heading)
        const sin = Math.sin(this.heading)

        const [x,y] = this.position

        const
            // esquerda trás
            x0 = -this.config.cgToRear,
            y0 = -this.config.halfWidth,
            // esquerda frente
            x1 = +this.config.cgToRear,
            y1 = -this.config.halfWidth,
            // direita frente
            x2 = +this.config.cgToRear,
            y2 = +this.config.halfWidth,
            // direita trás
            x3 = -this.config.cgToRear,
            y3 = +this.config.halfWidth
        return [
            [x+x0*cos - y0*sin, y+y0*cos + x0*sin],
            [x+x1*cos - y1*sin, y+y1*cos + x1*sin],
            [x+x2*cos - y2*sin, y+y2*cos + x2*sin],
            [x+x3*cos - y3*sin, y+y3*cos + x3*sin],
        ]    
    }

    reset(){
        this.gasolina = GAME_GASOLINA_INICIAL

        this.rpm = 0
        this.marcha = 0

        this.heading = 0
        this.position = [0,0]
        this.velocity = [0,0]
        this.velocity_c = [0,0]
        this.accel = [0,0]
        this.accel_c = [0,0]
        this.absVel = 0
        this.yawRate = 0
        this.steer = 0
        this.steerAngle = 0
        this.input.reset()
    }

     /**
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Camera} camera 
     */
    draw(ctx, camera){
        const cfg = this.config
        ctx.save()

        // @ts-ignore
        ctx.translate( ...camera.translate(this.position) )
        ctx.rotate( this.heading )

        ctx.fillStyle="pink"

        ctx.scale(camera.zoom,camera.zoom)

        ctx.fillRect(
            -cfg.cgToRear,
            -cfg.halfWidth,
            cfg.cgToFront + cfg.cgToRear,
            cfg.halfWidth * 2
        )
        ctx.restore()
    }

    /**
     * @param {CarroConfigOptions} [config] 
     */
    constructor(config){
        this.config = CarroConfig(config)

        this.inertia = this.config.mass * this.config.inertiaScale
        this.wheelBase = this.config.cgToFrontAxle + this.config.cgToRearAxle
        this.axleWeightRatioFront = this.config.cgToRearAxle / this.wheelBase
        this.axleWeightRatioRear = this.config.cgToFrontAxle / this.wheelBase
    }


    /**
     * @param {number} amount
     */
    refuel(amount){
        this.gasolina += amount
        if(this.gasolina>= GAME_GASOLINA_INICIAL){
            this.gasolina = GAME_GASOLINA_INICIAL
        }
    }

    /**
     * @param {number} dt - delta tempo em segundos.
     */
    update(dt){
        if(this.gasolina <= 0){
            this.gasolina = 0
            this.input.throttle = 0
        }
        if(this.input.throttle){
            this.rpm += (17-this.rpm) * 0.005
            this.gasolina -= this.rpm * 0.008
        }else{
            this.rpm -= 0.2
        }
        if(this.input.brake){
            this.rpm -= 0.5
        }
        // troca de marcha
        if(this.rpm > 11){
            if(this.marcha < 3){
                this.marcha++
                this.rpm = 8
            }
        }
        if(this.rpm < 3){
            if(this.marcha > 0){
                this.marcha --
                this.rpm = 3
            }else{
                this.rpm = 3
            }
        }

        this.doSteering()
        const cfg = this.config
        const sin = Math.sin( this.heading )
        const cos = Math.cos( this.heading )

        // velocidade em sistema local.
        this.velocity_c[0] = cos * this.velocity[0] + sin * this.velocity[1]
        this.velocity_c[1] = cos * this.velocity[1] - sin * this.velocity[0]

        // o peso nos eixos é baseado no centro de gravidade e transferência de peso
        // devido à aeceleração
        const
            axleWeightFront = cfg.mass * (this.axleWeightRatioFront * cfg.gravity - cfg.weightTransfer * this.accel_c[0] * cfg.cgHeight/this.wheelBase),
            axleWeightRear = cfg.mass * (this.axleWeightRatioRear * cfg.gravity + cfg.weightTransfer * this.accel_c[0] * cfg.cgHeight/this.wheelBase)

        // velocidade das rodas é um resultado da velocidade angular do corpo do carro
        const
            yawSpeedFront = cfg.cgToFrontAxle * this.yawRate,
            yawSpeedRear = -cfg.cgToRearAxle * this.yawRate

        // calcular ângulo de derrapagem para as rodas da frente e de trás (diz o spacejack que é um tal de alpha)
        const
            slipAngleFront = Math.atan2( this.velocity_c[1] + yawSpeedFront, Math.abs(this.velocity_c[0])) - Math.sign( this.velocity_c[0]) * this.steerAngle,
            slipAngleRear  = Math.atan2( this.velocity_c[1] + yawSpeedRear, Math.abs(this.velocity_c[0]))

        const
            tireGripFront = cfg.tireGrip,
            tireGripRear = cfg.tireGrip * (1- this.input.eBrake * (1-cfg.lockGrip)) // cavalo de pau

        const
            frictionForceFront_cy = clamp( -cfg.cornerStiffnessFront * slipAngleFront, -tireGripFront, tireGripFront) * axleWeightFront ,
            frictionForceRear_cy = clamp( -cfg.cornerStiffnessRear * slipAngleRear, -tireGripRear, tireGripRear) * axleWeightRear
        
        // aceleração e freio dos controles
        const
            brake = Math.min( this.input.brake * cfg.brakeForce + this.input.eBrake * cfg.eBrakeForce, cfg.brakeForce),
            throttle = this.input.throttle * cfg.engineForce - this.input.reverse * cfg.engineForce
        
        // força resultante em sistema local.
        // diz o spacejack que essa física é só pra tração traseira.
        const
            tractionForce_cx = throttle - brake * Math.sign( this.velocity_c[0] ),
            tractionForce_cy = 0

        // aplica atrito + resistencia do ar
        const
            dragForce_cx = -cfg.rollResist * this.velocity_c[0] - cfg.airResist * this.velocity_c[0] * Math.abs( this.velocity_c[0] ),
            dragForce_cy = -cfg.rollResist * this.velocity_c[1] - cfg.airResist * this.velocity_c[1] * Math.abs( this.velocity_c[1] )
        
        // calcula as forças resultantes em sistema local
        const
            totalForce_cx = dragForce_cx + tractionForce_cx,
            totalForce_cy = dragForce_cy + tractionForce_cy + Math.cos(this.steerAngle) * frictionForceFront_cy + frictionForceRear_cy
        // aceleração em coordenadas locais
        // NOTA: não sei por que ele tá usando x como se fosse "pra frente e pra trás"
        this.accel_c[0] = totalForce_cx/cfg.mass // aceleração frente/trás
        this.accel_c[1] = totalForce_cy/cfg.mass // aceleração lateral
        // aceleração em coordenadas globais
        this.accel[0] = cos * this.accel_c[0] - sin * this.accel_c[1]
        this.accel[1] = sin * this.accel_c[0] + cos * this.accel_c[1]

        // atualiza a velocidade
        this.velocity[0] += this.accel[0] * dt
        this.velocity[1] += this.accel[1] * dt

        this.absVel = vec2.len( this.velocity )

        // forças rotacionais
        let angularTorque = (frictionForceFront_cy + tractionForce_cy) * cfg.cgToFrontAxle - frictionForceRear_cy*cfg.cgToRearAxle
        
        // para o carro se a velocidade for bem pequena.
        if( Math.abs(this.absVel) < 0.5 && !throttle ){
            this.velocity[0] = this.velocity[1] = this.absVel = 0
            this.yawRate = angularTorque = 0
        }

        const angularAccel = angularTorque / this.inertia

        this.yawRate += angularAccel * dt
        this.heading += this.yawRate * dt

        // FINALMENTE MOVE O CARRINHO
        this.position[0] += this.velocity[0] * dt
        this.position[1] += this.velocity[1] * dt
    }

    doSteering(){
        const steerInput = this.input.right - this.input.left

        this.steer = steerInput

        this.steerAngle = this.steer * this.config.maxSteer
    }
}


export { Carro }