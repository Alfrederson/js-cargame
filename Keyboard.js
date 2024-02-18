export class Keyboard{
    w = 0
    a = 0
    s = 0
    d = 0
    r = 0
    m = 0
    _holding = {}
    /**
     * @param {string} key
     */
    hit(key){
      if(this[key] && !this._holding[key]){
        return this._holding[key] = true
      }
      this._holding[key] = this[key]
      return false
    }
  }