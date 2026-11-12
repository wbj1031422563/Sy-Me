import MaxwellHoda from "../maxwell-hoda/maxwell-hoda-re.jsx";
import {useContext, useEffect, useRef} from "react";
import TWEEN from "@tweenjs/tween.js";
import MaxWellRoadScene from "../maxwell-road-scene/maxwell-road-scene";
import {MaxWellContext} from "../../context/maxwell-car-context";
import {CAR_SCENE_TYPE, CAR_TECH_TYPE} from "../../enum/enum";
import MaxWellRoomScene from "../maxwll-room-scene/maxwll-room-scene";
import MaxwellText from "@/example/maxwell-car/maxwell-car-three/maxwell-text/maxwell-text.jsx";
import MaxwellTechScene from "@/example/maxwell-car/maxwell-car-three/maxwell-tech-scene/maxwell-tech-scene.jsx";

function MaxwellSceneManager() {
    const {sceneType,techType,speed,runState,setSpeed,setRunState,parameters} = useContext(MaxWellContext);
    const speedRef = useRef(speed);

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    useEffect(() => {
        const maxSpeed = parameters.maxSpeed ?? 20;
        const targetSpeed = sceneType === CAR_SCENE_TYPE.SHOWROOM
            || (sceneType === CAR_SCENE_TYPE.TECH && techType === CAR_TECH_TYPE.MEDEA)
            ? 0
            : maxSpeed;
        const targetRunState = targetSpeed > 0 ? "RUNNING" : "STOP";
        const startSpeed = speedRef.current;
        let tween = null;

        setRunState(targetRunState);
        if (Math.abs(startSpeed - targetSpeed) < 0.001) {
            setSpeed(targetSpeed);
            return undefined;
        }

        tween = new TWEEN.Tween({value: startSpeed})
            .to({value: targetSpeed}, 2 * 1000)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate(({value}) => {
                setSpeed(value);
            })
            .onComplete(() => {
                setSpeed(targetSpeed);
            })
            .start();

        return () => {
            tween?.stop();
        };
    }, [parameters.maxSpeed, sceneType, setRunState, setSpeed, techType]);
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
