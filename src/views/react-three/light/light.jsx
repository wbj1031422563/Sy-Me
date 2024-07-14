/*
 * @Author: FMC
 * @Date: 2024-06-23 09:58:48
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-14 16:38:28
 * @FilePath: \fmc-personal-blog\src\views\react-three\light\light.jsx
 * @Description:灯光
 */
function Light() {
  return (
    <>
      {/* <directionalLight
        castShadow
        position={[4, 4, 1]}
        intensity={1.5}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={10}
        shadow-camera-top={10}
        shadow-camera-right={10}
        shadow-camera-bottom={-10}
        shadow-camera-left={-10}
      /> */}
      <ambientLight intensity={0.1} />
    </>
  );
}

export default Light;
