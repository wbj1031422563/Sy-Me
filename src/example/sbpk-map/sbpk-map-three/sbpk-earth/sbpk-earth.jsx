/*
 * @Author: FMC
 * @Date: 2024-07-15 21:43:01
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-28 11:17:01
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-earth\sbpk-earth.jsx
 * @Description:
 */
import { useTexture } from "@react-three/drei";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { extend, useFrame } from "@react-three/fiber";
import vs from "./shader/vs.glsl";
import fs from "./shader/fs.glsl";
import linnerFS from "./shader/liner/liner.fs.glsl";
import * as THREE from "three";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { useEffect, useRef, useState } from "react";
import TWEEN from "@tweenjs/tween.js";
import { useControls } from "leva";
import GUI from "lil-gui";
import EarthMaterial from "./material/earthMaterial";
import TrailLinerMaterial from "./material/trailLinerMaterial";
// import chinaMap from './map.json';

import * as d3 from "d3";

extend({ EarthMaterial });
extend({ TrailLinerMaterial });

const maxImactAmount = 10;
function SbpkEarth() {
  const earthRef = useRef();
  const linerRefs = useRef([]);
  const chinaBorderRefs = useRef(null);
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
          .setLength(5),// 冲击波的随机起点
        impactMaxRadius: 5 * THREE.MathUtils.randFloat(0.5, 0.75),// 冲击波的随机最大半径
        impactRatio: 0,// 冲击波的动画step控制量
        prevPosition: new THREE.Vector3().random().subScalar(0.5).setLength(5),
        trailRatio: { value: 0 },//飞线动画step控制量
        trailLength: { value: 0 },//飞线长度
        linerGeometry: null,
        runTween: null,//飞线动画函数
      });
      list[i].linerGeometry = new THREE.BufferGeometry().setFromPoints(
        setPath(list[i].impactPosition, list[i].prevPosition, 1)
      );
    }
    return list;
  });
  // 合并几何体
  const geometrys = mergeBufferGeometries(makeGlobeOfPoints());
  useEffect(() => {
    if (linerRefs.current && linerRefs.current.length > 0) {
      linerRefs.current.forEach((item) => {
        /**
         * .computeLineDistances () : this
            计算LineDashedMaterial所需的距离的值的数组。 对于几何体中的每一个顶点，这个方法计算出了当前点到线的起始点的累积长度。
         */
        item.computeLineDistances();
        item.geometry.attributes.lineDistance.needsUpdate = true;
      });
      setImpacts(() =>
        impacts.map((item, index) => {
          //记录飞行线长度,获取飞行线的总长度，传入shader
          //每条飞线有100个点。299=100*3-1
          item.trailLength.value =
            linerRefs.current[
              index
            ].geometry.attributes.lineDistance.array[299];
          linerRefs.current[index].material.uniforms.lineLength.value =
            item.trailLength.value;
          return item;
        })
      );

      setImpacts(() =>
        impacts.map((item, index) => {
          // console.log('item.trailLength.value',item.trailLength.value)
          item.runTween = () => {
            /**
             * 飞线动画
             */
            const len = item.trailLength.value;
            const speed = 3;
            // 确保飞线的运动速度恒定
            const dur = len / speed;
            let tweenTrail = new TWEEN.Tween({ value: 0 })
              .to({ value: 1 }, dur * 1000)
              .onUpdate((val) => {
                linerRefs.current[index].material.uniforms.actionRatio.value =
                  val.value;
              });
            /**
             * 冲击波动画
             */
            let tweenImpact = new TWEEN.Tween({ value: 0 })
              .to({ value: 1 }, THREE.MathUtils.randInt(2500, 5000))
              .onUpdate((val) => {
                // item.impactRatio=val;
                earthRef.current.material.uniforms.impactRatioList.value[
                  index
                ] = val.value;
              })
              .onComplete(() => {
                item.prevPosition.copy(impacts[index].impactPosition);
                //在球面上随机生成冲击波的起点
                item.impactPosition.random().subScalar(0.5).setLength(5);

                //重新生成飞线的几何体
                linerRefs.current[index].geometry =
                  new THREE.BufferGeometry().setFromPoints(
                    setPath(item.impactPosition, item.prevPosition, 1)
                  );
                //重新计算飞线长度并传入shader中
                linerRefs.current[index].computeLineDistances();
                linerRefs.current[
                  index
                ].geometry.attributes.lineDistance.needsUpdate = true;
                linerRefs.current[index].material.uniforms.lineLength.value =
                  linerRefs.current[
                    index
                  ].geometry.attributes.lineDistance.array[299];

                //重新生成冲击波的最大半径和位置，将飞线的落地点作为冲击波的起点中心，随机生成冲击波动画半径
                earthRef.current.material.uniforms.impactMaxRadiusList.value[
                  index
                ] = 5 * THREE.MathUtils.randFloat(0.5, 0.75);
                earthRef.current.material.uniforms.impactPositionList.value[
                  index
                ] = item.prevPosition;

                //冲击波动画完成后，重新生成飞线动画
                const len =
                  linerRefs.current[index].geometry.attributes.lineDistance
                    .array[299];
                const speed = 3;
                const dur = len / speed;
                const newTweenTrail = new TWEEN.Tween({ value: 0 })
                  .to({ value: 1 }, dur * 1000)
                  .onUpdate((val) => {
                    linerRefs.current[
                      index
                    ].material.uniforms.actionRatio.value = val.value;
                  });

                //再次链接冲击波动画，实现循环
                newTweenTrail.chain(tweenImpact);
                newTweenTrail.start();
              });

            tweenTrail.chain(tweenImpact);
            tweenTrail.start();
          };
          item.runTween();
          return item;
        })
      );
    }
  }, []);

  useEffect(()=>{
    makeGlobeOfPointsChina();
  },[])

  useFrame((state, delta) => {
    // if (earthRef.current) {
    //   earthRef.current.rotation.y += delta * 0.25;
    // }
    TWEEN.update();
  });
  const fileLoader = new THREE.FileLoader();
  fileLoader.load(
    "https://geo.datav.aliyun.com/areas_v3/bound/100000.json",
    (geoJson) => {
      console.log("geoJson", JSON.parse(geoJson));
      const geo = JSON.parse(geoJson);

      const aProjection = d3.geoMercator().scale(100).translate([0, 0]);
      const bProjection = d3.geoOrthographic().scale(50).translate([0, 0]);
      let china = geo.features[0].geometry.coordinates;
      china = china.slice(0, 1);
      // const geometries = [];
      const shapes = [];
      /**
       * 中国地图GeoJson转化为平面
       */
      china.forEach((item1) => {
        const shape = new THREE.Shape();
        item1[0].forEach((item2, index) => {
          const [x, y] = aProjection(item2);
          if (index === 0) {
            shape.moveTo(x, -y);
          } else {
            shape.lineTo(x, -y);
          }
        });
        shapes.push(shape);
      });
      // chinaBorderRefs.current.geometry = new THREE.ExtrudeGeometry(shapes, {
      //   depth: 0.05,
      //   bevelEnabled: false,
      // });

      /**
       * 中国地图转球面坐标系
       */
      const sphGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(5384 * 3);
      const  mapCoordinates=[];
      const radius = 5; //球坐标系半径
      let positionIndex = 0;
      china.forEach((item1) => {
        item1[0].forEach(([lon, lat], index) => {
          const spherical = new THREE.Spherical(
            radius,
            THREE.MathUtils.degToRad(90 - lat),
            THREE.MathUtils.degToRad(lon)
          );
          const position = new THREE.Vector3().setFromSpherical(spherical);
          positions[positionIndex] = position.x;
          positions[positionIndex + 1] = position.y;
          positions[positionIndex + 2] = position.z;
          positionIndex += 3;

          mapCoordinates.push(position);
        });
      });
      sphGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      chinaBorderRefs.current.geometry = sphGeometry;

      // 创建纹理
      const texture = new THREE.DataTexture(positions, positions.length/3, 1, THREE.RGBFormat, THREE.FloatType);
      texture.needsUpdate = true;
      // console.log('positions/3',positions.length/3)
      earthRef.current.material.uniforms.mapTexture.value=texture;
    }
  );
  return (
    <>
      <group>
        <mesh ref={earthRef} geometry={geometrys}>
          <earthMaterial args={[impacts]} />
          {impacts.map((item, index) => (
            <line
              ref={(ref) => (linerRefs.current[index] = ref)}
              key={index}
              geometry={item.linerGeometry}
            >
              <trailLinerMaterial args={[item.trailRatio, item.trailLength]} />
            </line>
          ))}
        </mesh>
        {/* 射线捕获的目标 */}
        {/* <mesh
          visible={true}
          scale={[5.01, 5.01, 5.01]}
          onClick={() => {
            console.log("地球被点击了");
          }}
        >
          <sphereGeometry />
          <meshBasicMaterial />
        </mesh> */}

        {/* 平面中国地图 */}
        {/* <mesh ref={chinaBorderRefs} scale={[0.05, 0.05, 1]}>
          <meshBasicMaterial color={"red"} />
        </mesh> */}
        {/* 球坐标系中国地图 */}
        <points ref={chinaBorderRefs}>
          <pointsMaterial color={"red"} size={0.05} />
        </points>
        {/* <mesh scale={[5, 5, 5]}>
          <sphereGeometry />
          <meshBasicMaterial wireframe={true} />
        </mesh> */}
      </group>
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
    const aInside=[
      0,
      0,
      0,
      0,
    ]

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
    geometry.setAttribute(
      "aInside",
      new THREE.Float32BufferAttribute(aInside, 1)
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
  let division = 100 * 3 - 1;
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
    points.push(new THREE.Vector3(vFinal.x, vFinal.y, vFinal.z));
  }
  return points;
}


 function makeGlobeOfPointsChina() {
  const fileLoader = new THREE.FileLoader();
  fileLoader.load(
    "https://geo.datav.aliyun.com/areas_v3/bound/100000.json",
    (geoJson) => {
      const geo = JSON.parse(geoJson);
      let china = geo.features[0].geometry.coordinates;
      china = china.slice(0, 1);
      const polygon = [];
      /**
       * 中国地图转球面坐标系
       */
      china.forEach((item1) => {
        item1[0].forEach(([lon, lat], index) => {
          polygon.push(latLonToCartesian(lat, lon, 5));
        });
      });
      console.log('polygon', polygon);

      const points = [];
      // let sph = new THREE.Spherical();
      let count = 75000; // 点的数量
      let sphRadius = 5; // 球体半径
      const longitudeStep = Math.PI * (3 - Math.sqrt(5));
      const latitudeStep = 2 / count;
      let longitude = 0;
      let latitude = 1 - latitudeStep / 2; // 设置为接近于1.靠近北极作为初始值。这里减去步长，避免北极点的点的重合
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
        points.push(p);
      }
      console.log('points', points);

      const mid=Math.floor((polygon.length-1)*0.5)
      const normal = computeNormal(polygon[0], polygon[1], polygon[2]);
      const planePoint = polygon[0];
      const projectedPolygon = polygon.map(p => projectToPlane(p, normal, planePoint));
      const res = points.filter((point,index) => {
        const projectedPoint = projectToPlane(point, normal, planePoint);
        return isPointInPolygon(projectedPoint, projectedPolygon);
      });

      // points.forEach(item=>{})
      console.log('total', count);
      console.log('inside', res.length);
    }
  );
}


function computeNormal(p1, p2, p3) {
  const u = new THREE.Vector3().subVectors(p2, p1);
  const v = new THREE.Vector3().subVectors(p3, p1);
  return new THREE.Vector3().crossVectors(u, v).normalize();
}

// 经纬度转换为笛卡尔坐标
function latLonToCartesian(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

// Ray-Casting Algorithm
function isPointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
function projectToPlane(point, planeNormal, planePoint) {
  const toPoint = new THREE.Vector3().subVectors(point, planePoint);
  const distance = toPoint.dot(planeNormal);
  return point.clone().sub(planeNormal.clone().multiplyScalar(distance));
}
