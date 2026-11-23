/*
 * @Author: FMC
 * @Date: 2024-06-23 09:58:48
 * @LastEditors: FMC
 * @LastEditTime: 2026-03-23 10:00:00
 * @FilePath: \fmc-personal-blog\src\views\home\home.jsx
 * @Description: SY·ME 模型展厅门户首页
 */
import { useEffect } from "react";
import "./home.less";
import ReactThree from "../react-three/react-three.jsx";
import { useNavigate } from "react-router-dom";
import PageThemeControl from "../../features/page-theme/PageThemeControl.jsx";
import { usePageTheme } from "../../theme/page-themes.js";

const SHOWROOM_ENTRIES = [
  {
    id: "harvester",
    title: "收获机展厅",
    subtitle: "产品主视觉 · 镜头巡演 · 热点讲解",
    to: "/viewer/harvester",
    image: "/img/banner2.jpg",
    featured: true,
  },
  {
    id: "workbench",
    title: "资产工作台",
    subtitle: "装配 · 视觉方案 · 动作绑定",
    to: "/tools/asset-workbench",
    image: "/img/banner2.jpg",
  },
  {
    id: "sbpk-map",
    title: "赛博地图",
    subtitle: "精品 Demo · 城市可视化",
    to: "/sbpk-map",
    image: "/img/banner1.jpg",
  },
  {
    id: "maxwell-car",
    title: "汽车展厅",
    subtitle: "精品 Demo · 氛围与后期",
    to: "/maxwell-car",
    image: "/img/banner1.jpg",
  },
];

function Home() {
  const navigate = useNavigate();
  const { themeId, setThemeId } = usePageTheme();

  useEffect(() => {
    // 展厅门户默认偏向麦田金展示主题；用户已自选其它主题时不强行覆盖。
    if (themeId === "forest") setThemeId("amber");
  }, [themeId, setThemeId]);

  const goRouter = (router) => {
    navigate(router);
  };

  return (
    <>
      <div className="home home--showroom">
        <PageThemeControl className="home-page-theme-control" />
        <div className="home-hero">
          <div className="home-hero-glow" aria-hidden="true" />
          <p className="home-brand-mark">SY·ME</p>
          <h1 className="home-brand-title">模型展厅</h1>
          <p className="home-brand-lead">
            雷沃农机产品可视化展厅——电影感镜头、热点讲解与一键巡演，服务客户演示与展会交付。
          </p>
          <div className="home-hero-actions">
            <button
              type="button"
              className="home-cta-primary"
              onClick={() => goRouter("/viewer/harvester")}
            >
              <span>进入收获机展厅</span>
              <small>Showcase · 镜头 / 热点 / 巡演</small>
            </button>
            <button
              type="button"
              className="home-cta-secondary"
              onClick={() => goRouter("/studio")}
            >
              场景工作区
            </button>
          </div>
        </div>

        <section className="home-entry-section" aria-label="展厅入口">
          <div className="home-entry-heading">
            <span className="home-section-kicker">SHOWROOM ENTRIES</span>
            <h2>展厅与工作入口</h2>
          </div>
          <div className="project-list">
            {SHOWROOM_ENTRIES.map((entry) => (
              <div
                key={entry.id}
                className={`project-list-item ${entry.featured ? "is-featured" : ""}`}
              >
                <div
                  className="image-container"
                  role="button"
                  tabIndex={0}
                  onClick={() => goRouter(entry.to)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goRouter(entry.to);
                    }
                  }}
                >
                  <img className="pre-img" src={entry.image} alt={entry.title} />
                  <div className="mask">
                    <span>{entry.featured ? "进入展厅" : "打开"}</span>
                  </div>
                  {entry.featured && <em className="project-featured-badge">主推</em>}
                </div>
                <p className="project-item-name">{entry.title}</p>
                <p className="project-item-time">{entry.subtitle}</p>
                <button
                  type="button"
                  className="project-item-action"
                  onClick={() => goRouter(entry.to)}
                >
                  {entry.featured ? "进入展厅 →" : "打开 →"}
                </button>
              </div>
            ))}
          </div>
        </section>
        <div className="footer" />
      </div>
      <ReactThree />
    </>
  );
}

export default Home;
