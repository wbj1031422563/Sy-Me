/*
 * @Author: FMC
 * @Date: 2024-07-15 21:16:27
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-17 22:11:46
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-map-three.jsx
 * @Description: 
 */
import { Canvas } from "@react-three/fiber";
import "../sbpk-map-three/sbpk-map-three.less";
import SbpkBaseEnv from "./sbpk-base-env/sbpk-base-env";
import SbpkEarth from "./sbpk-earth/sbpk-earth";
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
        <color args={["#000000"]} attach={"background"} />
        <SbpkBaseEnv/>
        <SbpkEarth/>
      </Canvas>
    </div>
  );
}
export default SbpkMapThree;
