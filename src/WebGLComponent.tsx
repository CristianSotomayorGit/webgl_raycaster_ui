import React, { useRef, useEffect } from "react";
import { Utils } from "./utils/src";
import { ShaderSource } from "./shader/src";
import "./App.css"; // Import the CSS file
import { Player, Map } from "./types/src";

const WebGLComponent: React.FC = () => {

  //define initial player state
  const initialAngle = (3 * Math.PI) / 4;
  const initialDelta = {
    x: Math.cos(initialAngle) * 0.0025,
    y: Math.sin(initialAngle) * 0.0025
  };

  let player: Player = {
    location: { x: -0.9, y: 0.9 },
    angle: (3 * Math.PI) / 4,
    depthOfField: 0,
    locationDelta: initialDelta,
  };

  //define initial level state
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
      player.locationDelta.x = Math.cos(player.angle) * 0.0025;
      player.locationDelta.y = Math.sin(player.angle) * 0.0025;
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

    const gl = canvasMap.getContext("webgl");

    if (!gl) {
      alert("Unable to initialize WebGL. Your browser may not support it.");
      return;
    }

    const rayVertexShader = Utils.createShader(gl,gl.VERTEX_SHADER, ShaderSource.RAY_VERTEX);
    const rayFragmentShader = Utils.createShader(gl, gl.FRAGMENT_SHADER, ShaderSource.RAY_FRAGMENT);
    if (!rayVertexShader || !rayFragmentShader) throw new Error("Error while creating ray shader");
    const rayProgram = Utils.createProgram(gl, rayVertexShader, rayFragmentShader);

    const mapVertexShader = Utils.createShader(gl, gl.VERTEX_SHADER, ShaderSource.MAP_VERTEX);
    const mapFragmentShader = Utils.createShader(gl, gl.FRAGMENT_SHADER, ShaderSource.MAP_FRAGMENT);
    if (!mapVertexShader || !mapFragmentShader) throw new Error("Error while creating map shader");
    const mapProgram = Utils.createProgram(gl, mapVertexShader, mapFragmentShader);

    const playerVertexShader = Utils.createShader(gl, gl.VERTEX_SHADER, ShaderSource.PLAYER_VERTEX);
    const playerFragmentShader = Utils.createShader(gl, gl.FRAGMENT_SHADER, ShaderSource.PLAYER_FRAGMENT);
    if (!playerVertexShader || !playerFragmentShader) throw new Error("Error while creating player shader");
    const playerProgram = Utils.createProgram(gl, playerVertexShader, playerFragmentShader);

    const pointerVertexShader = Utils.createShader(gl, gl.VERTEX_SHADER, ShaderSource.POINTER_VERTEX);
    const pointerFragmentShader = Utils.createShader(gl, gl.FRAGMENT_SHADER, ShaderSource.POINTER_FRAGMENT);
    if (!pointerVertexShader || !pointerFragmentShader) throw new Error("Error while creating pointer shader");
    const pointerProgram = Utils.createProgram(gl, pointerVertexShader, pointerFragmentShader);

    const threeDVertexShader = Utils.createShader(gl, gl.VERTEX_SHADER, ShaderSource.THREED_VERTEX);
    const threeDFragmentShader = Utils.createShader(gl, gl.FRAGMENT_SHADER, ShaderSource.THREED_FRAGMENT);
    if (!threeDVertexShader || !threeDFragmentShader) throw new Error("Error while creating 3D shader");
    const threeDProgram = Utils.createProgram(gl, threeDVertexShader, threeDFragmentShader);

    function updatePlayerPosition() {
      if (keyState.d) {
        player.location.x += Math.cos(player.angle + PI / 2) * 0.0025;
        player.location.y += Math.sin(player.angle + PI / 2) * 0.0025;
      }

      if (keyState.a) {
        player.location.x += Math.cos(player.angle - PI / 2) * 0.0025;
        player.location.y += Math.sin(player.angle - PI / 2) * 0.0025;
      }

      if (keyState.w) {
        player.location.x -= player.locationDelta.x;
        player.location.y -= player.locationDelta.y;
      }
      if (keyState.s) {
        player.location.x += player.locationDelta.x;
        player.location.y += player.locationDelta.y;
      }
    }

    function render() {
      if (!gl) throw new Error("gl is null or underfined.");

      updatePlayerPosition();

      gl.enable(gl.SCISSOR_TEST);

      if (!rayProgram) throw new Error("Error while creating ray program");
      if (!threeDProgram) throw new Error("Error while creating 3D program");
      Utils.drawRays(gl, rayProgram, threeDProgram, player, map);

      if (!mapProgram) throw new Error("Error while creating map program");
      Utils.drawMap2D(gl, mapProgram, map);

      if (!playerProgram || !pointerProgram) throw new Error("Error while creating player/pointer program");
      Utils.drawPlayer(gl, playerProgram, pointerProgram, player);

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
