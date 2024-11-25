/*
 * @Author: FMC
 * @Date: 2024-07-29 22:46:37
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-05 22:09:47
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-efftects\efftects.jsx
 * @Description: 
 */
/**
 * 后处理
 */

import { EffectComposer,Bloom} from "@react-three/postprocessing";
import { useControls } from "leva";
import { RenderPass } from "postprocessing";

function SbpkEfftects() {
  // const props = useControls({
  //   mipmapBlur: true,
  //   intensity: 0.9,
  //   radius: 0.9,
  //   levels:8,
  //   luminanceSmoothing:0.025
  // })
  return (
    <>
      <EffectComposer multisampling={8}>
        {/* <RenderPass/> */}
        <Bloom luminanceThreshold={1.0} mipmapBlur={true} intensity={1.8} radius={0.9} levels={11.0} luminanceSmoothing={0.03}/>
      </EffectComposer>
    </>
  );
}
export default SbpkEfftects;
