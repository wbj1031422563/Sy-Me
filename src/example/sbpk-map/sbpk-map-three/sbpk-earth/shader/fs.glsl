
uniform vec3 gradInner;
uniform vec3 gradOuter;
varying float vFinalStep;
varying float vMap;
varying vec2 vUv;

void main(){
    // vec3 diffuseMap = diffuse * ((vMap > 0.5) ? 0.5 : 1.);
    // vec2 hUv=(vUv-.5);
    // int N=8;
    // float a=atan(hUv.x,hUv.y);
    // float r=PI2/float(N);
    // float d=cos(floor(.5+a/r)*r-a)*length(hUv);
    // float f=cos(PI/float(N))*.5;
    // if(d>f)discard;
    
    // vec3 grad=mix(gradInner,gradOuter,clamp(d/f,0.,1.));// gradient
    // vec3 diffuseMap=diffuse*((vMap>.5)?.5:1.);
    // vec3 col=mix(diffuseMap,grad,vFinalStep);// color on wave
    //if (!gl_FrontFacing) col *= 0.25; // moderate the color on backside
     csm_DiffuseColor=vec4(vec3(vMap),1.);
    
}