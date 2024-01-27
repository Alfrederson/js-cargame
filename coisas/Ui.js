import {GAME_GASOLINA_INICIAL} from "../config"

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} gasolina 
 */
export function medidorDeGasolina(ctx, x,y, gasolina){
    ctx.save()
    ctx.fillStyle = "#000000"
    ctx.fillRect(x-1,y,10,33)
    ctx.fillStyle = "#FF0000"
    ctx.fillRect(x,y+((1-gasolina/GAME_GASOLINA_INICIAL)*32)|0,8,((gasolina/GAME_GASOLINA_INICIAL)*32)|0)
    ctx.restore()
  }


  /**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} angulo 
 */
export function indicadorPalhaco(ctx,x,y,angulo){
  ctx.save()
  ctx.fillText("🤡", x|0, y|0 )    
  ctx.translate(x*1.1|0,y*1.1|0)
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
 velocidade *= 3.6
 let porcentagem = Math.min(1,velocidade/velocidadeMax)
 let porcentagemAlvo = (velocidadeAlvo*3.6)/velocidadeMax
 let angulo = (0.8+porcentagem* 1.4)  * Math.PI
 let anguloAlvo = (0.8+porcentagemAlvo*1.4) * Math.PI
 ctx.save()
 ctx.font = "16px monospace"
 ctx.fillStyle = "black"
 ctx.textBaseline = "top"
 ctx.textAlign = "center"
 ctx.fillText(
   "0",
   x + Math.cos( (0.8+0*1.4)*Math.PI  )* 30,
   y + Math.sin( (0.8+0*1.4)*Math.PI  )* 30,
 )
 ctx.fillText(
   velocidadeMax,
   x + Math.cos( (0.8+1*1.4)*Math.PI  )* 30,
   y + Math.sin( (0.8+1*1.4)*Math.PI  )* 30,
 )
 ctx.restore()
 ctx.moveTo(x,y)
 ctx.strokeStyle="red"
 ctx.lineTo( x + Math.cos(angulo) * 30, y + Math.sin(angulo) * 30 )
 ctx.fillStyle="red"
 // botar uma coisinha na velocidade alvo
 ctx.fillRect(
   x + Math.cos(anguloAlvo) * 30 -2,
   y + Math.sin(anguloAlvo) * 30 -2,
   4,4
 )
 ctx.stroke()
}


let framesBomba=0
export function mostrarBomba(ctx,x,y,segundos){
  framesBomba++
  ctx.save()
  ctx.save()
  ctx.translate(x,y)
  ctx.textAlign="center"
  ctx.textBaseline="middle"
  ctx.scale(1 + Math.cos(framesBomba*0.2)*0.2,1+ Math.cos(framesBomba*0.2)*0.2)
    ctx.fillText(
       "💣 "+segundos ,
      0,
      0 
    )
  ctx.restore()
}