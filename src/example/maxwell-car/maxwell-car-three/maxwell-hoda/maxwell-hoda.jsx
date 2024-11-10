/*
 * @Author: FMC
 * @Date: 2024-09-01 11:50:08
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-28 19:36:41
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-hoda\maxwell-hoda.jsx
 * @Description:
 */

import {
  applyProps,
  extend,
  useFrame,
  useLoader,
  useThree,
} from "@react-three/fiber";
import TWEEN from "@tweenjs/tween.js";
import { Suspense, useEffect, useRef, useState, useContext } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler";
import { smoothstep } from "three/src/math/MathUtils";
import LoadingMaterial from "../material/loadingMaterial/loadingMaterial";
import surfaceWeight from "./surfaceWeight.json";
import { computeModelSize } from "../../utils/utils";
import { useTexture } from "@react-three/drei";
import { CAR_COLOR } from "../../enum/enum";
import { MaxWellContext } from "../../context/maxwell-car-context";
import useDynamicLightformers from "@/example/maxwell-car/hooks/useDynamicLightformers.js";
extend({ LoadingMaterial });
function Model({ speed, rotation, position }) {
  const pointTransitionTime = {
      value: 0,
    },
    initialModelTransitionTime = {
      value: NaN,
    },
    targetModelTransitionTime = {
      value: NaN,
    };
  const { carColor } = useContext(MaxWellContext);
  const scaleNum = 1;
  const {dynamicEnvMap,baseEnvMap}=useDynamicLightformers();
  const state = useThree();
  const [hoda, setHoda] = useState(null);
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
  const pointsTexture = useTexture("texture/粒子.png");
  const otherColor = useTexture("texture/car_base_color_tc.png");
  otherColor.format=THREE.RGBAFormat;
  otherColor.type = THREE.UnsignedByteType; 
  // otherColor.colorSpace=THREE.SRGBColorSpace;
  otherColor.encoding=3001;  
  otherColor.flipY=false;

  const sliverColor = useTexture("texture/银色车漆.png");
  sliverColor.format=THREE.RGBAFormat;
  sliverColor.type = THREE.UnsignedByteType; 
  // otherColor.colorSpace=THREE.SRGBColorSpace;
  sliverColor.encoding=3001;  
  sliverColor.flipY=false;


  const defalutColor = useTexture("texture/蓝色车漆.png");
  defalutColor.format=THREE.RGBAFormat;
  defalutColor.type = THREE.UnsignedByteType; 
  // otherColor.colorSpace=THREE.SRGBColorSpace;
  defalutColor.encoding=3001;  
  defalutColor.flipY=false;

  const frontWheelRef = useRef(null);
  /**
   * 车辆运动状态初始化
   */
  useEffect(() => {
    const fontWheel = [
      "polySurface481_前左轮毂",
      "polySurface491_phong2_0",
      "polySurface480_blinn7_0",
    ];
    const rearWeel = [
      "polySurface477_后左轮毂",
      "polySurface476_blinn7_0",
      "polySurface539_phong2_0",
    ];
    const list = [];
    const meshList = [];
    if (hoda) {
      hoda.traverse((child) => {
        if (child.isMesh) {
          meshList.push(child);
        }
      });
      meshList.forEach((mesh, index) => {
        if (fontWheel.includes(mesh.name) || rearWeel.includes(mesh.name)) {
          list.push(mesh);
        }
      });
      //
      frontWheelRef.current = list;
    }
  }, [hoda]);
  useFrame((state, delta) => {
    if (hoda) {
      if (frontWheelRef.current) {
        const wheelRadius = 1.0; // 轮子的半径，假设是0.2
        const distance = delta * speed; // 移动的距离
        frontWheelRef.current.forEach((item) => {
          item.rotation.x += (distance / wheelRadius) * 0.4;
        });
      }
      // hodaRef.current.position.x-=distance*0.1;\
    }
  });

  /**
   * 创建粒子材质
   */
  const createPointsMaterial = (box3) => {
    const initialModelMaxValue = box3.max.y;
    const initialModelMinValue = box3.min.y;
    const material = new THREE.PointsMaterial();
    material.size = 0.25;
    material.color.set(0x409eff);
    material.map = pointsTexture;
    material.alphaMap = pointsTexture;
    material.transparent = true;
    material.depthWrite = false;
    material.blending = THREE.AdditiveBlending;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = pointTransitionTime;
      shader.uniforms.uInitialModelTransitionTime = initialModelTransitionTime;
      shader.uniforms.uTargetModelTransitionTime = targetModelTransitionTime;

      shader.uniforms.uHeight = {
        value: initialModelMaxValue - initialModelMinValue,
      };
      shader.uniforms.uOffset = {
        value: initialModelMinValue,
      };

      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        /* glsl */ `

            #include <common>

            attribute vec3 aPosition;

            uniform float uTime;
            uniform float uInitialModelTransitionTime;
            uniform float uTargetModelTransitionTime;

            uniform float uHeight;
            uniform float uOffset;

        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        /* glsl */ `

            #include <begin_vertex>

            float time = uTime - (transformed.y - uOffset) / (uHeight + 0.016 - 0.065);

            if (time > 0.0 && time < 1.0) {
                vec3 direction = aPosition - transformed;
                transformed = transformed + direction * time;
            } else if (time >= 1.0) {
                transformed = aPosition;
            }

        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <fog_vertex>",
        /* glsl */ `

            #include <fog_vertex>

            vec3 positionNormalize = normalize(aPosition);

            float angle = acos(dot(positionNormalize, vec3(1.0, 0.0, 0.0)));

            float strength = sin(angle * 10.0) / 2.0;

            if (transformed.y > uInitialModelTransitionTime && transformed == position) {
                gl_PointSize = 0.0;
            } else if (aPosition.y > uTargetModelTransitionTime + strength) {
                gl_PointSize = 0.0;
            }

        `
      );
    };
    return material;
  };
  /**
   * 列表长度对齐
   */
  const listLengthAlignment = (...list) => {
    let maxLength = 0;

    list.forEach((item) => {
      maxLength = item.length > maxLength ? item.length : maxLength;
    });

    list.forEach((item, index) => {
      let alignmentList = [];

      const count = Math.floor(maxLength / item.length),
        remainder = maxLength % item.length;

      for (let i = 0; i < count; i++) {
        alignmentList = alignmentList.concat(item);
      }

      alignmentList = alignmentList.concat(item.slice(0, remainder));

      list[index] = alignmentList;
    });
    return list;
  };
  /**
   * 组装顶点数据
   */
  const assembleVertexData = (
    object,
    offsetVector = new THREE.Vector3(0, 0, 0),
    scaleVector = new THREE.Vector3(1.0, 1.0, 1.0)
  ) => {
    const vertexList = [];
    object.traverse((item) => {
      if (item instanceof THREE.Mesh && item.geometry) {
        // item.updateMatrixWorld();

        // const geometry = new THREE.BufferGeometry();
        // console.log('offsetVector', offsetVector)
        // console.log('old array', item.geometry.attributes.position.array)
        const array = item.geometry.attributes.position.array.slice();
        for (let i = 0; i < array.length / 3; i++) {
          const i3 = i * 3;

          array[i3] = array[i3] * scaleVector.x;
          array[i3 + 1] = array[i3 + 1] * scaleVector.y;
          array[i3 + 2] = array[i3 + 2] * scaleVector.z;

          array[i3] = array[i3] + offsetVector.x;
          array[i3 + 1] = array[i3 + 1] + offsetVector.y;
          array[i3 + 2] = array[i3 + 2] + offsetVector.z;
        }
        array.forEach((item2) => {
          vertexList.push(item2);
        });
      }
    });
    return vertexList;
  };
  /**
   * 处理模型
   */
  const disposeTargetModelMaterial = (model) => {
    model.traverse((item) => {
      if (item instanceof THREE.Mesh && item.material) {
        item.material.transparent = true;

        item.material.onBeforeCompile = (shader) => {
          shader.uniforms.uTargetModelTransitionTime =
            targetModelTransitionTime;
          shader.vertexShader = shader.vertexShader.replace(
            "#include <common>",
            /* glsl */ `

                    #include <common>

                    varying vec3 vPosition;

                `
          );
          shader.vertexShader = shader.vertexShader.replace(
            "#include <begin_vertex>",
            /* glsl */ `

                    #include <begin_vertex>

                    vPosition = transformed;

                `
          );

          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <common>",
            /* glsl */ `

                    #include <common>

                    varying vec3 vPosition;

                    uniform float uTargetModelTransitionTime;

                `
          );

          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <dithering_fragment>",
            /* glsl */ `

                    #include <dithering_fragment>

                    vec3 positionNormalize = normalize(vPosition);

                    float angle = acos(dot(positionNormalize, vec3(1.0, 0.0, 0.0)));

                    float strength = sin(angle * 10.0) / 2.0;

                    if (vPosition.y < uTargetModelTransitionTime + strength) {
                        gl_FragColor = vec4(0.0);
                        // gl_FragDepth = 1.0;
                    } else if (vPosition.y < uTargetModelTransitionTime + strength + 0.1) {
                        gl_FragColor = vec4(0.25, 0.62, 1.0, 1.0);
                        // gl_FragDepth = gl_FragCoord.z;
                    } else {
                        gl_FragColor = gl_FragColor;
                        // gl_FragDepth = gl_FragCoord.z;
                    }

                `
          );


          /**
           * 混合环境贴图
           * */
          if(item.material.name==='Car paint'){
            // item.material.envMap=dynamicEnvMap;
            shader.uniforms.uDynamicEnvMap={value:dynamicEnvMap};
            shader.fragmentShader=shader.fragmentShader.replace('#include <envmap_common_pars_fragment>',
                `
            #ifdef USE_ENVMAP
            
                uniform float envMapIntensity;
                uniform float flipEnvMap;
                // uniform sampler2D uBaseEnvMap;
                uniform samplerCube uDynamicEnvMap;
            
                #ifdef ENVMAP_TYPE_CUBE
                    uniform samplerCube envMap;
                #else
                    uniform sampler2D envMap;
                #endif
                
            #endif
`
            )
            shader.fragmentShader=shader.fragmentShader.replace('#include <envmap_physical_pars_fragment>',
                `
#if defined( USE_ENVMAP )

	vec3 getIBLIrradiance( const in vec3 normal ) {

		#if defined( ENVMAP_TYPE_CUBE_UV )

			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );

			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );

			return PI * envMapColor.rgb * envMapIntensity;

		#else

			return vec3( 0.0 );

		#endif

	}

	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {

		#if defined( ENVMAP_TYPE_CUBE_UV )

			vec3 reflectVec = reflect( - viewDir, normal );

			// Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );

			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );

			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			//textureCube 只能够使用它，否则会报错1
			vec4 envMapColor2 = textureCube( uDynamicEnvMap,reflectVec);
			// 0.25 是控制环境贴图混合强度
			// 
			vec4 mixEnvMapColor=mix(envMapColor,envMapColor2,0.25);

			return mixEnvMapColor.rgb * envMapIntensity;

		#else

			return vec3( 0.0 );

		#endif

	}

#endif
`
            )
            console.log('Car paint',shader.fragmentShader);
          }
        };
      }
    });
  };
  useEffect(() => {
    if (hoda) {
      // setTimeout(() => {
      //   // disposeTargetModelMaterial(hoda);

      //   // console.log('targetVertexList', targetVertexList)
      // }, 100)
      const offset = new THREE.Vector3(0, 1.5, 0);
      const scale = new THREE.Vector3(1.2, 1.2, 1.2);

      const targetBox3 = computeModelSize(hoda);
      let sourceBox3 = targetBox3.clone();
      sourceBox3.expandByVector(scale);
      sourceBox3.translate(offset);

      const targetSize = new THREE.Vector3();
      targetBox3.getSize(targetSize);
      const planeGeometry = new THREE.PlaneGeometry(
        targetSize.x,
        targetSize.z,
        100,
        100
      );
      planeGeometry.rotateX(Math.PI * 0.5);
      planeGeometry.translate(0, 1.5, 1.5);
      planeGeometry.scale(1.2, 1.2, 1.2);
      const posArray = planeGeometry.attributes.position.array.slice();
      const uvArray = planeGeometry.attributes.uv.array.slice();
      const offsetHight = 1.2;
      const pp = 2;
      for (let i = 0; i < posArray.length / 3; i++) {
        const i3 = i * 3;
        const i2 = i * 2;

        const uv = [uvArray[i2] * 2 - 1, uvArray[i2 + 1] * 2 - 1];

        posArray[i3] = posArray[i3];
        posArray[i3 + 1] =
          posArray[i3 + 1] +
          offsetHight * (1 - Math.pow(uv[0], pp)) +
          offsetHight * (1 - Math.pow(uv[1], pp)) +
          Math.sin(Math.random() * 100) * 0.4;
        posArray[i3 + 2] = posArray[i3 + 2];
      }
      planeGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(posArray), 3)
      );
      const mesh = new THREE.Mesh(
        planeGeometry,
        new THREE.MeshBasicMaterial({ wireframe: true })
      );
      sourceBox3 = computeModelSize(mesh);
      const targetHelper = new THREE.Box3Helper(targetBox3, 0xffff00);
      const sourceHelper = new THREE.Box3Helper(sourceBox3, 0xff0000);

      initialModelTransitionTime.value = sourceBox3.min.y - 0.08;
      targetModelTransitionTime.value = targetBox3.max.y + 1;

      // const targetVertexList = assembleVertexData(hoda)
      // const sourceVertexList = assembleVertexData(mesh)

      const [targetVertexList, sourceVertexList] = listLengthAlignment(
        assembleVertexData(hoda),
        assembleVertexData(mesh)
      );
      // 创建几何体
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(sourceVertexList), 3)
      );
      geometry.setAttribute(
        "aPosition",
        new THREE.BufferAttribute(new Float32Array(targetVertexList), 3)
      );
      // 创建粒子材质
      const pointsMaterial = createPointsMaterial(sourceBox3);
      const totalTime = 4;

      scene.add(new THREE.Points(geometry, pointsMaterial));
      disposeTargetModelMaterial(hoda);
      const tween1 = new TWEEN.Tween(pointTransitionTime).to(
        { value: 2 },
        totalTime * 1000
      );

      const tween2 = new TWEEN.Tween(initialModelTransitionTime).to(
        { value: sourceBox3.max.y + 0.08 },
        totalTime * 0.5 * 1000
      );

      const tween3 = new TWEEN.Tween(targetModelTransitionTime)
        .to({ value: targetBox3.min.y - 1 }, totalTime * 0.75 * 1000)
        .delay(totalTime * 0.25 * 1000);

      if (tween1) {
        tween1.start();
        tween2.start();
        tween3.start();
      }
      return () => {
        if (tween1) {
          tween1.stop();
          tween2.stop();
          tween3.stop();
        }
      };
    }
  }, [hoda]);

  /**
   *
   */
  useEffect(() => {
    if (hoda) {
      switch (carColor) {
        case CAR_COLOR.OTHER:
          hoda.traverse((child) => {
            if (child.isMesh&&child.material.name=='Car paint') {
              child.material.map=otherColor;
              child.material.map.colorSpace=THREE.SRGBColorSpace;
              child.material.needsUpdate = true; // 确保材质更新
            }
          });
          break;
        case CAR_COLOR.SLIVER:
          hoda.traverse((child) => {
            if (child.isMesh&&child.material.name=='Car paint') {
              child.material.map=sliverColor;
              child.material.map.colorSpace=THREE.SRGBColorSpace;
              child.material.needsUpdate = true; // 确保材质更新
            }
          });
          break;
        default:
          hoda.traverse((child) => {
            if (child.isMesh&&child.material.name=='Car paint') {
              child.material.map=defalutColor;
              child.material.map.colorSpace=THREE.SRGBColorSpace;
              child.material.needsUpdate = true; // 确保材质更新
            }
          });
          break;

      }
    }
  }, [hoda, carColor]);


  useEffect(()=>{
    if(hoda){
      // const  materail=new THREE.MeshPhysicalMaterial({
      //   color:'#1e90ff',
      //   toneMapped:false,
      //   emissive:'#1e90ff',
      //   emissiveIntensity:'1.1',
      //   transparent:true,
      // })
      // hoda.traverse((child) => {
      //   if (child.isMesh&&child.name.includes('车尾')) {
      //     child.material=materail;
      //   }
      // });

    }
  },[hoda])
  // useEffect(()=>{
  //   if(materials){
  //     for (const key in materials) {
  //           materials[key].envMap=baseEnvMap;
  //     }
  //   }
  // },[materials])


  return (
    <group
    // rotation={rotation}
    // position={position}
    >
      <primitive
        ref={setHoda}
        object={scene ? scene : null}
        scale={[scaleNum, scaleNum, scaleNum]}
        // rotation-y={Math.PI*0.5}
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
function MaxwellHoda({ speed, position, rotation }) {
  return (
    <Suspense>
      <Model speed={speed} rotation={rotation} position={position} />
    </Suspense>
  );
}
export default MaxwellHoda;
