
varying vec2 vUv;
uniform float uTime;

vec3 hsv2rgb(float h,float s,float v)
{
    vec4 t=vec4(1.,2./3.,1./3.,3.);
    vec3 p=abs(fract(vec3(h)+t.xyz)*6.-vec3(t.w));
    return v*mix(vec3(t.x),clamp(p-vec3(t.x),0.,1.),s);
}

void main(){
    // float strength=sin(uTime);
    // strength=strength*.5+.5;
    
    vec2 oUV=vUv;
    float len=.2;
    
    float h=mix(.5,.65,length(vUv));
    
    vec3 vColor=hsv2rgb(h,1.,1.);
    
    float start=.25;
    float end=.75;
    float blur=.2;
    float step1=smoothstep(start-blur,start+blur,oUV.y);
    float step2=smoothstep(end+blur,end-blur,oUV.y);
    float alhp=step1*step2;
    // alhp=alhp*alhp;
    
    float show=smoothstep(0.,len,oUV.x);
    // if(show<0.01||show>0.99){
        //     discard;
    // }
    
    csm_DiffuseColor=vec4(vColor,alhp);
    // csm_DiffuseColor=vec4(vec3(1.0,1.0,0.5),1.0);
    
}