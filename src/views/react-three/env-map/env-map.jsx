/*
 * @Author: FMC
 * @Date: 2024-06-30 18:20:11
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-14 16:33:45
 * @FilePath: \fmc-personal-blog\src\views\react-three\env-map\env-map.jsx
 * @Description: 自定义天空
 */
import { Environment, Lightformer } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import GUI from "lil-gui";

function MyEnvMap({ debug = false, type = "cubeEnv" }) {
  let resJsx = "";
  // useHelper(directionalLightRef, THREE.DirectionalLightHelper);
  const [envmapState, setEnvMapState] = useState({
    distance: 256,
    sPosition: {
      x: 0,
      y: 1,
      z: 0,
    },
    inclination: 0.6,
    azimuth: 1.0,
  });
  useEffect(() => {
    if (!debug) return;
    let gui = new GUI({
      title: "控制面板",
      width: "320",
      closeFolders: true,
    });
    return () => {
      gui.destroy();
    };
  }, []);
  switch (type) {
    case "cubeEnv":
      resJsx = (
        <Environment
          // 设置背景
            
          files={[
            "envMap/px.jpg",
            "envMap/nx.jpg",
            "envMap/py.jpg",
            "envMap/ny.jpg",
            "envMap/pz.jpg",
            "envMap/nz.jpg",
          ]}
        />
      );
      break;
    case "HDR":
      resJsx = <Environment background files="室内_2k.hdr" />;
      break;
    case "MIX_MESH":
      // 自定义网格和环境贴图混合
      resJsx = (
        <Environment background files="室内_2k.hdr">
          <mesh position-z={-5} scale={10}>
            <planeGeometry></planeGeometry>
            <meshBasicMaterial color={"blue"} />
          </mesh>
        </Environment>
      );
      break;
    case "CSM_EVNMAP":
      resJsx = (
        <Environment background>
          {/* 设置背景颜色 */}
          <color args={[0xcccc00]} attach={"background"} />
          {/* 设置屏幕网格，作为模拟光源 */}
          <mesh position-z={-5} scale={10}>
            <planeGeometry></planeGeometry>
            <meshBasicMaterial color={[0, 0, 1]} />
          </mesh>
        </Environment>
      );
      break;
    case "Lightformer":
      resJsx = (
        <Environment background>
          {/* 设置背景颜色 */}
          <color args={[0x000000]} attach={"background"} />
          <Lightformer
            position-z={-5} scale={5}
            form="circle" // circle | ring | rect (optional, default = rect)
            intensity={1} // power level (optional = 1)
            color="white" // (optional = white)
            target={[0, 0, 0]} // Target position (optional = undefined)
          />
        </Environment>
      );
      break;
    default:
      break;
  }
  return <>{resJsx}</>;
}

export default MyEnvMap;
