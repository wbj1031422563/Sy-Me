/*
 * @Author: FMC
 * @Date: 2024-07-15 21:16:27
 * @LastEditors: FMC
 * @LastEditTime: 2024-11-19 22:18:47
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
import MaxwellEffects from "./maxwell-effects/maxwell-effects";
import MaxwellSceneManager from "./maxwell-scene-manager/maxwell-scene-manager";
function MaxWellCarThree() {
  return (
    <div className="maxwell-car-three">
      <Canvas
        gl={{
          logarithmicDepthBuffer: true,
          antialias: true,
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
        <MaxWellCarBaeEnv></MaxWellCarBaeEnv>
        <MaxwellEffects/>
        <MaxwellSceneManager/>
      </Canvas>
      <Stats />
      <Leva collapsed />
      {/* <Stats/> */}
      <Loader />
    </div>
  );
}
export default MaxWellCarThree;