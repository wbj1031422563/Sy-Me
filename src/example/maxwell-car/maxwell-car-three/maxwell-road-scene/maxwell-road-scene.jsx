/*
 * @Author: FMC
 * @Date: 2024-09-24 20:41:25
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-28 19:39:15
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-road-scene\maxwell-road-scene.jsx
 * @Description:
 */

import {Clone, useEnvironment, useTexture} from "@react-three/drei";
import {useFrame, useLoader, useThree} from "@react-three/fiber";
import {Suspense, useEffect, useRef, useState} from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import MaxwellHoda from "../maxwell-hoda/maxwell-hoda";
import TWEEN from "@tweenjs/tween.js";
import MaxwellLightformers from "@/example/maxwell-car/maxwell-car-three/maxwell-lightformers/maxwell-lightformers.jsx";
import {CAR_SCENE_TYPE} from "@/example/maxwell-car/enum/enum.js";
import MaxWellRoomScene from "@/example/maxwell-car/maxwell-car-three/maxwll-room-scene/maxwll-room-scene.jsx";
function Model({runState='STOP',speed,setSpeed,isShow=true}) {
  // const [speed,setSpeed] = useState(20);
  const  {scene: threeScene}=useThree()
  const [street, setStreet] = useState(null);
  const [cloneStreet1, setCloneStreet1] = useState(null);
  const [cloneStreet2, setCloneStreet2] = useState(null);
  const [cloneStreet3, setCloneStreet3] = useState(null);
  const [size, setSize] = useState(0);
  const opacity=useRef({value:0});
  const roadEnvMap=useEnvironment(
      {files:'/envMap/路灯.hdr'}
  )

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
    // const  boxh=new THREE.Box3Helper(box3);
    // threeScene.add(boxh);
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
    }
  }, [street]);
  useFrame((state, delta) => {
    const a = -size * 2.0;
    const outView = -1 * (100 + size * 0.5);
    if (cloneStreet1 && street&&cloneStreet2) {
      // if(street.position.z<size*0.9){
      //   street.position.z += speed * delta;
      // }
      // cloneStreet1.position.z -= speed * delta;
      // street.position.z -= speed * delta;
      // if (street.position.z < a) {
      //   street.position.z = cloneStreet1.position.z + size;
      // }
      // if (cloneStreet1.position.z < a) {
      //   cloneStreet1.position.z = street.position.z + size;
      // }

      const list=[cloneStreet1,street,cloneStreet2];
      list.forEach(item1=>{
        item1.position.z -= speed * delta;
      })
      //升序排列
      list.sort((a,b) => a.position.z - b.position.z);
      // console.log(sortByz);
      if(list[0].position.z <a){
        list[0].position.z = list[1].position.z + size*2;
      }
      list[0].position.y=[0.01]
      list[1].position.y=[0]
      list[2].position.y=[0.01]
    }
  });
  const reset=()=>{
    if(street&&cloneStreet1&&cloneStreet2){
      cloneStreet1.position.z=size;
      cloneStreet2.position.z=-size;
      street.position.z=0
    }
  }
  useEffect(()=>{
    let tween=null;
    const seconds=2;
    reset();
    if(runState==='RUNNING'){
      tween = new TWEEN.Tween({ value: 0 })
      .to({ value: 20 }, seconds * 1000)
      .onUpdate(({ value }) => {
        setSpeed(value);
      })
    }else if(runState==='STOP'){
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


  /**
   * 渐变切换控制
   */
  useEffect(()=>{
    for (let materialsName in materials) {
      const material = materials[materialsName];
      material.transparent=true;
      // material.opacity=opacity.current.value;
    }
  },[materials])
  const  setMaterialsOpacity=(opacity)=>{
    for (let materialsName in materials) {
      const material = materials[materialsName];
      material.opacity=opacity
    }
  }
  useEffect(()=>{
    let tween=null;
    if(isShow){
      tween = new TWEEN.Tween(opacity.current).to(
          { value: 1.0 },
          5 * 1000
      ).onUpdate(({ value }) => {
        setMaterialsOpacity(value);
      })
    }else{
      tween = new TWEEN.Tween(opacity.current).to(
          { value: 0.0 },
          5 * 1000
      ).onUpdate(({ value }) => {
        setMaterialsOpacity(value);
      })
    }
    if(tween){
      tween.start();
    }
    return ()=>{
      if(tween){
        tween.stop();
      }
    }
  },[isShow])


  useEffect(()=>{
    if(materials){
      // materials['8k Wet road with puddles'].envMap=roadEnvMap;
    }
  },[materials])


  /**
   * 路灯光源
   */
  // useEffect(()=>{
  //   if(street){
  //     street.traverse(child=>{
  //       if(child.isMesh&&child.name.includes('光源')&&(!child.children||!child.children.length===0)){
  //         const light=new THREE.PointLight(0xffffff,0);
  //         child.add(light);
  //       }
  //       if(child.isLight&&isShow){
  //         child.intensity=1.0;
  //         console.log('设置管')
  //       }
  //     })
  //   }
  // },[street,isShow])
  return (
    <group >
      {/* <mesh position-y={0.51}>
        <boxGeometry></boxGeometry>
        <meshStandardMaterial color={"red"}></meshStandardMaterial>
      </mesh> */}
      <mesh  scale={[50, 50, 50]} position-z={-100} >
        <planeGeometry></planeGeometry >
        <meshBasicMaterial color={"#000"} side={THREE.DoubleSide}></meshBasicMaterial>
      </mesh>
      <primitive ref={setStreet}  object={scene ? scene : null} />
      {street && (
        <Clone
          ref={setCloneStreet1}
          object={street}
          // position-y={0.1}
          // position-z={0.01}
        ></Clone>
      )}
       {street && <Clone ref={setCloneStreet2} object={street} position-z={-size} ></Clone>}
      {/* {street && <Clone ref={setCloneStreet3} object={street} position-z={-size*3}></Clone>} */}
      {/* <boxHelper></boxHelper> */}
      {isShow&& (
          <MaxwellLightformers/>
      )}
    </group>
  );
}

function MaxWellRoadScene({runState,speed,setSpeed,isShow}) {
  return (
    <Suspense>
      <Model runState={runState} speed={speed} setSpeed={setSpeed} isShow={isShow}/>
    </Suspense>
  );
}
export default MaxWellRoadScene;
