

varying vec2 vUv;
varying float r;
varying float vOffset;
float N21(vec2 p)
{
    p=fract(p*vec2(233.34,851.73));
    p+=dot(p,p+237.45);
    return fract(p.x*p.y);
}


attribute float aLen;

void main(){
    vUv=uv;
    vOffset=N21(vec2(aLen,aLen));
    r=aLen;
    // csm_Position=position;// scale on wave
}