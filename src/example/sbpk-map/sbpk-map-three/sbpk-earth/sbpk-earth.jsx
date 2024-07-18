/*
 * @Author: FMC
 * @Date: 2024-07-15 21:43:01
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-19 01:17:20
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-earth\sbpk-earth.jsx
 * @Description:
 */
import { useTexture } from "@react-three/drei";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { extend, useFrame } from "@react-three/fiber";
import vs from "./shader/vs.glsl";
import fs from "./shader/fs.glsl";
import linnerFS from "./shader/liner/liner.fs.glsl";
import linnerVs from "./shader/liner/liner.vs.glsl";
import * as THREE from "three";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { useEffect, useRef, useState } from "react";
const params = {
  colors: { base: "#f9f002", gradInner: "#8ae66e", gradOuter: "#03c03c" },
};
const uniforms = {
  // impacts: { value: impacts },
  // 陆地色块大小
  maxSize: { value: 0.04 },
  // 海洋色块大小
  minSize: { value: 0.025 },
  // 冲击波高度
  waveHeight: { value: 0.1 },
  // 冲击波范围
  scaling: { value: 1 },
  // 冲击波径向渐变内侧颜色
  gradInner: { value: new THREE.Color(params.colors.gradInner) },
  // 冲击波径向渐变外侧颜色
  gradOuter: { value: new THREE.Color(params.colors.gradOuter) },
};
const texture = new THREE.TextureLoader().load("/img/earth.jpg");
// console.log('texture',texture)

class EarthMaterial extends CustomShaderMaterial {
  constructor() {
    super({
      baseMaterial: THREE.MeshBasicMaterial,
      color: "blue",
      uniforms: {
        ...uniforms,
        tex: { value: texture },
      },
      vertexShader: vs,
      fragmentShader: fs,
    });
  }
}
extend({ EarthMaterial });

class TrailLinerMaterial extends CustomShaderMaterial {
  constructor(trailRatio, trailLength) {
    super({
      /**
       * 虚线材质
       */
      baseMaterial: THREE.LineDashedMaterial,
      uniforms: {
        actionRatio: { value: trailRatio },
        lineLength: { value: trailLength },
      },
      linewidth: 1,
      scale: 1,
      dashSize: 3,
      gapSize: 1,
      fragmentShader: linnerFS,
    });
    // console.log("material执行");
  }
}
extend({ TrailLinerMaterial });

const maxImactAmount = 10;
function SbpkEarth() {
  const earthRef = useRef();
  const linerRefs = useRef([]);
  /**
   * 初始化飞行线与冲击波数组
   */
  const [impacts, setImpacts] = useState(() => {
    const list = [];
    for (let i = 0; i < maxImactAmount; i++) {
      list.push({
        impactPosition: new THREE.Vector3()
          .random()
          .subScalar(0.5)
          .setLength(5),
        impactMaxRadius: 5 * THREE.MathUtils.randFloat(0.5, 0.75),
        impactRatio: 0,
        prevPosition: new THREE.Vector3().random().subScalar(0.5).setLength(5),
        trailRatio: { value: 0 },
        trailLength: { value: 0 },
        linerGeometry: null,
      });
      list[i].linerGeometry = new THREE.BufferGeometry().setFromPoints(
        setPath(list[i].impactPosition, list[i].prevPosition, 1)
      );
    }
    return list;
  });
  const geometrys = mergeBufferGeometries(makeGlobeOfPoints());

  // const maxImactAmount = 10;
  // const impacts = [];
  // const trails = [0];
  // for (let i = 0; i < maxImactAmount; i++) {
  //   impacts.push({
  //     impactPosition: new THREE.Vector3().random().subScalar(0.5).setLength(5),
  //     impactMaxRadius: 5 * THREE.MathUtils.randFloat(0.5, 0.75),
  //     impactRatio: 0,
  //     prevPosition: new THREE.Vector3().random().subScalar(0.5).setLength(5),
  //     trailRatio: { value: 0 },
  //     trailLength: { value: 0 },
  //     linerGeometry:null
  //   });
  //   impacts[i].linerGeometry=new THREE.BufferGeometry().setFromPoints(
  //     setPath(
  //       impacts[i].impactPosition,
  //       impacts[i].prevPosition,
  //       1
  //     )
  //   );
  // }
  useEffect(() => {
    if (linerRefs.current) {
      linerRefs.current.forEach(item=>{
        /**
         * .computeLineDistances () : this
            计算LineDashedMaterial所需的距离的值的数组。 对于几何体中的每一个顶点，这个方法计算出了当前点到线的起始点的累积长度。
         */
        item.computeLineDistances();
        item.geometry.attributes.lineDistance.needsUpdate = true;
      })
      setImpacts(impacts.map((item,index)=>{
        //记录飞行线长度
        item.trailLength.value=linerRefs.current[index].geometry.attributes.lineDistance.array[99]
        return item
      }))
    }
  }, []);

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta;
    }
  });

  return (
    <>
      <mesh ref={earthRef} geometry={geometrys}>
        {/* <sphereGeometry></sphereGeometry> */}
        <earthMaterial />
        {impacts.map((item, index) => (
          <line
            ref={(ref) => (linerRefs.current[index] = ref)}
            key={index}
            geometry={item.linerGeometry}
          >
            <trailLinerMaterial />
          </line>
        ))}
      </mesh>
    </>
  );
}
export default SbpkEarth;

function makeGlobeOfPoints() {
  let dummyObj = new THREE.Object3D();
  let sph = new THREE.Spherical();
  // THREE.BoxGeometry
  let geometrys = []; //存储生成的几何体
  //   let texture = new THREE.TextureLoader().load(imgData);
  let count = 75000; //点的数量
  let sphRadius = 5; //球体半径

  // 黄金比例用作经度步长
  //经度指的是与x轴正方向的夹角，范围是【0,2*PI]
  const longitudeStep = Math.PI * (3 - Math.sqrt(5));
  // debugger
  /**
   * 1.标准球坐标系的半径为1，纬度角指的是球面上一点到赤道面的垂直距离
   * 2.当纬度角为1的时候在北极，0在赤道，-1在南极
   * 3.直径为2，在这个直径上平均分布，2 / counter为维度步长
   */
  const latitudeStep = 2 / count;

  /**
   * 设置经纬度初始值
   */
  let longitude = 0;
  let latitude = 1 - latitudeStep / 2; //设置为接近于1.靠近北极作为初始值。这里减去步长，避免北极点的点的重合

  for (let i = 0; i < count; i++) {
    // 当前纬度角对应的圆面的半径
    const r = Math.sqrt(1 - latitude * latitude);
    const p = new THREE.Vector3();
    p.set(
      Math.cos(longitude) * r,
      latitude,
      -Math.sin(longitude) * r
    ).multiplyScalar(sphRadius);
    longitude += longitudeStep;
    latitude -= latitudeStep;
    sph.setFromVector3(p);
    //lookat:旋转物体使其在世界空间中面朝一个点,
    //对于后面来说，就是让平面的法线与方向保持一致，平面朝向球体外部。
    dummyObj.lookAt(p);
    dummyObj.updateMatrix();

    const geometry = new THREE.PlaneGeometry(1, 1);
    geometry.applyMatrix4(dummyObj.matrix);
    // if(isNaN(p.x)){
    //   debugger
    // }
    geometry.translate(p.x, p.y, p.z);

    //每一个平面作为一个粒子，四个顶点，重复四次
    const centers = [
      p.x,
      p.y,
      p.z,
      p.x,
      p.y,
      p.z,
      p.x,
      p.y,
      p.z,
      p.x,
      p.y,
      p.z,
    ];

    /**
     * u 计算:
     * u 坐标计算通过将 theta 角度从 [-Math.PI, Math.PI] 范围映射到 [0, 1]


        v 计算: 1. - sph.phi / Math.PI
        v 坐标计算通过将 phi 角度从 [0, Math.PI] 范围映射到 [1, 0]，
        从而将“北极”（phi = 0）对应到纹理的顶部（v = 1），
        将“南极”（phi = Math.PI）对应到纹理的底部（v = 0）。
     */
    const uv = new THREE.Vector2(
      (sph.theta + Math.PI) / (2 * Math.PI),
      1 - sph.phi / Math.PI
    );
    //每个粒子是一个PlaneGeometry，它有四个顶点，所以这里重复的4次
    let uvs = [uv.x, uv.y, uv.x, uv.y, uv.x, uv.y, uv.x, uv.y];
    geometry.setAttribute(
      "center",
      new THREE.Float32BufferAttribute(centers, 3)
    );
    geometry.setAttribute("baseUv", new THREE.Float32BufferAttribute(uvs, 2));
    geometrys.push(geometry);
  }
  return geometrys;
}


/**生成飞行线曲线的函数
 * 
 * @param {开始位置} startPoint 
 * @param {结束位置} endPoint 
 * @param {飞行线高度} peakHeight 
 * @param {*} cycles 
 * @returns 
 */
function setPath(startPoint, endPoint, peakHeight, cycles) {
  const points = [];
  // let pos = l.geometry.attributes.position;
  let division = 100*3-1;
  let cycle = cycles || 1;
  let peak = peakHeight || 1;
  let radius = startPoint.length();
  let angle = startPoint.angleTo(endPoint);
  let arcLength = radius * angle;
  let diameterMinor = arcLength / Math.PI;
  let radiusMinor = (diameterMinor * 0.5) / cycle;
  let peakRatio = peak / diameterMinor;
  let radiusMajor = startPoint.length() + radiusMinor;
  let basisMajor = new THREE.Vector3().copy(startPoint).setLength(radiusMajor);
  let basisMinor = new THREE.Vector3()
    .copy(startPoint)
    .negate()
    .setLength(radiusMinor);
  let tri = new THREE.Triangle(startPoint, endPoint, new THREE.Vector3());
  let nrm = new THREE.Vector3();
  tri.getNormal(nrm);
  let v3Major = new THREE.Vector3();
  let v3Minor = new THREE.Vector3();
  let v3Inter = new THREE.Vector3();
  let vFinal = new THREE.Vector3();
  for (let i = 0; i <= division; i++) {
    let divisionRatio = i / division;
    let angleValue = angle * divisionRatio;
    v3Major.copy(basisMajor).applyAxisAngle(nrm, angleValue);
    v3Minor
      .copy(basisMinor)
      .applyAxisAngle(nrm, angleValue + Math.PI * 2 * divisionRatio * cycle);
    v3Inter.addVectors(v3Major, v3Minor);
    let newLength = (v3Inter.length() - radius) * peakRatio + radius;
    vFinal.copy(v3Inter).setLength(newLength);
    // pos.setXYZ(i, vFinal.x, vFinal.y, vFinal.z);
    points.push(new THREE.Vector3(vFinal.x, vFinal.y, vFinal.z));
  }
  // pos.needsUpdate = true;
  // l.computeLineDistances();
  // l.geometry.attributes.lineDistance.needsUpdate = true;
  // impacts[l.userData.idx].trailLength.value = l.geometry.attributes.lineDistance.array[99];
  // l.material.dashSize = 3;
  return points;
}

// function makeTrail(i, impacts) {
//   const linerPonits = new Array(100 * 3).fill(0);
//   const linerGeometry = new THREE.BufferGeometry();
//   //通过点队列设置该 BufferGeometry 的 attribute
//   linerGeometry.setFromPoints(linerPonits);
//   setPath(linerGeometry);
// }
