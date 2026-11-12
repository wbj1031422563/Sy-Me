/*
 * @Author: FMC
 * @Date: 2024-07-15 19:50:43
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-28 14:47:51
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map.jsx
 * @Description:
 */
import { lazy, Suspense, useCallback, useEffect, useMemo } from "react";
import { AreaContext } from "./context/sbpk-area-context.js";
import "./sbpk-map.less";
import { createSceneRuntime, useSceneRuntime } from "@/core/scene";
import { normalizeScene } from "@/core/scene/scene-normalize.js";

const SbpkEchart = lazy(() => import("./sbpk-echart/sbpk-echart.jsx"));
const SbpkMapThree = lazy(() => import("./sbpk-map-three/sbpk-map-three.jsx"));

const SBPK_SCENE = {
  id: "sbpk-map",
  title: "运输态势地图",
  parameters: {
    area: "全国地区",
  },
};

function SbpkMap({ onRuntimeReady }) {
  const scene = useMemo(() => normalizeScene(SBPK_SCENE), []);
  const runtime = useMemo(() => createSceneRuntime(scene), [scene]);
  const { parameters } = useSceneRuntime(runtime);
  const area = parameters.area;

  const setArea = useCallback((value) => {
    runtime.dispatch({ type: "parameter/set", payload: { key: "area", value } });
  }, [runtime]);

  useEffect(() => {
    onRuntimeReady?.(runtime);
  }, [onRuntimeReady, runtime]);

  return (
    <div className="sbpk-map">
      <AreaContext.Provider value={area}>
        <Suspense fallback={null}>
          <SbpkEchart handleAreaChange={setArea} />
          <SbpkMapThree />
        </Suspense>
      </AreaContext.Provider>
    </div>
  );
}
export default SbpkMap;
