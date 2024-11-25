/*
 * @Author: FMC
 * @Date: 2024-07-15 19:50:43
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-28 14:47:51
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map.jsx
 * @Description:
 */
import SbpkEchart from "./sbpk-echart/sbpk-echart.jsx";
import SbpkMapThree from "./sbpk-map-three/sbpk-map-three.jsx";
import { useState } from "react";
import { AreaContext } from "./context/sbpk-area-context.js";
import "./sbpk-map.less";
function SbpkMap() {
  const [area, setArea] = useState("全国地区");
  return (
    <>
      <div className="sbpk-map">
        <AreaContext.Provider value={area}>
          <SbpkEchart
            handleAreaChange={(val) => {
              setArea(val);
            }}
          />
          <SbpkMapThree  />
        </AreaContext.Provider>
      </div>
    </>
  );
}
export default SbpkMap;
