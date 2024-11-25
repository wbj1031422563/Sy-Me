uniform vec3 uColor;
uniform float uHeight;

varying vec3 vPos;

void main(){
    float strength=1.-vPos.y/uHeight;
    strength=pow(strength,4.);
    strength-=0.2;
    strength=smoothstep(0.,1.,strength);
    // strength-=0.22
    
    gl_FragColor=vec4(uColor.xyz,strength);
}