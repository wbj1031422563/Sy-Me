/*
 * @Author: FMC
 * @Date: 2024-08-18 17:17:29
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-22 21:03:14
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-china-traffic\sbpk-china-traffic.jsx
 * @Description:
 */
/**
 *
 * @returns 交通线路
 */
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as d3 from "d3";
import { Line } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import RoadGeometry from "./RoadGeometry";
import RoadMaterial from "./RoadMaterial";

extend({ RoadGeometry });
extend({RoadMaterial})

function SbpkChinaTraffic() {
  const lines = useRef([]);
  const [linesData, setLinesData] = useState([]);
  const texture = new THREE.TextureLoader().load("/img/图层 3.png");
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  const material = new RoadMaterial({
    // color:'red',
    // side:THREE.DoubleSide,
    // map: texture,
    // side: THREE.BackSide,
    // transparent: true,
  });
  useEffect(() => {
    const fileLoader = new THREE.FileLoader();
    fileLoader.load("/chinaTrain.json", (geoJson) => {
      const line1=[];
      const line2=[];
      const infoLen = [];
      const geoList = JSON.parse(geoJson)["features"];
      const aProjection = d3.geoMercator().scale(10).translate([0, 0]);
      const list = [];
      geoList.forEach((geo, index) => {
        const line = {
          data: geo.properties,
          points: [],
          geo: geo,
        };
        if (
          geo.geometry &&
          geo.geometry.coordinates &&
          !geo.properties.NAME.includes("地铁")
        ) {
          line.points = geo.geometry.coordinates.map((point) => {
            // 
            const [x, y] = aProjection(point);
            //   line.points.push(new THREE.Vector3(x, 0,y));
            return new THREE.Vector3(x, 0.11, y);
          });
          if(geo.properties.NAME.includes("京广")){
            line1.push(...line.points)
          }
          // if(geo.properties.NAME.includes("成昆")){
          //   line1.push(...line.points)
          // }
          const color = new THREE.Color();
          color.setHSL(0.8, Math.min(0.9, Math.random()), Math.random());
          line.data.color = color;
          const curve = new THREE.CatmullRomCurve3(line.points);
          line.curve = curve;
          const len = curve.getLength();
          if (len > 0.1) {
            infoLen.push(curve.getLength());
            line.geometry = new RoadGeometry(curve, 80, 0.01, 2);
            list.push(line);
          }
        }
      });
      // mergeBufferGeometries(list.map(item=>item.geometry));
      // console.log("max len", Math.max(...infoLen));
      // console.log("min len", Math.min(...infoLen));
      // console.log("len", infoLen.length);
      setLinesData(list);
    });
  }, []);
  useFrame((state, delta) => {
    const { clock } = state;
    // if (material) {
    //   material.uniforms.uTime.value = clock.getElapsedTime();
    // }
  });
  //   useEffect(()=>{
  //     console.log('lines',lines.length)
  //   },[lines])
  return (
    <>
      <group position={[-15.01, 0, -0.05]}>
        {linesData.length > 0 &&
          linesData.map((item, index) => {
            return (
              <mesh
                ref={(el) => (lines.current[index] = el)}
                key={item.data.NAME + index}
                geometry={item.geometry}
                // material={material}
              >
                <roadMaterial></roadMaterial>
              </mesh>
            );
          })}
      </group>
    </>
  );
}
export default SbpkChinaTraffic;
