import {useRef} from "react";
import {useFrame} from "@react-three/fiber";
import {Lightformer} from "@react-three/drei";

/**
 * 模拟光源
 * */
function MaxwellLightformers({positions = [2, 0, 2, 0, 2, 0, 2, 0], layers = 1}) {
    const group = useRef();
    useFrame((state, delta) => (
        group.current.position.z -= delta * 10) < -30 && (group.current.position.z = 30)
    )
    return (
        <>
            <group rotation={[0, 0.5, 0]}>
                <group ref={group}>
                    {positions.map((x, i) => (
                        <Lightformer layers={layers} key={i} form="circle" intensity={2} rotation={[Math.PI / 2, 0, 0]}
                                     position={[x, 4, i * 4]} scale={[3, 1, 1]}/>
                    ))}
                </group>
            </group>
            <Lightformer layers={layers} form="ring" color="red" intensity={1} scale={10} position={[-15, 4, -18]}
                         target={[0, 0, 0]}/>
        </>
    )

}

export default MaxwellLightformers;