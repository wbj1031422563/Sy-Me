varying vec2 vUv;
#include ../inclouds/simplex_4D_Noise.glsl



attribute vec4 tangent;

uniform float uStrength;
uniform float uPositionFrequency;
uniform float uTime;
uniform float uTimeFrequency;

uniform float uStrength1;
uniform float uPositionFrequency1;
uniform float uTimeFrequency1;

varying float vWobble;

float getWobble(vec3 position,float time){

    vec3 position1=position;
    position1+=snoise4D(
        vec4(
            position*uPositionFrequency1,
            time*uTimeFrequency1
        )
    )*uStrength1;

        //   csm_Position.y+=sin(csm_Position.x*5.0)*0.5;
    return  snoise4D(
        vec4(
            position1*uPositionFrequency,
            time*uTimeFrequency
        )
    )*uStrength;

}

void main(){
    //   csm_Position.y+=sin(csm_Position.x*5.0)*0.5;



    float shift=0.01;
    vec3 biTangent=cross(normal, tangent.xyz);

    // 得到相邻两个点的位置
    vec3 positionA=csm_Position+tangent.xyz*shift;
    vec3 positionB=csm_Position+biTangent.xyz*shift;

    // 计算顶点和它向量的两个点摆动后的位置
    float wobble=getWobble(csm_Position,uTime);
    csm_Position+=wobble*normal;
    positionA+=getWobble(positionA,uTime)*normal;
    positionB+=getWobble(positionB,uTime)*normal;

    // 计算顶点到两相邻个点的方向向量
    vec3 toA=normalize(positionA-csm_Position);
    vec3 toB=normalize(positionB-csm_Position);


    // 计算顶点法向量
    csm_Normal=cross(toA, toB);

    // csm_Position+=getWobble(csm_Position)*normal;

    vUv=uv;
    vWobble=wobble/uStrength;
}