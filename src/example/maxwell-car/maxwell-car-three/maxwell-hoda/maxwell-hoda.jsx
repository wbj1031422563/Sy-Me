/*
 * @Author: FMC
 * @Date: 2024-09-01 11:50:08
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-09 00:14:45
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-hoda\maxwell-hoda.jsx
 * @Description:
 */

import { applyProps, useFrame, useLoader } from "@react-three/fiber";
import TWEEN from "@tweenjs/tween.js";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
function Model() {
  const scaleNum = 0.01;
  const [hoda, setHoda] = useState(null);
  const [carBox3, setCarBox3] = useState(null);
  const [compileObj, setCompileObj] = useState({
    CarPaintBlack: false,
    WhitePlastic: false,
    CarpetSpecial: false,
    InteriorFloor: false,
    Plastic45: false,
    RoofCloth: false,
    GrayClothCouches: false,
    WhiteClothCouches: false,
    CameraLens_BlackShiny: false,
    CarUnderBlack: false,
    SteeringWheel: false,
    "Buttons-Detailtext": false,
    Rubber: false,
    BlackNoSplecular: false,
    BlackPlasticShiny: false,
    CameraPlasticMaterial1: false,
    CameraPlasticMaterial2: false,
    CamerasCristal: false,
    CarPaintWhite: false,
    CristalTintado: false,
    Chrome15: false,
    SeatBelt: false,
    SewsGolden: false,
    SewsWhite: false,
    InteriorWood: false,
    HeadLampGlasses: false,
    MainHeadLightGlass: false,
    ExteriorHeadLightsGlass: false,
    Cristal: false,
    WindowsBlackSticker: false,
    Pedales: false,
    WhiteMetalShiny: false,
    Plastic25: false,
    DashPatternPlastic: false,
    RearLampInteriorGlasses: false,
    ChromedReflectors: false,
    EmissiveLogo: false,
    ChromeLogos: false,
    RetroGlass: false,
    RearWhipper: false,
    Rims: false,
    Pneumatic: false,
    RoofLights: false,
    LedFrontLight: false,
    LedRearLight: false,
    SpeakerRack: false,
    Matricula: false,
    ScreenTexture: false,
    CenterBigScreen: false,
    RetroScreens: false,
    HeatedLinesRearWindshield: false,
    BackRedReflectors: false,
    CenterRetro: false,
    "EmissiveLogo.001": false,
    "EmissiveLogo.003": false,
  });
  const frontWheelRef = useRef(null);
  /**
   * 加载Draco模型
   */
  const { scene, nodes, materials } = useLoader(
    GLTFLoader,
    "model/本田规范化版.glb",
    (loader) => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("draco/");
      loader.setDRACOLoader(dracoLoader);
    }
  );
  const setShader = (material) => {
    material.transparent = true;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uProgress = { value: 0 };
      shader.uniforms.uXlen = { value: 0 };
      shader.uniforms.uOffsetX = { value: 0 };
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        /*glsl */
        `
        #include <common>
        varying vec3 vPos;
      `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        /*glsl */
        `
        #include <begin_vertex>
        vec4 fmcWorldPosition = modelMatrix * vec4(transformed, 1.0);
        vPos=fmcWorldPosition.xyz;
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        /*glsl */
        `
        #include <common>
        uniform float uProgress;
        uniform float uXlen;
        uniform float uOffsetX;
        varying vec3 vPos;
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        /*glsl */
        `
        float fmcStrength=abs(vPos.x-uOffsetX)/uXlen;
        // float alph=1.-step(uProgress,strength);
        
        // 延迟动画进度 0.1 秒并进行归一化处理
        float delayedProgress=(uProgress-.1)/.9;
        delayedProgress=clamp(delayedProgress,0.,1.);// 确保范围在 [0, 1]
    
        float alphStrength=1.-step(delayedProgress,fmcStrength-0.1);
        float fmcAlph=mix(0.0,opacity,alphStrength);
        vec4 diffuseColor = vec4( diffuse, fmcAlph );
        `
      );
      material.userData.shader = shader;
      setCompileObj({
        ...compileObj,
        [material.name]: true,
      });
      // debugger
      // console.log("shader", shader===material);
    };
  };
  const getGroupBox3 = (group) => {
    let box3 = new THREE.Box3();
    group.traverse((child) => {
      if (child.isMesh) {
        // 如果子对象有几何体，就计算它的包围盒
        const mesh = child.clone();
        mesh.updateMatrixWorld(true);
        const childBoundingBox = new THREE.Box3().setFromObject(mesh);

        // 应用子对象的变换矩阵（如缩放、旋转等）
        // childBoundingBox.applyMatrix4(child.matrixWorld);

        // 合并子对象的包围盒到 group 的包围盒
        box3.union(childBoundingBox);
        // const helper = new THREE.Box3Helper(childBoundingBox, 0xffff00);
        // scene.add(helper);
      }
    });
    box3.expandByScalar(scaleNum);
    setCarBox3(box3);
    // const helper = new THREE.Box3Helper(box3, 0xffff00);
    // scene.add(helper);
  };
  useEffect(() => {
    if (scene && hoda) {
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
      getGroupBox3(hoda);
    }
  }, [scene, hoda]);
  useEffect(() => {
    if (materials && hoda) {
      applyProps(materials.CarPaintWhite, {
        color: "#999999",
      });
      applyProps(materials.RoofCloth, {
        color: "#999999",
      });
      applyProps(materials.Rims, {
        metalness: 0.9,
        roughness: 0.1,
        color: "#909090",
      });
      // console.log("materials.CarPaintWhite", materials.CarPaintWhite);

      applyProps(materials.HeadLampGlasses, {
        emissiveIntensity: 1.5,
        toneMapped: false,
        color: "#FFA500",
        emissive: "#FFA500",
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
        emissive: "red",
        color: "red",
      });

      applyProps(materials.BackRedReflectors, {
        emissiveIntensity: 0.8,
        toneMapped: false,
        color: "red",
        emissive: "red",
      });
      setShader(materials["CarPaintWhite"]);
      const { CristalTintado } = materials;
      nodes.CristalLateral_Cristal_0.material = CristalTintado;
    }
  }, [hoda]);
  useEffect(() => {
    let tween = null;
    if (compileObj.CarPaintWhite && carBox3) {
      let targetMaterail = null;
      hoda.traverse((child) => {
        if (
          child.isMesh &&
          child.material &&
          child.material.name == "CarPaintWhite"
        ) {
          const shader = child.material.userData.shader;
          targetMaterail = shader;
        }
      });
      const size = new THREE.Vector3();
      carBox3.getSize(size);
      targetMaterail.uniforms.uXlen.value = size.x * 0.01;
      targetMaterail.uniforms.uOffsetX.value = carBox3.min.x * 0.01;
      tween = new TWEEN.Tween({ value: 0 })
        .to({ value: 1 }, 20 * 1000)
        .onUpdate(({ value }) => {
          targetMaterail.uniforms.uProgress.value = value;
        });
      tween.start();
    }
    return () => {
      if (tween) {
        tween.stop();
      }
    };
  }, [compileObj.CarPaintWhite, carBox3]);

  useFrame((state, delta) => {
    if (hoda) {
      const speed = 25; // 汽车的移动速度
      // const wheelRadius = 1.0; // 轮子的半径，假设是0.2
      // const distance = delta * speed; // 移动的距离
      // if(frontWheelRef.current){
      //   frontWheelRef.current.forEach(item=>{
      //     item.rotation.y-=distance / wheelRadius*0.4;
      //   })
      // }
      // hodaRef.current.position.x-=distance*0.1;\
    }
  });
  return (
    <>
      <primitive
        ref={setHoda}
        object={scene ? scene : null}
        scale={[scaleNum, scaleNum, scaleNum]}
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
