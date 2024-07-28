
uniform vec3 gradInner;
uniform vec3 gradOuter;
uniform vec3 baseColor;
varying float vFinalStep;
varying float vMap;
varying vec2 vUv;
varying float inside;
varying float isStart;

uniform float test3[1];

void main(){

    vec3 myColor=baseColor;
    vec2 hUv=(vUv-.5);
    int N=8;
    float a=atan(hUv.x,hUv.y);
    float r=PI2/float(N);
    float d=cos(floor(.5+a/r)*r-a)*length(hUv);
    float f=cos(PI/float(N))*.5;
    // if(d>f)discard;
    
    vec3 grad=mix(gradInner,gradOuter,clamp(d/f,0.,1.));// gradient
    vec3 diffuseMap=myColor*((vMap>.5)?.5:1.);
    vec3 col=mix(diffuseMap,grad,vFinalStep);// color on wave

    // if(inside>0.0){
    //     col=vec3(1.0,0.0,0.0);
    // }
    col=mix(col,vec3(1.0,0.0,0.0),inside);
    col=mix(col,vec3(0.0,1.0 ,0.0 ),isStart);
    
    csm_DiffuseColor=vec4(col,1.0);
    
}