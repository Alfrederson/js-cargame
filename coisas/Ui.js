import {GAME_GASOLINA_INICIAL} from "../config"



  /**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} angulo 
 */
export function indicadorPalhaco(ctx,x,y,angulo){
  let cos = Math.cos(angulo), sin = Math.sin(angulo)
  let xPalhaco = cos*100
  let yPalhaco = sin*100

  ctx.save()
  ctx.translate(x,y)
  ctx.translate(xPalhaco,yPalhaco)
  ctx.scale(3,3)
  ctx.fillText("🤡",0,0)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.translate(x,y)
  ctx.translate(xPalhaco*1.2,yPalhaco*1.2)
  ctx.scale(3,3)
  ctx.rotate( angulo )
  ctx.fillText("👉",0,0)

  ctx.restore()
}


/**
* @param {CanvasRenderingContext2D} ctx 
* @param {number} x 
* @param {number} y 
* @param {number} velocidade 
* @param {number} velocidadeMax
* @param {number} velocidadeAlvo
*/
export function velocimetro(ctx, x,y, velocidade, velocidadeMax, velocidadeAlvo){
  const raio = 60
  velocidade *= 3.6
  let porcentagem = Math.min(1,velocidade/velocidadeMax)
  let porcentagemAlvo = (velocidadeAlvo*3.6)/velocidadeMax
  let angulo = (0.8+porcentagem* 1.4)  * Math.PI
  let anguloAlvo = (0.8+porcentagemAlvo*1.4) * Math.PI
  ctx.save()
  ctx.font = "24px monospace"
  ctx.fillStyle = "black"
  ctx.textBaseline = "top"
  ctx.textAlign = "center"
  // desenha o de 0 a (max)
  ctx.fillText(
    "0",
    x + Math.cos( (0.8+0*1.4)*Math.PI)* raio,
    y + Math.sin( (0.8+0*1.4)*Math.PI)* raio,
  )
  ctx.fillText(
    velocidadeMax,
    x + Math.cos( (0.8+1*1.4)*Math.PI)* raio,
    y + Math.sin( (0.8+1*1.4)*Math.PI)* raio,
  )
  ctx.restore()
  ctx.beginPath()
  ctx.moveTo(x,y)
  ctx.strokeStyle="red"
  ctx.lineWidth=3
  ctx.lineTo(x+Math.cos(-angulo)*60,y-Math.sin(-angulo)*raio )
  ctx.stroke()

  ctx.fillStyle="red"
  // botar uma coisinha na velocidade alvo
  ctx.fillRect(
    x + Math.cos(anguloAlvo)*raio-4,
    y + Math.sin(anguloAlvo)*raio-4,
    8,8
  )
}

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} gasolina 
 */
export function medidorDeGasolina2(ctx, x,y, gasolina){
  const width = 20, height =64
  ctx.save()
  ctx.fillStyle = "#000000"
  ctx.fillRect(x-1,y-height,width+2,height+2)
  ctx.fillStyle = "#FF0000"
  ctx.fillRect(x,y-height+((1-gasolina/GAME_GASOLINA_INICIAL)*height),width,((gasolina/GAME_GASOLINA_INICIAL)*height)|0)
  ctx.restore()
}


/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} gasolina 
 */

let gasolinaAtual = 0
export function medidorDeGasolina(ctx, x,y, gasolina){
  const raio=40

  gasolinaAtual = gasolinaAtual + (gasolina-gasolinaAtual)*0.05


  const porcentagem = (gasolinaAtual/GAME_GASOLINA_INICIAL)
  const anguloCheio = (0.25) * Math.PI
  const anguloVazio = (0.75) * Math.PI
  // const anguloMeio = (anguloCheio+anguloVazio)/2

  const angulo = anguloVazio +(anguloCheio-anguloVazio)*porcentagem

  // o medidor de gasolinha é um ponteirinho.
  ctx.save()

  ctx.font = "600 16px monospace"
  ctx.textBaseline = "bottom"
  ctx.textAlign = "center"
  ctx.fillStyle = "red"
  ctx.fillText("E", x + Math.cos(anguloVazio)*raio, y + Math.sin(anguloVazio)*raio-20)

  ctx.fillStyle = "black"
  ctx.fillText("F", x + Math.cos(anguloCheio)*raio, y + Math.sin(anguloCheio)*raio-20)

  ctx.strokeStyle = "3px red"
  ctx.beginPath()
  ctx.moveTo( x + Math.cos(angulo) * (raio-20), y - Math.sin(angulo) * (raio-20)+raio)
  ctx.lineTo( x + Math.cos(angulo) * raio, y - Math.sin(angulo) * raio +raio)
  ctx.stroke()
  ctx.restore()
}


let framesBomba=0
export function mostrarBomba(ctx,x,y,segundos){
  framesBomba++
  ctx.save()
  ctx.translate(x,y)
  ctx.textAlign="center"
  ctx.textBaseline="middle"
  ctx.scale(6 + Math.cos(framesBomba*0.2)*0.2,6+ Math.cos(framesBomba*0.2)*0.2)
    ctx.fillText(
       "💣 "+segundos ,
      0,
      0 
    )
  ctx.restore()
}