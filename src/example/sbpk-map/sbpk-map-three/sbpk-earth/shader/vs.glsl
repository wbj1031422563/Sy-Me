varying vec3 vNormal;
varying vec2 vUv;

uniform vec2 uResolution;
uniform sampler2D uTexture;

attribute vec2 aUv;
attribute vec3 aNormal;

varying float vMap;
varying float vVisibility;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // 计算法线变换矩阵：逆矩阵并转置
    mat3 normalMatrix = transpose(inverse(mat3(modelMatrix)));
    // 使用法线变换矩阵变换法线
    vec3 transformedNormal = normalize(normalMatrix * aNormal);
    vNormal = transformedNormal;

    // 计算片段到相机位置的方向向量
    vec3 cameraDirection = normalize(viewPosition.xyz - cameraPosition);

    // 计算法线向量和相机方向向量的点积
    float dotProduct = dot(vNormal, cameraDirection);
    vVisibility = dotProduct > 0.0 ? 1.0 : 0.0;

    // 设置粒子大小
    gl_PointSize = 0.04 * uResolution.y * 1.0;
    gl_PointSize *= (1.0 / -viewPosition.z);

    // 传递纹理坐标
    vUv = aUv;

    // 传递纹理值
    vMap = texture2D(uTexture, aUv).r;
}
