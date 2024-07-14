attribute float aRadom;


uniform float uBigWavesElevation;
uniform float uTime;
uniform vec2 uBigWavesFrequency;
uniform float  uBigWavesSpeed;


varying float  vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

#include ./inclouds/perlinClassic3D.glsl

float waveElevation(vec3 position){
    vec3 modelPosition=position;
    float elevation =0.0 ;
// 海浪高度
    float zElevation = sin(modelPosition.z*uBigWavesFrequency.y+uTime*uBigWavesSpeed);
    float xElevation = sin(modelPosition.x*uBigWavesFrequency.x+uTime*uBigWavesSpeed);
    elevation=zElevation*xElevation*uBigWavesElevation;

    //使用3D珍珠噪声函数，基于原有的规则几何波形，产生小的波浪。
    //同时通过abs，确保基于原有的波形向y轴负方向变化，这里使用累减
    // elevation-=abs(perlinClassic3D(vec3(modelPosition.xz*3.0,uTime*0.2))*0.15);


    // 循环在原有的小波浪基础在再次进行频率更大，幅度更小噪声处理
    // modelPosition.xz*3.0*i  提高频率，
    // 0.2/i 减小幅度
    //注意这个效果需要平面具有更多的细分才会更明显
    for(float i = 1.0;i<=4.0;i++){
        
        elevation-=abs(perlinClassic3D(vec3(modelPosition.xz*3.0*i,uTime*0.2))*0.15/i);
    }
    return elevation; 
}

void main(){

    
    //     vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    // vec4 viewPosition = viewMatrix * modelPosition;
    // gl_Position = projectionMatrix * viewPosition;

    float shift=0.01;

    vec4 modelPosition=modelMatrix * vec4(position, 1.0);
    vec3 modelPositionA=modelPosition.xyz+vec3(shift,0.0,0.0);
    // 这里采用-shift偏移，确保向量叉乘结果指向Y轴正半轴
     vec3 modelPositionB=modelPosition.xyz+vec3(0.0,0.0,-shift);


    float elevation = waveElevation(modelPosition.xyz);

    modelPosition.y+=elevation;
    modelPositionA.y+=waveElevation(modelPositionA);
    modelPositionB.y+=waveElevation(modelPositionB);


    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;


    vElevation=elevation;


    //计算法向量
    vec3 PA=normalize(modelPositionA-modelPosition.xyz);
    vec3 PB=normalize(modelPositionB-modelPosition.xyz);
    vec3 computedNormal=cross(PA, PB);

    //     // 计算法线变换矩阵：逆矩阵并转置
    // mat3 normalMatrix=transpose(inverse(mat3(modelMatrix)));
    // 使用法线变换矩阵变换法线
    vec3 transformedNormal=normalize(computedNormal);
    vNormal=transformedNormal;
    
    vPosition=modelPosition.xyz;
    
}