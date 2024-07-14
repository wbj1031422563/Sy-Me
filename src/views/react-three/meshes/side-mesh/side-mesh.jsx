import { Float } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

function SideMesh() {
  const a1 = useRef();
  const a2 = useRef();
  const a3 = useRef();
  const a5 = useRef();
  const a4 = useRef();
  const a6 = useRef();
  useFrame((state,delta)=>{
    if(a1.current){
      a1.current.rotation.y+=0.45*delta;
      a2.current.rotation.y-=0.35*delta;
      a3.current.rotation.x+=0.5*delta;
      a4.current.rotation.z-=0.25*delta;
      a5.current.rotation.y+=0.35*delta;
      a6.current.rotation.x+=0.65*delta;
    }
    
  })

  return (
    <>
      <group position-y={-2.0}>
        <Float>
          <mesh
            ref={a1}
            scale={[0.015, 0.015, 0.015]}
            position={[getRaodmX(), -1.8, 0]}
          >
            <torusKnotGeometry args={[10, 3, 100, 16]} />
            <meshBasicMaterial wireframe={true} color={"#006658"} />
          </mesh>
        </Float>

        <Float>
          <mesh ref={a2} scale={[0.3, 0.3, 0.3]} position={[getRaodmX(), 0, 0]}>
            <tetrahedronGeometry />
            <meshBasicMaterial wireframe={true} color={"#006658"} />
          </mesh>
        </Float>
        <Float>
          <mesh
            ref={a3}
            scale={[0.3, 0.3, 0.3]}
            rotation={[Math.PI * 0.25, Math.PI * 0.25, 0]}
            position={[getRaodmX(), -1.0, 0]}
          >
            <boxGeometry />
            <meshBasicMaterial wireframe={true} color={"#006658"} />
          </mesh>
        </Float>
        <Float>
          <mesh
            ref={a4}
            scale={[0.5, 0.5, 0.5]}
            rotation={[Math.PI * 0.25, Math.PI * 0.25, 0]}
            position={[getRaodmX(), -1.0 + 0.25, 0]}
          >
            <coneGeometry args={[0.5, 1.5, 6, 1]} />
            <meshBasicMaterial wireframe={true} color={"#006658"} />
          </mesh>
        </Float>
        <Float>
          <mesh
            ref={a5}
            scale={[0.3, 0.3, 0.3]}
            rotation={[Math.PI * 0.25, Math.PI * 0.25, 0]}
            position={[getRaodmX(), -1.76, 0]}
          >
            <boxGeometry />
            <meshBasicMaterial wireframe={true} color={"#006658"} />
          </mesh>
        </Float>
        <Float>
          <mesh
            ref={a6}
            scale={[0.3, 0.3, 0.3]}
            rotation={[Math.PI * 0.25, Math.PI * 0.25, 0]}
            position={[getRaodmX(), -1.65, 0]}
          >
            <boxGeometry />
            <meshBasicMaterial wireframe={true} color={"#006658"} />
          </mesh>
        </Float>
      </group>
    </>
  );
}
export default SideMesh;

function getRaodmX() {
  const flag = Math.random() < 0.5 ? -1 : 1;
  return flag * getRandomBetween(1.8, 2.5);
}

function getRandomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
