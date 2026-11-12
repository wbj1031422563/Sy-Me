import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * 为模型材质维护可组合的 Shader 插件管线。
 * 兼容旧调用方式 registerShaderLogic(fn)，同时支持
 * registerShaderLogic("plugin-id", fn)。
 */
const useProcessModelShaders = (model) => {
    const shaderPluginsRef = useRef(new Map());
    const materialStateRef = useRef(new WeakMap());
    const modelRef = useRef(model);
    const anonymousIdRef = useRef(0);
    const [, setRevision] = useState(0);
    modelRef.current = model;

    const registerShaderLogic = useCallback((idOrLogic, maybeLogic) => {
        const isNamed = typeof idOrLogic === "string";
        const logic = isNamed ? maybeLogic : idOrLogic;
        if (typeof logic !== "function") return () => {};

        const id = isNamed
            ? idOrLogic
            : logic.shaderId || logic.name || `shader-${anonymousIdRef.current++}`;
        const previous = shaderPluginsRef.current.get(id);
        if (previous !== logic) {
            shaderPluginsRef.current.set(id, logic);
            modelRef.current?.traverse((item) => {
                if (item instanceof THREE.Mesh && item.material) {
                    item.material.needsUpdate = true;
                }
            });
            setRevision((value) => value + 1);
        }

        return () => {
            if (shaderPluginsRef.current.get(id) === logic) {
                shaderPluginsRef.current.delete(id);
                setRevision((value) => value + 1);
            }
        };
    }, []);

    useEffect(() => {
        if (!model) return undefined;

        const appliedMaterials = [];
        const materialState = materialStateRef.current;
        model.traverse((item) => {
            if (!(item instanceof THREE.Mesh) || !item.material) return;

            const material = item.material;
            const originalOnBeforeCompile = materialState.get(material)
                ?.originalOnBeforeCompile ?? material.onBeforeCompile;
            const wrappedOnBeforeCompile = (shader, renderer) => {
                originalOnBeforeCompile?.call(material, shader, renderer);
                shaderPluginsRef.current.forEach((plugin) => {
                    plugin(shader, material, renderer);
                });
            };

            materialState.set(material, {
                originalOnBeforeCompile,
                wrappedOnBeforeCompile,
            });
            material.transparent = true;
            material.onBeforeCompile = wrappedOnBeforeCompile;
            material.needsUpdate = true;
            appliedMaterials.push(material);
        });

        return () => {
            appliedMaterials.forEach((material) => {
                const state = materialState.get(material);
                if (!state || material.onBeforeCompile !== state.wrappedOnBeforeCompile) return;
                material.onBeforeCompile = state.originalOnBeforeCompile;
                material.needsUpdate = true;
            });
        };
    }, [model]);

    return { registerShaderLogic };
};

export default useProcessModelShaders;
