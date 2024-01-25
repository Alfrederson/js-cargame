import { Camera } from "./Camera"


const X = 0
const Y = 1

function clamp(x,min,max){
    if(x < min)
        return min
    if(x > max)
        return max
    return x
}

/**
 * 
 * @param {number[]} vec 
 * @returns comprimento do vetor
 */
function vec2_len(vec){
    return Math.sqrt( vec[0]*vec[0] + vec[1]*vec[1])
}

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
 * @property {number} [tireGrip]
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

    input = new CarroControles() // acho que são os controles

    smoothSteer = true
    safeSteer = true

    inertia = 0 // vai ser igual a massa?
    wheelBase = 0
    axleWeightRatioFront = 0
    axleWeightRatioRear = 0

    /** @type {CarroConfigOptions} */
    config = {}

    reset(){
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
     * @param {CarroConfigOptions} config 
     */
    constructor(config){
        
        if(!config)
            throw "cade o config?"

        this.config = CarroConfig(config)

        this.inertia = this.config.mass * this.config.inertiaScale
        this.wheelBase = this.config.cgToFrontAxle + this.config.cgToRearAxle
        this.axleWeightRatioFront = this.config.cgToRearAxle / this.wheelBase
        this.axleWeightRatioRear = this.config.cgToFrontAxle / this.wheelBase

        let cfg = this.config
    }



    /**
     * 
     * @param {number} dt - delta tempo em segundos.
     */
    update(dt){
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

        this.absVel = vec2_len( this.velocity )

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