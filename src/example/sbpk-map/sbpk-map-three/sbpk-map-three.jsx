import { Canvas } from "@react-three/fiber";
import "../sbpk-map-three/sbpk-map-three.less";
import SbpkBaseEnv from "./sbpk-base-env/sbpk-base-env";
function SbpkMapThree() {
  return (
    <div className="sbpk-map-three">
      <Canvas
        flat
        dpr={[1, 2]}
        camera={{
          fov: 45,
          near: 0.1,
          far: 200,
          position: [0, 0, 15.5],
        }}
      >
        <color args={["#cccccc"]} attach={"background"} />
        <SbpkBaseEnv/>
        <mesh>
          <boxGeometry/>
          <meshBasicMaterial color={'red'}/>
        </mesh>
      </Canvas>
    </div>
  );
}
export default SbpkMapThree;
