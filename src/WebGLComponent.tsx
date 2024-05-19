import React, { useRef, useEffect } from "react";
import { Utils } from "./utils/src";
import { ShaderSource } from "./shader/src";
import "./App.css"; // Import the CSS file
import { Player, Map } from "./types/src";

const WebGLComponent: React.FC = () => {
  let player: Player = {
    location: { x: -0.9, y: 0.9 },
    angle: (3 * Math.PI) / 4,
    depthOfField: 0,
  };

  // let playerAngle = (3 * Math.PI) / 4;
  // let playerPositionX = -0.9;
  // let player.location.y = 0.9;
  let playerDeltaX = Math.cos(player.angle) * 0.0025;
  let playerDeltaY = Math.sin(player.angle) * 0.0025;
  const canvasMapRef = useRef<HTMLCanvasElement>(null);

  const PI = Math.PI;

  // State object to track key presses
  const keyState: { [key: string]: boolean } = {
    w: false,
    a: false,
    s: false,
    d: false,
  };

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      player.angle -= event.movementX * 0.005;
      playerDeltaX = Math.cos(player.angle) * 0.0025;
      playerDeltaY = Math.sin(player.angle) * 0.0025;
    };

    const handleClick = () => {
      const canvas = canvasMapRef.current;
      if (canvas) {
        canvas.requestPointerLock();
      }
    };

    const handlePointerLockChange = () => {
      if (document.pointerLockElement === canvasMapRef.current) {
        document.addEventListener("mousemove", handleMouseMove);
      } else {
        document.removeEventListener("mousemove", handleMouseMove);
      }
    };

    document.addEventListener("pointerlockchange", handlePointerLockChange);
    const canvas = canvasMapRef.current;
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
  }, []);

  useEffect(() => {
    const canvasMap = canvasMapRef.current;
    if (!canvasMap) return;
    canvasMap.width = 2 * window.innerHeight;
    canvasMap.height = window.innerHeight;

    const glMap = canvasMap.getContext("webgl");

    if (!glMap) {
      alert("Unable to initialize WebGL. Your browser may not support it.");
      return;
    }

    const rayVertexShader = Utils.createShader(
      glMap,
      glMap.VERTEX_SHADER,
      ShaderSource.RAY_VERTEX
    );
    const rayFragmentShader = Utils.createShader(
      glMap,
      glMap.FRAGMENT_SHADER,
      ShaderSource.RAY_FRAGMENT
    );
    if (!rayVertexShader || !rayFragmentShader)
      throw new Error("Error while creating ray shader");
    const rayProgram = Utils.createProgram(
      glMap,
      rayVertexShader,
      rayFragmentShader
    );

    const mapVertexShader = Utils.createShader(
      glMap,
      glMap.VERTEX_SHADER,
      ShaderSource.MAP_VERTEX
    );
    const mapFragmentShader = Utils.createShader(
      glMap,
      glMap.FRAGMENT_SHADER,
      ShaderSource.MAP_FRAGMENT
    );
    if (!mapVertexShader || !mapFragmentShader)
      throw new Error("Error while creating map shader");
    const mapProgram = Utils.createProgram(
      glMap,
      mapVertexShader,
      mapFragmentShader
    );

    const playerVertexShader = Utils.createShader(
      glMap,
      glMap.VERTEX_SHADER,
      ShaderSource.PLAYER_VERTEX
    );
    const playerFragmentShader = Utils.createShader(
      glMap,
      glMap.FRAGMENT_SHADER,
      ShaderSource.PLAYER_FRAGMENT
    );
    if (!playerVertexShader || !playerFragmentShader)
      throw new Error("Error while creating player shader");
    const playerProgram = Utils.createProgram(
      glMap,
      playerVertexShader,
      playerFragmentShader
    );

    const pointerVertexShader = Utils.createShader(
      glMap,
      glMap.VERTEX_SHADER,
      ShaderSource.POINTER_VERTEX
    );
    const pointerFragmentShader = Utils.createShader(
      glMap,
      glMap.FRAGMENT_SHADER,
      ShaderSource.POINTER_FRAGMENT
    );
    if (!pointerVertexShader || !pointerFragmentShader)
      throw new Error("Error while creating pointer shader");
    const pointerProgram = Utils.createProgram(
      glMap,
      pointerVertexShader,
      pointerFragmentShader
    );

    const threeDVertexShader = Utils.createShader(
      glMap,
      glMap.VERTEX_SHADER,
      ShaderSource.THREED_VERTEX
    );
    const threeDFragmentShader = Utils.createShader(
      glMap,
      glMap.FRAGMENT_SHADER,
      ShaderSource.THREED_FRAGMENT
    );
    if (!threeDVertexShader || !threeDFragmentShader)
      throw new Error("Error while creating 3D shader");
    const threeDProgram = Utils.createProgram(
      glMap,
      threeDVertexShader,
      threeDFragmentShader
    );

    const map: Map = {
      rows: 20,
      columns: 20,
      cellSize: 64,
      cellSizeNormalized: 2.0 / 20,
      cells: [
        0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0,
        1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1,
        1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0,
        0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1,
        1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1,
        1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0,
        1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0,
        1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1,
        0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1,
        1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0,
        1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      ],
    };

    function updatePlayerPosition() {
      if (keyState.d) {
        player.location.x += Math.cos(player.angle + PI / 2) * 0.0025;
        player.location.y += Math.sin(player.angle + PI / 2) * 0.0025;
      }

      if (keyState.a) {
        player.location.x += Math.cos(player.angle - PI / 2) * 0.0025;
        player.location.y += Math.sin(player.angle - PI / 2) * 0.0025;
      }

      let playerPositionXNormalized =
        ((Utils.xNormalizedTodevice(player.location.x) | 0) >> 6) << 6;
      let playerPositionYNormalized =
        ((Utils.yNormalizedTodevice(player.location.y) | 0) >> 6) << 6;

      if (keyState.w) {
        player.location.x -= playerDeltaX;
        player.location.y -= playerDeltaY;
      }
      if (keyState.s) {
        player.location.x += playerDeltaX;
        player.location.y += playerDeltaY;
      }
    }
    function render() {
      if (!glMap) throw new Error("glMap is null or underfined.");

      updatePlayerPosition(); // Update player position based on key states

      glMap.enable(glMap.SCISSOR_TEST);

      glMap.viewport(
        glMap.canvas.width / 2,
        0,
        glMap.canvas.width / 2,
        glMap.canvas.height
      );
      glMap.scissor(
        glMap.canvas.width / 2,
        0,
        glMap.canvas.width / 2,
        glMap.canvas.height
      );
      glMap.clearColor(0.25, 0.25, 0.25, 1);
      glMap.clear(glMap.COLOR_BUFFER_BIT);

      glMap.viewport(0, 0, glMap.canvas.width / 2, glMap.canvas.height);
      glMap.scissor(0, 0, glMap.canvas.width / 2, glMap.canvas.height);
      glMap.clearColor(0.25, 0.25, 0.25, 1);
      glMap.clear(glMap.COLOR_BUFFER_BIT);

      if (!rayProgram) throw new Error("Error while creating ray program");
      if (!threeDProgram) throw new Error("Error while creating 3D program");
      Utils.drawRays(
        glMap,
        rayProgram,
        threeDProgram,
        player,
        map,
      );

      if (!mapProgram) throw new Error("Error while creating map program");
      Utils.drawMap2D(glMap, mapProgram, map);

      if (!playerProgram || !pointerProgram)
        throw new Error("Error while creating player/pointer program");
      Utils.drawPlayer(
        glMap,
        playerProgram,
        pointerProgram,
        player,
        playerDeltaX,
        playerDeltaY
      );

      requestAnimationFrame(render);
    }

    render();
  }, []);

  return (
    <div>
      <canvas ref={canvasMapRef}></canvas>
    </div>
  );
};

export default WebGLComponent;
