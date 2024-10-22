/*
 * @Author: FMC
 * @Date: 2024-09-04 22:04:29
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-08 11:35:25
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-text\maxwell-text.jsx
 * @Description:
 */
import {
  Billboard,
  Center,
  Text3D
} from "@react-three/drei";
// import { Depth, LayerMaterial } from "lamina";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// const Glow = ({
//   color,
//   scale = 1.5,
//   size = new THREE.Vector3(1, 1, 1),
//   near = -2,
//   far = 1.4,
// }) => {
//   return (
//     <Billboard>
//       <mesh>
//         <circleGeometry args={[2 * scale, 16]} />
//         {/* <boxGeometry args={[2 * scale,2 * scale,2 * scale]}/> */}
//         <LayerMaterial
//           transparent
//           depthWrite={false}
//           blending={THREE.CustomBlending}
//           blendEquation={THREE.AddEquation}
//           blendSrc={THREE.SrcAlphaFactor}
//           blendDst={THREE.DstAlphaFactor}
//         >
//           <Depth
//             colorA={color}
//             colorB="black"
//             alpha={1}
//             mode="normal"
//             near={near * scale}
//             far={far * scale}
//             origin={[0, 0, 0]}
//           />
//           <Depth
//             colorA={color}
//             colorB="black"
//             alpha={0.5}
//             mode="add"
//             near={-40 * scale}
//             far={far * 1.2 * scale}
//             origin={[0, 0, 0]}
//           />
//           <Depth
//             colorA={color}
//             colorB="black"
//             alpha={1}
//             mode="add"
//             near={-15 * scale}
//             far={far * 0.7 * scale}
//             origin={[0, 0, 0]}
//           />
//           <Depth
//             colorA={color}
//             colorB="black"
//             alpha={1}
//             mode="add"
//             near={-10 * scale}
//             far={far * 0.68 * scale}
//             origin={[0, 0, 0]}
//           />
//         </LayerMaterial>
//       </mesh>
//     </Billboard>
//   );
// };

function MaxwellText(prpos) {
  const textRef = useRef(null);
  const [golwSize, setGlowSize] = useState(new THREE.Vector3(1, 1, 1));

  useEffect(() => {
    const boundingBox = new THREE.Box3(); // 3. 计算该网格对象的包围盒
    boundingBox.setFromObject(textRef.current);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    // 4. 打印包围盒的最小点和最大点
    console.log("大小", size);
    setGlowSize(size);
  }, []);
  return (
    <Center {...prpos} center ref={textRef}>
      <Text3D
        font="/fonts/cn.json"
        size={0.75}
        height={0.2}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.05}
        bevelSize={0.02}
        bevelOffset={0}
        bevelSegments={5}
        letterSpacing={0.2}
      >
        {"MAXWELL"}
        {/* <meshBasicMaterial color={"red"}></meshBasicMaterial> */}
        {/* <meshPhysicalMaterial roughness={0} color={"#999"} emissive="green" envMapIntensity={0.2} />
        <Glow size={golwSize}  near={-25} color={'lightgreen'} /> */}
        {/* <meshMatcapMaterial matcap={matcap} /> */}
        {/* <Helper type={THREE.BoxHelper}></Helper> */}
        <meshPhysicalMaterial
          color={'#4a884f'}
          toneMapped={false}
          emissive={'#4a884f'}
          emissiveIntensity={2.6}
        ></meshPhysicalMaterial>
      </Text3D>
      {/* <Helper type={THREE.BoxHelper}></Helper> */}
    </Center>
  );
}
export default MaxwellText;
