varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main(){
    vUv=uv;
    vec4 modelPosition=modelMatrix*vec4(position,1.);
    vec4 viewPosition=viewMatrix*modelPosition;
    gl_Position=projectionMatrix*viewPosition;
    
    // 计算法线变换矩阵：逆矩阵并转置
    mat3 normalMatrix=transpose(inverse(mat3(modelMatrix)));
    // 使用法线变换矩阵变换法线
    vec3 transformedNormal=normalize(normalMatrix*normal);

    vNormal=normalize(transformedNormal);
    vPosition=modelPosition.xyz;
}