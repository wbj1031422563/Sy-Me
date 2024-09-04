/*
 * @Author: FMC
 * @Date: 2024-07-15 21:16:27
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-04 21:42:26
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
        {/* <mesh
          scale={4}
          position={[3, 0, -1.5]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2.5]}
        >
          <ringGeometry args={[0.9, 1, 4, 1]} />
          <meshStandardMaterial color="white" roughness={0.75} />
        </mesh>
        <mesh
          scale={4}
          position={[-3, 0, -1]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2.5]}
        >
          <ringGeometry args={[0.9, 1, 3, 1]} />
          <meshStandardMaterial color="white" roughness={0.75} />
        </mesh> */}
        <MaxWellGround />
        <Environment resolution={512}>
          {/* Ceiling */}
          <Lightformer
            intensity={2}
            rotation-x={Math.PI / 2}
            position={[0, 4, -9]}
            scale={[10, 1, 1]}
          />
          <Lightformer
            intensity={2}
            rotation-x={Math.PI / 2}
            position={[0, 4, -6]}
            scale={[10, 1, 1]}
          />
          <Lightformer
            intensity={2}
            rotation-x={Math.PI / 2}
            position={[0, 4, -3]}
            scale={[10, 1, 1]}
          />
          <Lightformer
          
            intensity={2}
            rotation-x={Math.PI / 2}
            position={[0, 4, 0]}
            scale={[10, 4.5, 4.5]}
          />
          <Lightformer
            intensity={2}
            rotation-x={Math.PI / 2}
            position={[0, 4, 3]}
            scale={[10, 1, 1]}
          />
          <Lightformer
            intensity={2}
            rotation-x={Math.PI / 2}
            position={[0, 4, 6]}
            scale={[10, 1, 1]}
          />
          <Lightformer
            intensity={2}
            rotation-x={Math.PI / 2}
            position={[0, 4, 9]}
            scale={[10, 1, 1]}
          />
          {/* Sides */}
          <Lightformer
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-50, 2, 0]}
            scale={[100, 2, 1]}
          />
          <Lightformer
            intensity={2}
            rotation-y={-Math.PI / 2}
            position={[50, 2, 0]}
            scale={[100, 2, 1]}
          />
          {/* Key */}
          <Lightformer
            form="ring"
            color="red"
            intensity={10}
            scale={2}
            position={[10, 5, 10]}
            onUpdate={(self) => self.lookAt(0, 0, 0)}
          />
        </Environment>
        <MaxWellCarBaeEnv></MaxWellCarBaeEnv>
        <MaxwellEffects />
        <Suspense fallback={null}>
          <fog args={[0x00000, 15, 20]} attach={"fog"}></fog>
          <MaxwellHoda></MaxwellHoda>
          {/* <mesh geometry={geo} ref={r}>
            <meshBasicMaterial color={'red'}></meshBasicMaterial>
          </mesh> */}
          {/* <MaxWellGround /> */}
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