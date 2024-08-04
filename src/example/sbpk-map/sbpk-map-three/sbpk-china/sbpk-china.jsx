/*
 * @Author: FMC
 * @Date: 2024-07-29 20:50:33
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-04 15:53:35
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-china\sbpk-china.jsx
 * @Description:
 */
import * as THREE from "three";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { Center, Helper, shaderMaterial, Line } from "@react-three/drei";
import { Line2 } from "three/examples/jsm/lines/Line2";
// import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
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
  const provinces=useRef([]);
  const [edge, setEdge] = useState([]);

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
  const addEdge = (
    mapBlockMesh,
    depth = 0.05,
    color = 0x66d4e5,
    linewidth = 3
  ) => {
    // 获取 mapBlockMesh 的顶点位置
    const positions = mapBlockMesh.geometry.attributes.position.array;
    const vertexCount = mapBlockMesh.geometry.attributes.position.count;

    // 创建用于存储线段端点的数组
    const linePoints = [];
    for (let i = 0; i < vertexCount; i++) {
      const index = i * 3;
      linePoints.push(
        new THREE.Vector3(positions[index], depth, positions[index + 2])
      );
    }

    // 创建一个 BufferGeometry 对象来生成边缘
    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setFromPoints(linePoints);

    // 生成边缘几何体
    const edgesGeometry = new THREE.EdgesGeometry(bufferGeometry);

    // 获取边缘几何体的顶点位置属性
    const edgePositionAttribute = edgesGeometry.getAttribute("position");
    const edgeVertices = [];
    const edgeVertexCount = edgePositionAttribute.count;

    // 从顶点位置属性中提取边缘顶点
    for (let i = 0; i < edgeVertexCount; i++) {
      const index = i * 3;
      edgeVertices.push([
        edgePositionAttribute.array[index],
        edgePositionAttribute.array[index + 1],
        edgePositionAttribute.array[index + 2],
      ]);
    }

    // 更新边缘数据状态
    setEdge(edgeVertices);
  };

  useEffect(() => {
    const fileLoader = new THREE.FileLoader();
    fileLoader.load(
      "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json",
      (geoJson) => {
        const geo = JSON.parse(geoJson);
        console.log("geo", geo);
        // 104.065735, 30.659462
        const aProjection = d3.geoMercator().scale(10).translate([0, 0]);

        // let china = geo.features[0].geometry.coordinates;
        // // let china = geo.features.map(item=>item.geometry.coordinates)
        // china = china.slice(0, 8);
        const provinceList = [];
        const ps = geo.features.slice(0, 32);

        ps.forEach((c) => {
          const province={
            key:c.properties.adcode,
            name:c.properties.name,
            border:[],
            info:c.properties
          }
          province.center=aProjection(c.properties.center);
          let border = c.geometry.coordinates;
          // let info=c.properties;
          // console.log('china',c);

          /**
           * 中国地图GeoJson转化为平面
           */
          border.forEach((item1) => {
            const shape = new THREE.Shape();
            if (item1[0].length === 2) {
              item1.forEach((item2, index) => {
                const [x, y] = aProjection(item2);
                if (index === 0) {
                  shape.moveTo(x, -y);
                } else {
                  shape.lineTo(x, -y);
                }
              });
            } else {
              // console.log('item',item1)
              item1[0].forEach((item2, index) => {
                const [x, y] = aProjection(item2);
                if (index === 0) {
                  shape.moveTo(x, -y);
                } else {
                  shape.lineTo(x, -y);
                }
              });
            }
            province.border.push(shape);
          });

          provinceList.push(province);
        });
        const shapes=provinceList.map(item=>item.border);
        console.log("provinceList", provinceList);

        chinaRef.current.geometry = new THREE.ExtrudeGeometry(shapes.flat(), {
          depth: 0.05,
          bevelEnabled: false,
        });

        chinaRef.current.geometry.rotateX(-Math.PI * 0.5);
        adjustUVs(chinaRef.current.geometry);
        addEdge(chinaRef.current);
        console.log("chinaRef.current", chinaRef.current);
      }
    );
  }, []);

  return (
    <>
      <group scale={[1, 1, 1]} position={[-15, 0, 0]}>
        <mesh ref={chinaRef}>
          {/* <meshBasicMaterial color={"red"} /> */}
          {/* <Helper type={THREE.BoxHelper}></Helper> */}
          <blockMaterial />
          {edge.length > 0 && (
            <Line points={edge} color="#66D4E5" segments={true} lineWidth={2} />
          )}
        </mesh>
      </group>

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
