//@ts-check

import { RoadSegment } from "./coisas/RoadSegment"
import { Camera } from "./coisas/Camera"
import { vec2_add, vec2_mul, vec2_sub } from "./coisas/util"
import { Carro } from "./coisas/Carro"
import { colidem } from "./coisas/Collision"

const point = [300,300]
const cam = new Camera(600,600)
cam.zoom = 10

const keyboard = {}
const carro = new Carro()
carro.position = [300,340]

const rua = new RoadSegment({
    center: [290,290],
    from: 0.6,
    to: -0.4,
    radius: 50,
    width: 12,
    prev: null
})

function controlarCarro(c){
    c.input.throttle = keyboard.KeyW ? 1 : 0
    c.input.brake = keyboard.KeyS && c.velocity_c[1] > 0.1? 1 : 0
    c.input.reverse = keyboard.KeyS && c.velocity_c[1] <= 0.1 ? 1 : 0
    c.input.left = keyboard.KeyA ? 1 : 0
    c.input.right = keyboard.KeyD ? 1 : 0
}


function estradaContemPonto(ctx){
    cam.lookAt(carro.position)
    controlarCarro(carro)
    rua.draw(ctx,cam)


    let [x,y] = carro.position
    carro.gasolina = 30
    carro.update(0.016)

    if(rua.containsPoints(carro.corners)){
        ctx.fillStyle = "red"
    }else{
        ctx.fillStyle = "black"
    }

    for(let ponto of carro.corners){
        let [x,y] = cam.translate(ponto)
        ctx.fillRect(x-2,y-2,4,4)
    }
    carro.draw(ctx,cam)

    ctx.fillText(carro.position.map(x => x.toFixed(2) ).join(","),20,20)

}

const carrosColidem = {

    setup(){
        this.point = [300,300]
        this.cam = new Camera(600,600)

        this.cam.zoom = 10

        this.carroA = new Carro()
        this.carroA.position = [300,340]

        this.carroB = new Carro()
        this.carroB.position = [310,340]
        this.carroB.heading = Math.PI * 0.25



        this.rua = new RoadSegment({
            center: [290,290],
            from: 0.6,
            to: -0.4,
            radius: 50,
            width: 12,
            prev: null            
        })
    },

    teste(ctx){
        const {cam,carroA,carroB} = this

        controlarCarro(carroA)

        carroB.input.brake = 1

        const oldPos = [...carroA.position];

        this.rua.draw(ctx, cam)

        carroA.gasolina = 30
        carroA.update(0.016)
        carroB.update(0.016)

        cam.lookAt(carroA.position)

        carroA.draw(ctx, cam)
        carroB.draw(ctx, cam)

        let saida = {
            debug : "sdf",
            collisions : []
        }

        if(colidem(carroA,carroB,saida)){
            //carroA.gasolina=0
            let vel = carroA.velocity
            // carroA.position = vec2_sub(carroA.position, saida.mtv)
            carroA.velocity = vec2_mul(vel,-0.5)      
            carroB.velocity = vec2_add(carroB.velocity, vec2_mul(vel,0.5))
        }

        ctx.fillText(carroA.gasolina,30,30)
    }

}



document.addEventListener("DOMContentLoaded", function(){

    document.onkeydown = event => keyboard[event.code] = true
    document.onkeyup = event => keyboard[event.code] = false

    let canvas = document.getElementById("canvas")

    canvas.onmousemove = function(event){
        point[0] = event.clientX
        point[1] = event.clientY
    }

    let ctx = canvas.getContext("2d")

    const test = carrosColidem

    test.setup()

    function frame(){
        ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
        test.teste(ctx)
        requestAnimationFrame(frame)
    }
    frame()
})