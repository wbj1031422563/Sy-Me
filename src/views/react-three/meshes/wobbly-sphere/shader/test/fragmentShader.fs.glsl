
varying vec2 vUv;
varying float vWobble;

// uniform vec3 colorB;
// uniform vec3 colorA;

void main(){
  // csm_DiffuseColor.rgb=vec3(vUv,1.0);

  //  csm_Metalness=step(0.0,sin(vUv.x*100.0) );
  // csm_Roughness=1.0-csm_Metalness;
  vec3 colorA=vec3(1.0,0.0 ,0.0 );
  vec3 colorB=vec3(0.0,1.0 ,0.0 );
  float colorMix=smoothstep(-1.0, 1.0,vWobble );
  vec3 color=mix(colorA,colorB,colorMix).rgb;
  csm_DiffuseColor=vec4(color,1.0);

  // 镜像化
  // csm_Metalness=step(0.25, vWobble);
  // csm_Roughness=1.0-csm_Metalness;

  // 边缘光滑化
  csm_Roughness=1.0-colorMix;
}