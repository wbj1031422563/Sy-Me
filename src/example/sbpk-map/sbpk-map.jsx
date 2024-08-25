/*
 * @Author: FMC
 * @Date: 2024-07-15 19:50:43
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-25 10:58:10
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map.jsx
 * @Description:
 */
import SbpkEchart from "./sbpk-echart/sbpk-echart.jsx";
import SbpkMapThree from "./sbpk-map-three/sbpk-map-three.jsx";
import "./sbpk-map.less";
function SbpkMap() {
  return (
    <>
      <div className="sbpk-map">
        <SbpkEchart />
        <SbpkMapThree />
      </div>
    </>
  );
}
export default SbpkMap;
