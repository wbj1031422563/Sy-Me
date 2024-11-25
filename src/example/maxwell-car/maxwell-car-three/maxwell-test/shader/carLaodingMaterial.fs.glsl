

uniform float uProgress;
uniform float uXlen;
uniform float uOffsetX;
varying vec2 vUv;

varying vec3 vPos;
void main(){
    float strength=abs(vPos.x-uOffsetX)/uXlen;
    // float alph=1.-step(uProgress,strength);
    
    // 延迟动画进度 0.1 秒并进行归一化处理
    float delayedProgress=(uProgress-.1)/.9;
    delayedProgress=clamp(delayedProgress,0.,1.);// 确保范围在 [0, 1]

    float alph=1.-step(delayedProgress,strength-0.1);
    
    // strength*=.5;
    csm_DiffuseColor=vec4(.5,0.,0.,alph);
    
}