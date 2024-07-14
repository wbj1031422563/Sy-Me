/*
 * @Author: FMC
 * @Date: 2024-07-14 11:11:07
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-14 19:01:49
 * @FilePath: \fmc-personal-blog\src\views\react-three\react-three.jsx
 * @Description:
 */
import BaseEnv from "./base-env/base-env.jsx";
import Light from "./light/light.jsx";
import { Canvas } from "@react-three/fiber";
import Ground from "./meshes/gound/ground.jsx";
import "./react-three.less";
import WobblySphere from "./meshes/wobbly-sphere/wobbly-sphere.jsx";
import MyEnvMap from "./env-map/env-map.jsx";
import SideMesh from "./meshes/side-mesh/side-mesh.jsx";
function ReactThree() {
  // const created = ({ camera, gl }) => {
  //   camera.position.set(3.0, 3.0, 3.0);
  // };
  return (
    <>
      <div className="react-three">
        <Canvas
          flat
          dpr={[1, 2]}
          camera={{
            fov: 45,
            near: 0.1,
            far: 200,
            position: [0, 0, 3.5],
          }}
        >
          <color args={["#000000"]} attach={"background"} />
          <Light />
          <MyEnvMap />
          <BaseEnv/>
          {/* <axesHelper args={[5,5,5]}/> */}

          {/* <mesh castShadow>
            <boxGeometry></boxGeometry>
            <meshNormalMaterial></meshNormalMaterial>
          </mesh> */}
          <WobblySphere/>
          <Ground />
          <SideMesh/>
        </Canvas>
      </div>
    </>
  );
}

export default ReactThree;
