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

    //Keep ray from going out of ran 0 -> 2*PI
    if (ray.angle < 0) ray.angle += 2 * PI;
    if (ray.angle > 2 * PI) ray.angle -= 2 * PI;

    //limit drawing to main viewport and set background color
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.scissor(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.25, 0.25, 0.25, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (let currentRay = 0; currentRay < rays; currentRay++) {

      //Translate WebGL normal space coordinates to integer space space coordinates
      player.location.y = Utils.yNormalizedTodevice(player.location.y);
      player.location.x = Utils.xNormalizedTodevice(player.location.x);

      //HORIZONTAL HIT CHECK--------------------------------------------
      
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

      //VERTICAL HIT CHECK--------------------------------------------

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

      //FIND RAY WITH SHORTEST LENGTH------------------------------------------

      gl.useProgram(program3D);
      const rayColorUniformLocation = gl.getUniformLocation(program3D, "u_color");

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

      //DRAW MAP RAYS/3D ILLUSION------------------------------------------------------------------------

      //Tranlate integer space coordinates back to WebGL normal space for rendering rays on map
      player.location.x = Utils.xDeviceToNormalized(player.location.x);
      player.location.y = Utils.yDeviceToNormalized(player.location.y);
      ray.x = Utils.xDeviceToNormalized(ray.x);
      ray.y = Utils.yDeviceToNormalized(ray.y);

      //draw rays on map viewport (UNCOMMENT CODE FOR MAP RAY DEMO)
      // gl.viewport(0, 0, gl.canvas.height/4, gl.canvas.height/4);
      // gl.scissor(0, 0, gl.canvas.height/4, gl.canvas.height/4);
      // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([player.location.x, player.location.y, ray.x, ray.y]), gl.STATIC_DRAW);
      // gl.drawArrays(gl.LINES, 0, 2);

      //Fix fisheye distortion
      var ca = player.angle - ray.angle;
      if (ca < 0)      ca += 2 * PI;
      if (ca > 2 * PI) ca -= 2 * PI;

      hitDistance = hitDistance * Math.cos(ca);

      //To achieve a smooth wall rendering we use rectangles as WevGl does not allow line widths
      const rectangleHeight = (map.cellSize * 1280) / hitDistance;
      const rectangleWidth = 2/rays;
      const rectangleOffset = 640 - rectangleHeight / 2;

      let x0 = -(currentRay * rectangleWidth - 1);
      let y0 = Utils.yDeviceToNormalized(rectangleOffset);
      let x1 = x0 + rectangleWidth;
      let y1 = Utils.yDeviceToNormalized(rectangleHeight + rectangleOffset);

      //draw 3D walls
      Utils.createAndFillBufferObject(gl, new Float32Array([x0, y0, x1, y0, x1, y1, x0, y1]));
      Utils.getAndEnableAttributeLocation(gl, program3D);

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
  ) {
    //limit drawing to map viewport on bottom left
    const mapViewportHeight = gl.canvas.height/4;
    const mapViewportWidth = mapViewportHeight

    gl.viewport(0, 0, mapViewportWidth, mapViewportWidth);
    gl.scissor(0, 0, mapViewportWidth, mapViewportWidth);

    // draw player
    gl.useProgram(playerProgram);
    Utils.createAndFillBufferObject(gl, new Float32Array([player.location.x, player.location.y]))
    Utils.getAndEnableAttributeLocation(gl,playerProgram);
    gl.drawArrays(gl.POINTS, 0, 1);

    // draw player pointer
    gl.useProgram(pointerProgram);    
    Utils.createAndFillBufferObject(gl, new Float32Array([player.location.x, player.location.y, player.location.x - player.locationDelta.x * 20, player.location.y - player.locationDelta.y * 20,]))
    Utils.getAndEnableAttributeLocation(gl,pointerProgram);
    gl.drawArrays(gl.LINES, 0, 2);
  }

static drawMap2D(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  map: Map,
) {
  gl.useProgram(program);

  //limit rendering to map viewport on bottom left
  const viewportSize = gl.canvas.height / 4;
  gl.viewport(0, 0, viewportSize, viewportSize);
  gl.scissor(0, 0, viewportSize, viewportSize);
  gl.clearColor(0.25, 0.25, 0.25, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  //draw map cells
  for (let y = 0; y < map.rows; y++) {
    for (let x = 0; x < map.columns; x++) {
      if (map.cells[y * map.columns + x] === 1) {
        const x0 = x * map.cellSizeNormalized - 1;
        const y0 = 1 - y * map.cellSizeNormalized;
        const x1 = (x + 1) * map.cellSizeNormalized - 1;
        const y1 = 1 - (y + 1) * map.cellSizeNormalized;

        Utils.createAndFillBufferObject(gl, new Float32Array([x0, y0, x1, y0, x1, y1, x0, y1]))
        Utils.getAndEnableAttributeLocation(gl,program);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
      }
    }
  }
}

static createAndFillBufferObject(gl: WebGLRenderingContext, data: Float32Array) {

  // Create a buffer object
  let bufferId = gl.createBuffer();
  if (!bufferId) throw new Error('Failed to create the buffer object');

  // Make the buffer object the active buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

  // Upload the data for this buffer object to the GPU.
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  return bufferId;
}

static getAndEnableAttributeLocation(gl: WebGLRenderingContext, program: WebGLProgram) {
  const attributeLocation = gl.getAttribLocation(program, "a_position");
  if (attributeLocation === -1) throw new Error('failed to get attribute location');
  gl.enableVertexAttribArray(attributeLocation);
  gl.vertexAttribPointer(attributeLocation, 2, gl.FLOAT, false, 0, 0);}

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
