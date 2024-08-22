import { extend } from "@react-three/fiber";
import * as THREE from "three";
import RoadTestGeometry from "./RoadGeometry";
extend({RoadTestGeometry})
function SbpkChinaTrafficTest() {
    const initMapGeometry = () => {
        // const line1 = [[2, 0, 2], [3, 0, 10]].map(item=>new THREE.Vector3(...item))
        // const line2 = [[7, 0, 2], [8, 0, 10]].map(item=>new THREE.Vector3(...item))
        // const line3 = [[-2, 0, 4], [10, 0, 4]].map(item=>new THREE.Vector3(...item))
        // const line4 = [[-2, 0, 6], [10, 0, 6]].map(item=>new THREE.Vector3(...item))
        const curve1= new THREE.CatmullRomCurve3([
            new THREE.Vector3(2, 0, 2),
            new THREE.Vector3(3, 0, 10)
        ])
        const curve2= new THREE.CatmullRomCurve3([
            new THREE.Vector3(7, 0, 2),
            new THREE.Vector3(8, 0, 10)
        ])
        const curve3= new THREE.CatmullRomCurve3([
            new THREE.Vector3(2, 0, 4),
            new THREE.Vector3(10, 0, 4)
        ])
        const curve4= new THREE.CatmullRomCurve3([
            new THREE.Vector3(-2, 0, 6),
            new THREE.Vector3(10, 0, 6)
        ])
    }
    return <>
            <mesh>
                <roadTestGeometry></roadTestGeometry>
                <meshBasicMaterial color={'red'}></meshBasicMaterial>
            </mesh>
    </>
}
export default SbpkChinaTrafficTest