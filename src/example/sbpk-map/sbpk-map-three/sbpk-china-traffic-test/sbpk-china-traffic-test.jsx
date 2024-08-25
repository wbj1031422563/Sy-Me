/*
 * @Author: FMC
 * @Date: 2024-08-18 17:17:29
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-25 11:01:50
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-china-traffic-test\sbpk-china-traffic-test.jsx
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
import RoadTestGeometry from "./RoadGeometry";
import RoadGeometry from "../sbpk-china-traffic/RoadGeometry";
import RoadMaterial from "../sbpk-china-traffic/RoadMaterial";
extend({ RoadMaterial });

function SbpkChinaTrafficTest() {
  const reft = useRef(null);
  useEffect(() => {
    const fileLoader = new THREE.FileLoader();
    fileLoader.load("/chinaTrain.json", (geoJson) => {
      const line1 = [];
      const line2 = [];
      const geoList = JSON.parse(geoJson)["features"];
      const aProjection = d3.geoMercator().scale(10).translate([0, 0]);
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
            // debugger
            const [x, y] = aProjection(point);
            //   line.points.push(new THREE.Vector3(x, 0,y));
            return new THREE.Vector3(x, 0.11, y);
          });
          // if (geo.properties.NAME.includes("京广")) {
          //   line1.push(line.points);
          // }
          // if (geo.properties.NAME.includes("成昆")) {
          //   line2.push(line.points);
          // }
          line1.push(new THREE.CatmullRomCurve3(line.points))
        }
      });

      console.log("京广", line1);
      // //京广
      // const jg1 = new THREE.CatmullRomCurve3(line1[2]);
      // const jg2 = new THREE.CatmullRomCurve3(line1[7]);
      // // 成昆
      // const ck1 = new THREE.CatmullRomCurve3(line2[1]);
      // const ck2 = new THREE.CatmullRomCurve3(line2[2]);

      reft.current.geometry = new RoadTestGeometry(
        line1,
        80,
        0.01,
        2
      );
      reft.current.material = new RoadMaterial();
      // debugger
    });
  }, []);
  useFrame((state, delta) => {
    const { clock } = state;
    if (reft.current&&reft.current.material) {
      reft.current.material.uniforms.uTime.value = clock.getElapsedTime();
    }
  });
  return (
    <>
      <group position={[-15.01, 0, -0.05]}>
        <mesh ref={reft}>
          {/* <boxBufferGeometry></boxBufferGeometry> */}
          {/* <meshBasicMaterial color={'red'}></meshBasicMaterial> */}
          {/* <roadMaterial></roadMaterial> */}
        </mesh>
        <line></line>
      </group>
    </>
  );
}
export default SbpkChinaTrafficTest;
