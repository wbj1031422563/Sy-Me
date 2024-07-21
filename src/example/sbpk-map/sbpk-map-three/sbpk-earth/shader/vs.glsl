


uniform sampler2D tex;
uniform float maxSize;
uniform float minSize;
uniform float waveHeight;
uniform float scaling;

attribute vec3 center;
attribute vec2 baseUv;

uniform    vec3 impactPositionList[10];
uniform    float impactMaxRadiusList[10];
uniform    float impactRatioList[10];

varying float vFinalStep;
varying float vMap;
varying vec2 vUv;

void main(){
    
    float finalStep = 0.0;
    for (int i = 0; i < 10;i++){
        float dist = distance(center, impactPositionList[i]);
        float curRadius = impactMaxRadiusList[i] * impactRatioList[i];
        float sstep = smoothstep(0., curRadius, dist) - smoothstep(curRadius - ( 0.25 * impactRatioList[i] ), curRadius, dist);
        sstep *= 1. - impactRatioList[i];
        finalStep += sstep;
    }
    finalStep = clamp(finalStep, 0., 1.);
    vFinalStep = finalStep;


    float map=texture(tex,baseUv).r;
    vMap=map;
    float pSize=map<0.5?maxSize:minSize;
    float scale=scaling;
    vUv=baseUv;



         vec3   myTransformed = (position - center) * pSize * mix(1., scale * 1.25, finalStep) + center; // scale on wave
            myTransformed += normal * finalStep * waveHeight; // lift on wave
    
    // vec3 p=(position-center)*pSize+center;
    // p+=normal;
    csm_Position=myTransformed;// scale on wave
}