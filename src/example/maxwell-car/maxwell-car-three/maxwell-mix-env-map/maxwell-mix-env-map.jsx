/*
* 混合环境贴图，模拟动态光照
* */
import useDynamicLightformers from "@/example/maxwell-car/hooks/useDynamicLightformers.js";
import {useCallback, useEffect} from "react";

function MaxWellMixEnvMap({registerShaderLogic}){
    const {dynamicEnvMap}=useDynamicLightformers();
    const applyDynamicEnvMap = useCallback((shader,material) => {
        if(material.name==='Car paint'){
            // item.material.envMap=dynamicEnvMap;
            shader.uniforms.uDynamicEnvMap={value:dynamicEnvMap};
            shader.fragmentShader=shader.fragmentShader.replace('#include <envmap_common_pars_fragment>',
                `
            #ifdef USE_ENVMAP
            
                uniform float envMapIntensity;
                uniform float flipEnvMap;
                // uniform sampler2D uBaseEnvMap;
                uniform samplerCube uDynamicEnvMap;
            
                #ifdef ENVMAP_TYPE_CUBE
                    uniform samplerCube envMap;
                #else
                    uniform sampler2D envMap;
                #endif
                
            #endif
`
            )
            shader.fragmentShader=shader.fragmentShader.replace('#include <envmap_physical_pars_fragment>',
                `
#if defined( USE_ENVMAP )

	vec3 getIBLIrradiance( const in vec3 normal ) {

		#if defined( ENVMAP_TYPE_CUBE_UV )

			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );

			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );

			return PI * envMapColor.rgb * envMapIntensity;

		#else

			return vec3( 0.0 );

		#endif

	}

	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {

		#if defined( ENVMAP_TYPE_CUBE_UV )

			vec3 reflectVec = reflect( - viewDir, normal );

			// Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );

			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );

			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			//textureCube 只能够使用它，否则会报错1
			vec4 envMapColor2 = textureCube( uDynamicEnvMap,reflectVec);
			// 0.25 是控制环境贴图混合强度
			// 
			vec4 mixEnvMapColor=mix(envMapColor,envMapColor2,0.25);

			return mixEnvMapColor.rgb * envMapIntensity;

		#else

			return vec3( 0.0 );

		#endif

	}

#endif
`
            )
        }
    }, [dynamicEnvMap]);
    useEffect(() => {
        registerShaderLogic("dynamic-env-map", applyDynamicEnvMap);
    }, [applyDynamicEnvMap, registerShaderLogic]);

    return null;
}
export default MaxWellMixEnvMap
