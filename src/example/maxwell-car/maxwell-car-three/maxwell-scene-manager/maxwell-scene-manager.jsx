import { ContactShadows, Loader, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import * as THREE from "three";
import MaxwellHoda from "../maxwell-hoda/maxwell-hoda";
import { Suspense, useContext, useEffect, useMemo, useState } from "react";
import TWEEN from "@tweenjs/tween.js";
import MaxWellRoadScene from "../maxwell-road-scene/maxwell-road-scene";
import { MaxWellContext } from "../../context/maxwell-car-context";
import { CAR_SCENE_TYPE } from "../../enum/enum";
import MaxWellRoomScene from "../maxwll-room-scene/maxwll-room-scene";

function MaxwellSceneManager() {
  const { sceneType } = useContext(MaxWellContext);
  const [speed, setSpeed] = useState(0);
  const [runState, setRunState] = useState("RUNNING");

  useEffect(() => {
    let tween = null;
    if (sceneType === CAR_SCENE_TYPE.SHOWROOM) {
      tween = new TWEEN.Tween({ value: 20 })
        .to({ value: 0 }, 2 * 1000)
        .onUpdate(({ value }) => {
          setSpeed(value);
        });
      setRunState("STOP");
    } else if (sceneType === CAR_SCENE_TYPE.ROAD) {
      setRunState("RUNNING");
    }
    if (tween) {
      tween.start();
    }
    return () => {
      if (tween) {
        tween.stop();
      }
    };
  }, [sceneType]);
  return (
    <>
      <Suspense fallback={null}>
        <MaxwellHoda speed={speed}></MaxwellHoda>
      </Suspense>
      {sceneType === CAR_SCENE_TYPE.SHOWROOM && (
        <MaxWellRoomScene></MaxWellRoomScene>
      )}
      {sceneType === CAR_SCENE_TYPE.ROAD && (
        <MaxWellRoadScene
          runState={runState}
          speed={speed}
          setSpeed={(val) => {
            setSpeed(val);
          }}
        ></MaxWellRoadScene>
      )}
    </>
  );
}
export default MaxwellSceneManager;
