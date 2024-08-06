// varying vec2 vUv;
// varying vec3 vNormal;
// varying vec3 vPosition;

// attribute vec2 aBaseUv;

varying vec3 vPos;

void main(){
    vec4 modelPosition=modelMatrix*vec4(position,1.);
    vec4 viewPosition=viewMatrix*modelPosition;
    gl_Position=projectionMatrix*viewPosition;

    vPos=position.xyz;
}