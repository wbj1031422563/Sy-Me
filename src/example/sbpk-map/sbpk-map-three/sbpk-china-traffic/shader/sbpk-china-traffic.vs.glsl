

varying vec2 vUv;
varying float r;


attribute float aLen;

void main(){
    vUv=uv;
    r=0.1/aLen;
    // csm_Position=position;// scale on wave
}