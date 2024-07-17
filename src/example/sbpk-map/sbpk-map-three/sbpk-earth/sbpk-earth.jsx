/*
 * @Author: FMC
 * @Date: 2024-07-15 21:43:01
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-15 23:05:08
 * @FilePath: \fmc-personal-blog\src\example\sbpk-map\sbpk-map-three\sbpk-earth\sbpk-earth.jsx
 * @Description: 
 */
import * as THREE from 'three';

function SbpkEarth(){


    return null
}
export default SbpkEarth;


function makeGlobeOfPoints(){
    let dummyObj=new THREE.Object3D();
    let p=new THREE.Vector3();//向量
    let sph=new THREE.Spherical();
    // THREE.BoxGeometry
    let geometrys=[];//存储生成的几何体
    let texture=new THREE.TextureLoader().load(imgData);
    let count=75000;//点的数量
    let sphRadius=5;//球体半径
    let r=0;

    // 黄金比例用作经度步长
    //经度指的是与x轴正方向的夹角，范围是【0,2*PI]
    const longitudeStep=Math.PI*(3-Math.sqrt(5));

    /**
     * 1.标准球坐标系的半径为1，纬度角指的是球面上一点到赤道面的垂直距离
     * 2.当纬度角为1的时候在北极，0在赤道，-1在南极
     * 3.直径为2，在这个直径上平均分布，2 / counter为维度步长
     */
    const latitudeStep=2/count;

    /**
     * 设置经纬度初始值
     */
    let longitude=0;
    let latitude=1-latitudeStep/2;//设置为接近于1.靠近北极作为初始值。这里减去步长，避免北极点的点的重合
    


}