/*
 * @Author: FMC
 * @Date: 2024-07-29 20:50:33
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-12 22:12:04
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-china-map-block\sbpk-china-map-block.jsx
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
import sbpkChinaBlockVs from "../sbpk-china/shader/sbpk-china-block.vs.glsl";
import sbpkChinaBlockFs from "../sbpk-china/shader/sbpk-china-block.fs.glsl";
import SbpkModelDfmz from "../sbpk-model/sbpk-model-dfmz";
import SbpkModelTt from "../sbpk-model/sbpk-model-tt";
import SbpkModelGz from "../sbpk-model/sbpk-model-gz";
import GUI from "lil-gui";

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

function SbpkChinaMapBlock({
  map = {
    key: 110000,
    name: "北京市",
    border: [],
    info: {},
    center: null,
  },
  colorObj={
    borderColor: new THREE.Color("#93EBF8"),
    innerColor: new THREE.Color("#154e90"),
    outColor: new THREE.Color("#66D4E5"),
  }
}) {
  const chinaRef = useRef(null);
  const [edge, setEdge] = useState([]);
  // const [cubeState, setCubeState] = useState({
  //   borderColor:  "#93EBF8",
  //   innerColor:  "#154e90",
  //   outColor: "#66D4E5",
  // });

  /**
   *
   * @param {几何体} geometry
   */
  const adjustUVs = (geometry) => {
    //计算包围和
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    //得到包围盒size
    const size = bbox.getSize(new THREE.Vector3());
    const min = bbox.min;
    const max = bbox.max;

    // 得到包围基点，注意这里是二维平面上的
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

      //地图块位于x-z平面上
      baseUv[i2] = (positions[i3] - basePosition.x) / size.x;
      baseUv[i2 + 1] = (positions[i3 + 2] - basePosition.y) / size.z;
    }
    geometry.setAttribute("aBaseUv", new THREE.BufferAttribute(baseUv, 2));
  };
  /**
   *
   * @param {网格对象} mapBlockMesh
   * @param {拉伸高度} depth
   */
  const addEdge = (mapBlockMesh, depth = 0.1) => {
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
    chinaRef.current.geometry = new THREE.ExtrudeGeometry(map.border.flat(), {
      depth: 0.1,
      bevelEnabled: false,
    });
    chinaRef.current.geometry.rotateX(-Math.PI * 0.5);
    adjustUVs(chinaRef.current.geometry);
    addEdge(chinaRef.current);
    console.log('chinaRef.current.geometry',chinaRef.current.geometry)
  }, [map]);

  useEffect(()=>{
    chinaRef.current.material.uniforms.innerColor.value=new THREE.Color(colorObj.innerColor);
    chinaRef.current.material.uniforms.borderColor.value=new THREE.Color(colorObj.borderColor);
    chinaRef.current.material.uniforms.outColor.value=new THREE.Color(colorObj.outColor);
  },[colorObj])
  // useEffect(()=>{
  //   let gui = new GUI({
  //     title: "控制面板",
  //     width: "320",
  //     closeFolders: true,
  //   });
  //   gui.addColor(cubeState, "innerColor").onChange((v) => {
  //     chinaRef.current.material.uniforms.innerColor.value=new THREE.Color(v)
  //   });
  // },[])

  return (
    <>
      <mesh
        ref={chinaRef}
        scale={[1, 1, 1]}
        position={[-15, 0, 0]}
        onClick={() => {
          // alert(`${map.name}中心在${map.center}`);
        }}
      >
        {/* <meshBasicMaterial color={"red"} /> */}
        {/* <Helper type={THREE.BoxHelper}></Helper> */}
        <blockMaterial />
        {edge.length > 0 && (
          <Line points={edge} color="#66D4E5" segments={true} lineWidth={2} />
        )}
        {map.name === "上海市" && (
          <SbpkModelDfmz position={[map.center[0], 0.12, map.center[1]]} />
        )}
        {map.name === "北京市" && (
          <SbpkModelTt position={[map.center[0], 0.1, map.center[1]]} />
        )}
        {map.name === "广东省" && (
          <SbpkModelGz position={[map.center[0], 0.1, map.center[1]]} />
        )}
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
export default SbpkChinaMapBlock;
