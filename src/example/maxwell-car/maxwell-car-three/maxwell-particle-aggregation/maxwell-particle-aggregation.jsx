/*
* 粒子聚合动画
* */
import * as THREE from "three";
import {useTexture} from "@react-three/drei";
import {useEffect, useState} from "react";
import {computeModelSize} from "@/example/maxwell-car/utils/utils.js";
import TWEEN from "@tweenjs/tween.js";
import {useThree} from "@react-three/fiber";
const loadTexture=new THREE.TextureLoader();
const pointsTexture=loadTexture.load("texture/粒子.png");


function MaxWellParticleAggregation({hoda,registerShaderLogic}){
    const [isInit, setIsInit] = useState(false);
    const {scene}=useThree();
    const pointTransitionTime = {
            value: 0,
        },
        initialModelTransitionTime = {
            value: NaN,
        },
        targetModelTransitionTime = {
            value: NaN,
        };
    // const pointsTexture = useTexture("texture/粒子.png");
    /**
     * 创建粒子材质
     */
    const createPointsMaterial = (box3) => {
        const initialModelMaxValue = box3.max.y;
        const initialModelMinValue = box3.min.y;
        const material = new THREE.PointsMaterial();
        material.size = 0.25;
        material.color.set(0x409eff);
        material.map = pointsTexture;
        material.alphaMap = pointsTexture;
        material.transparent = true;
        material.depthWrite = false;
        material.blending = THREE.AdditiveBlending;
        material.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = pointTransitionTime;
            shader.uniforms.uInitialModelTransitionTime = initialModelTransitionTime;
            shader.uniforms.uTargetModelTransitionTime = targetModelTransitionTime;

            shader.uniforms.uHeight = {
                value: initialModelMaxValue - initialModelMinValue,
            };
            shader.uniforms.uOffset = {
                value: initialModelMinValue,
            };

            shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                /* glsl */ `

            #include <common>

            attribute vec3 aPosition;

            uniform float uTime;
            uniform float uInitialModelTransitionTime;
            uniform float uTargetModelTransitionTime;

            uniform float uHeight;
            uniform float uOffset;

        `
            );
            shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                /* glsl */ `

            #include <begin_vertex>

            float time = uTime - (transformed.y - uOffset) / (uHeight + 0.016 - 0.065);

            if (time > 0.0 && time < 1.0) {
                vec3 direction = aPosition - transformed;
                transformed = transformed + direction * time;
            } else if (time >= 1.0) {
                transformed = aPosition;
            }


        `
            );
            shader.vertexShader = shader.vertexShader.replace(
                "#include <fog_vertex>",
                /* glsl */ `

            #include <fog_vertex>

            vec3 positionNormalize = normalize(aPosition);

            float angle = acos(dot(positionNormalize, vec3(1.0, 0.0, 0.0)));

            float strength = sin(angle * 10.0) / 2.0;

            if (transformed.y > uInitialModelTransitionTime && transformed == position) {
                gl_PointSize = 0.0;
            } else if (aPosition.y > uTargetModelTransitionTime + strength) {
                gl_PointSize = 0.0;
            }                        

        `
            );
        };
        return material;
    };
    /**
     * 列表长度对齐
     */
    const listLengthAlignment = (...list) => {
        let maxLength = 0;

        list.forEach((item) => {
            maxLength = item.length > maxLength ? item.length : maxLength;
        });

        list.forEach((item, index) => {
            let alignmentList = [];

            const count = Math.floor(maxLength / item.length),
                remainder = maxLength % item.length;

            for (let i = 0; i < count; i++) {
                alignmentList = alignmentList.concat(item);
            }

            alignmentList = alignmentList.concat(item.slice(0, remainder));

            list[index] = alignmentList;
        });
        return list;
    };
    /**
     * 组装顶点数据
     */
    const assembleVertexData = (
        object,
        offsetVector = new THREE.Vector3(0, 0, 0),
        scaleVector = new THREE.Vector3(1.0, 1.0, 1.0)
    ) => {
        const vertexList = [];
        object.traverse((item) => {
            if (item instanceof THREE.Mesh && item.geometry) {
                // item.updateMatrixWorld();

                // const geometry = new THREE.BufferGeometry();
                // console.log('offsetVector', offsetVector)
                // console.log('old array', item.geometry.attributes.position.array)
                const array = item.geometry.attributes.position.array.slice();
                for (let i = 0; i < array.length / 3; i++) {
                    const i3 = i * 3;

                    array[i3] = array[i3] * scaleVector.x;
                    array[i3 + 1] = array[i3 + 1] * scaleVector.y;
                    array[i3 + 2] = array[i3 + 2] * scaleVector.z;

                    array[i3] = array[i3] + offsetVector.x;
                    array[i3 + 1] = array[i3 + 1] + offsetVector.y;
                    array[i3 + 2] = array[i3 + 2] + offsetVector.z;
                }
                array.forEach((item2) => {
                    vertexList.push(item2);
                });
            }
        });
        return vertexList;
    };


    useEffect(() => {
        if (hoda&&!isInit) {
            // setTimeout(() => {
            //   // disposeTargetModelMaterial(hoda);

            //   // console.log('targetVertexList', targetVertexList)
            // }, 100)
            const offset = new THREE.Vector3(0, 1.5, 0);
            const scale = new THREE.Vector3(1.2, 1.2, 1.2);

            const targetBox3 = computeModelSize(hoda);
            let sourceBox3 = targetBox3.clone();
            sourceBox3.expandByVector(scale);
            sourceBox3.translate(offset);

            const targetSize = new THREE.Vector3();
            targetBox3.getSize(targetSize);
            const planeGeometry = new THREE.PlaneGeometry(
                targetSize.x,
                targetSize.z,
                100,
                100
            );
            planeGeometry.rotateX(Math.PI * 0.5);
            planeGeometry.translate(0, 1.5, 1.5);
            planeGeometry.scale(1.2, 1.2, 1.2);
            const posArray = planeGeometry.attributes.position.array.slice();
            const uvArray = planeGeometry.attributes.uv.array.slice();
            const offsetHight = 1.2;
            const pp = 2;
            for (let i = 0; i < posArray.length / 3; i++) {
                const i3 = i * 3;
                const i2 = i * 2;

                const uv = [uvArray[i2] * 2 - 1, uvArray[i2 + 1] * 2 - 1];

                posArray[i3] = posArray[i3];
                posArray[i3 + 1] =
                    posArray[i3 + 1] +
                    offsetHight * (1 - Math.pow(uv[0], pp)) +
                    offsetHight * (1 - Math.pow(uv[1], pp)) +
                    Math.sin(Math.random() * 100) * 0.4;
                posArray[i3 + 2] = posArray[i3 + 2];
            }
            planeGeometry.setAttribute(
                "position",
                new THREE.BufferAttribute(new Float32Array(posArray), 3)
            );
            const mesh = new THREE.Mesh(
                planeGeometry,
                new THREE.MeshBasicMaterial({ wireframe: true })
            );
            sourceBox3 = computeModelSize(mesh);
            // const targetHelper = new THREE.Box3Helper(targetBox3, 0xffff00);
            // const sourceHelper = new THREE.Box3Helper(sourceBox3, 0xff0000);

            initialModelTransitionTime.value = sourceBox3.min.y - 0.08;
            targetModelTransitionTime.value = targetBox3.max.y + 1;

            // const targetVertexList = assembleVertexData(hoda)
            // const sourceVertexList = assembleVertexData(mesh)

            const [targetVertexList, sourceVertexList] = listLengthAlignment(
                assembleVertexData(hoda),
                assembleVertexData(mesh)
            );
            // 创建几何体
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute(
                "position",
                new THREE.BufferAttribute(new Float32Array(sourceVertexList), 3)
            );
            geometry.setAttribute(
                "aPosition",
                new THREE.BufferAttribute(new Float32Array(targetVertexList), 3)
            );
            // 创建粒子材质
            const pointsMaterial = createPointsMaterial(sourceBox3);
            const totalTime = 4;
            const ponits=new THREE.Points(geometry, pointsMaterial)
            scene.add(ponits);
            const tween1 = new TWEEN.Tween(pointTransitionTime).to(
                { value: 2 },
                totalTime * 1000
            );

            const tween2 = new TWEEN.Tween(initialModelTransitionTime).to(
                { value: sourceBox3.max.y + 0.08 },
                totalTime * 0.5 * 1000
            );

            const tween3 = new TWEEN.Tween(targetModelTransitionTime)
                .to({ value: targetBox3.min.y - 1 }, totalTime * 0.75 * 1000)
                .delay(totalTime * 0.25 * 1000).onComplete(()=>{
                    setIsInit(true);
                    ponits.material.dispose();
                    scene.remove(ponits);
                })

            if (tween1) {
                tween1.start();
                tween2.start();
                tween3.start();
            }
            return () => {
                if (tween1) {
                    tween1.stop();
                    tween2.stop();
                    tween3.stop();
                }
            };
        }
    }, [hoda,isInit]);

    const applyParticleAnimation = (shader,materail) => {
        // console.log('shader3333',shader)
        shader.uniforms.uTargetModelTransitionTime = targetModelTransitionTime;

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
        vPosition = transformed;
    `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            "#include <common>",
            /* glsl */ `
        #include <common>
        varying vec3 vPosition;
        uniform float uTargetModelTransitionTime;
    `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            "#include <dithering_fragment>",
            /* glsl */ `
        #include <dithering_fragment>
        vec3 positionNormalize = normalize(vPosition);
        float angle = acos(dot(positionNormalize, vec3(1.0, 0.0, 0.0)));
        float strength = sin(angle * 10.0) / 2.0;

        if (vPosition.y < uTargetModelTransitionTime + strength) {
            gl_FragColor = vec4(0.0);
        } else if (vPosition.y < uTargetModelTransitionTime + strength + 0.1) {
            gl_FragColor = vec4(0.25, 0.62, 1.0, 1.0);
        }
    `
        );
    };

    useEffect(() => {
        if(hoda){
            registerShaderLogic("particle-animation", applyParticleAnimation)
        }
    }, [hoda, registerShaderLogic]);

    return null
}
export default MaxWellParticleAggregation
