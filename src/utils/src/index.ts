const DR = 0.0174533;
const PI = Math.PI;
const PI2 = Math.PI / 2;
const PI3 = (3 * Math.PI) / 2;

export class Utils {
  static draw3D(gl: WebGLRenderingContext) {

  }

  static createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);

    if (!shader) {
      throw new Error("Error while creating shader");
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (success) {
      return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }

  static createProgram(
    gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ) {
    var program = gl.createProgram();

    if (!program) {
      throw new Error("Error while creating program");
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    var success = gl.getProgramParameter(program, gl.LINK_STATUS);

    if (success) {
      return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }

  static dist(aX: number, aY: number, bX: number, bY: number) {
    const c = Math.sqrt((bX - aX) * (bX - aX) + (bY - aY) * (bY - aY)); //pythagorean theorem
    return c;
  }

  static drawRays(
    gl: WebGLRenderingContext,
    program: WebGLProgram,    
    program3D: WebGLProgram,
    playerPositionX: number,
    playerPositionY: number,
    playerAngle: number,
    map: number[],
    mapX: number,
    mapY: number,
    tileSize: number
  ) {

    var mX: any;
    var mY: any;
    var mP: any;
    var dof: any;

    var rY = 0.0;
    var rX = 0.0;
    var ra: any;
    var xO = 0.0;
    var yO = 0.0;

    var devRY = 0;
    var devRX = 0;

    var distT = 0;

    ra = playerAngle - (DR/4) * 120;
    gl.useProgram(program);
    var rayColorUniformLocation = gl.getUniformLocation(program, "u_color");

    if (ra < 0) {
      ra += 2 * PI;
    }

    if (ra > 2 * PI) {
      ra -= 2 * PI;
    }

    for (let r = 0; r < 240; r++) {

      gl.viewport(0, 0, gl.canvas.width/2, gl.canvas.height);

      //Horizontal check
      playerPositionY = Utils.yNormalizedTodevice(playerPositionY);
      playerPositionX = Utils.xNormalizedTodevice(playerPositionX);

      dof = 0;

      var disH = 1000000;
      var hX = playerPositionX;
      var hY = playerPositionY;

      const aTan = -1 / Math.tan(-ra);

      if (ra < PI) {
        //Looking up
        rY = (((playerPositionY | 0) >> 6) << 6) + tileSize;
        rX = (playerPositionY - rY) * aTan + playerPositionX;
        yO = tileSize;
        xO = -yO * aTan;
      }

      if (ra > PI) {
        //Looking down
        rY = (((playerPositionY | 0) >> 6) << 6) - 0.0001;
        rX = (playerPositionY - rY) * aTan + playerPositionX;
        yO = -tileSize;
        xO = -yO * aTan;
      }

      while (dof < 20) {
        mX = (rX | 0) >> 6;
        mY = (rY | 0) >> 6;
        mP = mY * mapX + mX;

        if (mP < mapX * mapY && map[mP] === 1) {
          hX = rX;
          hY = rY;
          disH = this.dist(playerPositionX, playerPositionY, hX, hY);

          dof = 20;
        } else {
          rX += xO;
          rY += yO;
          dof += 1;
        }
      }

      // Vertical Line check

      dof = 0;

      var disV = 1000000;
      var vX = playerPositionX;
      var vY = playerPositionY;
      var nTan= -Math.tan(-ra);
      
      if (ra < PI2 || ra > PI3) {
          rX = (((playerPositionX | 0) >>6) <<6) - 0.0001;
          rY = (playerPositionX - rX) * nTan + playerPositionY;
          xO = -tileSize;
          yO = -xO * nTan;
      }

      if (ra > PI2 && ra < PI3) {
          rX = (((playerPositionX | 0) >>6) <<6) + tileSize;
          rY = (playerPositionX - rX) * nTan + playerPositionY;
          xO = tileSize;
          yO = -xO * nTan;
      }
      
      if (ra == 0 || ra == PI) {
          rX = playerPositionX;
          rY = playerPositionY;
          dof = 20;
      }
      
      while (dof < 20) {
          mX = (rX | 0) >> 6;
          mY = (rY | 0) >> 6;
          mP = mY * mapX + mX;

          if (mP > 0 && mP < mapX * mapY && map[mP] == 1) {
              vX = rX;
              vY = rY;
              disV = this.dist(playerPositionX, playerPositionY, vX, vY);
              dof = 20;
          }

          else {
              rX += xO;
              rY += yO;
              dof += 1;
          } 
      }

      if (disV < disH) {
          rX = vX;
          rY = vY;
          distT = disV;
          // glColor3f(1, 0, 0);
          gl.uniform4f(rayColorUniformLocation, 1, 0, 0, 1); // Set ray color to cyan

      }

      if (disH < disV) {
          rX = hX;
          rY = hY;
          distT = disH;
          // glColor3f(0.5, 0, 0);
          gl.uniform4f(rayColorUniformLocation, 0.5, 0, 0, 1); // Set ray color to cyan

      }

      devRY = rY;
      devRX = rX;

      playerPositionX = Utils.xDeviceToNormalized(playerPositionX);
      playerPositionY = Utils.yDeviceToNormalized(playerPositionY);
      rX = Utils.xDeviceToNormalized(rX);
      rY = Utils.yDeviceToNormalized(rY);

      //draw on left viewport
      gl.viewport(0, 0, gl.canvas.width / 2, gl.canvas.height);
      gl.scissor(0, 0, gl.canvas.width / 2, gl.canvas.height);
      // gl.clearColor(0.25, 0.25, 0.25, 1);
      // gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([playerPositionX, playerPositionY, rX, rY]), gl.STATIC_DRAW);
      gl.drawArrays(gl.LINES, 0, 2);

        //Draw 3D Walls
        //Fix fisheye distortion
        var ca = playerAngle - ra;
        
        if (ca < 0) {
            ca += 2 * PI; 
        }

        if (ca > 2 * PI) {
            ca -= 2 * PI;
        }

      distT = distT * Math.cos(ca);
        
      var lineH = (tileSize * 1280) / distT;
      var lineO = 640 - lineH / 2;

     


      
      //draw on right viewpoert
      gl.viewport(gl.canvas.width / 2, 0, gl.canvas.width / 2, gl.canvas.height);
      gl.scissor(gl.canvas.width / 2, 0, gl.canvas.width / 2, gl.canvas.height);
      var threeDColorUniformLocation = gl.getUniformLocation(program3D, "u_color");
      gl.uniform4f(threeDColorUniformLocation, 0.5, 0, 0, 1); // Set ray color to cyandd

      const spacing = 0.01744 /2
      // r = Utils.xDeviceToNormalized(r);
      // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-(r * spacing - 1), Utils.yDeviceToNormalized(lineO), -(r * spacing - 1), Utils.yDeviceToNormalized(lineH +lineO)]), gl.STATIC_DRAW);
      // gl.lineWidth(0.99);
      // gl.drawArrays(gl.LINES, 0, 2);
  
      let x0 = -(r * spacing - 1);
      let y0 = Utils.yDeviceToNormalized(lineO);
      let x1 = x0 + spacing;
      let y1 = Utils.yDeviceToNormalized(lineH +lineO);

      // var mapVertexBuffer = gl.createBuffer();
      // gl.bindBuffer(gl.ARRAY_BUFFER, mapVertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x0, y0, x1, y0, x1, y1, x0, y1]), gl.STATIC_DRAW);
      // mapVertices.push(x0, y0, x1, y0, x1, y1, x0, y1);

      // gl.vertexAttribPointer(mapPositionAttributeLocation,2,gl.FLOAT,false,0,0);
  
  
      // gl.uniform4f(mapColorUniformLocation, 0.5, 0.5, 0.5, 1);
  

      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
      



      ra += DR/4;

      if (ra < 0) {
        ra += 2 * PI;
      }

      if (ra > 2 * PI) {
        ra -= 2 * PI;
      }


    }
    return { mX, mY, mP, dof, devRY, devRX, ra, xO, yO };
  }

  static drawPlayer(
    gl: WebGLRenderingContext,
    playerProgram: WebGLProgram,
    pointerProgram: WebGLProgram,
    playerPositionX: number,
    playerPositionY: number,
    playerDeltaX: number,
    playerDeltaY: number
  ) {
    var playerPositionBuffer = gl.createBuffer();

    var playerPositionAttributeLocation = gl.getAttribLocation(
      playerProgram,
      "a_position"
    );
    gl.enableVertexAttribArray(playerPositionAttributeLocation);
    gl.vertexAttribPointer(
      playerPositionAttributeLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.useProgram(playerProgram);
      //draw on left viewport
      gl.viewport(0, 0, gl.canvas.width / 2, gl.canvas.height);
      gl.scissor(0, 0, gl.canvas.width / 2, gl.canvas.height);
      // gl.clearColor(0.25, 0.25, 0.25, 1);
      // gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([playerPositionX, playerPositionY]),
      gl.STATIC_DRAW
    );

    gl.drawArrays(gl.POINTS, 0, 1);

    gl.useProgram(pointerProgram);
    gl.uniform4f(gl.getUniformLocation(pointerProgram, "u_color"), 1, 1, 0, 1); // Yellow color
    var lineVertices = [
      playerPositionX,
      playerPositionY,
      playerPositionX - playerDeltaX * 10,
      playerPositionY - playerDeltaY * 10,
    ];
    var lineBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(lineVertices),
      gl.STATIC_DRAW
    );
    var linePositionAttributeLocation = gl.getAttribLocation(
      pointerProgram,
      "a_position"
    );
    gl.enableVertexAttribArray(linePositionAttributeLocation);
    gl.vertexAttribPointer(
      linePositionAttributeLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.drawArrays(gl.LINES, 0, 2);
  }

  static drawMap2D(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    map: number[],
    mapX: number,
    mapY: number,
    tileSize: number
  ) {
    var mapPositionAttributeLocation = gl.getAttribLocation(
      program,
      "a_position"
    );
    gl.enableVertexAttribArray(mapPositionAttributeLocation);

    var mapColorUniformLocation = gl.getUniformLocation(program, "u_color");

    gl.useProgram(program);

    var mapVertices: number[] = [];

  
    for (var y = 0; y < mapY; y++) {
      for (var x = 0; x < mapX; x++) {
        var x0 = x * tileSize - 1;
        var y0 = 1 - y * tileSize;

        var x1 = (x + 1) * tileSize - 1;
        var y1 = 1 - (y + 1) * tileSize;

        if (map[y * mapX + x] === 1) {
          mapVertices.push(x0, y0, x1, y0, x1, y1, x0, y1);
        }
      }
    }

    var mapVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mapVertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(mapVertices),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(
      mapPositionAttributeLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );


    gl.uniform4f(mapColorUniformLocation, 0.5, 0.5, 0.5, 1);

    //draw on left viewport
    gl.viewport(0, 0, gl.canvas.width / 2, gl.canvas.height);
    gl.scissor(0, 0, gl.canvas.width / 2, gl.canvas.height);
    gl.clearColor(0.25, 0.25, 0.25, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i = 0; i < mapVertices.length / 8; i++) {
      gl.drawArrays(gl.TRIANGLE_FAN, i * 4, 4);
    }
  }

  static updatePosition(
    keys: any,
    playerAngle: number,
    playerPositionX: number,
    playerPositionY: number,
    playerDeltaX: number,
    playerDeltaY: number
  ) {
    if (keys["d"]) {
      playerAngle -= 0.05;

      if (playerAngle < 0) {
        playerAngle += 2 * PI;
      }

      playerDeltaX = Math.cos(playerAngle) * 5;
      playerDeltaY = Math.sin(playerAngle) * 5;
    }

    if (keys["a"]) {
      playerAngle += 0.05;

      if (playerAngle > 2 * PI) {
        playerAngle -= 2 * PI;
      }

      playerDeltaX = Math.cos(playerAngle) * 5;
      playerDeltaY = Math.sin(playerAngle) * 5;
    }

    if (keys["w"]) {
      playerPositionX += playerDeltaX;
      playerPositionY += playerDeltaY;
    }

    if (keys["s"]) {
      playerPositionX -= playerDeltaX;
      playerPositionY -= playerDeltaY;
    }
  }

  static xNormalizedTodevice(x: number) {
    return 640 * (x + 1);
  }

  static xDeviceToNormalized(x: number) {
    return (1 / 640) * x - 1;
  }

  static yNormalizedTodevice(y: number) {
    return -640 * (y - 1);
  }

  static yDeviceToNormalized(y: number) {
    return (-1 / 640) * y + 1;
  }
}
