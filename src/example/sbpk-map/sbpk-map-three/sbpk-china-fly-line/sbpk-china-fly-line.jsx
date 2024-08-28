import { useEffect, useState, useRef ,useContext} from "react";
import * as THREE from "three";
import { AreaContext } from "../../context/sbpk-area-context";
import TWEEN from "@tweenjs/tween.js";
import { useFrame } from "@react-three/fiber";
function SbpkChianFlyLine({ list }) {
  const area=useContext(AreaContext);
  //   const [lines, setLines] = useState([]);
  const texture = new THREE.TextureLoader().load("/img/飞线贴图3.png");
  texture.repeat.set(150, 2);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  // texture.wrapS=THREE.RepeatWrapping;
  // texture.wrapT=THREE.RepeatWrapping;
  // texture.repeat.x=1;
  // texture.repeat.y=1;
  // const materail=new THREE.MeshBasicMaterial({
  //   map:texture,
  //   color:'red',
  //   transparent:true
  // })
  const linerRefs = useRef([]);
  let lines = [];
  const init = () => {
    if (list.length < 1) return [];
    let res = [];
    let target = new THREE.Vector3();
    let province = null;
    switch (area) {
      case "华东地区":
        province = list.find((item) => item.name == "上海市");
        target.x = province.center[0];
        target.z = province.center[1];
        break;
      case "华北地区":
        province = list.find((item) => item.name == "北京市");
        target.x = province.center[0];
        target.z = province.center[1];
        break;
      case "华南地区":
        province = list.find((item) => item.name == "广东省");
        target.x = province.center[0];
        target.z = province.center[1];
        break;
      default:
        return [];
    }
    res = list.filter(
      (item) =>
        item.name !== "上海市" ||
        item.name !== "广东省" ||
        item.name !== "北京市"
    );
    res = res.map((item) => {
      const { cure, len } = setPath(
        new THREE.Vector3(item.center[0], 0, item.center[1]),
        target
      );
      const geo = new THREE.TubeGeometry(cure, 100, 0.005, 2, false);
      item.geo = geo;
      item.len = len;
      return item;
    });
    // setLines(res)
    return res;
  };
  lines = init();

  useFrame((state, delta) => {
    texture.offset.x -= delta * 5;
  });
  // useEffect(()=>{},[])

  return (
    <>
      <group position={[-15, 0, 0]}>
        {lines.map((item, index) => {
          return (
            <mesh
              key={index}
              geometry={item.geo}
              // materail={materail}
              ref={(ref) => (linerRefs.current[index] = ref)}
            >
              {/* <lineBasicMaterial color={"red"}></lineBasicMaterial> */}
              {/* <trailLinerMaterial args={[0,item.len]} /> */}
              {/* <roadMaterial></roadMaterial> */}
              <meshBasicMaterial
                map={texture}
                transparent={true}
              ></meshBasicMaterial>
            </mesh>
          );
        })}
      </group>
    </>
  );
}
export default SbpkChianFlyLine;

function getVCenter(v1, v2) {
  const v = v1.add(v2);
  return v.divideScalar(2);
}

function getLenVector(v1, v2, len) {
  let v1v2Len = v1.distanceTo(v2);
  return v1.lerp(v2, len / v1v2Len);
}

// 获取贝塞尔控制点
function getBezierPoint(v0, v3) {
  // 角度
  const angle = (v0.angleTo(v3) * 180) / Math.PI; // 0 ~ Math.PI//
  // 使用 1.2 和 10 来调整弧度
  // 角度值与长度值
  const aLen = angle * 0.15,
    hLen = angle * angle * 1;

  // 两点的中心位置
  const centerPoint = getVCenter(v0.clone(), v3.clone());

  // 法线向量、使用中心点和向上的向量
  const rayLine = new THREE.Ray(centerPoint, new THREE.Vector3(0, 1, 0));

  // API 更新后，Ray类的 at 方法需要两个参数
  const temp = new THREE.Vector3(0, 0, 0);

  // 计算位置
  const at = hLen / rayLine.at(1, temp).distanceTo(centerPoint);
  // 顶点坐标
  const vTop = rayLine.at(at, temp);

  // 控制点坐标
  const v1 = getLenVector(v0.clone(), vTop, aLen);
  const v2 = getLenVector(v3.clone(), vTop, aLen);
  return [v1, v2];
}

function setPath(startPos, endPos) {
  const [v1, v2] = getBezierPoint(startPos, endPos);
  const cure = new THREE.CubicBezierCurve3(startPos, v1, v2, endPos);
  return {
    cure,
    len: cure.getLength(),
  };
}
