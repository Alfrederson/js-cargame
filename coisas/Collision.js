//@ts-check

// ARC
// { type : ARC, position : this.center, from : this.from, to : this.to, radius : this.radius + this.width/2 }
// RECT
//             

import * as vec2 from "./vec2"

// type : collision.RECT,
// position : this.position,
// width : this.config.halfWidth*2,
// depth : this.config.cgToRear*2
// corners : this.corners

// RECT
// 
export const RECT = 1
export const ARC = 2


/**
 * @interface
 */
class Shape{
    type=0
}

/** 
 *  @typedef {Object} Arco
 *  @property {number[]} position
 *  @property {number} from
 *  @property {number} to
 *  @property {number} radius
 */

/** 
 * @typedef {Object} Retangulo 
 * @property {number[]} position
 * @property {number} width
 * @property {number} depth
 * @property {number} angle
 * @property {number} diagonal
*/

/**
 * 
 * @param {Shape} a 
 * @param {Shape} b 
 * @returns 
 */
function ordenar(a,b){
    if(a.type < b.type)
        return [a,b]
    else
        return [b,a]
}

const pares = {
    [RECT] : {
        [RECT] : retangulo_retangulo,
        [ARC] : retangulo_arco
    },
}



/**
 * desse jeito esquisito pra não recalcular cos e sin.
 * @param {Retangulo} rect 
 * @param {number} cos - cosseno do angulo
 * @param {number} sin - seno do angulo.
 * @returns {number[][]} 
 */
function rect_corners(rect,cos,sin){
    const [x,y] = rect.position

    const
        // esquerda trás
        x0 = -rect.depth/2,
        y0 = -rect.width/2,
        // esquerda frente
        x1 = +rect.depth/2,
        y1 = -rect.width/2,
        // direita frente
        x2 = +rect.depth/2,
        y2 = +rect.width/2,
        // direita trás
        x3 = -rect.depth/2,
        y3 = +rect.width/2
    return [
        [x+x0*cos - y0*sin, y+y0*cos + x0*sin],
        [x+x1*cos - y1*sin, y+y1*cos + x1*sin],
        [x+x2*cos - y2*sin, y+y2*cos + x2*sin],
        [x+x3*cos - y3*sin, y+y3*cos + x3*sin],
    ]  
}

function rect_axes(cos,sin){
    return [
        [cos, sin],
        [-sin, cos]
    ]
}

function aabb(pontos){
    let min_x = pontos[0][0]
    let max_x = pontos[0][0]

    let min_y = pontos[0][1]
    let max_y = pontos[0][1]
    
    for(let i = 0;i < pontos.length;i++){
        if(pontos[i][0] < min_x)
            min_x = pontos[i][0]
        if(pontos[i][0] > max_x)
            max_x = pontos[i][0]
        if(pontos[i][1] < min_y)
            min_y = pontos[i][1]
        if(pontos[i][1] > max_y)
            max_y = pontos[i][1]
    }
    
    return [min_x,max_x,min_y,max_y]
}

/**
 * @param {Retangulo} a 
 * @param {Retangulo} b 
 */
function retangulo_retangulo(a,b, output){
    // x_cos e x_sin também são os eixos dos dois retangulos.
    const [a_cos,a_sin] = [Math.cos(a.angle), Math.sin(a.angle)]
    const [b_cos,b_sin] = [Math.cos(b.angle), Math.sin(b.angle)]
    const corners_a = rect_corners(a, a_cos, a_sin)
    const corners_b = rect_corners(b, b_cos, b_sin)
    const aabb_a = aabb(corners_a)
    const aabb_b = aabb(corners_b)
    // minimo x > maximo x ou
    // maximo x < minimo x ou
    // mesma coisa y
    if(
        (aabb_a[0] > aabb_b[1]) || // minimo do a > maximo do b
        (aabb_a[1] < aabb_b[0]) || // maximo do a < minimo do b
        (aabb_a[2] > aabb_b[3]) || // minimo do a > maximo do b
        (aabb_a[3] < aabb_b[2])    // maximo do a < minimo do b
    ){
        return false
    }
    const axes_a = rect_axes(a_cos, a_sin)
    const axes_b = rect_axes(b_cos, b_sin)
    //const axes = [...axes_a, ...axes_b]

    let minimumOverlap = Number.MAX_VALUE
    let smallestAxis = -1

    // são 4 eixos.
    for(let i = 0; i < 4; i++){
        let axis = i < 2 ? axes_a[i] : axes_b[i-2]
        let min1 = Number.MAX_VALUE;
        let max1 = -Number.MAX_VALUE;
        let min2 = Number.MAX_VALUE;
        let max2 = -Number.MAX_VALUE;
        // retangulo tem 4 cantos! eu espero.
        for(let j = 0; j < 4; j++){
            let dot = vec2.dp(corners_a[j], axis)
            min1 = Math.min(min1, dot)
            max1 = Math.max(max1, dot)
            dot = vec2.dp(corners_b[j], axis)
            min2 = Math.min(min2,dot)
            max2 = Math.max(max2,dot)
        }
        if(max1 < min2 || max2 < min1)
            return false
        let overlap = Math.min(max1,max2) - Math.max(min1, min2)
        if(overlap < minimumOverlap){
            minimumOverlap = overlap
            smallestAxis = i
        }
    }
    output.mtv = vec2.mul( smallestAxis < 2 ? axes_a[smallestAxis] : axes_b[smallestAxis-2], minimumOverlap )
    return true
}

/**
 * 
 * @param {Retangulo} a 
 * @param {Arco} b 
 */
function retangulo_arco(a,b, output){
    console.log("retangulo x arco")
}


/** @interface */
class CoisaComShapes{
    /**
     * @return {Shape[]}
     */
    get shapes() {
        return []
    }
}

/**
 * 
 * @param {CoisaComShapes} objA
 * @param {CoisaComShapes} objB 
 * @param {object} output 
 */
export function colidem(objA,objB, output){
    let shapesA = objA.shapes
    let shapesB = objB.shapes

    for(let shapeA of shapesA){
        for(let shapeB of shapesB){
            let [a,b] = ordenar(shapeA,shapeB)
            const detectora = pares[a.type][b.type]
            return detectora(a,b, output)
        }
    }
}

