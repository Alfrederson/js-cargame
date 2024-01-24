/** @interface */
class Camera {
    x = 0
    y = 0
    zoom = 20
    screenWidth = 0
    screenHeight = 0
    constructor(width,height){
        this.screenWidth = width
        this.screenHeight = height
    }
    translate(pos) {
        return [
            (pos[0] - this.x) * this.zoom + this.screenWidth / 2,
            (pos[1] - this.y) * this.zoom + this.screenHeight / 2
        ]
    }
    /**
     * 
     * @param {number[]} pos 
     */
    setPos(pos){
        this.x = pos[0]
        this.y = pos[1]
    }

    /**
     * 
     * @param {number[]} pos 
     */
    lookAt(pos){
        let dX = pos[0] - this.x
        let dY = pos[1] - this.y      
        this.x += dX * 0.2
        this.y += dY * 0.2
    }
}

export { Camera }