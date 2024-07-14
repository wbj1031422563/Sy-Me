
#include <common>
uniform float uTime;
uniform float uDeltaTime;
uniform sampler2D uBase;
uniform float uInfluence;
uniform float uFrequency;
uniform float uStrength;
#include ../inclouds/simplex_4D_Noise.glsl
void main(){
    // resolution 是GPUComputationRenderer 内置的一个分辨率常量
    vec2 uv=gl_FragCoord.xy/resolution.xy;
    float time=uTime*0.2;

    vec4 particle=texture2D(uParticles,uv);
    vec4 baseParticle=texture2D(uBase,uv);

// 流场动画强度
    float strength=snoise4D(vec4(baseParticle.xyz,time));
    float influence=(uInfluence-0.5)*(-2.0);
    strength=smoothstep(influence,1.0 , strength);
    // strength=1.0;


    //Decay 寿命
    if(particle.a>1.0){
        particle.a=mod(particle.a,1.0 );
        particle.xyz=baseParticle.xyz;
    }else{
        vec3 flowField=vec3(
        snoise4D(vec4(particle.xyz*uFrequency+0.0,time)),
        snoise4D(vec4(particle.xyz*uFrequency+1.0,time)),
        snoise4D(vec4(particle.xyz*uFrequency+2.0,time))
        );
        flowField=normalize(flowField);
        particle.xyz+=flowField*uStrength*uDeltaTime*strength;
        particle.a+=0.4*uDeltaTime;
    }

    gl_FragColor=particle;
}