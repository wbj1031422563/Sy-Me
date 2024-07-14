/*
 * @Author: FMC
 * @Date: 2024-06-23 09:58:48
 * @LastEditors: FMC
 * @LastEditTime: 2024-07-14 19:02:33
 * @FilePath: \fmc-personal-blog\src\views\home\home.jsx
 * @Description:
 */
import "./home.less";

function Home() {
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
            <div className="image-container">
              <img className="pre-img" src="/img/banner1.jpg" />
              <div className="mask">
                <span>项目1</span>
              </div>
            </div>
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
          <div className="project-list-item">
            <img className="pre-img" src="/img/banner1.jpg" />
            <p className="project-item-name">项目1</p>
            <p className="project-item-time">2024-07-14</p>
          </div>
        </div>
        <div className="footer"></div>
      </div>
      {/* <div className="gui-container"></div> */}
    </>
  );
}

export default Home;
