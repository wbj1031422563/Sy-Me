/**
 * 科技展示场景
 * @returns {JSX.Element}
 * @constructor
 */
import { extend, useFrame, useLoader, useThree } from "@react-three/fiber";


/*
 * @Author: FMC
 * @Date: 2024-09-04 22:04:29
 * @LastEditors: FMC
 * @LastEditTime: 2024-11-19 22:21:17
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-tech-scene\maxwell-tech-scene.jsx
 * @Description:
 */
// import { Depth, LayerMaterial } from "lamina";
import MaxWellGround from "@/example/maxwell-car/maxwell-car-three/maxwell-ground/maxwell-ground.jsx";
import { useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import radaMaterailFs from './shader/rada.fs.glsl';
import radaMaterailVs from './shader/rada.vs.glsl';

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
    const perlinTexture=useTexture('texture/noiseTexture.png');
    const innerRadius=8;
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
        let singleNum=720-1;
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
            geoPosList[i3+1]+=Math.floor(i/720)*0.15;
        }

        const aNormals=[];
        for(let i=0;i<geoPosList.length/3;i++){
            const i3=i*3;
            aNormals[i3]=geoPosList[(i%720+720*4)*3]-geoPosList[(i%720)*3]
            aNormals[i3+1]=geoPosList[(i%720+720*4)*3+1]-geoPosList[(i%720)*3+1]
            aNormals[i3+2]=geoPosList[(i%720+720*4)*3+2]-geoPosList[(i%720)*3+2]
        }
        geometry.setAttribute('aNormal',new THREE.BufferAttribute(new Float32Array(aNormals), 3));
        geometry.setAttribute('aIndex',new THREE.BufferAttribute(new Float32Array(aIndex), 1));
        geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(geoPosList), 3));
        const pointsMaterial = new THREE.PointsMaterial({
            color:0x409eff,
            size:0.5,
            map:pointsTexture,
            alphaMap:pointsTexture,
            transparent:true,
            depthWrite:false,

            blending:THREE.AdditiveBlending,
        })
        pointsMaterial.onBeforeCompile=((shader)=>{
            shader.uniforms.uTime = uTime.current;
            shader.uniforms.uPerlinTexture={value:perlinTexture};
            shader.uniforms.baseColor1={value:new THREE.Color(0x90EE90)};
            shader.uniforms.baseColor2={value:new THREE.Color(0xFFA500)};
            shader.uniforms.baseColor3={value:new THREE.Color(0x9B30FF)};
            shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                /* glsl */ `

            #include <common>
            attribute float aIndex;
            attribute vec3 aNormal;
            uniform float uTime;
            uniform sampler2D uPerlinTexture;
            varying float vIndex;
            varying float vSelfIndex;
            varying float vCircleNum;
            
            float getStrength(float aIndex,float uTime,vec3 aNormal){
                    float selfIndex = mod(aIndex, 720.0);      // 计算每个点在圆环上的位置索引
                    float circleNum = (aIndex - selfIndex) / 720.0; // 计算点所在的“圈号”，但此值目前未使用
                
                    vec3 pDir = normalize(aNormal);            // 获取法线方向，后续将用其调整偏移方向
                    float waveWidth = 90.0;                    // 波动效果的宽度
                    float totalLength = 720.0;                 // 圆的总长度（720度）
                    float modUtime = mod(uTime * 50.0, 720.0); // 时间的循环，乘以 30.0 是加速效果
                    float dw = waveWidth*0.5;              // 平滑过渡的宽度，控制波动的范围
                
                    // 计算波动强度
                    // 对首尾连接部分（0 和 720）进行平滑过渡处理
                    float smoothStart = smoothstep(modUtime , modUtime+dw, selfIndex);
                    float smoothEnd = 1.0-smoothstep(modUtime+waveWidth - dw,modUtime+waveWidth, selfIndex);
                    
                    // 创建平滑连接：确保波动在 [720 - dw, 720 + waveWidth] 和 [0, dw] 区间内平滑过渡
                    float strength = min(smoothStart,smoothEnd);
                    
                    
                    float isOver=step(720.0,modUtime+waveWidth);
                    float over=(modUtime+waveWidth-720.0);
                    float isOverStep1=(1.0-step(dw,over))*isOver;
                    float isOverStep2=step(dw,over);
                    
                    float overStep1Left=min(smoothstep(modUtime,modUtime+dw,selfIndex),(1.0-smoothstep(modUtime+waveWidth - dw,modUtime+waveWidth, selfIndex)));
                    float overStep1Right=1.0-smoothstep(modUtime+waveWidth - dw,modUtime+waveWidth, selfIndex+720.0);
                    float overStep1=max(overStep1Left,overStep1Right);
                    
                    float overStep2Left=smoothstep(modUtime,modUtime+dw,selfIndex);
                    float overStep2Right=min(smoothstep(modUtime,modUtime+dw,selfIndex+720.0),(1.0-smoothstep(modUtime+waveWidth - dw,modUtime+waveWidth, selfIndex+720.0)));
                    float overStep2=max(overStep2Left,overStep2Right);
                    
                    float os=isOverStep1*overStep1+overStep2*isOverStep2;


 
                    
                    
     
                    strength=(1.0-isOver)*strength+isOver*os;
                    return strength;
            }
        `
            );
            shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                /* glsl */ `

                   #include <begin_vertex>
                       float selfIndex = mod(aIndex, 720.0);
                     float circleNum = (aIndex - selfIndex) / 720.0;
                    vec3 pDir = normalize(aNormal);  

                
                    float noise=texture(uPerlinTexture,vec2((selfIndex/720.0),mod(uTime*0.1,1.0))).r;
                
               
                    float strength=getStrength(aIndex,uTime,aNormal);
                        strength+=getStrength(aIndex,uTime+10.0+noise,aNormal);
                        strength+=getStrength(aIndex,uTime+20.0+noise,aNormal);
                        strength+=getStrength(aIndex,uTime+30.0+noise,aNormal);
                        strength+=getStrength(aIndex,uTime+40.0+noise,aNormal);                        
                        strength+=getStrength(aIndex,uTime+50.0+noise,aNormal); 
                        strength+=getStrength(aIndex,uTime+60.0+noise,aNormal); 
                        strength+=getStrength(aIndex,uTime+70.0+noise,aNormal);  
                        strength+=getStrength(aIndex,uTime+80.0+noise,aNormal);
                        strength+=getStrength(aIndex,uTime+90.0+noise,aNormal);                         


                                     // 偏移的强度因子，当前没有动态变化
                
                    // 基于法线方向和波动强度偏移点的 x 和 z 坐标
                    transformed.x += pDir.x * strength*0.5;
                    transformed.z += pDir.z* strength*0.5;
                     transformed.y += strength*circleNum*noise*0.6 ;
                    //transformed.y +=strength * circleNum*0.08;
                    
                
                    vIndex = aIndex;                          // 将索引传递给片段着色器（或者用于调试）
            `
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <common>",
                /* glsl */ `

                 varying float vIndex;
                 
                  uniform float uTime;
                  uniform vec3 baseColor1;
                  uniform sampler2D uPerlinTexture;
                  uniform vec3 baseColor2;
                  uniform vec3 baseColor3;
                #include <common>
            `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                "vec4 diffuseColor = vec4( diffuse, opacity );",
                /* glsl */ `
                vec3 whiteColor = vec3( 1.0,1.0,1.0);
                float selfIndex=mod(vIndex,720.0);
                float circleNum=(vIndex - selfIndex)/720.0;
                //float nuo=mod(uTime*0.2,1.0);
                vec3  baseColor=mix(baseColor1,baseColor2,mod(uTime*0.1,1.0));
                 baseColor=mix(baseColor,baseColor3,mod(uTime*0.2,1.0));
                vec3 finalColor=mix(baseColor,diffuse,circleNum/5.0);
                finalColor*=1.0;
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

// const RadaMaterail=shaderMaterial({
    // uSpeed: { value: props.speed },
    // uRadius: { value: props.radius },
    // uTime: timeDelta,
    // uFollowWidth: { value: props.followWidth },
    // ncolor: { value: new Color(props.color) },
// },
// radaMaterailVs,
// radaMaterailFs,
// )
class RadaMaterail extends THREE.ShaderMaterial {
    constructor(props) {
      super({
        uniforms: {
            uSpeed: { value: props.speed },
            uRadius: { value: props.radius },
            uTime: {value:0},
            uFollowWidth: { value: props.followWidth },
            ncolor: { value: new THREE.Color(props.color) },
        },
        // wireframe:true,
        // transparent: true,
        // blending: THREE.AdditiveBlending,
        // depthWrite: true,
        // side: THREE.DoubleSide,
        // depthTest: true,
        vertexShader:radaMaterailVs,
        fragmentShader:radaMaterailFs
      });
    }
  }
extend({RadaMaterail})

function MaxwellRaDa(){
    const [rada, setRada] = useState(null);
    const uTime=useRef({value:0});
    /**
     * 加载Draco模型
     */
    const { scene, nodes, materials } = useLoader(
        GLTFLoader,
        "model/low_poly_cars_pack.glb",
        (loader) => {
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath("draco/");
            loader.setDRACOLoader(dracoLoader);
        }
    );
    useEffect(()=>{
        if(rada){
            const props={
                position: [0, 0, 0],
                radius: 240,
                size: 300,
                color: 0x409eff,
                opacity: 0.9,
                speed: 300,
                followWidth: 220, //扇面大小
            }
            // rada.material=material;
        }
    },[rada]);
    // useFrame((state, delta)=>{
    //     if(rada&& rada.material.uniforms.uTime){
    //         const a=rada.material.uniforms.uTime;
    //         a.value+=delta;
    //     }
    // })
    const test=(shader)=>{
        const props={
            position: [0, 0, 0],
            radius: 3*0.99,
            size: 3,
            color: 0x409eff,
            opacity: 0.9,
            speed: 110,
            followWidth: 90, //扇面大小
        }
        shader.uniforms.uTime = uTime.current;
        shader.uniforms.uSpeed={value:props.speed};
        shader.uniforms.uRadius={value:props.radius};
        shader.uniforms.uFollowWidth={value:props.followWidth};
        shader.uniforms.ncolor={value:new THREE.Color(props.color)};

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
                vPosition = position; 
        `
        );
        shader.fragmentShader = shader.fragmentShader.replace(
            "#include <common>",
            /* glsl */ `
            uniform float uRadius;     
            uniform float uTime;            
            uniform float uSpeed; 
            uniform float uFollowWidth; 
            varying vec3 vPosition;
            uniform vec3 ncolor;
            float calcAngle(vec3 oFrag){
                float fragAngle;
                const vec3 ox = vec3(1,0,0);
                float dianji = oFrag.x * ox.x + oFrag.z*ox.z;
                float oFrag_length = length(oFrag); // length是内置函数
                float ox_length = length(ox); // length是内置函数
                float yuxian = dianji / (oFrag_length * ox_length);
                fragAngle = acos(yuxian);
                fragAngle = degrees(fragAngle);
                if(oFrag.z > 0.0) {
                fragAngle = -fragAngle + 360.0;
                }
                float scanAngle = uTime * uSpeed - floor(uTime * uSpeed / 360.0) * 360.0;
                float angle = scanAngle - fragAngle;
                if(angle < 0.0){
                angle = angle + 360.0;
                }
                return angle;
            }
            #include <common>
        `
        );
        shader.fragmentShader = shader.fragmentShader.replace(
            "vec4 diffuseColor = vec4( diffuse, opacity );",
            /* glsl */ `
            vec4 finalColor=vec4(0.0,0.0,0.0,1.0);
        if(length(vPosition) == 0.0 || length(vPosition) > uRadius){
			finalColor = vec4( ncolor, 1.0);
		} else {
			float angle = calcAngle(vPosition);
			if(angle < uFollowWidth){
				// 尾焰区域
				float opacity1 =  1.0 - angle / uFollowWidth; 
				finalColor = vec4( ncolor, 1.0 * opacity1 );  
			} else {
				// 其他位置的像素均为透明
				finalColor = vec4( ncolor, 0.0 ); 
			}
		}
            float angle = calcAngle(vPosition);
            //vec4 diffuseColor =vec4((angle/360.0),0.0,0.0,1.0);
            vec4 diffuseColor =finalColor;
        `
        );
    }
    useFrame((state,delta)=>{
        if(rada){
            uTime.current.value+=delta;
        }
    })
    return (
        <>
            <group
            >
                <primitive
                    ref={setRada}
                    object={scene ? scene : null}
                />
            </group>
            <mesh ref={setRada} position-y={0.2} rotation-x={Math.PI*0.5} scale={[3.0,3.0,3.0]} rotation-z={Math.PI*0.5}>
                <circleGeometry args={[3,1000]}></circleGeometry>
                <meshBasicMaterial  
                transparent={true} 
                 blending={THREE.AdditiveBlending} 
                 side={THREE.DoubleSide}
                 depthTest={true}
                 depthWrite={false}
                 onBeforeCompile={test}></meshBasicMaterial>
            </mesh>
        </>
    )
}

function MaxwellTechScene() {
    const maxWellGround = useMemo(() => <MaxWellGround/>, []);
    return <>
        {/*<MaxwellCarFlow/>*/}
        {maxWellGround}
        {/*<MaxwellCircleWave/>*/}
        {<MaxwellRaDa/>}
    </>
}

export default MaxwellTechScene;