/*
 * @Author: FMC
 * @Date: 2024-07-15 21:16:27
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-04 22:10:56
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-car-three.jsx
 * @Description:
 *
 */
import { Canvas, useFrame } from "@react-three/fiber";
import "./maxwell-car-three.less";
import { Suspense, useRef } from "react";
import { Loader } from "@react-three/drei";
import * as THREE from "three";
import MaxWellCarBaeEnv from "./maxwell-car-base-env/maxwell-car-base-env";
import MaxWellGround from "./maxwell-ground/maxwell-ground";
import MaxwellHoda from "./maxwell-hoda/maxwell-hoda";
import { Leva } from "leva";
import {
  Environment,
  Lightformer,
  ContactShadows,
  OrbitControls,
  Stats,
} from "@react-three/drei";
import MaxwellEffects from "./maxwell-effects/maxwell-effects";
import MaxwellText from "./maxwell-text/maxwell-text";
function MaxWellCarThree() {
  return (
    <div className="maxwell-car-three">
      <Canvas
        gl={{
          logarithmicDepthBuffer: true,
          antialias: false,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 15], fov: 25 }}
      >
        <color attach="background" args={["#000000"]} />
        <hemisphereLight intensity={0.8} />
        <ContactShadows
          resolution={1024}
          frames={1}
          position={[0, -0.01, 0]}
          scale={15}
          blur={0.5}
          opacity={1}
          far={20}
        />
        <MaxWellGround />
        <MaxWellCarBaeEnv></MaxWellCarBaeEnv>
        <MaxwellText position={[1.5,1,-3.5]}/>
        <MaxwellEffects />
        <Suspense fallback={null}>
          <fog args={[0x00000, 15, 20]} attach={"fog"}></fog>
          <MaxwellHoda></MaxwellHoda>
        </Suspense>
      </Canvas>
      <Stats />
      <Leva collapsed />
      {/* <Stats/> */}
      <Loader />
    </div>
  );
}
export default MaxWellCarThree;