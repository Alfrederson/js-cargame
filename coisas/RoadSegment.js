const EDGE_LENGTH = 12
const WAYPOINT_SPACING = 4


class RoadSegment{
    center
    radius
    from
    to
  
    prev
    next
  
    width
  
    length = 0
    segments = 0
  
    vertices = []
    aabb = []
  
    waypoints = []
  
    clockwise = true

    /** gera uma lista de quadrados....? */
    generateVertexBuffer(){
      const faces = []


      const vertices = []
      const indices = []
      const uvs = []
      const vertexCount = Math.max(2, (this.length / EDGE_LENGTH)|0)
      const angleIncrement = this.to / vertexCount
      /*
          o resultado dessa coisa são duas arrays.
          uma array contem uma lista de vértices, a outra contem uma lista de índices.

          3-----4  - os vértices formam uma sequência assim.
          | \   |  - pra gerar o mesh, a gente precisa, então,
          |   \ |  - ter uma sequência assim:
          2-----5 
          | \   |   [0 1 7]
          |   \ |   [7 1 6]
          1-----6   [1 2 6]
          | \   |   [6 2 5]
          |   \ |   [2 3 5]
          0-----7   [5 3 4]

          a resolução é um leetcode nível fácil.
      */
      // vai fazendo o lado esquerdo




      const [x,y] = this.center
      let v=0
      for(let i = 0; i <= vertexCount; i++){
        uvs.push(0,i*1)
        vertices.push(x + Math.cos( (this.from + angleIncrement * i) * Math.PI) * (this.radius - this.width/2))
        vertices.push(0)
        vertices.push(y + Math.sin( (this.from + angleIncrement * i) * Math.PI) * (this.radius - this.width/2))
      }
      // agora o direitor
      for(let i=vertexCount; i >= 0; i--){
        uvs.push(1,i)
        vertices.push(x + Math.cos( (this.from + angleIncrement * i) * Math.PI) * (this.radius + this.width/2))
        vertices.push(0)
        vertices.push(y + Math.sin( (this.from + angleIncrement * i) * Math.PI) * (this.radius + this.width/2))
      }
      /*
          0,1 ------------ 1,1
           |                |
           |                |
           |                |
           |                |
           |                |
           |                |
          0,0 ------------ 1,0
      */
      for(let i = 0; i < vertexCount; i ++){
        // canto esquerdo de baixo
        if(this.clockwise){
          // triangulo da esquerda
          indices.push(i)
          indices.push(i+1)
          indices.push(vertexCount*2-i+1)

          indices.push(vertexCount*2-i+1)
          indices.push(i+1)
          indices.push(vertexCount*2-i)      
          
             
        }else{
          // triangulo da direita
          indices.push(i+1)
          indices.push(vertexCount*2-i+1)
          indices.push(vertexCount*2-i)                    

          indices.push(vertexCount*2-i+1)
          indices.push(i+1)
          indices.push(i)
        }
      }
      return {vertices, indices, uvs}
    }

    generateVertices(){
      const vertexCount = Math.max(2, (this.length / EDGE_LENGTH)|0)
      const angleIncrement = this.to / vertexCount
      // vai fazendo o lado esquerdo
      const [x,y] = this.center
      for(let i = 0; i <= vertexCount; i++){
        this.vertices.push([
          x + Math.cos( (this.from + angleIncrement * i) * Math.PI) * (this.radius - this.width/2),
          y + Math.sin( (this.from + angleIncrement * i) * Math.PI) * (this.radius - this.width/2),
          0
        ])
      }

      // this.vertices.push( this.endPointRight )
      // fazendo o lado direito...
      for(let i = vertexCount; i >= 0; i--){
        this.vertices.push([
          x + Math.cos( (this.from + angleIncrement * i) * Math.PI) * (this.radius + this.width/2),
          y + Math.sin( (this.from + angleIncrement * i) * Math.PI) * (this.radius + this.width/2),
          0
        ])
      }

      return this.vertices
    }
  
    generateWaypoints(){
      const waypointCount = Math.max(2, (this.length / WAYPOINT_SPACING)|0)
      const angleIncrement = this.to / waypointCount
      this.waypoints.push( this.startPoint)
      const [x,y] = this.center
      for(let i = 1; i < waypointCount; i++){
        this.waypoints.push([
          x + Math.cos( (this.from + angleIncrement * i) * Math.PI ) * this.radius,
          y + Math.sin( (this.from + angleIncrement * i) * Math.PI ) * this.radius
        ])
      }
      this.waypoints.push( this.endPoint)
    }
  
    constructor({/** @type {number[]}*/center,/** @type {number}*/radius,/** @type {number}*/from,/** @type {number}*/to,/** @type {RoadSegment?}*/prev, /** @type {number} */width}){
      if(to < 0){
        this.clockwise = false;
      }
      while(from > 2){
        from -= 2
      }
      while(from < 0){
        from += 2
      }
  
      this.center = center
      this.radius = radius
      
      this.from = from
      this.to = to
      this.prev = prev
  
      this.length = (this.radius * Math.abs(this.to) * Math.PI)
      this.segments = Math.max(4,(this.length/EDGE_LENGTH)|0)
  
      this.width = width
  
      // calcula os waypoints
      this.generateWaypoints()
      // calcula os vértices
      this.generateVertices()
  
      // calcula os pontos do aabb
      this.aabb = this.getAABB()
    }
    get endPoint(){
      const [centerX, centerY] = this.center
      const endPointX = centerX + (this.radius) * Math.cos((this.from + this.to)*Math.PI)
      const endPointY = centerY + (this.radius) * Math.sin((this.from + this.to)*Math.PI)
      return [
        endPointX,
        endPointY
      ]
    }
  
    get endPointLeft(){
      const [x,y] = this.center
      return [
        x + (this.radius+this.width/2) * Math.cos((this.from + this.to)*Math.PI),
        y + (this.radius+this.width/2) * Math.sin((this.from + this.to)*Math.PI)
      ]
    }
    get endPointRight(){
      const [x,y] = this.center
      return [
        x + (this.radius-this.width/2) * Math.cos((this.from + this.to)*Math.PI),
        y + (this.radius-this.width/2) * Math.sin((this.from + this.to)*Math.PI)
      ]
    }
    get startPointRight(){
      const [x,y] = this.center
      return [
        x + (this.radius-this.width/2) * Math.cos((this.from)*Math.PI),
        y + (this.radius-this.width/2) * Math.sin((this.from)*Math.PI)
      ]
    }
    get startPoint(){
      const [centerX, centerY] = this.center
      const startPointX = centerX + (this.radius) * Math.cos((this.from)*Math.PI)
      const startPointY = centerY + (this.radius) * Math.sin((this.from)*Math.PI)
      return [
        startPointX,
        startPointY
      ]
    }
  
    get startPointLeft(){
      const [x,y] = this.center
      return [
        x + (this.radius+this.width/2) * Math.cos((this.from)*Math.PI),
        y + (this.radius+this.width/2) * Math.sin((this.from)*Math.PI)
      ]
    }

  
    getAABB(){
      const points = [
        this.startPointLeft,
        this.startPointRight,
        this.endPointLeft,
        this.endPointRight
      ];
      let minX = points[0][0]
      let minY = points[0][1]
      let maxX = points[0][0]
      let maxY = points[0][1]
      for(const point of points){
        if( point[0] < minX){
          minX = point[0]
        }
        if( point[0] > maxX){
          maxX = point[0]
        }
        if( point[1] < minY){
          minY = point[1]
        }
        if( point[1] > maxY){
          maxY = point[1]
        }
      }
      return [
        minX,
        minY,
        maxX- minX,
        maxY- minY
      ]
    }
  
    closestPoint(x,y){
      // angulo do centro até x,y
      const dx = x - this.center[0]
      const dy = y - this.center[1]
      const angle = Math.atan2(
        dy,dx
      )    
      // pega o ponto nesse ângulo
      return [
        this.center[0] + this.radius * Math.cos(angle),
        this.center[1] + this.radius * Math.sin(angle)
      ]
    }
  
    lookAhead(x,y){
      // angulo do centro até x,y
      let dx = x - this.center[0]
      let dy = y - this.center[1]
      const len = Math.sqrt(dx*dx + dy*dy)
      dx /= len
      dy /= len
      if(this.to < 0){
        dx *= -1
        dy *= -1
      }
      return [
        -dy,
        dx
      ]
    }
    continue({radius, to}){    
      const dX = Math.cos((this.from+this.to)*Math.PI)
      const dY = Math.sin((this.from+this.to)*Math.PI)
      const center = [
        this.center[0] + dX*(this.radius + (Math.sign(this.to) !== Math.sign(to) ? radius : -radius)),
        this.center[1] + dY*(this.radius + (Math.sign(this.to) !== Math.sign(to) ? radius : -radius))              
      ]
  
      // let _from = to > 0 ? this.from+this.to : this.from+this.to-1
      // let _to = Math.sign(this.to) !== Math.sign(to) ? -to : to
  
      let _from = this.from + this.to
      let _to = to
  
      // curva vai mudar de sentido.
      if(Math.sign(this.to) !== Math.sign(to)){
        _from += 1
      }
  
      const result = new RoadSegment({
        center,
        radius,
        from: _from,
        to : _to ,
        prev : this,
        width: this.width
      })
      this.next = result
      return result
    }

    drawAsphalt(ctx,camera){
      ctx.save()
      ctx.beginPath()

      if(this.clockwise){
        ctx.fillStyle = "#555555"
      }else{
        ctx.fillStyle = "#646464"
      }
      
      ctx.moveTo(...camera.translate(this.vertices[0]))
      const vertexCount = this.vertices.length
      for(let i = 1; i < vertexCount; i++){
         ctx.lineTo( ...camera.translate( this.vertices[i] ))
      }

      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    draw(ctx, camera){

      this.drawAsphalt(ctx, camera)

      // tracejado
      ctx.strokeStyle="#F0CD0E"
      ctx.lineWidth = 3
      const waypointCount = this.waypoints.length
      for(let i = 0; i < waypointCount; i+=2){
        if(i < waypointCount-1 ){
          ctx.beginPath()
          ctx.moveTo( ...camera.translate(this.waypoints[i]) )
          ctx.lineTo( ...camera.translate(this.waypoints[i+1]))
          ctx.stroke()
        }
      }

      if(this.next){
        this.next.draw(ctx, camera)
      }

      return
      const [centerX, centerY] = this.center
      const angleIncrement = (this.to*Math.PI)/this.segments;
      const fromAngle = this.from*Math.PI;
  
      let paths = [
        [-this.width/2, "red"], // esquerda
        [this.width/2, "green"] // direita
      ]
      
      if(!this.clockwise){
        paths = [
          [-this.width/2, "green"], // esquerda
          [this.width/2, "red"] // direita
        ]
      }
  
      ;paths.forEach( ([offset,color]) =>{
        ctx.strokeStyle = color
        ctx.beginPath();
               
        let angle = fromAngle;
        for(let i = 0; i <= this.segments; i++){
          const x = centerX + (this.radius+offset) * Math.cos(angle)
          const y = centerY + (this.radius+offset) * Math.sin(angle)  
          angle += angleIncrement
          ctx.lineTo( ...camera.translate([x,y]) )
        }
        ctx.stroke()  
      });
      
      // ctx.beginPath();
      // ctx.moveTo(...camera.translate(this.waypoints[0]))
      // for(let i = 1; i < this.waypoints.length; i++){
      //   ctx.fillText( i, ...camera.translate( this.waypoints[i] ))
      //   ctx.lineTo( ...camera.translate( this.waypoints[i] ))
      // }
      // ctx.stroke()
    
    }
  }

  export { RoadSegment }