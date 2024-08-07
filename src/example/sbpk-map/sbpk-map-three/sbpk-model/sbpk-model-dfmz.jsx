/*
 * @Author: FMC
 * @Date: 2024-08-04 18:47:04
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-07 00:14:45
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-model\sbpk-model-dfmz.jsx
 * @Description:
 */

import { Suspense, useEffect, useRef, useState } from "react";
import { useGLTF, useTexture, shaderMaterial } from "@react-three/drei";
import { useThree, useFrame, extend } from "@react-three/fiber";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import LightColumnVs from "./shader/light-column.vs.glsl";
import LightColumnFs from "./shader/light-column.fs.glsl";
import LightCircleVs from "./shader/light-circle.vs.glsl";
import LightCircleFs from "./shader/light-circle.fs.glsl";
import LightPointsVs from "./shader/light-points.vs.glsl";
import LightPointsFs from "./shader/light-points.fs.glsl";
import LightLinerFs from "./shader/light-liner.fs.glsl"; 
import TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
class LightColumnMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uColor: { value: new THREE.Color("#00ffff") },
        uHeight: { value: 3 },
      },
      // wireframe:true,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      vertexShader: LightColumnVs,
      fragmentShader: LightColumnFs,
    });
  }
}
class LightCircleMaterial extends THREE.ShaderMaterial {
  constructor(offset) {
    super({
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uOffset: { value: offset },
      },
      // wireframe:true,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      vertexShader: LightCircleVs,
      fragmentShader: LightCircleFs,
    });
  }
}
class LightPonitsMaterial extends THREE.ShaderMaterial {
  constructor(size, resolution) {
    super({
      uniforms: {
        uSize: new THREE.Uniform(size),
        // 屏幕分辨率
        uResolution: new THREE.Uniform(resolution),
      },
      transparent:true,
      // blending:THREE.AdditiveBlending,
      depthTest:false,
      vertexShader: LightPointsVs,
      fragmentShader: LightPointsFs,
    });
  }
}
class LightLinerMaterial extends CustomShaderMaterial {
  constructor(trailRatio, trailLength) {
    super({
      /**
       * 虚线材质
       */
      baseMaterial: THREE.LineDashedMaterial,
      uniforms: {
        // actionRatio: { value: trailRatio },
        // lineLength: { value: trailLength },
        // lineColor: { value: new THREE.Color(0x0b49ad) },
      },
      linewidth: 1,
      scale: 1,
      dashSize: 3,
      gapSize: 5,
      transparent: true,
      onBeforeCompile: (shader) => {
        shader.fragmentShader = LightLinerFs;
      },
    });
    // console.log("material执行");
  }
}
extend({ LightColumnMaterial });
extend({ LightCircleMaterial });
extend({ LightPonitsMaterial });
extend({LightLinerMaterial})
// LightCircleMaterial

function Model(props) {
  //   const model = useLoader(GLTFLoader, "/model/东方明珠.glb")
  const { nodes } = useGLTF("/model/东方明珠.glb");
  const lightColumnRef = useRef(null);
  const lightCircleRef1 = useRef(null);
  const lightCircleRef2 = useRef(null);
  const lightCircleRef3 = useRef(null);
  const lightPoints = useRef(null);
  const lightLine = useRef(null);
  const apertureTexture = useTexture("/texture/标注光圈.png");
  // const lightColumnTexture = useTexture("/texture/光柱.png");
  const initLightColumnGeometry = (radius, height, segment) => {
    const bottomPos = [];
    const topPos = [];
    const angleOffset = (Math.PI * 2) / segment;
    for (let index = 0; index < segment; index++) {
      const x = Math.cos(angleOffset * index) * radius;
      const z = Math.sin(angleOffset * index) * radius;
      bottomPos.push(x, 0, z);
      topPos.push(x, height, z);
    }
    const pos = bottomPos.concat(topPos);

    const face = [];
    for (let index = 0; index < segment; index++) {
      if (index != segment - 1) {
        face.push(index + segment + 1, index, index + segment);
        face.push(index, index + segment + 1, index + 1);
      } else {
        face.push(segment, index, index + segment);
        face.push(index, segment, 0);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(pos), 3)
    );
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(face), 1));
    return geometry;
  };
  const initRoundPointsGeomerty = (radius, segment, height) => {
    const curve = new THREE.EllipseCurve(
      0,
      0, // ax, aY
      radius,
      radius, // xRadius, yRadius
      0,
      2 * Math.PI, // aStartAngle, aEndAngle
      false, // aClockwise
      0 // aRotation
    );
    const points = curve
      .getPoints(segment)
      .map((item) => new THREE.Vector3(item.x, height, item.y));
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(points);
    return geometry;
  };
  // const initLightLinnerGeometry = (radius, segment, height) => {
  //   const curve = new THREE.EllipseCurve(
  //     0,
  //     0, // ax, aY
  //     radius,
  //     radius, // xRadius, yRadius
  //     0,
  //     2 * Math.PI, // aStartAngle, aEndAngle
  //     false, // aClockwise
  //     0 // aRotation
  //   );
  //   const points = curve
  //     .getPoints(segment)
  //     .map((item) => new THREE.Vector3(item.x, height, item.y));
  // };
  // const initLightCircleAmi = () => {
  //   let tweenImpact = new TWEEN.Tween({ value: 0 })
  //     .to({ value: 1 }, 1500)
  //     .onUpdate((val) => {
  //       console.log("val", val);
  //       lightCircleRef.current.material.uniforms.uProgress.value = val;
  //     })
  //     .onComplete(() => {});
  //   tweenImpact.start();
  // };

  useEffect(() => {
    lightColumnRef.current.geometry = initLightColumnGeometry(1, 3, 32);
    let tweenImpact = new TWEEN.Tween({ value: 0 })
      .to({ value: 2 }, 1000 * 2)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .repeat(Infinity)
      .repeatDelay(500)
      .onUpdate((val) => {
        // console.log("val", val);
        lightCircleRef1.current.material.uniforms.uProgress.value = val.value;
        lightCircleRef2.current.material.uniforms.uProgress.value = val.value;
        lightCircleRef3.current.material.uniforms.uProgress.value = val.value;
      })
      .onComplete(() => {
        // tweenImpact.start();
      });
    tweenImpact.start();

    lightPoints.current.geometry = initRoundPointsGeomerty(1.8, 40, 0.5);

    lightLine.current.geometry=initRoundPointsGeomerty(2.0, 40, 0.5);
    lightLine.current.computeLineDistances();
    return () => {
      tweenImpact.stop();
      lightColumnRef.current.material.dispose();
      lightColumnRef.current.geometry.dispose();
    };
  }, []);
  // console.log('加载东方之门');
  // useEffect(()=>{
  //   console.log('EffectComposer',EffectComposer)
  // },[])
  useFrame((state, delta) => {
    // const a=new THREE.Mesh()
    // a.rotation
    lightPoints.current.rotation.y += delta * 0.2;
  });
  return (
    <>
      <group {...props} scale={[0.1, 0.1, 0.1]}>
        <mesh geometry={nodes.Sphere011_Material002_0.geometry}>
          <meshBasicMaterial
            // color={[0.188, 0.992, 0.992].map((item) => item * 1.333)}
            color={[0.188, 0.992, 0.992].map((item) => item * 1.0)}
            // transparent={true}
            // opacity={0.2}
            toneMapped={false}
          ></meshBasicMaterial>
        </mesh>
      </group>
      {/* 底部光圈 */}
      <mesh
        rotation-x={-Math.PI * 0.5}
        position-y={-0.1}
        scale={[4.0, 4.0, 4.0]}
      >
        <planeGeometry></planeGeometry>
        <meshBasicMaterial
          transparent={true}
          map={apertureTexture}
          color={"#00ffff"}
        ></meshBasicMaterial>
      </mesh>
      {/* 光柱  半径为1*/}
      <mesh ref={lightColumnRef}>
        <lightColumnMaterial></lightColumnMaterial>
      </mesh>
      {/* 向上运动的光圈 */}
      <mesh ref={lightCircleRef1} rotation-x={-Math.PI * 0.5}>
        <ringGeometry args={[1.05, 1.1]}></ringGeometry>
        <lightCircleMaterial args={[0.2]}></lightCircleMaterial>
      </mesh>
      <mesh ref={lightCircleRef3} rotation-x={-Math.PI * 0.5}>
        <ringGeometry args={[1.05, 1.1]}></ringGeometry>
        <lightCircleMaterial args={[0.4]}></lightCircleMaterial>
      </mesh>
      <mesh ref={lightCircleRef2} rotation-x={-Math.PI * 0.5}>
        <ringGeometry args={[1.05, 1.1]}></ringGeometry>
        <lightCircleMaterial args={[0]}></lightCircleMaterial>
      </mesh>
      <points ref={lightPoints}>
        <lightPonitsMaterial
          args={[
            0.2,
            new THREE.Vector2(
              window.innerWidth * Math.min(window.devicePixelRatio, 2),
              window.innerHeight * Math.min(window.devicePixelRatio, 2)
            ),
          ]}
        ></lightPonitsMaterial>
      </points>
        {/* 按照固定轨迹运动的粒子 */}
      <line ref={lightLine}>
        <lightLinerMaterial></lightLinerMaterial>
        {/* <lineDashedMaterial color={'red'} ></lineDashedMaterial> */}
      </line>
    </>
  );
}
// function Loading(){
//   return(<>
//     <mesh position={[1,1,0]} >
//       <boxGeometry args={[0.8,1.35,0.8,4,4,4]}/>
//       <meshBasicMaterial color={'red'} wireframe={true} />
//     </mesh>
//   </>)
// }
function SbpkModelDfmz(props) {
  return (
    <Suspense>
      <Model {...props} />
    </Suspense>
  );
}
export default SbpkModelDfmz;
