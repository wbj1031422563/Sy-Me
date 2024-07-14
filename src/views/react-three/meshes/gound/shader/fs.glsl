precision mediump float;

#define PI 3.1415926535897932384626433832795

uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform float uColorOffset;
uniform float uColorMultiplier;

varying float  vElevation;
varying vec3 vNormal;
varying vec3 vPosition;


#include ./inclouds/ambientLight.glsl
#include ./inclouds/directionalLight.glsl


/**
 * Computes the lighting contribution from a directional light source.
 *
 * @param lightColor The color of the light source.
 * @param lightIntensity The intensity of the light source.
 * @param normal The normalized normal vector at the surface point.
 * @param lightPosition The position of the light source.
 * @param viewDirection The normalized direction from the surface point to the viewer.
 * @param specularPow The shininess factor for specular highlights.
 * @return The lighting color contribution at the surface point.
 */
vec3 directionalLight2(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition, vec3 viewDirection, float specularPow) {
    // Calculate the light direction and normalize it
    vec3 lightDirection = normalize(lightPosition);

    // Calculate diffuse shading
    float shading = dot(normal, lightDirection);
    shading = max(0.0, shading);

    // Calculate specular reflection
    vec3 lightReflection = reflect(-lightDirection, normal);
    float specular = -dot(lightReflection, viewDirection);
    specular = max(0.0, specular);
    specular = pow(specular, specularPow);

    // Compute the final lighting result
    return lightColor * lightIntensity * (shading + specular);
}

/**
 * Computes the lighting contribution from a spotlight source.
 *
 * @param lightColor The color of the light source.
 * @param lightIntensity The intensity of the light source.
 * @param normal The normalized normal vector at the surface point.
 * @param lightPosition The position of the light source.
 * @param viewDirection The normalized direction from the surface point to the viewer.
 * @param specularPow The shininess factor for specular highlights.
 * @param spotDirection The normalized direction of the spotlight.
 * @param cutoffAngle The cutoff angle of the spotlight in radians.
 * @param outerCutoffAngle The outer cutoff angle for the spotlight's edge falloff in radians.
 * @return The lighting color contribution at the surface point.
 */
vec3 spotLight2(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition, vec3 viewDirection, float specularPow, vec3 spotDirection, float cutoffAngle, float outerCutoffAngle) {
    // Calculate the light direction and normalize it
    vec3 lightDirection = normalize(lightPosition);

    // Calculate the spotlight effect
    float theta = dot(lightDirection, normalize(-spotDirection));
    float epsilon = cutoffAngle - outerCutoffAngle;
    float intensity = clamp((theta - outerCutoffAngle) / epsilon, 0.0, 1.0);

    // Calculate diffuse shading
    float shading = max(dot(normal, lightDirection), 0.0);

    // Calculate specular reflection
    vec3 lightReflection = reflect(-lightDirection, normal);
    float specular = pow(max(dot(viewDirection, lightReflection), 0.0), specularPow);

    // Compute the final lighting result with spotlight effect
    return lightColor * lightIntensity * (shading + specular) * intensity;
}

void main(){
  float  strenth=(vElevation+uColorOffset)*uColorMultiplier;
  strenth=smoothstep(0.0, 1.0, strenth);
  // strenth=1.0-strenth;
  vec3 mixColor=mix(uDepthColor, uSurfaceColor,strenth );

  //light
  vec3 light=vec3(0.0,0.0,0.0);
  // light+=ambientLight(vec3(1.),.2);
  vec3 viewDirection=normalize(vPosition-cameraPosition);

  float cutoffAngle = cos(radians(12.5)); // Inner cutoff angle in radians
  float outerCutoffAngle = cos(radians(17.5)); // Outer cutoff angle in radians
  light+=directionalLight(
      vec3(1.0, 1.0, 1.0),
      1.0,
      vNormal,
      vec3(3.0, 3.0, 0.0),
      viewDirection,
      100.0
    );

  mixColor*=light;
  
  gl_FragColor=vec4(mixColor,1.);
  
}