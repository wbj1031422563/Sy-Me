import { useContext } from "react";
import {CAR_COLOR, CAR_SCENE_TYPE, CAR_TECH_TYPE} from "../../enum/enum";
import "./maxwell-home.less";
import { MaxWellContext } from "../../context/maxwell-car-context";
function MaxWellHome({ handleSceneChange,handleColorChange ,handleTechTypeChange }) {
  const { sceneType, carColor,techType } = useContext(MaxWellContext);
  const getIndex = (type) => {
    if (type == CAR_SCENE_TYPE.SHOWROOM) {
      return 3.5;
    } else if (type == CAR_SCENE_TYPE.ROAD) {
      return 17.5;
    }
    else if (type == CAR_SCENE_TYPE.TECH) {
      return 31.5;
    }
  };
  const getBottom = (color) => {
    return color * 8 + 2;
  };
  const  resetTechTye=()=>{
      handleTechTypeChange(CAR_TECH_TYPE.MEDEA)
  }
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
            {sceneType == CAR_SCENE_TYPE.TECH&&techType==CAR_TECH_TYPE.MEDEA && (
                <>
                    <h2 className="blue mb-10">沉浸式车载娱乐系统</h2>
                    <p className="wihte mb-5">
                        杜比环绕声，让每一个音符触动心弦
                    </p>
                    <p className="wihte mb-5">
                        智能在线连接，畅享音乐、电影与导航的无缝融合
                    </p>
                    <p className="wihte mb-5">

                    </p>
                </>
            )}
            {sceneType == CAR_SCENE_TYPE.TECH&&techType==CAR_TECH_TYPE.FLOW && (
                <>
                    <h2 className="blue mb-10">突破风的桎梏，尽享速度的激情</h2>
                    <p className="wihte mb-5">
                        流线型车身，宛如风中舞者，将阻力降至最低
                    </p>
                    <p className="wihte mb-5">
                        卓越空气动力性能，赋予您无与伦比的加速体验
                    </p>
                </>
            )}
            {sceneType == CAR_SCENE_TYPE.TECH&&techType==CAR_TECH_TYPE.LD && (
                <>
                    <h2 className="blue mb-10">智感未来，驾驭无忧</h2>
                    <p className="wihte mb-5">
                        智能雷达系统，全天候感知周围环境，精准扫描、实时反馈，助您从容应对复杂路况
                    </p>
                    <p className="wihte mb-5">
                        先进智驾系统，融合AI科技，智能规划行车路线，自动辅助驾驶，让每一次出行更安全、更高效。
                    </p>
                </>
            )}
        </div>
          <div className="maxwell-home-right maxwell-home-fixed">
              {/* 造型 */}
          <div
              className="item"
              onClick={() => {
                  resetTechTye();
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
              onClick={() => {
                  resetTechTye();
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
              className="item"
              onClick={() => {
                  resetTechTye();
                handleSceneChange(CAR_SCENE_TYPE.TECH)
              }}
          >
            <div
                className={
                  sceneType === CAR_SCENE_TYPE.TECH
                      ? "item-text active"
                      : "item-text"
                }
            >
              科技
            </div>

            <div className="item-Line"></div>
          </div>
          <div
              className="line"
              style={{top: `${getIndex(sceneType)}vmin`}}
          ></div>
          {/* <div>行驶</div> */}
        </div>
          <div className="maxwell-home-bottom maxwell-home-fixed">
              {(sceneType == CAR_SCENE_TYPE.SHOWROOM || sceneType == CAR_SCENE_TYPE.ROAD) && (<div className="bar-content">
                  <div
                      className="bar"
                      onClick={() => {
                          handleColorChange(CAR_COLOR.BLUE)
                      }}
                  >
                      <img src={"/texture/蓝色车漆预览.png"} className="active"/>
                      <div className="bar-line"></div>
                  </div>
                  <div
                      className="bar"
                      onClick={() => {
                          handleColorChange(CAR_COLOR.SLIVER)
                      }}
                  >
                      <img src={"/img/银色.png"} className="active"/>
                      <div className="bar-line"></div>
                  </div>
                  <div
                      className="bar"
                      onClick={() => {
                          handleColorChange(CAR_COLOR.OTHER)
                      }}
                  >
                      <img src={"/texture/123374379_p0_master1200.jpg"} className="active"/>
                      <div className="bar-line"></div>
                  </div>
                  <div
                      className="line"
                      style={{left: `${getBottom(carColor)}vmin`}}
                  ></div>
              </div>)}
              {sceneType===CAR_SCENE_TYPE.TECH && (
                  <div className="bar-content">
                      <div
                          className="bar"
                          title={"影音娱乐"}
                          onClick={() => {
                              handleTechTypeChange(CAR_TECH_TYPE.MEDEA)
                          }}
                      >
                          <img src={"/texture/多媒体 (1).png"} className="active"/>
                          <div className="bar-line"></div>
                      </div>
                      <div
                          className="line"
                          style={{left: `${getBottom(techType)}vmin`}}
                      ></div>
                      <div
                          className="bar"
                          title={"空气动力"}
                          onClick={() => {
                              handleTechTypeChange(CAR_TECH_TYPE.FLOW)
                          }}
                      >
                          <img src={"/texture/wind-flow-2--wind-flow-weather.png"} className="active"/>
                          <div className="bar-line"></div>
                      </div>
                      <div
                          className="bar"
                          title={"智驾辅助"}
                          onClick={() => {
                              handleTechTypeChange(CAR_TECH_TYPE.LD)
                          }}
                      >
                          <img src={"/texture/雷达.png"} className="active"/>
                          <div className="bar-line"></div>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </>
  );
}

export default MaxWellHome;
