/**
 * 
 * @param {number[]} a 
 * @param {number[]} b 
 * @returns 
 */
export function dist2d(a,b){
    const dX = a[0] - b[0]
    const dY = a[1] - b[1]
    return Math.sqrt( dX*dX + dY*dY )
}

/**
 * faz v1 - v2
 * @param {number[]} v1 
 * @param {number[]} v2 
 * @returns 
 */
export function vec2_sub( v1, v2 ){
    return [
        v1[0] - v2[0],
        v1[1] - v2[1]
    ]
}

/**
 * Dá o angulo (em radianos) que corresponde ao sentido de um vetor.
 * @param {number[]} v 
 * @returns 
 */
export function vec2_angle( v ){
    return Math.atan2( v[1], v[0] )
}

export function clamp(x,min,max){
    if(x < min)
        return min
    if(x > max)
        return max
    return x
}

/**
 * Recebe um vetor e dá o comprimento dele.
 * @param {number[]} vec 
 * @returns comprimento do vetor
 */
export function vec2_len(vec){
    return Math.sqrt( vec[0]*vec[0] + vec[1]*vec[1])
}

/**
 * Faz alguma coisa uma só vez.
 * @param {string} chave 
 * @param {function} o_que 
 */
export function uma_so_vez( chave, o_que ){
    let ja_fez = localStorage.getItem(chave)
    if(ja_fez==null){
        localStorage.setItem(chave,"ja")
        o_que()
    }
}