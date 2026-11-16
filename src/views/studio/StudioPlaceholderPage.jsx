import { Link } from "react-router-dom";

export default function StudioPlaceholderPage({ type = "operation" }) {
  const isAssets = type === "assets";
  const isDiagnostics = type === "diagnostics";
  const title = isAssets ? "资产目录" : isDiagnostics ? "诊断中心" : "作业模拟";
  const description = isAssets
    ? "模型、附件、材质和动作资源将统一归档，并支持按能力与格式筛选。"
    : isDiagnostics
    ? "模型体检、动画、材质和性能诊断将从资产工作台逐步集中到这里。"
    : "田间地块、路线、天气、任务和遥测将作为下一阶段的可执行场景。";
  const items = isAssets
    ? ["模型与附件资产", "能力标签与格式", "版本与资源清单"]
    : isDiagnostics
    ? ["资产结构与节点体检", "动作与动画片段", "材质与渲染性能"]
    : ["地块与作物状态", "路线与 GPS 辅助", "任务进度与机器遥测"];

  return (
    <div className="studio-placeholder-page">
      <div className="studio-placeholder-icon">{isAssets ? "◇" : isDiagnostics ? "⌁" : "▶"}</div>
      <span className="studio-section-kicker">{isAssets ? "ASSET CATALOG" : isDiagnostics ? "DIAGNOSTICS CENTER" : "FIELD OPERATIONS"}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="studio-placeholder-list">
        {items.map((item, index) => <span key={item}><b>0{index + 1}</b>{item}</span>)}
      </div>
      <Link to="/tools/asset-workbench">先从资产工作台开始 →</Link>
    </div>
  );
}
