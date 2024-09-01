/*
 * @Author: FMC
 * @Date: 2024-07-15 21:16:27
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-01 12:15:44
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-car-three.jsx
 * @Description:
 *
 */
import { Canvas } from "@react-three/fiber";
import "./maxwell-car-three.less";
import { Suspense} from "react";
import { Loader } from "@react-three/drei";
import * as THREE from "three";
import MaxWellCarBaeEnv from "./maxwell-car-base-env/maxwell-car-base-env";
import MaxWellGround from "./maxwell-ground/maxwell-ground";
import MaxwellHoda from "./maxwell-hoda/maxwell-hoda";

function MaxWellCarThree() {

  return (
    <div className="maxwell-car-three">
      <Canvas
        flat
        dpr={[1, 2]}
      >
        <MaxWellCarBaeEnv></MaxWellCarBaeEnv>
        <Suspense fallback={null}>
          <color args={[0x000000]} attach={"background"} />
          <fog args={[ 0x00000, 10, 15]} attach={'fog'}></fog>
          <MaxwellHoda></MaxwellHoda>
          <MaxWellGround/>
        </Suspense>
        {/* <axesHelper /> */}
      </Canvas>
      <Loader />
    </div>
  );
}
export default MaxWellCarThree;
