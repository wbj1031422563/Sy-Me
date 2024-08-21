
varying vec2 vUv;
uniform float uTime;

vec3 hsv2rgb(float h, float s, float v)
{
    vec4 t = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(vec3(h) + t.xyz) * 6.0 - vec3(t.w));
    return v * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0, 1.0), s);
}

void main(){
    // float strength=sin(uTime);
    // strength=strength*.5+.5;
    
    vec2 oUV=vUv;
    float len=0.2;

    float h = mix(0.5, 0.65, length(vUv));

    vec3 vColor=hsv2rgb(h,1.0,1.0);
    
    float start=0.25;
    float end=0.75;
    float blur=0.2;
    float step1=smoothstep(start-blur,start+blur,oUV.y);
    float step2=smoothstep(end+blur,end-blur,oUV.y);
    float alhp=step1*step2;
    // alhp=alhp*alhp;

    float show=smoothstep(0.0,len , oUV.x);
    // if(show<0.01||show>0.99){
    //     discard;
    // }


    
    csm_DiffuseColor=vec4(vColor,alhp);
    
}