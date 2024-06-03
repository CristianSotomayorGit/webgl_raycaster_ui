import { brick, checkerBoard, door } from "../../textures/src";
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
    map: Map
  ) {
    const numberOfRays = 320;
    const density = 4;
    let ray: Ray = {
      x: 0,
      y: 0,
      xOffset: 0,
      yOffset: 0,
      angle: player.angle - ((DR / density) * numberOfRays) / 2,
      projection: { height: 0, width: 0, offset: 0, coordinates: [] },
      horizontalCheck: { x: 0, y: 0, distance: 0 },
      verticalCheck: { x: 0, y: 0, distance: 0 },
      hit: { distance: 0, plane: "" },
    };

    // Keep ray from going out of range 0 -> 2*PI
    if (ray.angle < 0) ray.angle += 2 * PI;
    if (ray.angle > 2 * PI) ray.angle -= 2 * PI;

    // Limit drawing to main viewport and set background color
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.scissor(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.1137, 0.1137, 0.1137, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const rayHorizontalXLocations: number[] = [];
    const rayVerticalYLocations: number[] = [];
    const horizontalRectangles: number[] = [];
    const verticalRectangles: number[] = [];
    const cellsChecked: number[] = [];
    const rays: Ray[] = [];

    for (let currentRay = 0; currentRay < numberOfRays; currentRay++) {
      ray.projection.coordinates = [];
      // Translate WebGL normal space coordinates to integer space coordinates
      player.location.y = this.yNormalizedTodevice(player.location.y);
      player.location.x = this.xNormalizedTodevice(player.location.x);

      // HORIZONTAL HIT CHECK
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

      let cellCheckedHor = 0;

      ray.horizontalCheck.x = player.location.x;
      ray.horizontalCheck.y = player.location.y;
      ray.horizontalCheck.distance = 1000000;

      while (player.depthOfField < 20) {
        let columnFaceChecked = (ray.x | 0) >> 6;
        let rowFaceChecked = (ray.y | 0) >> 6;
        cellCheckedHor = rowFaceChecked * map.rows + columnFaceChecked;

        if (
          cellCheckedHor < map.columns * map.rows &&
          map.cells[cellCheckedHor] > 0
        ) {
          ray.horizontalCheck.x = ray.x;
          ray.horizontalCheck.y = ray.y;
          ray.horizontalCheck.distance = this.dist(
            player.location.x,
            player.location.y,
            ray.horizontalCheck.x,
            ray.horizontalCheck.y
          );
          player.depthOfField = 20;
        } else {
          ray.x += ray.xOffset;
          ray.y += ray.yOffset;
          player.depthOfField += 1;
        }
      }

      // VERTICAL HIT CHECK
      player.depthOfField = 0;
      const nTan = -Math.tan(-ray.angle);
      let cellCheckedVert = 0;

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

      ray.verticalCheck.x = player.location.x;
      ray.verticalCheck.y = player.location.y;
      ray.verticalCheck.distance = 1000000;

      while (player.depthOfField < 20) {
        let columnFaceChecked = (ray.x | 0) >> 6;
        let rowFaceChecked = (ray.y | 0) >> 6;
        cellCheckedVert = rowFaceChecked * map.rows + columnFaceChecked;

        if (
          cellCheckedVert < map.columns * map.rows &&
          map.cells[cellCheckedVert] > 0
        ) {
          ray.verticalCheck.x = ray.x;
          ray.verticalCheck.y = ray.y;
          ray.verticalCheck.distance = this.dist(
            player.location.x,
            player.location.y,
            ray.verticalCheck.x,
            ray.verticalCheck.y
          );
          player.depthOfField = 20;
        } else {
          ray.x += ray.xOffset;
          ray.y += ray.yOffset;
          player.depthOfField += 1;
        }
      }

      // FIND RAY WITH SHORTEST LENGTH

      if (ray.verticalCheck.distance < ray.horizontalCheck.distance) {
        ray.x = ray.verticalCheck.x;
        ray.y = ray.verticalCheck.y;
        ray.hit.distance = ray.verticalCheck.distance;
        ray.hit.plane = "VERTICAL";

        // DRAW MAP RAYS/3D ILLUSION
        // Fix fisheye distortion
        let ca = player.angle - ray.angle;
        if (ca < 0) ca += 2 * PI;
        if (ca > 2 * PI) ca -= 2 * PI;

        ray.hit.distance *= Math.cos(ca);

        ray.projection.height = (map.cellSize * 1280) / ray.hit.distance;
        ray.projection.width = 2 / numberOfRays;
        ray.projection.offset = 640 - ray.projection.height / 2;

        let x0 = -(currentRay * ray.projection.width - 1);
        let x1 = x0 + ray.projection.width;

        rayVerticalYLocations.push(ray.y);
        for (let i = 0; i < 32; i++) {
          let y0 = this.yDeviceToNormalized(
            ray.projection.offset + (ray.projection.height / 32) * i
          );
          let y1 = this.yDeviceToNormalized(
            (ray.projection.height / 32) * (i + 1) + ray.projection.offset
          );
          verticalRectangles.push(x0, y0, x1, y0, x1, y1, x0, y1);
        }

        player.location.x = this.xDeviceToNormalized(player.location.x);
        player.location.y = this.yDeviceToNormalized(player.location.y);
        ray.x = this.xDeviceToNormalized(ray.x);
        ray.y = this.yDeviceToNormalized(ray.y);
      } 
      
      else if (ray.horizontalCheck.distance < ray.verticalCheck.distance) {
        ray.x = ray.horizontalCheck.x;
        ray.y = ray.horizontalCheck.y;
        ray.hit.distance = ray.horizontalCheck.distance;
        ray.hit.plane = "HORIZONTAL";

        // DRAW MAP RAYS/3D ILLUSION
        // Fix fisheye distortion
        let ca = player.angle - ray.angle;
        if (ca < 0) ca += 2 * PI;
        if (ca > 2 * PI) ca -= 2 * PI;

        ray.hit.distance *= Math.cos(ca);

        ray.projection.height = (map.cellSize * 1280) / ray.hit.distance;
        ray.projection.width = 2 / numberOfRays;
        ray.projection.offset = 640 - ray.projection.height / 2;

        let x0 = -(currentRay * ray.projection.width - 1);
        let x1 = x0 + ray.projection.width;
        // console.log(cellCheckedHor);
        cellsChecked.push(cellCheckedHor);
        rayHorizontalXLocations.push(ray.x);
        
        for (let i = 0; i < 32; i++) {
          let y0 = this.yDeviceToNormalized(
            ray.projection.offset + (ray.projection.height / 32) * i
          );
          let y1 = this.yDeviceToNormalized(
            (ray.projection.height / 32) * (i + 1) + ray.projection.offset
          );
         horizontalRectangles.push(x0, y0, x1, y0, x1, y1, x0, y1);
        }

        rays.push(ray);

        player.location.x = this.xDeviceToNormalized(player.location.x);
        player.location.y = this.yDeviceToNormalized(player.location.y);
        ray.x = this.xDeviceToNormalized(ray.x);
        ray.y = this.yDeviceToNormalized(ray.y);
      }

      ray.angle += DR / density;

      if (ray.angle < 0) ray.angle += 2 * PI;
      if (ray.angle > 2 * PI) ray.angle -= 2 * PI;
    }

    gl.useProgram(program3D);
    const rayColorUniformLocation = gl.getUniformLocation(program3D, "u_color");

    //project horizontal map lines in 3d
    let buffer = this.createAndFillBufferObject(
      gl,
      new Float32Array(horizontalRectangles)
    );
    let attributeLocation = this.getAndEnableAttributeLocation(gl, program3D);

    let j = 0;
    for (let i = 0; i < horizontalRectangles.length / 8; i++) {
      let y = i % 32;
      let xO = ((rayHorizontalXLocations[j] >> 1) | 0) % 32;

      if (brick[xO + y * 32] === 0)
        gl.uniform4f(rayColorUniformLocation, 0.6078, 0.4, 0.8667, 1);
      else
        gl.uniform4f(rayColorUniformLocation, 0.1137, 0.1137, 0.1137, 1);

        // console.log(cellsChecked[j], map.cells[cellsChecked[j]])
      if (map.cells[cellsChecked[j]] === 2) {
        if (door[xO + y * 32] === 0)
          gl.uniform4f(rayColorUniformLocation, 0.6078, 0.4, 0.8667, 1);
        else
          gl.uniform4f(rayColorUniformLocation, 0.1137, 0.1137, 0.1137, 1);
      }

      // if (map.cells[cellsChecked[i/32]])
      gl.drawArrays(gl.TRIANGLE_FAN, i * 4, 4);
      if (y === 31) j++;
    }

    // let i = 0;
    // for (const ray of rays) {
    //   console.log(i);
    //   console.log(ray);
    //   i++
    // }

    // console.log('done')

    gl.disableVertexAttribArray(attributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.deleteBuffer(buffer);

    // project vertical map lines in 3d
     buffer = this.createAndFillBufferObject(
      gl,
      new Float32Array(verticalRectangles)
    );
     attributeLocation = this.getAndEnableAttributeLocation(gl, program3D);

    let k = 0;
    for (let i = 0; i < verticalRectangles.length / 8; i++) {
      let y = i % 32;
      let xO = ((rayVerticalYLocations[k] >> 1) | 0) % 32;

      if (brick[xO + y * 32] === 0)
        gl.uniform4f(rayColorUniformLocation, 0.5294, 0.3216, 0.7882, 1);
      else gl.uniform4f(rayColorUniformLocation, 0.1137, 0.1137, 0.1137, 1);

      gl.drawArrays(gl.TRIANGLE_FAN, i * 4, 4);
      if (y === 31) k++;
    }

    gl.disableVertexAttribArray(attributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.deleteBuffer(buffer);

    // //project floor
    // buffer = this.createAndFillBufferObject(
    //   gl,
    //   new Float32Array(verticalRectangles)
    // );
    // attributeLocation = this.getAndEnableAttributeLocation(gl, program3D);
  }

  static drawPlayer(
    gl: WebGLRenderingContext,
    playerProgram: WebGLProgram,
    pointerProgram: WebGLProgram,
    player: Player
  ) {
    //limit drawing to map viewport on bottom left
    const mapViewportHeight = gl.canvas.height / 4;
    const mapViewportWidth = mapViewportHeight;

    gl.viewport(0, 0, mapViewportWidth, mapViewportWidth);
    gl.scissor(0, 0, mapViewportWidth, mapViewportWidth);

    // draw player
    gl.useProgram(playerProgram);
    let buffer = this.createAndFillBufferObject(
      gl,
      new Float32Array([player.location.x, player.location.y])
    );
    let attributeLocation = this.getAndEnableAttributeLocation(
      gl,
      playerProgram
    );
    gl.drawArrays(gl.POINTS, 0, 1);
    gl.deleteBuffer(buffer);
    gl.disableVertexAttribArray(attributeLocation);

    // draw player pointer
    gl.useProgram(pointerProgram);
    buffer = this.createAndFillBufferObject(
      gl,
      new Float32Array([
        player.location.x,
        player.location.y,
        player.location.x - player.locationDelta.x * 20,
        player.location.y - player.locationDelta.y * 20,
      ])
    );
    attributeLocation = this.getAndEnableAttributeLocation(gl, pointerProgram);
    gl.drawArrays(gl.LINES, 0, 2);
    gl.deleteBuffer(buffer);
    gl.disableVertexAttribArray(attributeLocation);
  }

  static drawMap2D(gl: WebGLRenderingContext, program: WebGLProgram, map: Map) {
    gl.useProgram(program);

    // Limit rendering to map viewport on bottom left
    const viewportSize = gl.canvas.height / 4;
    gl.viewport(0, 0, viewportSize, viewportSize);
    gl.scissor(0, 0, viewportSize, viewportSize);
    gl.clearColor(0.1137, 0.1137, 0.1137, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const rectangles: Float32Array[] = [];
    for (let i = 0; i < map.rows * map.columns; i++) {
      const x = i % map.columns;
      const y = Math.floor(i / map.columns);

      if (map.cells[i] > 0) {
        const x0 = x * map.cellSizeNormalized - 1;
        const y0 = 1 - y * map.cellSizeNormalized;
        const x1 = (x + 1) * map.cellSizeNormalized - 1;
        const y1 = 1 - (y + 1) * map.cellSizeNormalized;
        rectangles.push(new Float32Array([x0, y0, x1, y0, x1, y1, x0, y1]));
      }
    }

    rectangles.forEach((rect) => {
      const buffer = this.createAndFillBufferObject(gl, rect);
      const attributeLocation = this.getAndEnableAttributeLocation(gl, program);

      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

      gl.deleteBuffer(buffer);
      gl.disableVertexAttribArray(attributeLocation);
    });
  }

  static createAndFillBufferObject(
    gl: WebGLRenderingContext,
    data: Float32Array
  ) {
    let bufferId = gl.createBuffer();
    if (!bufferId) throw new Error("Failed to create the buffer object");

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    return bufferId;
  }

  static getAndEnableAttributeLocation(
    gl: WebGLRenderingContext,
    program: WebGLProgram
  ) {
    const attributeLocation = gl.getAttribLocation(program, "a_position");
    if (attributeLocation === -1)
      throw new Error("failed to get attribute location");
    gl.enableVertexAttribArray(attributeLocation);
    gl.vertexAttribPointer(attributeLocation, 2, gl.FLOAT, false, 0, 0);

    return attributeLocation;
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
