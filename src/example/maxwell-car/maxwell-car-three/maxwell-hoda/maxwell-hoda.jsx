/*
 * @Author: FMC
 * @Date: 2024-09-01 11:50:08
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-04 23:15:21
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-hoda\maxwell-hoda.jsx
 * @Description:
 */

import { useFrame, useLoader, useThree, applyProps } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import * as THREE from "three";
import { Suspense, useRef, useEffect } from "react";

function Model() {
  const hodaRef = useRef(null);
  const frontWheelRef = useRef(null);

  /**
   * 加载Draco模型
   */
  const { scene, nodes, materials } = useLoader(
    GLTFLoader,
    "model/本田3.glb",
    (loader) => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("draco/");
      loader.setDRACOLoader(dracoLoader);
    }
  );
  useEffect(() => {
    if (scene) {
      const meshList = [];
      const frontWheel = [];
      const frontWheelNameList = [
        "PneumaticoTrasero_Pneumatic_0",
        "LlantaTrasera_Rims_0",
        "TornillosLlantaTrasera_CarPaintBlack_0",
        "TaponLlantaTrasera_CarPaintBlack_0",
        "Llanta.002_ChromeRims_0",

        "Pneumatico_Pneumatic_0",
        "Llanta_Rims_0",
        "TornillosLlanta_CarPaintBlack_0",
        "TaponLlanta_CarPaintBlack_0",
        "Llanta.001_ChromeRims_0",
      ];
      const hoda = hodaRef.current;
      hoda.traverse((child) => {
        if (child.isMesh) {
          meshList.push(child);
        }
      });
      meshList.forEach((mesh, index) => {
        if (frontWheelNameList.includes(mesh.name)) {
          frontWheel.push(mesh);
        }
      });
      frontWheelRef.current = frontWheel;
    }
  }, [scene]);
  useEffect(() => {
    if (materials) {
      // console.log('materials',materials);
      applyProps(materials.CarPaintWhite, { color: "#999999" });
      applyProps(materials.Rims, { metalness: 0.9, roughness: 0.1,color:'#909090'});

      applyProps(materials.HeadLampGlasses, {
        emissiveIntensity: 1.5,
        toneMapped: false,
        color:'#FFA500',
        emissive: '#FFA500',
      });
      applyProps(materials.MainHeadLightGlass, {
        emissiveIntensity: 4,
        toneMapped: false,
        color: "#fff",
        emissive: "#fff",
      });

      applyProps(materials.RearLampInteriorGlasses, {
        emissiveIntensity: 5,
        toneMapped: false,
        emissive: 'red',
        color:'red',
      });

      applyProps(materials.BackRedReflectors, {
        emissiveIntensity: 0.8,
        toneMapped: false,
        color:'red',
        emissive: 'red',
      });

      const {CristalTintado}=materials
      // nodes.FrontWindshield_Cristal_0.material=CristalTintado
      nodes.CristalLateral_Cristal_0.material=CristalTintado
    }
  }, [materials,nodes]);
  useFrame((state, delta) => {
    if (hodaRef.current) {
      const speed = 25; // 汽车的移动速度
      const wheelRadius = 1.0; // 轮子的半径，假设是0.2
      const distance = delta * speed; // 移动的距离
      // if(frontWheelRef.current){
      //   frontWheelRef.current.forEach(item=>{
      //     item.rotation.y-=distance / wheelRadius*0.4;
      //   })
      // }
      // hodaRef.current.position.x-=distance*0.1;
    }
  });
  return (
    <>
      <primitive
        ref={hodaRef}
        object={scene ? scene : null}
        scale={[0.01, 0.01, 0.01]}
      />
    </>
  );
}
function MaxwellHoda() {
  return (
    <Suspense>
      <Model />
    </Suspense>
  );
}
export default MaxwellHoda;
