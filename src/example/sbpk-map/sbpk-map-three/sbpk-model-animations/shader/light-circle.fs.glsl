
uniform float uProgress;
uniform float uTime;
uniform float uOffset;

void main(){
    // 创建渐变色效果
    vec3 color=vec3(0, 1.0, 1.0);
    
    // \
    float progress=smoothstep(0.0, 1.0,uProgress-uOffset );
    float fade=1.-progress;
    
    // 动态变化的颜色（可选）
    // float dynamicColor=sin(uTime*0.1)*.5+.5;
    // color=mix(color,vec3(1.,0.,0.),dynamicColor);
    gl_FragColor=vec4(color,fade);
}