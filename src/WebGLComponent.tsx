import React, { useRef, useEffect, useMemo, useState } from "react";
import { Utils } from "./utils/src";
import { ShaderSource } from "./shader/src";
import "./App.css"; // Import the CSS file
import { Player, Map } from "./types/src";

const WebGLComponent: React.FC = () => {
  
  // const [fps, setFps] = useState(0);
  // let lastFrameTime = performance.now();
  // let frameCount = 0;

  //define initial player state
  const player: Player = useMemo(() => ({
    location: { x: 0.58, y: -0.7 },
    // angle: (3 * Math.PI) / 4,
    angle:4.5,

    depthOfField: 0,
    locationDelta: {
      x: Math.cos((3 * Math.PI) / 4) * 0.0025,
      y: Math.sin((3 * Math.PI) / 4) * 0.0025
    },
    speed: 0.0015
  }), []);

  //define initial level state
  const map: Map = useMemo(() => ({
    rows: 20,
    columns: 20,
    cellSize: 64,
    cellSizeNormalized: 2.0 / 20,
    cells: [
      0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1,
      1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
      1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1,
      1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1,
      1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1,
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1,
      1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 
      1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1,
      1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 
      1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 
      1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1,
      1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 
      1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 2, 1, 1, 1,
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ]
  }), []);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State object to track key presses  
  const keyState: { [key: string]: boolean } = useMemo(() => ({
    w: false,
    a: false,
    s: false,
    d: false
  }), []);

  const glRef = useRef<WebGLRenderingContext | null>(null);

  const shadersProgramsRef = useRef<{
    rayProgram: WebGLProgram | undefined,
    mapProgram: WebGLProgram | undefined,
    playerProgram: WebGLProgram | undefined,
    pointerProgram: WebGLProgram | undefined,
    threeDProgram: WebGLProgram | undefined,
  }>({
    rayProgram: undefined,
    mapProgram: undefined,
    playerProgram: undefined,
    pointerProgram: undefined,
    threeDProgram: undefined,
  });

  useEffect(() => {
    console.log('setting up canvas and shader programs')
    if (!canvasRef) throw new Error("Error while retrieving canvas reference")
    if (!canvasRef.current) throw new Error("Error while retrieving current property of canvas reference")

    canvasRef.current.width = 1080;
    canvasRef.current.height = 720;

    let canvas = canvasRef.current;

    if (!canvas) throw new Error("Error while retrieving canvas")
    glRef.current = canvas.getContext("webgl")!;
    let gl = glRef.current ;

    if (!gl) throw new Error("Error while retrieving gl context")

    const createProgram = (vertexSrc: string, fragmentSrc: string) => {
      const vertexShader = Utils.createShader(gl, gl.VERTEX_SHADER, vertexSrc);
      const fragmentShader = Utils.createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
      if (!vertexShader || !fragmentShader) throw new Error("Error while creating shader");
      return Utils.createProgram(gl, vertexShader, fragmentShader);
    };

    shadersProgramsRef.current =  {
      rayProgram: createProgram(ShaderSource.RAY_VERTEX, ShaderSource.RAY_FRAGMENT),
      mapProgram: createProgram(ShaderSource.MAP_VERTEX, ShaderSource.MAP_FRAGMENT),
      playerProgram: createProgram(ShaderSource.PLAYER_VERTEX, ShaderSource.PLAYER_FRAGMENT),
      pointerProgram: createProgram(ShaderSource.POINTER_VERTEX, ShaderSource.POINTER_FRAGMENT),
      threeDProgram: createProgram(ShaderSource.THREED_VERTEX, ShaderSource.THREED_FRAGMENT),
    };
  }, []);

  useEffect(() => {
    console.log('checking key presses')
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key in keyState) {
        keyState[key] = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key in keyState) {
        keyState[key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [keyState]);

  useEffect(() => {
    console.log('checking mouse movement')
    const handleMouseMove = (event: MouseEvent) => {
      player.angle -= event.movementX * 0.005;
      player.locationDelta.x = Math.cos(player.angle) * 0.0020;
      player.locationDelta.y = Math.sin(player.angle) * 0.0020;
    };

    const handleClick = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.requestPointerLock();
      }
    };

    const handlePointerLockChange = () => {
      if (document.pointerLockElement === canvasRef.current) {
        document.addEventListener("mousemove", handleMouseMove);
      } else {
        document.removeEventListener("mousemove", handleMouseMove);
      }
    };

    document.addEventListener("pointerlockchange", handlePointerLockChange);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("click", handleClick);
    }

    return () => {
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange
      );
      document.removeEventListener("mousemove", handleMouseMove);
      if (canvas) {
        canvas.removeEventListener("click", handleClick);
      }
    };
  }, [player]);

  useEffect(() => {
    function updatePlayerPosition() {
      
      let distance = 0;
      let moveX = 0;
      let moveY = 0;
    
      if (keyState.d) {
        moveX = Math.cos(player.angle + Math.PI / 2) * player.speed;
        moveY = Math.sin(player.angle + Math.PI / 2) * player.speed;
        distance = 5;
      }
    
      if (keyState.a) {
        moveX = Math.cos(player.angle - Math.PI / 2) * player.speed;
        moveY = Math.sin(player.angle - Math.PI / 2) * player.speed;
        distance = 5;
      }
    
      if (keyState.w) {
        moveX = -player.locationDelta.x;
        moveY = -player.locationDelta.y;
        distance = 20;
      }
    
      if (keyState.s) {
        moveX = player.locationDelta.x;
        moveY = player.locationDelta.y;
        distance = 5;
      }
    
      const canMove = (x: number, y: number): boolean => {
        const nextLocationX = Utils.xNormalizedTodevice(player.location.x + x * distance);
        const nextLocationY = Utils.yNormalizedTodevice(player.location.y + y * distance);
        const cellY = nextLocationY >> 6;
        const cellX = nextLocationX >> 6;
        const cellChecked = cellY * map.rows + cellX;
        return map.cells[cellChecked] === 0  || map.cells[cellChecked] === 2;
      }
    
      let attemptedMove = false;
    
      if (moveX !== 0 || moveY !== 0) {
        if (canMove(moveX, moveY)) {
          player.location.x += moveX;
          player.location.y += moveY;
          attemptedMove = true;
        } else {
          // Try sliding along the X direction
          if (moveX !== 0 && canMove(moveX, 0)) {
            player.location.x += moveX;
            attemptedMove = true;
          }
          // Try sliding along the Y direction
          if (!attemptedMove && moveY !== 0 && canMove(0, moveY)) {
            player.location.y += moveY;
          }
        }
      }
    }
    

    function render() {

      let gl = glRef.current;

      // // Calculate FPS
      // const now = performance.now();
      // frameCount++;
      // const delta = (now - lastFrameTime) / 1000;
      // if (delta >= 1) {
      //   setFps(Math.round(frameCount / delta));
      //   frameCount = 0;
      //   lastFrameTime = now;
      // };

      updatePlayerPosition();

      if (!gl) throw new Error("gl is null or underfined.");

      gl.enable(gl.SCISSOR_TEST);

      if (!shadersProgramsRef) throw new Error("Error while creating a shader program"); 
      let shadersPrograms = shadersProgramsRef.current;

      if (!shadersPrograms.rayProgram) throw new Error("Error while creating ray program");
      if (!shadersPrograms.threeDProgram) throw new Error("Error while creating 3D program");
      Utils.drawRays(gl, shadersPrograms.rayProgram, shadersPrograms.threeDProgram, player, map);

      if (!shadersPrograms.mapProgram) throw new Error("Error while creating map program");
      Utils.drawMap2D(gl, shadersPrograms.mapProgram, map);

      if (!shadersPrograms.playerProgram || !shadersPrograms.pointerProgram) throw new Error("Error while creating player/pointer program");
      Utils.drawPlayer(gl, shadersPrograms.playerProgram, shadersPrograms.pointerProgram, player);

      requestAnimationFrame(render);
    }
    render();
  }, [keyState.a, keyState.d, keyState.s, keyState.w, map, player, shadersProgramsRef, glRef]);


  const canvasStyle: React.CSSProperties = {
    flex: 1, // Make the canvas take up the remaining space inside the column
    width: '100%',
    height: '100%',
  };

  return (
    <div>
      {/* <div>FPS: {fps}</div> */}
      <canvas ref={canvasRef} style={canvasStyle}></canvas>
    </div>
  );
};

export default WebGLComponent;
