/*
 * @Author: FMC
 * @Date: 2024-07-29 20:50:33
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-04 19:10:35
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
  const [provinces,setProvinces]=useState([]);
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
        const geoList = geo.features.slice(22, 23);

        geoList.forEach((geoItme) => {
          const province={
            key:geoItme.properties.adcode,
            name:geoItme.properties.name,
            border:[],
            center:null,
            info:geoItme.properties
          }
          province.center=aProjection(geoItme.properties.center);
          let border = geoItme.geometry.coordinates;
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

  return (
    <>
      {
        provinces.map(item=> <SbpkChinaMapBlock key={item.key} map={item}/>)
      }
    </>
  );
}
export default SbpkChina;

