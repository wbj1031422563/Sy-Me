import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { extend, useFrame } from "@react-three/fiber";
import vertexShader from "./shader/wobble/vertexShader.vs.glsl";
import fragmentShader from "./shader/wobble/fragmentShader.fs.glsl";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { useRef } from "react";

const colorA=new THREE.Color();
colorA.setHSL(1.0,0.7)

// // 使用 CustomShaderMaterial 创建自定义材质
const WobblySphereMaterial = selfShaderMaterial(
  {
    uTime: 0,
    uPositionFrequency: 0.476,
    uTimeFrequency: 0.156,
    uStrength: 0.918,

    uPositionFrequency1: 0.427,
    uTimeFrequency1: 0.181,
    uStrength1: 1.312,

    colorA: new THREE.Color(0x11e8de),
    colorB: new THREE.Color(0x1fc751),
  },
  vertexShader,
  fragmentShader
);
// const WobblySphereMaterial =new THREE.ShaderMaterial({
//   vertexShader:vertexShader,
//   fragmentShader:fragmentShader
// })

// 将 WobblySphereMaterial 扩展为 R3F 可识别的组件
extend({ WobblySphereMaterial });

function WobblySphere(props) {
  const wobblySphereMaterialRef = useRef();
  let geometry = new THREE.IcosahedronGeometry(2.5, 50);
  geometry = mergeVertices(geometry);
  geometry.computeTangents();

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    // 获取的自定义材质的实例，并更新它的uniforms值
    wobblySphereMaterialRef.current.uTime = time;
  });

  return (
    <>
      <mesh scale={[0.25, 0.25, 0.25]} position-y={0.5} geometry={geometry}>
        {/* 使用自定义的 WobblySphereMaterial */}
        <wobblySphereMaterial ref={wobblySphereMaterialRef} />
      </mesh>
    </>
  );
}

export default WobblySphere;

function selfShaderMaterial(uniforms, vertexShader, fragmentShader, onInit) {
  const material = class material extends CustomShaderMaterial {
    constructor(parameters = {}) {
      const entries = Object.entries(uniforms);
      // Create unforms and shaders
      super({
        uniforms: entries.reduce((acc, [name, value]) => {
          const uniform = THREE.UniformsUtils.clone({
            [name]: {
              value,
            },
          });
          return {
            ...acc,
            ...uniform,
          };
        }, {}),
        vertexShader,
        fragmentShader,
        baseMaterial: THREE.MeshPhysicalMaterial,

        color: 0xffffff,
        metalness: 0,
        ior: 1.5,
        thickness: 1.5,
        transparent: true,
        wireframe: false,
        roughness: 0.5,
        transmission: 0,
      });
      // Create getter/setters
      this.key = "";
      entries.forEach(([name]) =>
        Object.defineProperty(this, name, {
          get: () => this.uniforms[name].value,
          set: (v) => (this.uniforms[name].value = v),
        })
      );

      // Assign parameters, this might include uniforms
      Object.assign(this, parameters);
      // Call onInit
      if (onInit) onInit(this);
    }
  };
  material.key = THREE.MathUtils.generateUUID();
  return material;
}

// export { shaderMaterial };
