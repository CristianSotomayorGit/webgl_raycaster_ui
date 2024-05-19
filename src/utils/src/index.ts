import { Player, Ray, Map } from "../../types/src";

const DR = 0.0174533;
const PI = Math.PI;
const PI2 = Math.PI / 2;
const PI3 = (3 * Math.PI) / 2;

export class Utils {
  static createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);

    if (!shader) throw new Error("Error while creating shader");

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
    const c = Math.sqrt((bX - aX) * (bX - aX) + (bY - aY) * (bY - aY));
    return c;
  }

  static drawRays(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    program3D: WebGLProgram,
    player: Player,
    map: Map,
  ) {

    const rays = 180;
    let ray: Ray = {x: 0, y: 0, xOffset: 0, yOffset: 0, angle: player.angle - (DR/2) * rays/2}

    if (ray.angle < 0) ray.angle += 2 * PI;
    if (ray.angle > 2 * PI) ray.angle -= 2 * PI;
    
    for (let currentRay = 0; currentRay < rays; currentRay++) {

      //Translate WebGL normal space coordinates to integer space space coordinates
      player.location.y = Utils.yNormalizedTodevice(player.location.y);
      player.location.x = Utils.xNormalizedTodevice(player.location.x);

      //Horizontal hit check--------------------------------------------
      
      player.depthOfField = 0;
      const aTan = -1 / Math.tan(-ray.angle);
      
      if (ray.angle < PI) {
        ray.y = (((player.location.y | 0) >> 6) << 6) + map.cellSize;
        ray.x = (player.location.y - ray.y) * aTan + player.location.x;
        ray.yOffset = map.cellSize;
        ray.xOffset = -ray.yOffset * aTan;
      }

      if (ray.angle > PI) {
        ray.y = (((player.location.y | 0) >> 6) << 6) - 0.0001;
        ray.x = (player.location.y - ray.y) * aTan + player.location.x;
        ray.yOffset = -map.cellSize;
        ray.xOffset = -ray.yOffset * aTan;
      }

      let horHitLocationX = player.location.x;
      let horHitLocationY = player.location.y;
      let horHitDistance = 1000000;

      while (player.depthOfField < 20) {
        let columnFaceChecked = (ray.x | 0) >> 6;
        let rowFaceChecked = (ray.y | 0) >> 6;
        let cellChecked = rowFaceChecked * map.rows + columnFaceChecked;

        if (cellChecked < map.columns * map.rows && map.cells[cellChecked] === 1) {
          horHitLocationX = ray.x;
          horHitLocationY = ray.y;
          horHitDistance = this.dist(player.location.x, player.location.y, horHitLocationX, horHitLocationY);
          player.depthOfField = 20;
        } else {
          ray.x += ray.xOffset;
          ray.y += ray.yOffset;
          player.depthOfField += 1;
        }
      }

      //Horizontal hit check--------------------------------------------

      player.depthOfField = 0;
      const nTan = -Math.tan(-ray.angle);

      if (ray.angle < PI2 || ray.angle > PI3) {
        ray.x = (((player.location.x | 0) >> 6) << 6) - 0.0001;
        ray.y = (player.location.x - ray.x) * nTan + player.location.y;
        ray.xOffset = -map.cellSize;
        ray.yOffset = -ray.xOffset * nTan;
      }

      if (ray.angle > PI2 && ray.angle < PI3) {
        ray.x = (((player.location.x | 0) >> 6) << 6) + map.cellSize;
        ray.y = (player.location.x - ray.x) * nTan + player.location.y;
        ray.xOffset = map.cellSize;
        ray.yOffset = -ray.xOffset * nTan;
      }

      if (ray.angle === 0 || ray.angle === PI) {
        ray.x = player.location.x;
        ray.y = player.location.y;
        player.depthOfField = 20;
      }

      let vertHitLocationX = player.location.x;
      let vertHitLocationY = player.location.y;
      let vertHitDistance = 1000000;

      while (player.depthOfField < 20) {
        let columnFaceChecked = (ray.x | 0) >> 6;
        let rowFaceChecked = (ray.y | 0) >> 6;
        let cellChecked = rowFaceChecked * map.rows + columnFaceChecked;

        if (cellChecked < map.columns * map.rows && map.cells[cellChecked] === 1) {
          vertHitLocationX = ray.x;
          vertHitLocationY = ray.y;
          vertHitDistance = this.dist(player.location.x, player.location.y, vertHitLocationX, vertHitLocationY);
          player.depthOfField = 20;
        } else {
          ray.x += ray.xOffset;
          ray.y += ray.yOffset;
          player.depthOfField += 1;
        }
      }

      //Find ray with shortest distance to render-------------------------------------------

      gl.useProgram(program);
      const rayColorUniformLocation = gl.getUniformLocation(program, "u_color");

      let hitDistance = 0;

      if (vertHitDistance < horHitDistance) {
        ray.x = vertHitLocationX;
        ray.y = vertHitLocationY;
        hitDistance = vertHitDistance;
        gl.uniform4f(rayColorUniformLocation, 0.25, 0, 0, 1); 
      }

      if (horHitDistance < vertHitDistance) {
        ray.x = horHitLocationX;
        ray.y = horHitLocationY;
        hitDistance = horHitDistance;
        gl.uniform4f(rayColorUniformLocation, 0.333, 0.420, 0.184, 1); 
      }

      //Draw rays on map------------------------------------------------------------------------

      //Tranlate integer space coordinates back to WebGL normal space for rendering rays on map
      player.location.x = Utils.xDeviceToNormalized(player.location.x);
      player.location.y = Utils.yDeviceToNormalized(player.location.y);
      ray.x = Utils.xDeviceToNormalized(ray.x);
      ray.y = Utils.yDeviceToNormalized(ray.y);

      //draw rays on map viewport
      gl.viewport(0, 0, gl.canvas.height/4, gl.canvas.height/4);
      gl.scissor(0, 0, gl.canvas.height/4, gl.canvas.height/4);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([player.location.x, player.location.y, ray.x, ray.y]), gl.STATIC_DRAW);
      gl.drawArrays(gl.LINES, 0, 2);

      //Draw 3D wall illusion------------------------------------------------------------------------

      //Fix fisheye distortion
      var ca = player.angle - ray.angle;
      if (ca < 0) ca += 2 * PI;
      if (ca > 2 * PI) ca -= 2 * PI;

      hitDistance = hitDistance * Math.cos(ca);

      //To achieve a smooth wall rendering we use rectangles as WevGl does not allow line widths
      const rectangleHeight = (map.cellSize * 1280) / hitDistance;
      const rectangleWidth = 2/rays;
      const rectangleOffset = 640 - rectangleHeight / 2;

      //draw on main viewport
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.scissor(0, 0, gl.canvas.width, gl.canvas.height);

      var threeDColorUniformLocation = gl.getUniformLocation(program3D, "u_color");
      gl.uniform4f(threeDColorUniformLocation, 0.5, 0, 0, 1); 

      let x0 = -(currentRay * rectangleWidth - 1);
      let y0 = Utils.yDeviceToNormalized(rectangleOffset);
      let x1 = x0 + rectangleWidth;
      let y1 = Utils.yDeviceToNormalized(rectangleHeight + rectangleOffset);

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x0, y0, x1, y0, x1, y1, x0, y1]), gl.STATIC_DRAW);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

      ray.angle += DR/2 ;

      if (ray.angle < 0) ray.angle += 2 * PI;
      if (ray.angle > 2 * PI) ray.angle -= 2 * PI;
    }
  }

  static drawPlayer(
    gl: WebGLRenderingContext,
    playerProgram: WebGLProgram,
    pointerProgram: WebGLProgram,
    player: Player,
    playerDeltaX: number,
    playerDeltaY: number
  ) {

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
    gl.viewport(0, 0, gl.canvas.height/4, gl.canvas.height/4);
    gl.scissor(0, 0, gl.canvas.height/4, gl.canvas.height/4);

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([player.location.x, player.location.y]),
      gl.STATIC_DRAW
    );

    gl.drawArrays(gl.POINTS, 0, 1);

    gl.useProgram(pointerProgram);
    gl.uniform4f(gl.getUniformLocation(pointerProgram, "u_color"), 1, 1, 0, 1); // Yellow color
    var lineVertices = [
      player.location.x,
      player.location.y,
      player.location.x - playerDeltaX * 10,
      player.location.y - playerDeltaY * 10,
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
    map: Map,
  ) {
    var mapPositionAttributeLocation = gl.getAttribLocation(
      program,
      "a_position"
    );
    gl.enableVertexAttribArray(mapPositionAttributeLocation);

    var mapColorUniformLocation = gl.getUniformLocation(program, "u_color");

    gl.useProgram(program);

    var mapVertices: number[] = [];

    for (var y = 0; y < map.rows; y++) {
      for (var x = 0; x < map.columns; x++) {
        var x0 = x * map.cellSizeNormalized - 1;
        var y0 = 1 - y * map.cellSizeNormalized;

        var x1 = (x + 1) * map.cellSizeNormalized - 1;
        var y1 = 1 - (y + 1) * map.cellSizeNormalized;

        if (map.cells[y * map.columns + x] === 1) {
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
    gl.viewport(0, 0, gl.canvas.height/4, gl.canvas.height/4);
    gl.scissor(0, 0, gl.canvas.height/4, gl.canvas.height/4);
    gl.clearColor(0.25, 0.25, 0.25, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i = 0; i < mapVertices.length / 8; i++) {
      gl.drawArrays(gl.TRIANGLE_FAN, i * 4, 4);
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
