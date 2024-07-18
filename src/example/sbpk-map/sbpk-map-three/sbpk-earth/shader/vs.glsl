

struct impact{
    vec3 impactPosition;
    float impactMaxRadius;
    float impactRatio;
};
// uniform impact impacts[${maxImpactAmount}];
uniform sampler2D tex;
uniform float maxSize;
uniform float minSize;
uniform float waveHeight;
uniform float scaling;

attribute vec3 center;
attribute vec2 baseUv;

varying float vFinalStep;
varying float vMap;
varying vec2 vUv;

void main(){
    
    float map=texture(tex,baseUv).r;
    vMap=map;
    float pSize=map<0.5?maxSize:minSize;
    float scale=scaling;
    vUv=baseUv;
    
    // vec3 p=(position-center)*pSize+center;
    // p+=normal;
    csm_Position=(position-center)*pSize+center;// scale on wave
}