import {useCubeCamera} from "@react-three/drei";
import {useFrame} from "@react-three/fiber";

function useDynamicLightformers(){
    const cubeCamera = useCubeCamera(1, 1000, 256); // 创建立方体相机
    cubeCamera.camera.layers.set(1);

    useFrame(() => {
        cubeCamera.update();
    });

    return {texture: cubeCamera.camera.renderTarget.texture }; // 返回纹理
}
export  default useDynamicLightformers;