/**
 * 科技展示场景
 * @returns {JSX.Element}
 * @constructor
 */
import {useFrame, useLoader, useThree} from "@react-three/fiber";


/*
 * @Author: FMC
 * @Date: 2024-09-04 22:04:29
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-08 11:35:25
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-text\maxwell-text.jsx
 * @Description:
 */
// import { Depth, LayerMaterial } from "lamina";
import {Suspense, useEffect, useMemo, useRef} from "react";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
import * as THREE from "three";
import {useTexture} from "@react-three/drei";
import MaxWellGround from "@/example/maxwell-car/maxwell-car-three/maxwell-ground/maxwell-ground.jsx";


function MaxwellCarFlow() {
    const {nodes, materials} = useLoader(
        GLTFLoader,
        "model/流.glb",
        (loader) => {
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath("draco/");
            loader.setDRACOLoader(dracoLoader);
        }
    );
    useFrame((state, delta)=>{

        if(materials&&materials['空气流材质']){
            const {map}=materials['空气流材质'];
             map.offset.y+=delta;

        }
    })

    return (
        <Suspense>
            <group>
                <mesh geometry={nodes['流'].geometry} material={materials['空气流材质']}/>
            </group>
        </Suspense>
    );
}

function MaxwellCircleWave(){
    const {scene}=useThree();
    const pointsTexture = useTexture("texture/circle_05.png");
    const innerRadius=5;
    const uTime=useRef({value:0});
    const pointsRef=useRef(null);
    // const outerRadius=2;

    const  initGeometry = () => {
        const curve = new THREE.EllipseCurve(
            0,  0,            // ax, aY
            innerRadius, innerRadius,           // xRadius, yRadius
            0,  2 * Math.PI,  // aStartAngle, aEndAngle
            false,            // aClockwise
            0                 // aRotation
        );
        let pointsPos=[];
        let singleNum=360-1;
        // const pointsPos=curve.getPoints(180);
        for(let i=0;i<5;i++){
            pointsPos=[...pointsPos,...curve.getPoints(singleNum)]
            curve.xRadius+=0.2;
            curve.yRadius+=0.2;
            // singleNum+=20;
        }
        const aIndex=pointsPos.map((item,index)=>index);
        const geometry = new THREE.BufferGeometry().setFromPoints( pointsPos);

        geometry.rotateX(Math.PI*0.5);
        geometry.translate(0,0.1,2.5);
        let geoPosList=geometry.getAttribute('position').array.slice();

        for(let i=0;i<geoPosList.length/3;i++){
            const i3=i*3;
            geoPosList[i3+1]+=Math.floor(i/360)*0.15;
        }

        const aNormals=[];
        for(let i=0;i<geoPosList.length/3;i++){
            const i3=i*3;
            aNormals[i3]=geoPosList[(i%360+360*4)*3]-geoPosList[(i%360)*3]
            aNormals[i3+1]=geoPosList[(i%360+360*4)*3+1]-geoPosList[(i%360)*3+1]
            aNormals[i3+2]=geoPosList[(i%360+360*4)*3+2]-geoPosList[(i%360)*3+2]
        }
        geometry.setAttribute('aNormal',new THREE.BufferAttribute(new Float32Array(aNormals), 3));
        geometry.setAttribute('aIndex',new THREE.BufferAttribute(new Float32Array(aIndex), 1));
        geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(geoPosList), 3));
        const pointsMaterial = new THREE.PointsMaterial({
            color:0x409eff,
            size:0.4,
            map:pointsTexture,
            alphaMap:pointsTexture,
            transparent:true,
            depthWrite:false,
            blending:THREE.AdditiveBlending,
        })
        pointsMaterial.onBeforeCompile=((shader)=>{
            shader.uniforms.uTime = uTime.current;
            shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                /* glsl */ `

            #include <common>
            attribute float aIndex;
            attribute vec3 aNormal;
            uniform float uTime;
            varying float vIndex;
            varying float vSelfIndex;
            varying float vCircleNum;
        `
            );
            shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                /* glsl */ `

                #include <begin_vertex>
                float selfIndex=mod(aIndex,360.0);
                float circleNum=(aIndex - selfIndex)/360.0;
                
                vec3 pDir=normalize(aNormal);
                float waveWidth=30.0;
                float modUtime=mod(uTime*30.0,360.0);
                float modUtimeOver=mod(uTime*30.0,(360.0+waveWidth));
//                float strength=step(modUtime,selfIndex)*step(selfIndex,modUtime+waveWidth)+step(0.0,selfIndex)*step(selfIndex,modUtime+waveWidth-360.0)*step(360.0,modUtime+waveWidth);

                    
                   
 //                float strength=
//                 smoothstep(modUtime-10.0,modUtime,selfIndex)*smoothstep(selfIndex-10.0,selfIndex,modUtime+waveWidth)*(1.0-smoothstep(360.0-10.0,360.0,modUtime+waveWidth))+
 //               smoothstep(360.0,370.0,modUtime+waveWidth)*(1.0-smoothstep(modUtime+waveWidth-360.0-10.0,modUtime+waveWidth-360.0,selfIndex));
                
                
                float strength=
                 smoothstep(modUtime-10.0,modUtime,selfIndex)*smoothstep(selfIndex-10.0,selfIndex,modUtime+waveWidth)*(1.0-smoothstep(360.0-10.0,360.0,modUtime+waveWidth))+
                smoothstep(360.0,370.0,modUtime+waveWidth)*(1.0-smoothstep(modUtime+waveWidth-360.0-10.0,modUtime+waveWidth-360.0,selfIndex));
                strength=clamp(0.0,1.0,strength);
                
                float g=(sin(selfIndex*0.1)+1.0)*0.5*(circleNum+1.0)*0.5;
                g=1.0;
         
                
                transformed.x+=pDir.x*strength*g;
                 transformed.z+=pDir.z*strength*g;
 //               transformed.y+=strength*g;
//                transformed = transformed+pDir*sin(uTime+selfIndex)*0.5;
       //         transformed *= (sin(uTime+mod(selfIndex,4.0))+1.0)*0.5;

                
                
                vIndex=aIndex;
            `
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <common>",
                /* glsl */ `

                 varying float vIndex;
                  uniform float uTime;
                #include <common>
            `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                "vec4 diffuseColor = vec4( diffuse, opacity );",
                /* glsl */ `
                vec3 whiteColor = vec3( 1.0,1.0,1.0);
                float selfIndex=mod(vIndex,360.0);
                float circleNum=(vIndex - selfIndex)/360.0;
                vec3 finalColor=mix(diffuse,whiteColor,circleNum/4.0);
                vec4 diffuseColor = vec4( finalColor, opacity );
            `
            );
        })
        const points=new THREE.Points(geometry, pointsMaterial);
        scene.add(points);
        console.log('点波被调用');
        return points;
    }
  useEffect(()=>{
      const points=initGeometry();
    return()=>{
        scene.remove(points);
    }
  },[]);
    useFrame((state, delta)=>{
        uTime.current.value+=delta;
    })

    return (
    <></>
    )
}


function MaxwellTechScene() {
    const maxWellGround = useMemo(() => <MaxWellGround />, []);
    return <>
        {/*<MaxwellCarFlow/>*/}
        {maxWellGround}
        <MaxwellCircleWave/>
    </>
}

export default MaxwellTechScene;