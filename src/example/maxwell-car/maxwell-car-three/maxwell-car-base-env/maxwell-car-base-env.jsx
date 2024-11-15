/*
 * @Author: FMC
 * @Date: 2024-06-23 09:58:48
 * @LastEditors: FMC
 * @LastEditTime: 2024-09-27 22:13:22
 * @FilePath: \fmc-personal-blog\src\example\maxwell-car\maxwell-car-three\maxwell-car-base-env\maxwell-car-base-env.jsx
 * @Description:基础环境
 */
import {Environment, OrbitControls} from "@react-three/drei";
import {useFrame, useThree} from "@react-three/fiber";
import TWEEN from "@tweenjs/tween.js";
import {useContext, useEffect, useRef} from "react";
import * as THREE from "three";
import {MaxWellContext} from "@/example/maxwell-car/context/maxwell-car-context.js";
import {CAR_SCENE_TYPE} from "@/example/maxwell-car/enum/enum.js";

function MaxWellCarBaeEnv() {

    const controls = useRef(null);
    const geo = new THREE.BoxGeometry();
    geo.translate(0, 2, 0);
    const r = useRef(null);
    const { sceneType } = useContext(MaxWellContext);
    const state = useThree();
    useFrame((state) => {
        const {camera} = state;
        TWEEN.update();
        // console.log('stsjhakj',clock.getDelta())
        // console.log("camera", camera);
        // // const { target, matrix } = camera;
        // console.log("target", controls.current.target);
        // console.log("matrix", matrix);
    });
    useEffect(() => {
        const {camera} = state;
        if (controls.current) {
            if (sceneType === CAR_SCENE_TYPE.SHOWROOM) {
                camera.position.set(-13.29, 2.59, 2.98);
                controls.current.target = new THREE.Vector3(0.86, 1.36, 2.019);
            }
        }
    }, []);




    return (
        <>
            {/* <Perf position="top-left"/> */}
            {/* <OrbitControls
        ref={controls}
        makeDefault={true}
        maxZoom={5.0}
        enablePan={false}
        maxDistance={10}
        minDistance={1.0}
        minAzimuthAngle={-Math.PI * 0.5}
        maxAzimuthAngle={Math.PI * 0.5}
        minPolarAngle={-Math.PI * 0.5}
        maxPolarAngle={Math.PI * 0.5}
      /> */}
            {/* <group ref={r}>
        <mesh geometry={geo}>
          <meshBasicMaterial color={"red"}></meshBasicMaterial>
        </mesh>
      </group> */}
            <OrbitControls ref={controls} makeDefault={true}/>
            {/* <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.2} maxPolarAngle={Math.PI / 2.2} /> */}
            {/* <Environment files="/envMap/venice_sunset_1k.hdr"></Environment> */}
            {/*{sceneType===CAR_SCENE_TYPE.ROAD&&(*/}
            {/*    <Environment files="/envMap/fusion_1K_9097b102-cdb4-427a-a0a8-38aff39f6b6b.exr"*/}
            {/*                 background={false} >*/}
            {/*    </Environment>*/}
            {/*)}*/}
            <Environment files="/envMap/abstract-lighting-ray-room-style-01_2K_f478fdd1-243a-4cc8-b454-0f522f1afb6b.exr"
                         background={false} >
            </Environment>

        </>
    );
}

export default MaxWellCarBaeEnv;
