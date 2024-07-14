/**
lightColor 光照颜色，
lightIntensity 光照强度，
normal 法线，这里需要传入归一化后的向量
lightPosition 光源位置
viewDirection 视角向量 ,需要归一化
specularPow 反射高光区域的大小，值越大，反射高光区域越集中，越小
position 顶点位置
lightDecay 衰减率

*/
vec3 pointLight(
  vec3 lightColor,
  float lightIntensity,
  vec3 normal,
  vec3 lightPosition,
  vec3 viewDirection,
  float specularPow,
  vec3 position,
  float lightDecay
){
  vec3 lightDelta=lightPosition-position;
  // 光照方向
  vec3 lightDirection=normalize(lightDelta);
  
  float lightDistance=length(lightDelta);
  
  // 漫反射
  float shading=dot(normal,lightDirection);
  shading=max(0.,shading);
  
  // 镜面反射
  vec3 lightReflection=reflect(-lightDirection,normal);
  float specular=-dot(lightReflection,viewDirection);
  specular=max(0.,specular);
  specular=pow(specular,specularPow);
  // specular=max(0.0, specular);
  
  // 光照衰减
  float decay=1.-lightDistance*lightDecay;
  decay=max(0.0,decay);
  
  // 光照结果最小为0，不能够为负数
  return lightColor*lightIntensity*decay*(shading+specular*lightColor);
  
  // return vec3(decay);
  
}