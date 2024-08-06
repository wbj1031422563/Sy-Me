// varying vec2 vUv;
// varying vec3 vNormal;
// varying vec3 vPosition;

// attribute vec2 aBaseUv;

varying vec3 vPos;
uniform float uProgress;
uniform float uOffset;

void main(){
    vec4 modelPosition=modelMatrix*vec4(position,1.);

     float progress=smoothstep(0.0, 1.0,uProgress-uOffset );
    modelPosition.y+=progress;
    modelPosition.x*=(progress*0.5+1.0);
    modelPosition.z*=(progress*0.5+1.0);
    
    vec4 viewPosition=viewMatrix*modelPosition;
    gl_Position=projectionMatrix*viewPosition;
    
    // vPos=position.xyz;
}