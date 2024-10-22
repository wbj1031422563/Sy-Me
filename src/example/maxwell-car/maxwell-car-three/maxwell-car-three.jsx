/*
 * @Author: FMC
 * @Date: 2024-07-15 21:16:27
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-24 21:04:13
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-car-three.jsx
 * @Description:
 *
 */
import { ContactShadows, Loader, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import * as THREE from "three";
import MaxWellCarBaeEnv from "./maxwell-car-base-env/maxwell-car-base-env";
import "./maxwell-car-three.less";
import MaxwellRoadScene from "./maxwell-road-scene/maxwell-road-scene";
import MaxWellGround from "./maxwell-ground/maxwell-ground";
import MaxwellText from "./maxwell-text/maxwell-text";
import MaxwellEffects from "./maxwell-effects/maxwell-effects";
import MaxwellHoda from "./maxwell-hoda/maxwell-hoda";
import { Suspense } from "react";
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
        {/* <MaxwellRoadScene runState={'RUNNING'}></MaxwellRoadScene> */}
        <axesHelper></axesHelper>
        <MaxwellText position={[1.5,2,-3.5]}/>
        <MaxwellEffects />
        <Suspense fallback={null}>
          <fog args={[0x00000, 15, 20]} attach={"fog"}></fog>
          <MaxwellHoda rotation={[0,-Math.PI*0.5,0]} position={[3,0,0]}></MaxwellHoda>
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