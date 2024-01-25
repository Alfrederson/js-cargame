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