/**
 *
 * @returns 交通线路
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as d3 from "d3";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

function SbpkChinaTraffic() {
  const lines = useRef([]);
  const [linesData, setLinesData] = useState([]);
  const texture = new THREE.TextureLoader().load("/img/流光.png");
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    transparent: true,
  });
  useEffect(() => {
    const fileLoader = new THREE.FileLoader();
    fileLoader.load("/chinaTrain2.json", (geoJson) => {
      const geoList = JSON.parse(geoJson)["features"];
      const aProjection = d3.geoMercator().scale(10).translate([0, 0]);
      const list = [];
      geoList.forEach((geo) => {
        // console.log("geo", geo);
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
          const color = new THREE.Color();
          color.setHSL(0.8, Math.min(0.9, Math.random()), Math.random());
          line.data.color = color;
          const curve = new THREE.CatmullRomCurve3(line.points);
          line.curve = curve;
          line.geometry = new THREE.TubeGeometry(curve, 80, 0.006);
          list.push(line);
        }
      });

      // const
      // console.log('list',list);
      setLinesData(list);
    });
  }, []);
  useFrame(()=>{
    if(texture){
      texture.offset.x-=0.01;
    }
  })
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
                key={item.data.NAME + index}
                geometry={item.geometry}
                material={material}
              ></mesh>
            );
          })}
      </group>
    </>
  );
}
export default SbpkChinaTraffic;
