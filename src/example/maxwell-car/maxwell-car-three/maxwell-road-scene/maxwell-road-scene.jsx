/*
 * @Author: FMC
 * @Date: 2024-09-24 20:41:25
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-28 19:39:15
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-road-scene\maxwell-road-scene.jsx
 * @Description:
 */

import { Clone, useTexture } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import MaxwellHoda from "../maxwell-hoda/maxwell-hoda";
import TWEEN from "@tweenjs/tween.js";
import MaxwellLightformers from "@/example/maxwell-car/maxwell-car-three/maxwell-lightformers/maxwell-lightformers.jsx";
function Model({runState='STOP',speed,setSpeed}) {
  // const [speed,setSpeed] = useState(20);
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
    "model/街道.glb",
    (loader) => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("draco/");
      loader.setDRACOLoader(dracoLoader);
    }
  );
  const bakedImg = useTexture("model/baking.png");
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
    // console.log("size", box3.max.z - box3.min.z -5);
    setSize(box3.max.z - box3.min.z -1);
    // setCarBox3(box3);
  };
  useEffect(() => {
    if (street) {
      getGroupBox3(street);
      // bakedImg.flipY=false;
      // bakedImg.
      const bakedBuildMaterail = new THREE.MeshBasicMaterial({
        map: bakedImg,
      });
      // street.traverse((child) => {
      //   if(child.name=='建筑aa'){
      //     child.traverse(item=>{
      //       if(item.isMesh){
      //         item.material=bakedBuildMaterail;
      //       }
      //     })
      //   }
      // })
      // ;
      console.log('street',street)
    }
  }, [street]);
  useFrame((state, delta) => {
    const a = -size * 0.9;
    const outView = -1 * (100 + size * 0.5);
    if (cloneStreet1 && street) {
      // if(street.position.z<size*0.9){
      //   street.position.z += speed * delta;
      // }
      cloneStreet1.position.z -= speed * delta;
      street.position.z -= speed * delta;
      if (street.position.z < a) {
        street.position.z = cloneStreet1.position.z + size;
      }
      if (cloneStreet1.position.z < a) {
        cloneStreet1.position.z = street.position.z + size;
      }
    }
  });
  const reset=()=>{
    if(street&&cloneStreet1){
      cloneStreet1.position.z=size * 1;
      street.position.z=0
    }
  }
  useEffect(()=>{
    let tween=null;
    const seconds=2;
    reset();
    if(runState=='RUNNING'){
      console.log('RUNNING')
      tween = new TWEEN.Tween({ value: 0 })
      .to({ value: 20 }, seconds * 1000)
      .onUpdate(({ value }) => {
        setSpeed(value);
      })
    }else if(runState=='STOP'){
      console.log('STOP')
      tween = new TWEEN.Tween({ value: 20 })
      .to({ value: 0 }, seconds * 1000)
      .onUpdate(({ value }) => {
        setSpeed(value);
      })
    }
    if(tween){
      tween.start();
    }
    return ()=>{
      if(tween){
        tween.stop()
      }
    }
  },[runState])

  return (
    <group >
      {/* <mesh position-y={0.51}>
        <boxGeometry></boxGeometry>
        <meshStandardMaterial color={"red"}></meshStandardMaterial>
      </mesh> */}
      <mesh  scale={[50, 50, 50]} position-z={-30} >
        <planeGeometry></planeGeometry >
        <meshBasicMaterial color={"#000"} side={THREE.DoubleSide}></meshBasicMaterial>
      </mesh>
      <primitive ref={setStreet}  object={scene ? scene : null} />
      {street && (
        <Clone
          ref={setCloneStreet1}
          object={street}
          position-y={0.01}
          // rotation-y={Math.PI}
          position-z={size * 1}
        ></Clone>
      )}
      {/* {street && <Clone ref={setCloneStreet2} object={street} position-z={-size*2}></Clone>} */}
      {/* {street && <Clone ref={setCloneStreet3} object={street} position-z={-size*3}></Clone>} */}
      {/* <boxHelper></boxHelper> */}
    </group>
  );
}

function MaxWellRoadScene({runState,speed,setSpeed}) {
  return (
    <Suspense>
      <Model runState={runState} speed={speed} setSpeed={setSpeed}/>
    </Suspense>
  );
}
export default MaxWellRoadScene;
