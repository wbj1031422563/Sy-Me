/*
 * @Author: FMC
 * @Date: 2024-09-08 10:36:40
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-08 16:52:48
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-test\maxwell-test.jsx
 * @Description:
 */
import { extend } from "@react-three/fiber";
import TWEEN from "@tweenjs/tween.js";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler";
import fs from "./shader/carLaodingMaterial.fs.glsl";
import vs from "./shader/carLaodingMaterial.vs.glsl";
class CarLaodingMaterial extends CustomShaderMaterial {
  constructor() {
    super({
      baseMaterial: THREE.MeshStandardMaterial,
      color: "red",
      uniforms: {
        uProgress: { value: 0 },
        uXlen: { value: 0 },
        uOffsetX: { value: 0 },
      },
      transparent: true,
      fragmentShader: fs,
      vertexShader: vs,
    });
  }
}
extend({ CarLaodingMaterial });

function MaxWellTest() {
  const [vertices, setVertices] = useState([]);
  const count = 4000;
  const geomRef = useRef();
  const meshRef = useRef();
  useEffect(() => {
    if (geomRef.current) {
      const sampler = new MeshSurfaceSampler(geomRef.current).build();
      const tempPos = new THREE.Vector3();
      const tempObject = new THREE.Object3D();
      const list = [];
      for (let i = 0; i < count; i++) {
        sampler.sample(tempPos);
        tempObject.position.set(tempPos.x, tempPos.y, tempPos.z);
        list.push(new THREE.Vector3(tempPos.x, tempPos.y, tempPos.z));
        tempObject.position.z = 9999;
        tempObject.scale.setScalar(Math.random() * 0.5 + 0.5);
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      setVertices(list);
    }
  }, []);
  useEffect(() => {
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    box.setFromObject(geomRef.current);
    box.getSize(size);
    geomRef.current.material.uniforms.uXlen.value = size.x;
    geomRef.current.material.uniforms.uOffsetX.value = box.min.x;

    const tween = new TWEEN.Tween({ value: 0 })
      .to({ value: 1 }, 4 * 1000)
      .onUpdate(({ value }) => {
        for (let index = 0; index < count; index++) {
          const pos = new THREE.Vector3();
          let mat4 = new THREE.Matrix4();
          meshRef.current.getMatrixAt(index, mat4);
          pos.setFromMatrixPosition(mat4);
          const xRadio = Math.abs(pos.x - box.min.x) / size.x;
          if (xRadio >value&& xRadio < value +0.2) {
            mat4.setPosition(vertices[index]);
            // console.log("xRadio", xRadio);
          } else {
            mat4.setPosition(
              new THREE.Vector3(vertices[index].x, vertices[index].y, 9999)
            );
          }
          meshRef.current.setMatrixAt(index, mat4);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;

        geomRef.current.material.uniforms.uProgress.value = value;
      });
    tween.start();
    return () => {
      tween.stop();
    };
  }, [vertices]);
  return (
    <>
      <group position={[0, 1, 0]}>
        <mesh ref={geomRef}>
          <torusKnotGeometry></torusKnotGeometry>
          <carLaodingMaterial color={"red"}></carLaodingMaterial>
        </mesh>
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
          <sphereGeometry args={[0.05, 6, 6]}></sphereGeometry>
          <meshStandardMaterial color={"blue"}></meshStandardMaterial>
        </instancedMesh>
      </group>
    </>
  );
}
export default MaxWellTest;
