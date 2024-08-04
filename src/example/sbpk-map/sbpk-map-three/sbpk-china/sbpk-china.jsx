/*
 * @Author: FMC
 * @Date: 2024-07-29 20:50:33
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-04 10:40:52
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-china\sbpk-china.jsx
 * @Description:
 */
import * as THREE from "three";
import * as d3 from "d3";
import { useRef } from "react";
import { Center, Helper, shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import sbpkChinaBlockVs from "./shader/sbpk-china-block.vs.glsl";
import sbpkChinaBlockFs from "./shader/sbpk-china-block.fs.glsl";

const BlockMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.2, 0.0, 0.1),
    borderColor: new THREE.Color("#93EBF8"),
    innerColor: new THREE.Color("#154e90"),
    outColor: new THREE.Color("#66D4E5"),
  },
  sbpkChinaBlockVs,
  sbpkChinaBlockFs
);

extend({ BlockMaterial });

function SbpkChina() {
  const chinaRef = useRef(null);

  const adjustUVs = (geometry) => {
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    const size = bbox.getSize(new THREE.Vector3());
    const min = bbox.min;
    const max = bbox.max;
    const basePosition = new THREE.Vector2(
      Math.min(min.x, max.x),
      Math.min(min.z, max.z)
    );

    const positions = geometry.attributes.position.array;
    const count = geometry.attributes.position.count;
    const baseUv = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const i2 = i * 2;

      baseUv[i2] = (positions[i3] - basePosition.x) / size.x;
      baseUv[i2 + 1] = (positions[i3 + 2] - basePosition.y) / size.z;
    }
    geometry.setAttribute("aBaseUv", new THREE.BufferAttribute(baseUv, 2));
  };

  const fileLoader = new THREE.FileLoader();
  fileLoader.load(
    "https://geo.datav.aliyun.com/areas_v3/bound/100000.json",
    (geoJson) => {
      const geo = JSON.parse(geoJson);
      // console.log("geo", geo);

      const aProjection = d3.geoMercator().scale(10).translate([0, 0]);
      let china = geo.features[0].geometry.coordinates;
      china = china.slice(0, 1);
      const geometries = [];
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

      chinaRef.current.geometry = new THREE.ExtrudeGeometry(shapes, {
        depth: 0.05,
        bevelEnabled: false,
      });

      chinaRef.current.geometry.rotateX(-Math.PI * 0.5);

      adjustUVs(chinaRef.current.geometry);
      console.log("chinaRef.current", chinaRef.current);

      const pointsPositions = chinaRef.current.geometry.attributes.position.array;
      const count = chinaRef.current.geometry.attributes.position.count;
      const ponitsGeometry = new THREE.BufferGeometry();
      const lp = [];
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        // lp[i3] = pointsPositions[i3];
        // lp[i3 + 1] = 5.0;
        // lp[i3 + 2] = pointsPositions[i3 + 2];
        lp.push(new THREE.Vector3(
          pointsPositions[i3],
          0.05,
          pointsPositions[i3 + 2]
        ))
      }
      ponitsGeometry.setFromPoints(lp);
      const pointsMaterial = new THREE.PointsMaterial({
        color: '#66D4E5',
        size:0.05,
      });
      const points = new THREE.Points( ponitsGeometry, pointsMaterial );
      chinaRef.current.add(points);
    // const line = new THREE.Mesh( geometry, material );

      //todo
      //手动计算uv,现在的uv的值都是两百多，肯定不行！！！！！！

      // chinaRef.
    }
  );

  return (
    <>
      <mesh ref={chinaRef} scale={[1, 1, 1]} position={[-15, 0, 0]}>
        {/* <meshBasicMaterial color={"red"} /> */}
        <Helper type={THREE.BoxHelper}></Helper>
        <blockMaterial />
      </mesh>
      {/* <mesh scale={[5, 5, 0.1]} rotation-x={Math.PI*0.5}>
        <boxGeometry></boxGeometry>
        <blockMaterial />
      </mesh> */}
      {/* <mesh scale={[5, 5, 0.01]} rotation-x={Math.PI*0.5} position-y={-0.1}>
        <boxGeometry></boxGeometry>
        <meshBasicMaterial  color={[123/255,195/255,(246/255)*5.5]} toneMapped={false} />
      </mesh> */}
    </>
  );
}
export default SbpkChina;
