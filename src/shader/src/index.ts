//ALL FRAGMENT COLORS ARE SET HERE UNLESS NOTED

export enum ShaderSource {
  PLAYER_VERTEX = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0, 1);
        gl_PointSize = 4.0;
    }
  `,
  PLAYER_FRAGMENT = `
    precision mediump float;
    void main() {
        gl_FragColor = vec4(0.6078, 0.4, 0.8667, 1);
    }
  `,
  MAP_VERTEX = ` 
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0, 1); 
    }
  `,
  MAP_FRAGMENT = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
        gl_FragColor = vec4(0.2941, 0.2941, 0.2941, 1.0);
    }
  `,
  RAY_VERTEX = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0, 1);
    }
  `,
  //ray color set in corresponding function
  RAY_FRAGMENT = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
        gl_FragColor = u_color;
    }
  `,
  POINTER_VERTEX = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0, 1);
    }
  `,
  POINTER_FRAGMENT = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(0.6078, 0.4, 0.8667, 1);
    }
  `,
  THREED_VERTEX = `
  attribute vec2 a_position;
  void main() {
      gl_Position = vec4(a_position, 0, 1);
  }
`,
  //wall color set in corresponding function
  THREED_FRAGMENT = `
  precision mediump float;
  uniform vec4 u_color;
  void main() {
     gl_FragColor = u_color; 
  }
`,
}
