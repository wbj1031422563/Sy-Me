
import { useState } from "react";
import { MaxWellContext } from "./context/maxwell-car-context";
import MaxWellCarThree from "./maxwell-car-three/maxwell-car-three";
import "./maxwell-car.less";
import MaxWellHome from "./views/maxwell-home/maxwell-home";
import { CAR_SCENE_TYPE } from "./enum/enum";
import { CAR_COLOR } from "./enum/enum";
function MaxWellCar() {
  // const [carStore,setCarStore]=useState({
  //   sceneType:CAR_SCENE_TYPE.SHOWROOM,
  //   carColor:CAR_COLOR.BLUE
  // })
  const [sceneType, setSceneType] = useState(CAR_SCENE_TYPE.SHOWROOM);
  const [carColor, setCarColor] = useState(CAR_COLOR.BLUE);
  return (
    <>
      <div className="maxwell-car">
        <MaxWellContext.Provider 
        value={{ sceneType, carColor, setSceneType, setCarColor }}
        >
          <MaxWellHome handleSceneChange={(val)=>{
            setSceneType(val)
          }}
          handleColorChange={
            (val)=>{
              setCarColor(val)
            }
          }
          />
          <MaxWellCarThree />
        </MaxWellContext.Provider>
      </div>
    </>
  );
}
export default MaxWellCar;
