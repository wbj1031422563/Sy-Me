/*
 * @Author: FMC
 * @Date: 2024-09-01 11:50:08
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-28 19:36:41
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-hoda\maxwell-hoda.jsx
 * @Description:
 */

import { applyProps, extend, useFrame, useLoader, useThree } from "@react-three/fiber";
import TWEEN from "@tweenjs/tween.js";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler";
import { smoothstep } from "three/src/math/MathUtils";
import LoadingMaterial from "../material/loadingMaterial/loadingMaterial";
import surfaceWeight from "./surfaceWeight.json";
extend({ LoadingMaterial })
function Model({speed,rotation,position}) {
  const state = useThree();
  const scaleNum = 1;
  const seconds = 4;
  const maxParticlesCount = 14000;
  const particlesWidth = 0.2;
  const particleSize = 0.05;
  const sufarceNum = 0.7;
  const particlesRef = useRef();
  const [particlesPos, setParticlesPos] = useState([]);
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
    // ChromeLogos: false,
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
    // "EmissiveLogo.003": false,
  });
  // const frontWheelRef = useRef(null);
  /**
   * 加载Draco模型
   */
  const { scene, nodes, materials } = useLoader(
    GLTFLoader,
    "model/汽车.glb",
    (loader) => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("draco/");
      loader.setDRACOLoader(dracoLoader);
    }
  );
  const setVisable = (visable) => {
    hoda.traverse((child) => {
      if (child.isMesh) {
        child.is;
      }
    });
  };
  const setShader = (material) => {
    if (!material) return;
    const { name } = material;
    if (name == "ChromeLogos" || name == "EmissiveLogo.003") return;
    // material.transparent = true;
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
        vec4 permute(vec4 x)
        {
            return mod(((x*34.0)+1.0)*x, 289.0);
        }
        vec4 taylorInvSqrt(vec4 r)
        {
            return 1.79284291400159 - 0.85373472095314 * r;
        }
        vec3 fade(vec3 t)
        {
            return t*t*t*(t*(t*6.0-15.0)+10.0);
        }
        float cnoise(vec3 P)
{
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
}
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        /*glsl */
        `
        float fmcStrength=abs(vPos.x-uOffsetX)/uXlen;
        float fmcNoise=(cnoise(vec3(vPos.y,vPos.y,uProgress))+1.0)*0.5*0.1;
        // float alph=1.-step(uProgress,strength);
        
        // 延迟动画进度 0.1 秒并进行归一化处理
        // float delayedProgress=uProgress*(1.0+fmcNoise*3.0);
        float delayedProgress=(uProgress-.1)/.9;
        delayedProgress=clamp(delayedProgress,0.,1.);// 确保范围在 [0, 1]
    
        float alphStrength=1.-step(delayedProgress,fmcStrength-${particlesWidth * 0.5});
        if(alphStrength<0.01) discard;

        // vec3 selfColor=vec3(0.5,0.4,0.6);
        // float fmcEdge=0.02;
        // float fmcA=delayedProgress-fmcNoise*3.0;
        // float fmcB=delayedProgress;
        // float colorStrength= smoothstep(fmcA-fmcEdge,fmcA, fmcStrength) * (1.0 - smoothstep(fmcB, fmcB+fmcEdge, fmcStrength));
        
        // selfColor=mix(diffuse,selfColor,colorStrength);



        vec4 diffuseColor = vec4( diffuse, opacity );
        `
      );
      material.userData.shader = shader;
      material.userData.materialName = name;
      // setCompileObj({
      //   ...compileObj,
      //   [material.name]: true,
      // });
      setCompileObj((prevCompileObj) => ({
        ...prevCompileObj,
        [material.name]: true,
      }));
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
    // box3.expandByScalar(scaleNum);
    setCarBox3(box3);
    // const helper = new THREE.Box3Helper(box3, 0xffff00);
    // scene.add(helper);
  };
  const initParticlesPos = () => {
    if (!particlesPos || particlesPos.length == 0) return;
    const tempPos = new THREE.Vector3();
    const tempObject = new THREE.Object3D();
    const list = [];
    let count = 0;
    console.log("surfaceWeight", surfaceWeight);
    hoda.traverse((child) => {
      if (
        child.isMesh &&
        [
          "CarPaintWhite",
          "CarPaintBlack",
          "Rims",
          "CristalTintado",
          "Cristal",
          "Pneumatic",
        ].includes(child.material.name) &&
        surfaceWeight[child.name]
      ) {
        for (let i = 0; i < surfaceWeight[child.name] * sufarceNum; i++) {
          const sampler = new MeshSurfaceSampler(child).build();
          child.updateMatrixWorld(true);
          sampler.sample(tempPos);
          child.localToWorld(tempPos);
          // tempPos.applyAxisAngle(new THREE.Vector3(1,0,0),-Math.PI*0);
          // tempObject.position.set(tempPos.clone());
          tempObject.position.copy(tempPos);
          list.push(tempObject.position.clone());
          // tempObject.rotation.y=-Math.PI*0.5;
          // list.push(tempPos.clone());
          tempObject.position.z = 9999;
          tempObject.scale.setScalar(Math.random() * 0.5 + 0.5);
          tempObject.updateMatrix();
          particlesRef.current.setMatrixAt(count, tempObject.matrix);
          count++;
        }
        console.log("mesh", child.name);
      }
    });
    // debugger;
    if (list.length < maxParticlesCount) {
      for (let i = list.length; i < maxParticlesCount; i++) {
        tempObject.position.set(0, 0, 9999);
        tempObject.updateMatrix();
        particlesRef.current.setMatrixAt(i, tempObject.matrix);
      }
    }
    particlesRef.current.instanceMatrix.needsUpdate = true;
    setParticlesPos(list);
  };
  // useEffect(() => {
  //   if (scene && hoda) {
  //     const meshList = [];
  //     const frontWheel = [];
  //     const frontWheelNameList = [
  //       "PneumaticoTrasero_Pneumatic_0",
  //       "LlantaTrasera_Rims_0",
  //       "TornillosLlantaTrasera_CarPaintBlack_0",
  //       "TaponLlantaTrasera_CarPaintBlack_0",
  //       "Llanta.002_ChromeRims_0",

  //       "Pneumatico_Pneumatic_0",
  //       "Llanta_Rims_0",
  //       "TornillosLlanta_CarPaintBlack_0",
  //       "TaponLlanta_CarPaintBlack_0",
  //       "Llanta.001_ChromeRims_0",
  //     ];
  //     hoda.traverse((child) => {
  //       if (child.isMesh) {
  //         meshList.push(child);
  //       }
  //     });
  //     meshList.forEach((mesh, index) => {
  //       if (frontWheelNameList.includes(mesh.name)) {
  //         frontWheel.push(mesh);
  //       }
  //     });
  //     frontWheelRef.current = frontWheel;
  //     getGroupBox3(hoda);
  //     initParticlesPos();
  //   }
  // }, [scene, hoda]);
  // useEffect(() => {
  //   if (materials && hoda) {
  //     applyProps(materials.CarPaintWhite, {
  //       color: "#999999",
  //     });
  //     applyProps(materials.RoofCloth, {
  //       color: "#999999",
  //     });
  //     applyProps(materials.Rims, {
  //       metalness: 0.9,
  //       roughness: 0.1,
  //       color: "#909090",
  //     });
  //     // console.log("materials.CarPaintWhite", materials.CarPaintWhite);

  //     applyProps(materials.HeadLampGlasses, {
  //       emissiveIntensity: 1.5,
  //       toneMapped: false,
  //       color: "#FFA500",
  //       emissive: "#FFA500",
  //     });
  //     applyProps(materials.MainHeadLightGlass, {
  //       emissiveIntensity: 4,
  //       toneMapped: false,
  //       color: "#fff",
  //       emissive: "#fff",
  //     });

  //     applyProps(materials.RearLampInteriorGlasses, {
  //       emissiveIntensity: 5,
  //       toneMapped: false,
  //       emissive: "red",
  //       color: "red",
  //     });

  //     applyProps(materials.BackRedReflectors, {
  //       emissiveIntensity: 0.8,
  //       toneMapped: false,
  //       color: "red",
  //       emissive: "red",
  //     });
  //     Object.entries(materials).forEach(([key, value]) => {
  //       setShader(value);
  //     });
  //     // const { CristalTintado } = materials;
  //     // nodes.CristalLateral_Cristal_0.material = CristalTintado;
  //     // debugger
  //     // nodes['CristalLateralEsquina_Cristal_0001'].material=CristalTintado;
  //   }
  // }, [hoda]);
  // useEffect(() => {
  //   let tween = null;
  //   let allHaseComplieObj = Object.entries(compileObj).every(
  //     ([key, value]) => value
  //   );
  //   if (allHaseComplieObj && carBox3) {
  //     let targetMaterailList = [];
  //     hoda.traverse((child) => {
  //       if (child.isMesh && child.material) {
  //         targetMaterailList.push(child.material.userData);
  //       }
  //     });
  //     targetMaterailList = targetMaterailList.filter(
  //       (item, index, self) =>
  //         index === self.findIndex((t) => t.materialName === item.materialName)
  //     );
  //     // debugger

  //     const size = new THREE.Vector3();
  //     carBox3.getSize(size);
  //     targetMaterailList.forEach(({ shader }) => {
  //       shader.uniforms.uXlen.value = size.x * scaleNum;
  //       shader.uniforms.uOffsetX.value = carBox3.min.x * scaleNum;
  //     });

  //     tween = new TWEEN.Tween({ value: 0 })
  //       .to({ value: 1 }, seconds * 1000)
  //       .onUpdate(({ value }) => {
  //         targetMaterailList.forEach(({ shader }) => {
  //           shader.uniforms.uProgress.value = value;
  //         });
  //       });
  //     tween.start();
  //   }
  //   return () => {
  //     if (tween) {
  //       tween.stop();
  //     }
  //   };
  // }, [compileObj, carBox3]);

  // /**
  //  * 粒子
  //  */
  // useEffect(() => {
  //   let tween = null;
  //   if (particlesPos.length < 1 || !carBox3) return;

  //   const size = new THREE.Vector3();
  //   carBox3.getSize(size);
  //   // debugger
  //   // debugger
  //   const pos2 = new THREE.Vector3();
  //   let mat4 = new THREE.Matrix4();
  //   const { camera } = state;
  //   const pos = new THREE.Vector3();
  //   tween = new TWEEN.Tween({ value: 0 })
  //     .to({ value: 1 }, seconds * 1000)
  //     .onUpdate(({ value }) => {
  //       for (let index = 0; index < particlesPos.length; index++) {
  //         particlesRef.current.getMatrixAt(index, mat4);
  //         pos.setFromMatrixPosition(mat4);
  //         const xRadio =
  //           (pos.x - carBox3.min.x * scaleNum) / (size.x * scaleNum);
  //         // if (xRadio > value - 0.1 && xRadio < value - 0.1 + 0.1) {
  //         //   pos2.copy(camera.position);
  //         //   pos2.lerp(particlesPos[index], 0.5);
  //         //   mat4.setPosition(pos2);
  //         // }
  //         // else if (xRadio > value - 0.05 && xRadio < value - 0.05 + 0.1) {
  //         //   pos2.copy(camera.position);
  //         //   pos2.lerp(particlesPos[index], 0.75);
  //         //   mat4.setPosition(pos2);
  //         // }
  //         if (xRadio > value && xRadio < value + particlesWidth) {
  //           let showRadio = (xRadio - value) / particlesWidth;
  //           showRadio = smoothstep(showRadio, 0, 0.5);
  //           // mat4.makeScale(showRadio, showRadio, showRadio);

  //           pos2.copy(particlesPos[index]);
  //           // if(showRadio<0.5){
  //           //   pos2.setScalar(1.5)
  //           // }else if(showRadio<1){
  //           //   pos2.setScalar(1.25)
  //           // }
  //           // pos2.setScalar(1.2);
  //           // pos2.lerp(particlesPos[index],showRadio);
  //           // pos2.setScalar(1.5)
  //           mat4.setPosition(pos2);
  //         } else {
  //           mat4.setPosition(
  //             new THREE.Vector3(
  //               particlesPos[index].x,
  //               particlesPos[index].y,
  //               9999
  //             )
  //           );
  //         }
  //         particlesRef.current.setMatrixAt(index, mat4);
  //       }
  //       particlesRef.current.instanceMatrix.needsUpdate = true;
  //     });
  //   tween.start();
  //   return () => {
  //     if (tween) {
  //       tween.stop();
  //     }
  //   };
  // }, [particlesPos, carBox3]);


  const frontWheelRef = useRef(null);
  /**
   * 车辆运动状态初始化
   */
  useEffect(() => {
    const fontWheel = ['polySurface481_前左轮毂', 'polySurface491_phong2_0', 'polySurface480_blinn7_0']
    const rearWeel = ['polySurface477_后左轮毂', 'polySurface476_blinn7_0', 'polySurface539_phong2_0']
    const list=[];
    const meshList=[];
    if (hoda) {
      hoda.traverse((child) => {
        if (child.isMesh) {
          meshList.push(child);
        }
      });
      meshList.forEach((mesh, index) => {
        if (fontWheel.includes(mesh.name)||rearWeel.includes(mesh.name)) {
          list.push(mesh);
        }
      });
      // debugger
      frontWheelRef.current = list;
    }
  }, [hoda])
  useFrame((state, delta) => {
    if (hoda) {
      if(frontWheelRef.current){
        const wheelRadius = 1.0; // 轮子的半径，假设是0.2
        const distance = delta * speed; // 移动的距离
        frontWheelRef.current.forEach(item=>{
          item.rotation.x+=distance / wheelRadius*0.4;
        })
      }
      // hodaRef.current.position.x-=distance*0.1;\
    }
  });
  return (
    <group>
      <primitive
        ref={setHoda}
        object={scene ? scene : null}
        scale={[scaleNum, scaleNum, scaleNum]}
        // rotation-y={Math.PI*0.5}
        rotation={rotation}
        position={position}
      />
      {/* <instancedMesh
        ref={particlesRef}
        args={[undefined, undefined, maxParticlesCount]}
      >
        <planeGeometry args={[particleSize, particleSize]}></planeGeometry>
        <loadingMaterial/>
      </instancedMesh> */}
    </group>
  );
}
function MaxwellHoda({speed=0,position,rotation}) {
  return (
    <Suspense>
      <Model speed={speed} rotation={rotation} position={position}/>
    </Suspense>
  );
}
export default MaxwellHoda;
