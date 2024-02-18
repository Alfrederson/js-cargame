/**
 * Recebe um vetor e dá o comprimento dele.
 * @param {number[]} vec 
 * @returns comprimento do vetor
 */
export function len(vec){
    return Math.sqrt( vec[0]*vec[0] + vec[1]*vec[1])
}

export function dp(v1,v2){
    return v1[0]*v2[0] + v1[1]*v2[1]
}

/**
 * Dá o angulo (em radianos) que corresponde ao sentido de um vetor.
 * @param {number[]} v 
 * @returns 
 */
export function angle( v ){
    return Math.atan2( v[1], v[0] )
}

/**
 * faz v1 - v2
 * @param {number[]} v1 
 * @param {number[]} v2 
 * @returns 
 */
export function sub( v1, v2 ){
    return [
        v1[0] - v2[0],
        v1[1] - v2[1]
    ]
}

/**
 * escala um vetor
 * @param {number[]} v1 
 * @param {number} m 
 * @returns 
 */
export function mul( v1, m ){
    return [
        v1[0] *m,
        v1[1] *m
    ]
}


/**
 * média de 2 vetores.
 * @param {number[]} v1 
 * @param {number[]} v2 
 */
export function avg( v1,v2 ){
    return [
        (v1[0] + v2[0])/2,
        (v1[1] + v2[1])/2
    ]
}


/**
 * faz v1 + v2
 * @param {number[]} v1 
 * @param {number[]} v2 
 * @returns 
 */
export function add( v1, v2 ){
    return [
        v1[0] + v2[0],
        v1[1] + v2[1]
    ]
}


/**
 * 
 * @param {number[]} what 
 * @param {number[]} to 
 */
export function add_to(what, to){
    to[0] += what[0]
    to[1] += what[1]
}