/*
 * @Author: FMC
 * @Date: 2024-08-12 19:58:41
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-25 15:29:06
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-model-animations\sbpk-model-animations.jsx
 * @Description:
 */
/*
 * @Author: FMC
 * @Date: 2024-08-04 18:47:04
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-12 23:02:25
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-model\sbpk-model-dfmz.jsx
 * @Description:
 */

import { Suspense, useEffect, useRef, useState } from "react";
import { useGLTF, useTexture, shaderMaterial, Line } from "@react-three/drei";
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
import SbpkClock from '../common/sbpk-clock.js';
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
      transparent: true,
      // blending:THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: LightPointsVs,
      fragmentShader: LightPointsFs,
    });
  }
}
extend({ LightColumnMaterial });
extend({ LightCircleMaterial });
extend({ LightPonitsMaterial });
// LightCircleMaterial

function Model(props) {
  const lightColumnRef = useRef(null);
  const lightCircleRef1 = useRef(null);
  const lightCircleRef2 = useRef(null);
  const lightCircleRef3 = useRef(null);
  const lightPoints = useRef(null);
  // const lightLine = useRef(null);
  const apertureTexture = useTexture("/texture/标注光圈.png");
  const [linePoints, setLinePoints] = useState([]);
  const [lightLine, setlightLine] = useState(null);
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
  const initRoundPointsGeomerty2 = (radius, segment, height) => {
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
      .map((item) => [item.x, height, item.y]);
    return { points, len: curve.getLength() };
    // const geometry = new THREE.BufferGeometry();
    // geometry.setFromPoints(points);
    // return geometry;
  };

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

    // lightLine.current.points = initRoundPointsGeomerty2(2.0, 40, 0.5);

    return () => {
      tweenImpact.stop();
      lightColumnRef.current.material.dispose();
      lightColumnRef.current.geometry.dispose();
    };
  }, []);
  /**
   * 实现了可控制宽度的虚线已经对应的虚线动画
   */
  useEffect(() => {
    const { points, len } = initRoundPointsGeomerty2(2.0, 40, 0.6);
    setLinePoints(points);
    if (lightLine) {
      lightLine.computeLineDistances();
      // 
      const material = lightLine.material;
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uTotelLen = { value: len };
        // console.log("shader", shader);
        // shader.vertexShader = shader.vertexShader.replace(
        //   "uniform float linewidth;",
        //   /*glsl */
        //   `
        //   uniform float linewidth;
        //   uniform float uTime;
        //   uniform float uTotelLen;
        //   `
        // );
        // shader.vertexShader = shader.vertexShader.replace(
        //   "offset *= linewidth;",
        //   /*glsl */
        //   `
        //   offset *= linewidth;
        //   `
        // );

        shader.fragmentShader = shader.fragmentShader.replace(
          "uniform float linewidth;",
          /*glsl */
          `
          uniform float linewidth;
          uniform float uTime;
          uniform float uTotelLen;
          `
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          `						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX`,
          /*glsl */
          `
						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps
            float vL0=uTotelLen/12.0;
            float vL1=mod(uTime,2.0*PI)*(uTotelLen/(2.0*PI));
            float vL2=vL1+vL0;
            float vOffset=step(uTotelLen,vL2)*(vL2-uTotelLen);
            // if(vL2>uTotelLen)
  
             // 计算是否在下边界以上
            float inLowerBound = step(vL1, vLineDistance);
            
            // 计算是否在上边界以下
            float inUpperBound = step(vLineDistance, vL2);
  
  
            // 计算是否在上边界以下
            float inUpperBoundOffset = step(vLineDistance, vOffset);
            
            // 结合两个条件
            float inRange = inLowerBound * inUpperBound+inUpperBoundOffset;
            float distanceInDashPattern = mod( vLineDistance + dashOffset, dashSize + gapSize );
						if ( distanceInDashPattern*(1.0-inRange) > dashSize ) discard; // todo - FIX
          `
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "vec4 diffuseColor = vec4( diffuse, alpha );",
          /*glsl */
          `
          float zhanbi=(vLineDistance-vL1)/vL0;
          zhanbi=(1.0-inUpperBoundOffset)*zhanbi+inUpperBoundOffset*((uTotelLen-vL1+vLineDistance)/vL0);
          // vec3 lightColor=mix(vec3(1.0,0.0,0.0),vec3(0.0,1.0,0.0),zhanbi);
          // lightColor=diffuse;


          //轨道颜色
          vec3 trackColor=vec3(1.0,1.0,1.0);
          vec3 color=mix(trackColor,diffuse,clamp(0.0,1.0,inRange));

          float vWidth=zhanbi;
          vWidth=clamp(zhanbi,0.0, 1.0);
          vWidth=pow(vWidth,3.0);
          vWidth=1.0-vWidth;


          float alphfmc = smoothstep( 0.15, 1.0,(alpha+inRange-vWidth*inRange));


          vec4 diffuseColor = vec4( color, alphfmc);
          `
        );
      };
    }
  }, [lightLine]);

  useFrame((state, delta) => {
    const { clock } = state;
    lightPoints.current.rotation.y += delta;
    if (lightLine && lightLine.material.uniforms.uTime) {
      lightLine.material.uniforms.uTime.value = clock.getElapsedTime();
    }
  });
  return (
    // scale={[0.2, 0.2, 0.2]} position-y={0.01}
    <group {...props}>
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
            0.05 * 0.5,
            new THREE.Vector2(
              window.innerWidth * Math.min(window.devicePixelRatio, 2),
              window.innerHeight * Math.min(window.devicePixelRatio, 2)
            ),
          ]}
        ></lightPonitsMaterial>
      </points>
      {/* 按照固定轨迹运动的粒子 */}
      {linePoints.length > 0 && (

          <Line
            // ref的快捷写法
            ref={setlightLine}
            points={linePoints}
            transparent={true}
            color={0x00ffff}
            opacity={0.3}
            lineWidth={2}
            dashSize={3}
            dashScale={1}
            dashed={true}
            // color={'red'}
            // material={new THREE.MeshBasicMaterial({color:'blue'})}
          >
            {/* <meshBasicMaterial color={'blue'}></meshBasicMaterial> */}
            {/* <lightLinerMaterial></lightLinerMaterial> */}
            {/* <lineDashedMaterial color={'red'} ></lineDashedMaterial> */}
          </Line>
      )}
    </group>
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
function SbpkModelAnimations(props) {
  return (
    <Suspense>
      <Model {...props} />
    </Suspense>
  );
}
export default SbpkModelAnimations;
