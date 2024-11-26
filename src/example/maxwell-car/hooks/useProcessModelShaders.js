import { useEffect, useState } from "react";
import * as THREE from "three";
const useProcessModelShaders = (model) => {
    const [shaderLogicQueue, setShaderLogicQueue] = useState([]);

    const registerShaderLogic = (applyShaderLogic) => {
        if(shaderLogicQueue.every(fn => fn.toString()!==applyShaderLogic.toString())){
            setShaderLogicQueue((prevQueue) => [...prevQueue, applyShaderLogic]);
        }
    };

    useEffect(() => {
        if (!model||shaderLogicQueue.length===0) return;
        // console.log('applyShaderLogic')
        model.traverse((item) => {
            if (item instanceof THREE.Mesh && item.material) {
                item.material.transparent = true;
                // console.log('applyShaderLogic')
                item.material.needsUpdate = true;
                // 合并所有逻辑到一个 onBeforeCompile
                item.material.onBeforeCompile = (shader) => {
                    // console.log('applyShaderLogic')
                    shaderLogicQueue.forEach((applyShaderLogic,index) => {
                        applyShaderLogic(shader, item.material);
                    });
                };
            }
        });
    }, [model,shaderLogicQueue]);

    return { registerShaderLogic };
};

export default useProcessModelShaders;
