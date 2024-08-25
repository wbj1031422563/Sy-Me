import { Instance, Instances } from "@react-three/drei";
import SbpkMark from "../sbpk-mark/sbpk-mark";
import * as THREE from "three";
/*
 * @Author: FMC
 * @Date: 2024-08-25 15:38:26
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-25 17:25:09
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-mark-list\sbpk-mark-list.jsx
 * @Description:
 */
function SbpkMarkList({ list }) {
  const provincesCity = {
    北京市: "北京",
    上海市: "上海",
    四川省: "成都",
    湖北省: "武汉",
    江苏省: "南京",
    广东省: "广东",
    浙江省: "杭州",
    山东省: "济南",
    天津市: "天津",
    河北省: "石家庄",
    湖南省: "长沙",
    河南省: "郑州",
  };
  console.log("list", list);
  const markList = list.filter((item) => {
    const provinces = [
      "北京市",
      "上海市",
      "四川省",
      "湖北省",
      "江苏省",
      "广东省",
      "浙江省",
      "山东省",
    //   "天津市",
      "河北省",
      "湖南省",
      "河南省",
    ];
    item.height=0.2;
    if(item.name=='上海市'){
        item.height=0.8;
    }
    if(item.name=='北京市'){
        item.height=0.5;
    }
    if(item.name=='广东省'){
        item.height=0.6;
    }
    if(item.name=='湖南省'){
        item.center[1]+=0.02;
        item.center[0]-=0.02;
    }
    return provinces.includes(item.name);
  });
  //不传入材质和几何体就会报错
  const geo = new THREE.BufferGeometry();
  const materail = new THREE.MeshBasicMaterial();
  return (
    <>
      {list.length > 0 && (
        <Instances
          range={markList.length}
          position={[-15, 0, 0]}
          geometry={geo}
          material={materail}
        >
          {markList.map((props, i) => (
            <SbpkMark
              key={props.key}
              text={provincesCity[props.name]}
              position={[props.center[0], props.height, props.center[1] - 0.05]}
              scale={[0.15,0.15,0.15]}
            />
          ))}
        </Instances>
      )}
    </>
  );
}
export default SbpkMarkList;
