/*
 * @Author: FMC
 * @Date: 2024-09-01 11:50:08
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-28 19:36:41
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-hoda\maxwell-hoda.jsx
 * @Description:
 */

import {extend, useFrame, useLoader, useThree,} from "@react-three/fiber";
import {Suspense, useContext, useEffect, useMemo, useRef, useState} from "react";
import * as THREE from "three";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import LoadingMaterial from "../material/loadingMaterial/loadingMaterial";
import {useTexture} from "@react-three/drei";
import {CAR_COLOR} from "../../enum/enum";
import {MaxWellContext} from "../../context/maxwell-car-context";
import useProcessModelShaders from "@/example/maxwell-car/hooks/useProcessModelShaders.js";
import MaxwellParticleAggregation
  from "@/example/maxwell-car/maxwell-car-three/maxwell-particle-aggregation/maxwell-particle-aggregation.jsx";
import MaxwellMixEnvMap from "@/example/maxwell-car/maxwell-car-three/maxwell-mix-env-map/maxwell-mix-env-map.jsx";

extend({LoadingMaterial});

function Model({speed, rotation, position}) {
    const {carColor} = useContext(MaxWellContext);
    const scaleNum = 1;
    const state = useThree();
    const [hoda, setHoda] = useState(null);
    // const frontWheelRef = useRef(null);
    /**
     * 加载Draco模型
     */
    const {scene, nodes, materials} = useLoader(
        GLTFLoader,
        "model/汽车.glb",
        (loader) => {
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath("draco/");
            loader.setDRACOLoader(dracoLoader);
        }
    );
    const otherColor = useTexture("texture/car_base_color_tc.png");
    otherColor.format = THREE.RGBAFormat;
    otherColor.type = THREE.UnsignedByteType;
    // otherColor.colorSpace=THREE.SRGBColorSpace;
    otherColor.encoding = 3001;
    otherColor.flipY = false;

    const sliverColor = useTexture("texture/银色车漆.png");
    sliverColor.format = THREE.RGBAFormat;
    sliverColor.type = THREE.UnsignedByteType;
    // otherColor.colorSpace=THREE.SRGBColorSpace;
    sliverColor.encoding = 3001;
    sliverColor.flipY = false;


    const defalutColor = useTexture("texture/蓝色车漆.png");
    defalutColor.format = THREE.RGBAFormat;
    defalutColor.type = THREE.UnsignedByteType;
    // otherColor.colorSpace=THREE.SRGBColorSpace;
    defalutColor.encoding = 3001;
    defalutColor.flipY = false;

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

    const {registerShaderLogic} = useProcessModelShaders(hoda);
    const maxwellMixEnvMap = useMemo(() => <MaxwellMixEnvMap registerShaderLogic={registerShaderLogic}/>,
        []); // 通过 useMemo 缓存 MaxWellGround
    const maxwellParticleAggregation = useMemo(() =>{
        return <MaxwellParticleAggregation
            hoda={hoda}
            registerShaderLogic={registerShaderLogic}
        />
        },
        [hoda]);
    /**
     *
     */
    useEffect(() => {
        if (hoda) {
            switch (carColor) {
                case CAR_COLOR.OTHER:
                    hoda.traverse((child) => {
                        if (child.isMesh && child.material.name == 'Car paint') {
                            child.material.map = otherColor;
                            child.material.map.colorSpace = THREE.SRGBColorSpace;
                            child.material.needsUpdate = true; // 确保材质更新
                        }
                    });
                    break;
                case CAR_COLOR.SLIVER:
                    hoda.traverse((child) => {
                        if (child.isMesh && child.material.name == 'Car paint') {
                            child.material.map = sliverColor;
                            child.material.map.colorSpace = THREE.SRGBColorSpace;
                            child.material.needsUpdate = true; // 确保材质更新
                        }
                    });
                    break;
                default:
                    hoda.traverse((child) => {
                        if (child.isMesh && child.material.name == 'Car paint') {
                            child.material.map = defalutColor;
                            child.material.map.colorSpace = THREE.SRGBColorSpace;
                            child.material.needsUpdate = true; // 确保材质更新
                        }
                    });
                    break;

            }
        }
    }, [hoda, carColor]);


    return (
        <group
        >
            <primitive
                ref={setHoda}
                object={scene ? scene : null}
                scale={[scaleNum, scaleNum, scaleNum]}
            />
            {maxwellParticleAggregation}
            {maxwellMixEnvMap}
        </group>
    );
}

function MaxwellHoda({speed, position, rotation}) {
    return (
        <Suspense>
            <Model speed={speed} rotation={rotation} position={position}/>
        </Suspense>
    );
}

export default MaxwellHoda;
