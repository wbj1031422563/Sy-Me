import { useContext } from "react";
import { CAR_COLOR, CAR_SCENE_TYPE } from "../../enum/enum";
import "./maxwell-home.less";
import { MaxWellContext } from "../../context/maxwell-car-context";
function MaxWellHome({ handleSceneChange,handleColorChange }) {
  const { sceneType, carColor } = useContext(MaxWellContext);
  console.log('首页初始化')
  const getIndex = (type) => {
    if (type == CAR_SCENE_TYPE.SHOWROOM) {
      return 3.5;
    } else if (type == CAR_SCENE_TYPE.ROAD) {
      return 17.5;
    }
  };
  const getBottom = (color) => {
    return color * 8 + 2;
  };
  return (
    <>
      <div className="maxwell-home">
        <div className="maxwell-home-header maxwell-home-fixed">
          {sceneType == CAR_SCENE_TYPE.SHOWROOM && (
            <>
              <h1 className="blue mb-10 brand">Luxvire</h1>
              <p className="wihte mb-5">Beyond Luxury, Beyond Speed</p>
              <p className="wihte mb-5">
                麦克斯韦全新跑车，专为极致性能与奢华体验而生
              </p>
            </>
          )}
          {sceneType == CAR_SCENE_TYPE.ROAD && (
            <>
              <h2 className="blue mb-10">Beyond Luxury, Beyond Speed</h2>
              <p className="wihte mb-5">
                搭载顶级动力系统，提供非凡加速与优雅流畅的驾驶体验
              </p>
              <p className="wihte mb-5">
                内饰结合细腻材质与智能科技，带来无与伦比的舒适与控制感
              </p>
              <p className="wihte mb-5">
                这不仅是一辆跑车，更是奢华与速度的完美体现
              </p>
            </>
          )}
        </div>
        <div className="maxwell-home-right maxwell-home-fixed">
          {/* 造型 */}
          <div
            className="item"
            onClick={()=>{
              handleSceneChange(CAR_SCENE_TYPE.SHOWROOM)
            }
          }
          >
            <div
              className={
                sceneType == CAR_SCENE_TYPE.SHOWROOM
                  ? "item-text active"
                  : "item-text"
              }
            >
              造型
            </div>
            <div className="item-Line"></div>
          </div>

          {/* 行驶 */}
          <div
            className="item"
            onClick={()=>{
              handleSceneChange(CAR_SCENE_TYPE.ROAD)
            }}
          >
            <div
              className={
                sceneType == CAR_SCENE_TYPE.ROAD
                  ? "item-text active"
                  : "item-text"
              }
            >
              行驶
            </div>
            <div className="item-Line"></div>
          </div>
          <div
            className="line"
            style={{ top: `${getIndex(sceneType)}vmin` }}
          ></div>
          {/* <div>行驶</div> */}
        </div>
        <div className="maxwell-home-bottom maxwell-home-fixed">
          <div className="bar-content">
            <div
              className="bar"
              onClick={()=>{
                handleColorChange(CAR_COLOR.BLUE)
              }}
            >
              <img src={"/texture/蓝色车漆预览.png"} className="active" />
              <div className="bar-line"></div>
            </div>
            <div
              className="bar"
              onClick={()=>{
                handleColorChange(CAR_COLOR.SLIVER)
              }}
            >
              <img src={"/img/银色.png"} className="active" />
              <div className="bar-line"></div>
            </div>
            <div
              className="bar"
              onClick={()=>{
                handleColorChange(CAR_COLOR.OTHER)
              }}
            >
              <img src={"/texture/123374379_p0_master1200.jpg"} className="active" />
              <div className="bar-line"></div>
            </div>
            <div
              className="line"
              style={{ left: `${getBottom(carColor)}vmin` }}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MaxWellHome;
