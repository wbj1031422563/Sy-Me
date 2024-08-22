/*
 * @Author: FMC
 * @Date: 2024-07-29 20:50:33
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-22 21:11:29
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
import SbpkChinaMapBlock from "../sbpk-china-map-block/sbpk-china-map-block";
import GUI from "lil-gui";
import SbpkChinaTraffic from "../sbpk-china-traffic/sbpk-china-traffic";
import SbpkChinaTrafficTest from "../sbpk-china-traffic-test/sbpk-china-traffic-test";

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
  const [provinces, setProvinces] = useState([]);
  const [edge, setEdge] = useState([]);

  const [cubeState, setCubeState] = useState({
    borderColor: "#93EBF8",
    innerColor: "#149fc2",
    outColor: "#073378",
  });

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
        // console.log("geo", geo);
        // 104.065735, 30.659462
        const aProjection = d3.geoMercator().scale(10).translate([0, 0]);

        // let china = geo.features[0].geometry.coordinates;
        // // let china = geo.features.map(item=>item.geometry.coordinates)
        // china = china.slice(0, 8);
        const provinceList = [];
        const geoList = geo.features.slice(0, 33);

        geoList.forEach((c) => {
          const province = {
            key: c.properties.adcode,
            name: c.properties.name,
            border: [],
            center: null,
            info: c.properties,
          };
          province.center = aProjection(c.properties.center);
          let border = c.geometry.coordinates;
          // let info=c.properties;
          // console.log('china',c);

          /**
           * GeoJson转化为shape
           */
          border.forEach((item1) => {
            const shape = new THREE.Shape();
            if (item1[0].length === 2) {
              // 内蒙古的边界数据的特殊处理
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
        setProvinces(provinceList);
      }
    );
  }, []);

  useEffect(() => {
    // let gui = new GUI({
    //   title: "控制面板",
    //   width: "320",
    //   closeFolders: true,
    // });
    // gui.addColor(cubeState, "innerColor").onChange((v) => {
    //   setCubeState({
    //     ...cubeState,
    //     innerColor: v,
    //   });
    // });
    // gui.addColor(cubeState, "outColor").onChange((v) => {
    //   setCubeState({
    //     ...cubeState,
    //     outColor: v,
    //   });
    // });
    // gui.addColor(cubeState, "innerColor").onChange((v) => {
    //   setCubeState({
    //     ...cubeState,
    //     innerColor: v,
    //   });
    // });
  }, []);

  return (
    <>
      <group position={[-4.5, 0, 5.5]}>
        {provinces.map((item) => (
          <SbpkChinaMapBlock key={item.key} map={item} colorObj={cubeState} />
        ))}
        {/* <SbpkChinaTraffic /> */}
        <SbpkChinaTrafficTest/>
      </group>
      {/* <SbpkChinaTrafficTest/> */}
    </>
  );
}
export default SbpkChina;
