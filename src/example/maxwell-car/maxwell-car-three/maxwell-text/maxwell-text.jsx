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
  Text3D,
  useTexture
} from "@react-three/drei";
import { useThree,useLoader } from "@react-three/fiber";
// import { Depth, LayerMaterial } from "lamina";
import { useEffect, useRef, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import TWEEN from "@tweenjs/tween.js";
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
  const [isShow,setShow]=useState(false);
  const uProgress=useRef({
    value: 1,
  })
  const textRef = useRef(null);
  const [golwSize, setGlowSize] = useState(new THREE.Vector3(1, 1, 1));
  const [text,setText]=useState();
  const { scene, nodes} = useLoader(
    GLTFLoader,
    "model/字体.glb",
    (loader) => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("draco/");
      loader.setDRACOLoader(dracoLoader);
    }
  );
  const perlinTexture=useTexture('texture/noiseTexture.png');
  // 0显示 ，1隐藏
  // const uProgress = {
  //   value: 1,
  // }
  const uType = {
    value: 0,
  }
  useEffect(() => {
    if(!text||!textRef)return;
    const boundingBox=new THREE.Box3();
    boundingBox.setFromObject(text);
    console.log(boundingBox)
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const help=new THREE.Box3Helper(boundingBox,'#ffffff')
    scene.add(help);
    // console.log('text',text)
    const w=boundingBox.max.z-boundingBox.min.z
    const h=boundingBox.max.y-boundingBox.min.y
    // debugger
    
    // // // 4. 打印包围盒的最小点和最大点
    // console.log("大小", size);
    let opopo=0;
    const count=text.geometry.attributes.position.count;
    const posArray=text.geometry.attributes.position.array.slice();   
    const aUv=[];
    for(let i=0;i<count;i++){
        const i3=i*3;
        const i2=i*2;
        aUv[i2]=(posArray[i3+2]-boundingBox.min.z)/w;
        aUv[i2+1]=((posArray[i3+1]-boundingBox.min.y)/h)*1;
        if(aUv[i2]>1||aUv[i2+1]>1){
          opopo++;
        }
    }
    text.geometry.setAttribute(
      "aUv",
      new THREE.BufferAttribute(new Float32Array(aUv), 2)
    );
    setShow(true);
    console.log('text',aUv)
  }, [text]);
  const shaderCallback=(shader)=>{
      shader.uniforms.uProgress=uProgress.current;
      shader.uniforms.uPerlinTexture={value:perlinTexture};
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        /* glsl */ `

                #include <common>

                uniform float uProgress;
                varying vec2 vUv;
                attribute vec2 aUv;

            `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        /* glsl */ `

                #include <begin_vertex>
                vUv=aUv;

            `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        /* glsl */ `

                 varying vec2 vUv;
                 uniform float uProgress;
                 uniform sampler2D uPerlinTexture;
                #include <common>

            `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        /* glsl */ `
                
                vec4 diffuseColor = vec4( diffuse, opacity );
            `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "vec3 totalEmissiveRadiance = emissive;",
        /* glsl */ `
        vec3 totalEmissiveRadiance = emissive;
        vec2 fmcUv=clamp(vUv,0.0,1.0);
        float fmcDuration=0.4;
        float noise=texture(uPerlinTexture,vec2(fmcUv.x,fmcUv.x)).r;
        float fmcDelay=(1.0-fmcDuration)*noise;
        float fmcEnd=fmcDuration+fmcDelay;
        float fmcProgress=smoothstep(fmcDelay,fmcEnd ,uProgress );

        fmcProgress=fmcProgress*1.02-0.01;
        float strength=1.0-step(fmcUv.y,fmcProgress);
        if(strength<0.01) discard;
            `
      );
  }
  useEffect(()=>{
    let tween=null;
    if(isShow){
      tween = new TWEEN.Tween(uProgress.current).to(
        { value: 0 },
        5 * 1000
      )
    }else{
      tween = new TWEEN.Tween(uProgress.current).to(
        { value: 1 },
        5 * 1000
      );
    }
    if(tween){
      tween.start();
    } 
    return ()=>{
      if(tween){
        tween.stop();
      }
    }
  },[isShow])
  return (

    <group {...prpos} dispose={null}>
      <mesh
        ref={setText}
        geometry={nodes['文本'].geometry}
      >
        <meshPhysicalMaterial
          color={'#1e90ff'}
          toneMapped={false}
          transparent={true}
          emissive={'#1e90ff'}
          emissiveIntensity={1.3}
          onBeforeCompile={shaderCallback}
        ></meshPhysicalMaterial>
      </mesh>
    </group>
    // <Center {...prpos} center ref={textRef}>
    //   <Text3D
    //     font="/fonts/cn.json"
    //     ref={setText}
    //     size={0.75}
    //     height={0.2}
    //     curveSegments={12}
    //     bevelEnabled
    //     bevelThickness={0.05}
    //     bevelSize={0.02}
    //     bevelOffset={0}
    //     bevelSegments={5}
    //     letterSpacing={0.5}
    //   >
    //     {"MAXWELL"}
    //     {/* <meshBasicMaterial color={"red"}></meshBasicMaterial> */}
    //     {/* <meshPhysicalMaterial roughness={0} color={"#999"} emissive="green" envMapIntensity={0.2} />
    //     <Glow size={golwSize}  near={-25} color={'lightgreen'} /> */}
    //     {/* <meshMatcapMaterial matcap={matcap} /> */}
    //     {/* <Helper type={THREE.BoxHelper}></Helper> */}
    //     <meshPhysicalMaterial
    //       color={'#1e90ff'}
    //       toneMapped={false}
    //       transparent={true}
    //       emissive={'#1e90ff'}
    //       emissiveIntensity={1.3}
    //       onBeforeCompile={shaderCallback}
    //     ></meshPhysicalMaterial>
    //   </Text3D>
    //   {/* <Helper type={THREE.BoxHelper}></Helper> */}
    // </Center>
  );
}
export default MaxwellText;
