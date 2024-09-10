

uniform vec3 uColor;

varying vec2 vUv;

void main(){
    // 创建渐变色效果
    vec3 color=uColor;
    float distanceToCenter=length(vUv-.5);
    float alpha=.05/distanceToCenter-.1;
    alpha=clamp(0.,1.,alpha);
    if(alpha<0.01) discard;
    // \
    // float progress=smoothstep(0.0, 1.0,uProgress-uOffset );
    // float fade=1.-progress;
    
    // 动态变化的颜色（可选）
    // float dynamicColor=sin(uTime*0.1)*.5+.5;
    // color=mix(color,vec3(1.,0.,0.),dynamicColor);
    // gl_FragColor=vec4(uColor,1.0);
    csm_DiffuseColor=vec4(color,alpha);
}