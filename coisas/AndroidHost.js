

/** @interface */
class FakeHost{
    showAd(){}
    hideAd(){}
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