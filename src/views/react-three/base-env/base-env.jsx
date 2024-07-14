/*
 * @Author: FMC
 * @Date: 2024-06-23 09:58:48
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-14 18:26:07
 * @FilePath: \fmc-personal-blog\src\views\react-three\base-env\base-env.jsx
 * @Description:基础环境
 */
import { OrbitControls} from "@react-three/drei";
import { Perf } from 'r3f-perf'

function BaseEnv() {
  return (
    <> 
      <Perf position="top-left"/>
      {/* <OrbitControls makeDefault /> */}
    </>
  );
}

export default BaseEnv;
