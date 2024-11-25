uniform vec2 uResolution;
uniform float uSize;

void main(){
    vec4 modelPosition=modelMatrix*vec4(position,1.);
    
    vec4 viewPosition=viewMatrix*modelPosition;
    gl_Position=projectionMatrix*viewPosition;
    
    gl_PointSize=uSize*uResolution.y;
    // 实现粒子的透视效果，viewPosition为是模型视图变化后的posotion
    gl_PointSize*=(1./-viewPosition.z);
    
    // vPos=position.xyz;
}