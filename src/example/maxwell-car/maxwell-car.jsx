
import { lazy, Suspense, useCallback, useEffect, useMemo } from "react";
import { MaxWellContext } from "./context/maxwell-car-context";
import "./maxwell-car.less";
import MaxWellHome from "./views/maxwell-home/maxwell-home";
import { CAR_COLOR, CAR_SCENE_TYPE, CAR_TECH_TYPE } from "./enum/enum";
import { createSceneRuntime, useSceneRuntime } from "@/core/scene";
import { normalizeScene } from "@/core/scene/scene-normalize.js";

const MaxWellCarThree = lazy(() => import("./maxwell-car-three/maxwell-car-three"));

const MAXWELL_SCENE = {
  id: "maxwell-car",
  title: "Maxwell 汽车展厅",
  parameters: {
    sceneType: CAR_SCENE_TYPE.SHOWROOM,
    carColor: CAR_COLOR.BLUE,
    techType: CAR_TECH_TYPE.MEDEA,
    speed: 0,
    runState: "STOP",
    maxSpeed: 20,
    bloomEnabled: true,
    bloomIntensity: 1.4,
    bloomThreshold: 0.7,
    bloomRadius: 0.85,
  },
};

function MaxWellCar({ onRuntimeReady }) {
  const scene = useMemo(() => normalizeScene(MAXWELL_SCENE), []);
  const runtime = useMemo(() => createSceneRuntime(scene), [scene]);
  const { parameters } = useSceneRuntime(runtime);

  const setParameter = useCallback((key, value) => {
    runtime.dispatch({ type: "parameter/set", payload: { key, value } });
  }, [runtime]);

  useEffect(() => {
    onRuntimeReady?.(runtime);
  }, [onRuntimeReady, runtime]);

  const sceneType = parameters.sceneType;
  const carColor = parameters.carColor;
  const techType = parameters.techType;
  const speed = parameters.speed ?? 0;
  const runState = parameters.runState ?? "STOP";

  const contextValue = useMemo(() => ({
    sceneType,
    carColor,
    techType,
    speed,
    runState,
    parameters,
    runtime,
    setSceneType: (value) => setParameter("sceneType", value),
    setCarColor: (value) => setParameter("carColor", value),
    setTechType: (value) => setParameter("techType", value),
    setSpeed: (value) => setParameter("speed", value),
    setRunState: (value) => setParameter("runState", value),
  }), [
    carColor,
    parameters,
    runtime,
    runState,
    sceneType,
    setParameter,
    speed,
    techType,
  ]);

  return (
    <div className="maxwell-car">
      <MaxWellContext.Provider value={contextValue}>
        <MaxWellHome
          handleSceneChange={(value) => setParameter("sceneType", value)}
          handleColorChange={(value) => setParameter("carColor", value)}
          handleTechTypeChange={(value) => setParameter("techType", value)}
        />
        <Suspense fallback={null}>
          <MaxWellCarThree />
        </Suspense>
      </MaxWellContext.Provider>
    </div>
  );
}
export default MaxWellCar;
