import MaxwellHoda from "../maxwell-hoda/maxwell-hoda";
import {useContext, useEffect, useState} from "react";
import TWEEN from "@tweenjs/tween.js";
import MaxWellRoadScene from "../maxwell-road-scene/maxwell-road-scene";
import {MaxWellContext} from "../../context/maxwell-car-context";
import {CAR_SCENE_TYPE, CAR_TECH_TYPE} from "../../enum/enum";
import MaxWellRoomScene from "../maxwll-room-scene/maxwll-room-scene";
import MaxwellText from "@/example/maxwell-car/maxwell-car-three/maxwell-text/maxwell-text.jsx";
import MaxwellTechScene from "@/example/maxwell-car/maxwell-car-three/maxwell-tech-scene/maxwell-tech-scene.jsx";

function MaxwellSceneManager() {
    const {sceneType,techType} = useContext(MaxWellContext);
    const [speed, setSpeed] = useState(0);
    const [runState, setRunState] = useState("RUNNING");
    // const maxwellHoda = useMemo(() => <MaxWellGround speed={speed}/>, [speed]);
    useEffect(() => {
        let tween = null;
        if (sceneType === CAR_SCENE_TYPE.SHOWROOM) {
            tween = new TWEEN.Tween({value: 20})
                .to({value: 0}, 2 * 1000)
                .onUpdate(({value}) => {
                    setSpeed(value);
                });
            setRunState("STOP");
        }else if(sceneType===CAR_SCENE_TYPE.TECH){
            switch (techType) {
                case CAR_TECH_TYPE.MEDEA:
                    if(speed===20){
                        tween = new TWEEN.Tween({value: 20})
                            .to({value: 0}, 2 * 1000)
                            .onUpdate(({value}) => {
                                setSpeed(value);
                            });
                        setRunState("STOP");
                    }
                    break;
                case CAR_TECH_TYPE.FLOW:
                case CAR_TECH_TYPE.LD:
                    if(speed===0){
                        setRunState("RUNNING");
                        tween = new TWEEN.Tween({value: 0})
                            .to({value: 20}, 2 * 1000)
                            .onUpdate(({value}) => {
                                setSpeed(value);
                            });
                    }
                    break;
            }

        }
        else if (sceneType === CAR_SCENE_TYPE.ROAD) {
            setRunState("RUNNING");
            tween = new TWEEN.Tween({value: 0})
                .to({value: 20}, 2 * 1000)
                .onUpdate(({value}) => {
                    setSpeed(value);
                });
        }
        if (tween) {
            tween.start();
        }
        return () => {
            if (tween) {
                tween.stop();
            }
        };
    }, [sceneType,techType]);
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
