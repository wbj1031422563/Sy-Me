
uniform vec3 gradInner;
uniform vec3 gradOuter;
varying float vFinalStep;
varying float vMap;

void main(){
    vec3 diffuseMap = diffuse * ((vMap > 0.5) ? 0.5 : 1.);
    csm_DiffuseColor=vec4(vec3(vMap),1.);
    
}