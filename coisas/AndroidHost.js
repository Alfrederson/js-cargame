

/** @interface */
class FakeHost{
    showAd(){
        // console.log("mostrar ad")
    }
    hideAd(){
        // console.log("ocultar ad")
    }
}

/**
 * 
 * @returns {FakeHost}
 */
export function host(){
    if(typeof window.Host == "undefined"){
        return new FakeHost
    }
    return window.Host
}