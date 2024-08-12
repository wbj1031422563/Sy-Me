// varying vec2 vUv;
// varying vec3 vNormal;
// varying vec3 vPosition;

// attribute vec2 aBaseUv;

varying vec3 vPos;
uniform float uProgress;
uniform float uOffset;

void main(){
    
    float progress=smoothstep(0.,1.,uProgress-uOffset);
    float scale=progress*.1+1.;
    
    /**
    易错点: 缩放操作应该相对于圆心进行，而不是相对于圆环的其他部分
    */
    vec3 center=vec3(0.,0.,0.);// 圆心在模型空间中的位置
    vec3 localPosition=position.xyz-center;// 将顶点坐标移动到圆心
    vec3 scaledPosition=localPosition*scale;// 对局部坐标进行缩放
    vec3 finalPosition=scaledPosition+center;// 将坐标转换回原始位置
    
    vec4 modelPosition=modelMatrix*vec4(finalPosition,1.);
    modelPosition.y+=progress;
    
    vec4 viewPosition=viewMatrix*modelPosition;
    gl_Position=projectionMatrix*viewPosition;
    
    // vPos=position.xyz;
}