import React, { useRef, useEffect, useState } from "react";
import { Utils } from "./utils/src";
import { ShaderSource } from "./shader/src";

const WebGLComponent: React.FC = () => {
      // player data
  var playerAngle = 3*Math.PI/ 4;
  var playerPositionX = -0.392;
  var playerPositionY = -0.137;
//   var playerDeltaX = 0.0005;
//   var playerDeltaY = 0.0005;
var mX: number = 0, mY: number = 0, mP: number = 0, dof: number = 0, rY: number = 0, rX: number = 0, ra: number = 0, xO: number = 0, yO: number = 0
var    playerDeltaX = Math.cos(playerAngle) * 5;
var playerDeltaY = Math.sin(playerAngle) * 5;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerPosition, setPlayerPosition] = useState({ x: playerPositionX, y: playerPositionY, a: playerAngle });
  const [info, setData] = useState({a: mX, b:mY, c:mP, d:dof, e:rY, f:rX, g:ra, h:xO, i:yO })


  const PI = Math.PI;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      
      if (key === 'd') {
        playerAngle -= 0.05;
  
        if (playerAngle < 0) {
          playerAngle += 2 * PI;
        }
  
        playerDeltaX = Math.cos(playerAngle) * 0.005;
        playerDeltaY = Math.sin(playerAngle) * 0.005;

        setPlayerPosition({ x: playerPositionX, y: playerPositionY, a: playerAngle });

      }
  
      if (key === 'a') {
        playerAngle += 0.05;
  
        if (playerAngle > 2 * PI) {
          playerAngle -= 2 * PI;
        }
  
        playerDeltaX = Math.cos(playerAngle) * 0.005;
        playerDeltaY = Math.sin(playerAngle) * 0.005;

        setPlayerPosition({ x: playerPositionX, y: playerPositionY, a: playerAngle });

      }
  
      if (key === 's') {
        playerPositionX += playerDeltaX;
        playerPositionY += playerDeltaY;  
        setPlayerPosition({ x: playerPositionX, y: playerPositionY, a: playerAngle });
      }
  
      if (key === 'w') {
        playerPositionX -= playerDeltaX;
        playerPositionY -= playerDeltaY;
        setPlayerPosition({ x: playerPositionX, y: playerPositionY, a: playerAngle });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []); 



  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerHeight;
    canvas.height = window.innerHeight;

    const gl = canvas.getContext("webgl");

    if (!gl) {
      alert("Unable to initialize WebGL. Your browser may not support it.");
      return;
    }

    gl.clearColor(0.3, 0.3, 0.3, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const rayVertexShader = Utils.createShader(gl, gl.VERTEX_SHADER, ShaderSource.RAY_VERTEX);
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
    if (!pointerVertexShader || !pointerFragmentShader) throw new Error("Error while creting pointer shader");
    const pointerProgram = Utils.createProgram(gl, pointerVertexShader, pointerFragmentShader);

    // map data

    var mapX = 20;
    var mapY = 20;
    // var mapS = 2.0000 / mapX;
    var tileSizeNormal = 2.0000 / mapX;
    var tileSizeDevice = 64;
    // var mapSize = 200;
    // var mapS = (2.0 / mapX) * (mapSize / canvas.width);

    var map = [
      0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1,
      1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1,
      0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1,
      0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1,
      1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0,
      1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1,
      0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1,
      0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1,
      1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1,
      1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1,
      0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1,
      1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1,
      1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1,
      0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1,
      0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ];

    // var map = [
    //     1, 1, 1, 1, 1, 1, 1, 1,
    //     1, 0, 1, 0, 0, 0, 0, 1,
    //     1, 0, 1, 0, 0, 0, 0, 1,
    //     1, 0, 1, 0, 0, 0, 0, 1,
    //     1, 0, 0, 0, 0, 0, 0, 1,
    //     1, 0, 0, 0, 0, 1, 0, 1,
    //     1, 0, 0, 0, 0, 0, 0, 1,
    //     1, 1, 1, 1, 1, 1, 1, 1,
    //   ];

    // var mapX = 8;
    // var mapY = 8;
    // var tileSizeNormal = 2.0000 / mapX;
    // var tileSizeDevice = 64;

    //Implement animation loop



    function render() {
      if (!gl) throw new Error("gl is null or underfined.");

      gl.clear(gl.COLOR_BUFFER_BIT);

      if (!mapProgram) throw new Error("Error while creating map program");
      Utils.drawMap2D(gl, mapProgram, map, mapX, mapY, tileSizeNormal);

      if (!rayProgram) throw new Error("Error while creating ray program");
    
     const a =  Utils.drawRays(gl, rayProgram, playerPositionX, playerPositionY, playerAngle, map, mapX, mapY, tileSizeDevice);

     setData({ a:a.mX, b:a.mY, c:a.mP, d:a.dof, e:a.devRY, f:a.devRX, g:a.ra, h:a.xO, i:a.yO});


      if (!playerProgram || !pointerProgram) throw new Error("Error while creating player/pointer program");
      Utils.drawPlayer(gl, playerProgram, pointerProgram, playerPositionX, playerPositionY, playerDeltaX, playerDeltaY);
      

      requestAnimationFrame(render);
    }

    render();
  }, []);


  return   <div>
      <div>Player X: {playerPosition.x}, Player Y: {playerPosition.y}</div>
      <div>Player X: {Utils.xNormalizedTodevice(playerPosition.x)}, Player Y: {Utils.yNormalizedTodevice(playerPosition.y)}, Player Angle: {playerPosition.a}</div>
      <div>Player X: {Utils.xDeviceToNormalized(Utils.xNormalizedTodevice(playerPosition.x))}, Player Y: {Utils.yDeviceToNormalized(Utils.yNormalizedTodevice(playerPosition.y))}</div>
      <div>mX: {info.a} mY:{info.b} mP:{info.c} dof:{info.d} rY: {info.e} rX: {info.f} rA: {info.g} xO: {info.h} yO: {info.i}</div>
      {/* <div>Test: {(playerPosition.y - 1) / (-1/256)} </div>sss */}


      



  <canvas ref={canvasRef}></canvas>
</div>;
};

export default WebGLComponent;
