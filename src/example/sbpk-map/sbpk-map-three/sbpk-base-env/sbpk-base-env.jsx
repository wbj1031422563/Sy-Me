/*
 * @Author: FMC
 * @Date: 2024-06-23 09:58:48
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-21 22:15:07
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-base-env\sbpk-base-env.jsx
 * @Description:基础环境
 */
import { OrbitControls} from "@react-three/drei";
import { Perf } from 'r3f-perf'

function SbpkBaseEnv() {
  return (
    <> 
      {/* <Perf position="top-left"/> */}
      <OrbitControls makeDefault />
    </>
  );
}

export default SbpkBaseEnv;
