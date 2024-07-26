

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
varying float inside;

uniform sampler2D mapTexture;
  uniform int numCoords;
  
  vec2 projectTo2D(vec3 point) {
    float latitude = asin(point.y / 5.0); // 假设半径为5
    float longitude = atan(point.z, point.x);
    return vec2(longitude, latitude);
  }
  
  bool isPointInPolygon(vec2 point, int numPoints) {
    bool inside = false;
    vec2 prevCoord = texture2D(mapTexture, vec2(0.0, 0.0)).xy;
    vec2 currCoord;

    for (int i = 1; i < numPoints; i++) {
      currCoord = texture2D(mapTexture, vec2(float(i) / float(numPoints), 0.0)).xy;
      if (((currCoord.y > point.y) != (prevCoord.y > point.y)) &&
          (point.x < (prevCoord.x - currCoord.x) * (point.y - currCoord.y) / (prevCoord.y - currCoord.y) + currCoord.x)) {
        inside = !inside;
      }
      prevCoord = currCoord;
    }
    return inside;
  }

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


    /**
    判断是否在中国区域内
    */

     vec2 point2D = projectTo2D(center);
     inside = 0.0;
    //  if(isPointInPolygon(point2D, numCoords)){
    //     inside = 1.0;
    //  }else{
    //     inside = 0.0;
    //  }
    // bool insideRegion = isPointInPolygon(point2D, numCoords);
}


/*改进后的判断算法
*/


// bool isPointInPolygon(vec2 point, int numPoints) {
//     bool inside = false;
//     vec2 prevCoord = texture2D(mapCoordinates, vec2(0.0, 0.0)).xy;
//     vec2 currCoord;

//     for (int i = 1; i < numPoints; i++) {
//         currCoord = texture2D(mapCoordinates, vec2(float(i) / float(numPoints), 0.0)).xy;
//         if (((currCoord.y > point.y) != (prevCoord.y > point.y)) &&
//             (point.x < (prevCoord.x - currCoord.x) * (point.y - currCoord.y) / (prevCoord.y - currCoord.y) + currCoord.x)) {
//             inside = !inside;
//         }
//         prevCoord = currCoord;
//     }

//     // 最后一个点和第一个点之间的边
//     currCoord = texture2D(mapCoordinates, vec2(0.0, 0.0)).xy;
//     if (((currCoord.y > point.y) != (prevCoord.y > point.y)) &&
//         (point.x < (prevCoord.x - currCoord.x) * (point.y - currCoord.y) / (prevCoord.y - currCoord.y) + currCoord.x)) {
//         inside = !inside;
//     }

//     return inside;
// }
