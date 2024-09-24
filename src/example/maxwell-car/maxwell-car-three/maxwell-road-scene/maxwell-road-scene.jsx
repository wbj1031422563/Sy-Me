/*
 * @Author: FMC
 * @Date: 2024-09-24 20:41:25
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-24 23:01:39
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-road-scene\maxwell-road-scene.jsx
 * @Description:
 */

import { Clone } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
function Model(props) {
  const speed = 10;
  const [street, setStreet] = useState(null);
  const [cloneStreet1, setCloneStreet1] = useState(null);
  const [cloneStreet2, setCloneStreet2] = useState(null);
  const [cloneStreet3, setCloneStreet3] = useState(null);
  const [size, setSize] = useState(0);

  /**
   * 加载Draco模型
   */
  const { scene, nodes, materials } = useLoader(
    GLTFLoader,
    "model/街景.glb",
    (loader) => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("draco/");
      loader.setDRACOLoader(dracoLoader);
    }
  );
  const getGroupBox3 = (group) => {
    let box3 = new THREE.Box3();
    group.traverse((child) => {
      if (child.isMesh) {
        const mesh = child.clone();
        mesh.updateMatrixWorld(true);
        const childBoundingBox = new THREE.Box3().setFromObject(mesh);
        box3.union(childBoundingBox);
      }
    });
    console.log("size", box3.max.z - box3.min.z - 0.8);
    setSize(box3.max.z - box3.min.z-1);
    // setCarBox3(box3);
  };
  useEffect(() => {
    if (street) {
      getGroupBox3(street);
    }
  }, [street]);
  useFrame((state, delta) => {
    const a = size*0.9;
    const outView = -1 * (100 + size * 0.5);
    if (cloneStreet1 && street) {
      // if(street.position.z<size*0.9){
      //   street.position.z += speed * delta;
      // }
      cloneStreet1.position.z += speed * delta;
      street.position.z += speed * delta;
      if(street.position.z>a){
        street.position.z= cloneStreet1.position.z-size;
      }
      if(cloneStreet1.position.z>a){
        cloneStreet1.position.z=street.position.z-size;
      }
    }
  });

  return (
    <group {...props}>
      <mesh position-y={0.51}>
        <boxGeometry></boxGeometry>
        <meshStandardMaterial color={"red"}></meshStandardMaterial>
      </mesh>
      <mesh scale={[50, 50, 50]} position-z={-60}>
        <planeGeometry></planeGeometry>
        <meshBasicMaterial color={"#000000"}></meshBasicMaterial>
      </mesh>
      <primitive ref={setStreet} object={scene ? scene : null} />
      {street && (
        <Clone
          ref={setCloneStreet1}
          object={street}
          position-z={-size * 1}
        ></Clone>
      )}
      {/* {street && <Clone ref={setCloneStreet2} object={street} position-z={-size*2}></Clone>} */}
      {/* {street && <Clone ref={setCloneStreet3} object={street} position-z={-size*3}></Clone>} */}
      {/* <boxHelper></boxHelper> */}
    </group>
  );
}

function MaxWellRoadScene(props) {
  return (
    <Suspense>
      <Model {...props} />
    </Suspense>
  );
}
export default MaxWellRoadScene;
