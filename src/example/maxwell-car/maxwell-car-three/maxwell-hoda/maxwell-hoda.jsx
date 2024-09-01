/*
 * @Author: FMC
 * @Date: 2024-09-01 11:50:08
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-01 12:14:43
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-hoda\maxwell-hoda.jsx
 * @Description: 
 */

import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { Suspense } from "react";
function Model() {
  /**
   * 加载Draco模型
   */
  const model = useLoader(
    GLTFLoader,
    "model/本田3.glb",
    (loader) => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("draco/");
      loader.setDRACOLoader(dracoLoader);
    }
  );
  return (
    <>
      <primitive object={model.scene} scale={[0.01,0.01,0.01]}></primitive>
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
