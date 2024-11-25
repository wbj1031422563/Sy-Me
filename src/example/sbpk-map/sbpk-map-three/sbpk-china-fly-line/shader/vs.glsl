

varying vec2 vUv;
varying float r;
varying float vOffset;
float N21(vec2 p)
{
    p=fract(p*vec2(233.34,851.73));
    p+=dot(p,p+237.45);
    return fract(p.x*p.y);
}


uniform float uLen;
// attribute float aLen;

void main(){
    vUv=uv;
    float w=0.25;
    vOffset=N21(vec2(uLen,uLen));
    r=w/uLen;
    // csm_Position=position;// scale on wave
}