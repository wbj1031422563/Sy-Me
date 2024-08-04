uniform float time;
uniform vec3 color;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform vec3 borderColor;
uniform vec3 innerColor;
uniform vec3 outColor;


void main(){
    float isTop=0.;
    vec3 top=vec3(0,1,0);
    vec3 color=vec3(1.,1.,1.);
    top=normalize(top);
    if(dot(vNormal,top)>.9999){
        isTop=1.;
    }else{
        isTop=0.;
    }
    // gl_FragColor=vec4(color,1.);
    float strength1=step(.49,max(abs(vUv.x-.5),abs(vUv.y-.5)));
    // float strength2=1.0-step(.3,max(abs(vUv.x-.5),abs(vUv.y-.5)));
    // float strength =strength1*1.0 ;
    // strength=st
    
    float strength2=distance(vUv,vec2(.5,.5))+0.05;
    
    float strength=strength2;
    
    strength*=isTop;
    
    // strength=strength*0.8;

    strength=clamp(0.,strength,1.);

    color=mix(innerColor,outColor,strength);
    // if(strength>0.9999){
    //     color=borderColor;
    // }
    // color=color*0.8;
    
    // gl_FragColor.rgba=vec4(.5+.3*sin(vUv.yxx+time)+color,1.);
    gl_FragColor=vec4(vec3(color),1.);
}