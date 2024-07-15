/*
 * @Author: FMC
 * @Date: 2024-06-23 09:58:48
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-15 20:36:42
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
