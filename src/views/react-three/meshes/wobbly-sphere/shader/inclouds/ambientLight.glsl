/**
 lightColor 光照颜色，lightIntensity 光照强度
*/
vec3 ambientLight(vec3 lightColor,float lightIntensity){
    return lightColor*lightIntensity; 
}