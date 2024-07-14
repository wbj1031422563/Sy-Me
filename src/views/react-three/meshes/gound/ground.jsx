
/**
 * 地面
 *
 */
import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import vs from './shader/vs.glsl';
import fs from './shader/fs.glsl';
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
const GroundMaterial=new shaderMaterial({
  uTime: 0,
  uBigWavesSpeed: 0.5,
  uBigWavesElevation: 0.2, //海浪高度
  uBigWavesFrequency: new THREE.Vector2(4, 1.5) , //海浪频率

  uDepthColor: new THREE.Color( "#00b89f"),
  uSurfaceColor:  new THREE.Color("#3dffa1"),
  uColorOffset: { value: 0.925 },
  uColorMultiplier: { value: 1.0 },
},
  vs,
  fs
)
// GroundMaterial.wireframe=true;
// console.log('g',GroundMaterial)


extend({GroundMaterial})

function Ground() {
  const [scollerY, setScollerY] = useState(0);
  const groundMaterialRef =useRef(null);
  useEffect(() => {
    const handleWinScroll = () => {
      const scrollPosition =
        window.scrollY || document.documentElement.scrollTop;
      setScollerY(scrollPosition);
    };
    window.addEventListener("scroll", handleWinScroll);
    return () => {
      window.removeEventListener("scroll", handleWinScroll);
    };
  }, []);
  useFrame((state) => {
    const { camera,clock } = state;
    const time = clock.getElapsedTime();
    camera.position.y = (-1 * scollerY) / window.innerHeight*3;
    // console.log('state',state)
    if(groundMaterialRef.current){
      groundMaterialRef.current.uTime=time
    }
  });
  return (
    <>
      <mesh
        receiveShadow
        position-y={-0.5}
        rotation-x={-Math.PI * 0.5}
        scale={10}
      >
        <planeGeometry args={[1,1,100,100]} />
        <groundMaterial ref={groundMaterialRef} wireframe={true}/>
      </mesh>
    </>
  );
}
export default Ground;
