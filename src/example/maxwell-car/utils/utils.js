import * as THREE from "three";


/**
 * 计算模型尺寸
 * @param {*} model 
 * @returns 
 */
export const computeModelSize=(model)=>{
    const boundingBox = new THREE.Box3();

    model.traverse((item) => {
        if(item.isMesh){
            
            const itemBoundingBox = new THREE.Box3().setFromObject(item);
            boundingBox.union(itemBoundingBox);
        }
    });

    return boundingBox;
}