/*
 * @Author: FMC
 * @Date: 2024-07-15 21:43:01
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-17 23:40:58
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-earth\sbpk-earth.jsx
 * @Description:
 */
import { useTexture } from "@react-three/drei";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { extend } from "@react-three/fiber";
import vs from "./shader/vs.glsl";
import fs from "./shader/fs.glsl";
import * as THREE from "three";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  resolution: null,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};
sizes.resolution = new THREE.Vector2(
  window.innerWidth * sizes.pixelRatio,
  window.innerHeight * sizes.pixelRatio
);
const texture = new THREE.TextureLoader().load("/img/earth.jpg");
// console.log('texture',texture)

class EarthMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uResolution: {
          value: sizes.resolution,
        },
        uTexture:{
          value:texture
        }
      },
      vertexShader: vs,
      fragmentShader: fs,
    });
  }
}
extend({ EarthMaterial });

function SbpkEarth() {

  const geometry = makeGlobeOfPoints();
  return (
    <>
      <points geometry={geometry}>
        {/* <sphereGeometry></sphereGeometry> */}
        <earthMaterial />
      </points>
    </>
  );
}
export default SbpkEarth;

function makeGlobeOfPoints() {
  const geometry = new THREE.BufferGeometry();
  let sph = new THREE.Spherical();
  // THREE.BoxGeometry
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

  const positions = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const n=new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const i2 = i * 2;
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
    positions[i3] = p.x;
    positions[i3 + 1] = p.y;
    positions[i3 + 2] = p.z;

    n[i3] = p.x;
    n[i3 + 1] = p.y;
    n[i3 + 2] = p.z;

    uvs[i2] = uv.x;
    uvs[i2 + 1] = uv.y;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aUv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("aNormal", new THREE.BufferAttribute(n, 2));
  // geometry.setAttribute("aN", new THREE.BufferAttribute(uvs, 2));

  return geometry;
}
