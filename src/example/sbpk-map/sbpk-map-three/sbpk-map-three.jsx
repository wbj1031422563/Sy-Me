/*
 * @Author: FMC
 * @Date: 2024-07-15 21:16:27
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-25 21:57:48
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-map-three.jsx
 * @Description:
 */
import { Canvas, useThree } from "@react-three/fiber";
import "../sbpk-map-three/sbpk-map-three.less";
import SbpkBaseEnv from "./sbpk-base-env/sbpk-base-env";
import SbpkEarth from "./sbpk-earth/sbpk-earth";
function SbpkMapThree() {
  // const created = ({ camera, gl }) => {
  //   camera.position.set(4, 0, 15.5);
  //   camera.lookAt(4, 0, 0);
  //   camera.updateProjectionMatrix();
  // };
  return (
    <div className="sbpk-map-three">
      <Canvas
        flat
        dpr={[1, 2]}
        // onCreated={created}
        camera={{
          fov: 45,
          near: 0.1,
          far: 200,
          position:[0,5,15.5]
        }}
      >
        <color args={["#031D34"]} attach={"background"} />
        <SbpkBaseEnv />
        <SbpkEarth />
        <axesHelper />
      </Canvas>
    </div>
  );
}
export default SbpkMapThree;
