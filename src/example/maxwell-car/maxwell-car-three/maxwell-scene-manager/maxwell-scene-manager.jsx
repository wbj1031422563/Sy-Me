import MaxwellHoda from "../maxwell-hoda/maxwell-hoda";
import {useContext, useEffect, useState} from "react";
import TWEEN from "@tweenjs/tween.js";
import MaxWellRoadScene from "../maxwell-road-scene/maxwell-road-scene";
import {MaxWellContext} from "../../context/maxwell-car-context";
import {CAR_SCENE_TYPE} from "../../enum/enum";
import MaxWellRoomScene from "../maxwll-room-scene/maxwll-room-scene";
import MaxwellText from "@/example/maxwell-car/maxwell-car-three/maxwell-text/maxwell-text.jsx";
import MaxwellTechScene from "@/example/maxwell-car/maxwell-car-three/maxwell-tech-scene/maxwell-tech-scene.jsx";

function MaxwellSceneManager() {
    const {sceneType} = useContext(MaxWellContext);
    const [speed, setSpeed] = useState(0);
    const [runState, setRunState] = useState("RUNNING");
    // const maxwellHoda = useMemo(() => <MaxWellGround speed={speed}/>, [speed]);
    useEffect(() => {
        let tween = null;
        if (sceneType === CAR_SCENE_TYPE.SHOWROOM||sceneType===CAR_SCENE_TYPE.TECH) {
            tween = new TWEEN.Tween({value: 20})
                .to({value: 0}, 2 * 1000)
                .onUpdate(({value}) => {
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
            <MaxwellHoda speed={speed}></MaxwellHoda>
            <MaxwellText isShow={sceneType === CAR_SCENE_TYPE.SHOWROOM}/>
            {sceneType === CAR_SCENE_TYPE.SHOWROOM && (
                <MaxWellRoomScene></MaxWellRoomScene>
            )}
            <MaxWellRoadScene
                runState={runState}
                speed={speed}
                setSpeed={(val) => {
                    setSpeed(val);
                }}
                isShow={sceneType === CAR_SCENE_TYPE.ROAD}
            ></MaxWellRoadScene>
            {sceneType === CAR_SCENE_TYPE.TECH && (
                // <mesh>
                //     <boxGeometry></boxGeometry>
                //     <meshBasicMaterial></meshBasicMaterial>
                // </mesh>
                <MaxwellTechScene></MaxwellTechScene>
            )}
            {/*{sceneType === CAR_SCENE_TYPE.ROAD && (*/}
            {/*  <MaxWellRoadScene*/}
            {/*    runState={runState}*/}
            {/*    speed={speed}*/}
            {/*    setSpeed={(val) => {*/}
            {/*      setSpeed(val);*/}
            {/*    }}*/}
            {/*    isShow={sceneType === CAR_SCENE_TYPE.ROAD}*/}
            {/*  ></MaxWellRoadScene>*/}
            {/*)}*/}
        </>
    );
}

export default MaxwellSceneManager;
