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

export function clamp(x,min,max){
    if(x < min)
        return min
    if(x > max)
        return max
    return x
}

export function sequencia(chave){
    return function(...passos){
        let promise
        for(let i = 0; i < passos.length; i++){
            if(i==0){
                promise = new Promise((resolve,_) => passos[i]( resolve ))
            }else{
                promise = promise.then(
                    ()=> new Promise( (resolve,_)=>{
                            if(i==passos.length-1){
                                passos[i]( ()=>{
                                    resolve()
                                    localStorage.setItem(chave,"ja")
                                })
                                return
                            }
                            passos[i]( resolve )
                        })
                )
            }
        }
        promise.senao = ()=>{}
        return promise
    }
}

/**
 * Faz alguma coisa uma só vez.
 * @param {string} chave 
 * @param {function} callback 
 */
export function fazer( chave ){
    let ja_fez = localStorage.getItem(chave)
    if(ja_fez == null){
        return { uma_so_vez : sequencia(chave) }
    }
    // retorna uma coisa que faz um "senão."
    return {
        uma_so_vez : function(){
            return { senao : callback => callback() }
        }
    }
}

export function nunca(oque){
    return localStorage.getItem(oque)==null
}


export function se_nunca(oque){
    if(localStorage.getItem(oque)==null){
        return {
            entao : x => x()
        }
    }else{
        return {
            entao : x=> 0
        }
    }
}
export function agora_ja(oque){
    localStorage.setItem(oque,"ja")
}
export function passo_a_passo(...passos){
    let promise
    for(let passo of passos){
        promise = promise
            ? promise.then( () => new Promise(passo) )
            : new Promise( passo )
    }
    return promise    
}


export function passo( callback ){
    return new Promise( callback )
}


export function gerarTrecho(){
    const comprimento = 10 + 15*Math.round( (1+Math.random()*9) )/10
    const angulo = 0.3*Math.round( 1+Math.random()*99 )/100
    const radius = comprimento/angulo
    return {
        radius,
        to : Math.random() > 0.5 ? angulo : -angulo
    }
}

export function $(id){
    let e = document.getElementById(id)
    if(!e){
        throw "elemento "+id+" não existe"
    } 
    return e
}

export function show(e){
    e.classList.remove("hidden")
    return e
}
export function hide(e){
    e.classList.add("hidden")
    return e
}