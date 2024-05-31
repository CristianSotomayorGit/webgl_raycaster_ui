import "./App.css";
import CenteredColumn from "./CenteredColumn";
import WebGLComponent from "./WebGLComponent";

function App() {
  return (
    <div>
      <CenteredColumn>
        <p className="title">WebGL Raycaster Demo:</p>
        <WebGLComponent />
      </CenteredColumn>
      <CenteredColumn>
        <div className='instructions' style={{ display: "flex", alignItems: "center" }}>
          <p style={{ margin: "0 10px" }}>
            <strong>W:</strong> Move Forward
          </p>
          <p style={{ margin: "0 10px" }}>
            <strong>A:</strong> Move Left
          </p>
          <p style={{ margin: "0 10px" }}>
            <strong>S:</strong> Move Backward
          </p>
          <p style={{ margin: "0 10px" }}>
            <strong>D:</strong> Move Right
          </p>
          <p style={{ margin: "0 10px" }}>
            <strong>Mouse:</strong> Look Around
          </p>
          <p style={{ margin: "0 10px" }}>
            <strong>Esc:</strong> Exit Game
          </p>
        </div>
      </CenteredColumn>
    </div>
  );
}

export default App;
