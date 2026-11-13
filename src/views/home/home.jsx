/*
 * @Author: FMC
 * @Date: 2024-06-23 09:58:48
 * @LastEditors: FMC
 * @LastEditTime: 2024-08-29 20:49:32
 * @FilePath: \fmc-personal-blog\src\views\home\home.jsx
 * @Description:
 */
import "./home.less";
import ReactThree from "../react-three/react-three.jsx";
import { useNavigate } from "react-router-dom";
function Home() {
  let navigate = useNavigate();

  const goRouter = (router) => {
    // return <Navigate to={router} />;
    navigate(router);
  };
  return (
    <>
      <div className="home">
        <div className="peraon-info-conatiner">
          <h1>我的博客</h1>
          <button
            type="button"
            className="home-tool-entry"
            onClick={() => goRouter("/tools/asset-workbench")}
          >
            <span>进入资产工作台</span>
            <small>Asset Lab · 多模型视觉配置</small>
          </button>
        </div>
        <div className="project-list">
          {/* {new Array(10).map((item, index) => (
            <div key={index} className="project-list-item">
              <h1>项目1</h1>
              <h2>项目简介</h2>
            </div>
          ))} */}
          <div className="project-list-item">
            <div
              className="image-container"
              onClick={() => {
                goRouter("/sbpk-map");
              }}
            >
              <img className="pre-img" src="/img/banner1.jpg" />
              <div className="mask">
                <span>赛博朋克项目</span>
              </div>
            </div>
            <p className="project-item-name">赛博朋克项目</p>
            <p className="project-item-time">2024-07-15</p>
          </div>
          <div className="project-list-item">
            <div
              className="image-container"
              onClick={() => {
                goRouter("/maxwell-car");
              }}
            >
              <img className="pre-img" src="/img/banner1.jpg" />
              <div className="mask">
                <span>麦克斯伟汽车</span>
              </div>
            </div>
            <p className="project-item-name">麦克斯伟汽车</p>
            <p className="project-item-time">2024-08-29</p>
          </div>
          <div className="project-list-item">
            <div
              className="image-container"
              onClick={() => {
                goRouter("/viewer/houtou");
              }}
            >
              <img className="pre-img" src="/img/banner2.jpg" />
              <div className="mask">
                <span>猴头展厅</span>
              </div>
            </div>
            <p className="project-item-name">猴头展厅（SceneViewer）</p>
            <p className="project-item-time">2026-11-02</p>
          </div>
          <div className="project-list-item">
            <div
              className="image-container"
              onClick={() => {
                goRouter("/tools/asset-workbench");
              }}
            >
              <img className="pre-img" src="/img/banner2.jpg" alt="资产工作台预览" />
              <div className="mask">
                <span>打开资产工作台</span>
              </div>
            </div>
            <p className="project-item-name">收获机资产工作台</p>
            <p className="project-item-time">2026-11-13 · 多模型视觉配置</p>
            <button
              type="button"
              className="project-item-action"
              onClick={() => goRouter("/tools/asset-workbench")}
            >
              打开工作台 →
            </button>
          </div>
          <div className="project-list-item">
            <img className="pre-img" src="/img/banner1.jpg" />
            <p className="project-item-name">项目1</p>
            <p className="project-item-time">2024-07-14</p>
          </div>
          <div className="project-list-item">
            <img className="pre-img" src="/img/banner1.jpg" />
            <p className="project-item-name">项目1</p>
            <p className="project-item-time">2024-07-14</p>
          </div>
          <div className="project-list-item">
            <img className="pre-img" src="/img/banner1.jpg" />
            <p className="project-item-name">项目1</p>
            <p className="project-item-time">2024-07-14</p>
          </div>
          <div className="project-list-item">
            <img className="pre-img" src="/img/banner1.jpg" />
            <p className="project-item-name">项目1</p>
            <p className="project-item-time">2024-07-14</p>
          </div>
        </div>
        <div className="footer"></div>
      </div>
      <ReactThree />
      {/* <div className="gui-container"></div> */}
    </>
  );
}

export default Home;
