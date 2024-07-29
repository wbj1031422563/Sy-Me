import * as THREE from "three";
import * as d3 from "d3";
import { useRef } from "react";
import { Center, Helper, shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import sbpkChinaBlockVs from "./shader/sbpk-china-block.vs.glsl";
import sbpkChinaBlockFs from "./shader/sbpk-china-block.fs.glsl";

const BlockMaterial = shaderMaterial(
  { time: 0, color: new THREE.Color(0.2, 0.0, 0.1),
    borderColor:new THREE.Color("#93EBF8"),
    innerColor:new THREE.Color("#154e90"),
    outColor:new THREE.Color("#66D4E5")
  },
  sbpkChinaBlockVs,
  sbpkChinaBlockFs
);

extend({ BlockMaterial });

function SbpkChina() {
  const chinaRef = useRef(null);

  const fileLoader = new THREE.FileLoader();
  fileLoader.load(
    "https://geo.datav.aliyun.com/areas_v3/bound/100000.json",
    (geoJson) => {
      const geo = JSON.parse(geoJson);
      // console.log("geo", geo);

        const aProjection = d3.geoMercator().scale(100).translate([0, 0]);
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
        console.log('chinaRef.current',chinaRef.current);
        
    }
  );

  return (
    <>
      <mesh ref={chinaRef} scale={[0.08, 0.08, 1]} position={[-15,0,0]}  rotation-x={-Math.PI*0.5}>
          {/* <meshBasicMaterial color={"red"} />
          <Helper type={THREE.BoxHelper}></Helper> */}
           <blockMaterial />
        </mesh>
      <mesh scale={[5, 5, 0.1]} rotation-x={Math.PI*0.5}>
        <boxGeometry></boxGeometry>
        <blockMaterial />
      </mesh>
      {/* <mesh scale={[5, 5, 0.01]} rotation-x={Math.PI*0.5} position-y={-0.1}>
        <boxGeometry></boxGeometry>
        <meshBasicMaterial  color={[123/255,195/255,(246/255)*5.5]} toneMapped={false} />
      </mesh> */}
    </>
  );
}
export default SbpkChina;
