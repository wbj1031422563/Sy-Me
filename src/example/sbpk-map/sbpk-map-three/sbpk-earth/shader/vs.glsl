

uniform sampler2D tex;
uniform float maxSize;
uniform float minSize;
uniform float waveHeight;
uniform float scaling;

attribute vec3 center;
attribute vec2 baseUv;

//10为飞线的个数
uniform vec3 impactPositionList[10];
uniform float impactMaxRadiusList[10];
uniform float impactRatioList[10];

varying float vFinalStep;
varying float vMap;
varying vec2 vUv;

void main(){
    
    float finalStep=0.;
    for(int i=0;i<10;i++){
        float dist=distance(center,impactPositionList[i]);
        float curRadius=impactMaxRadiusList[i]*impactRatioList[i];
        float sstep=smoothstep(0.,curRadius,dist)-smoothstep(curRadius-(.25*impactRatioList[i]),curRadius,dist);
        sstep*=1.-impactRatioList[i];
        finalStep+=sstep;
    }
    finalStep=clamp(finalStep,0.,1.);
    vFinalStep=finalStep;
    
    float map=texture(tex,baseUv).r;
    vMap=map;
    float pSize=map<.5?maxSize:minSize;
    float scale=scaling;
    vUv=baseUv;
    
    /*
    通过多个plane网格作为粒子，最终来组成地球。
    读取纹理图片的红色通道，海洋与陆地的不同plane的缩放不同，显示出基本的造型
    (position - center) * pSize * mix(1., scale * 1.25, finalStep) + center。
    center为每个顶点对应的所处plane的中心位置，每个粒子的实际位置就是基于center的偏移量*缩放值+center。
    */
    /*
    之所以不通过，粒子来实现，是因为采用粒子会出现始终能够看到地球的背面效果。采用网格，由于我们设置的plane只渲染单面和设置了它始终朝向球面外部的法线
    观察正面时，地球背面为平面的反面，就不会渲染。
    */
    
    vec3 myTransformed=(position-center)*pSize*mix(1.,scale*1.25,finalStep)+center;// scale on wave
    myTransformed+=normal*finalStep*waveHeight;// lift on wave
    
    // vec3 p=(position-center)*pSize+center;
    // p+=normal;
    csm_Position=myTransformed;// scale on wave
}