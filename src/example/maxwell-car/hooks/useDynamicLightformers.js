import {useCubeCamera, useEnvironment} from "@react-three/drei";
import {useFrame} from "@react-three/fiber";
import * as THREE from "three";




function useDynamicLightformers() {
    const baseEnvMap=useEnvironment(
        {files:'/envMap/abstract-lighting-ray-room-style-01_2K_f478fdd1-243a-4cc8-b454-0f522f1afb6b.exr'}
    )
    const cubeCamera = useCubeCamera(1, 1000, 256);
    cubeCamera.camera.layers.set(1);
    const dynamicEnvMap=cubeCamera.camera.renderTarget.texture;




    useFrame(() => {
        cubeCamera.update();
    });

    return {dynamicEnvMap,baseEnvMap}; // 返回纹理
}

export default useDynamicLightformers;