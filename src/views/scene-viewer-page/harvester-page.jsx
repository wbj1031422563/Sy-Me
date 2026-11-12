import { useEffect, useState } from "react";
import SceneViewer from "../../viewer/SceneViewer.jsx";
import {
  createHarvesterScene,
  HARVESTER_MODEL_PLACEHOLDER,
} from "../../scenes/presets/harvester-preset.js";

// 将 public/model/收获机.glb 替换为你的实际模型后即可使用。
export default function HarvesterPage() {
  const [assetStatus, setAssetStatus] = useState("checking");

  useEffect(() => {
    let active = true;
    fetch(HARVESTER_MODEL_PLACEHOLDER, { method: "HEAD" })
      .then((response) => {
        const contentType = response.headers.get("content-type") || "";
        const isHtmlFallback = contentType.includes("text/html");
        if (active) setAssetStatus(response.ok && !isHtmlFallback ? "ready" : "missing");
      })
      .catch(() => {
        if (active) setAssetStatus("missing");
      });
    return () => {
      active = false;
    };
  }, []);

  if (assetStatus !== "ready") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          boxSizing: "border-box",
          background: "#071015",
          color: "#dce7e7",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 560, lineHeight: 1.8 }}>
          <h2>
            {assetStatus === "checking"
              ? "正在检查收获机模型"
              : "收获机视觉预设已就绪"}
          </h2>
          <p>请将你的 GLB 模型放入：</p>
          <code>public/model/收获机.glb</code>
          <p>放入后刷新页面即可进入展厅、镜头、材质和机器状态演示。</p>
        </div>
      </div>
    );
  }

  const harvesterScene = createHarvesterScene({
    modelUrl: HARVESTER_MODEL_PLACEHOLDER,
    modelLabel: "雷沃收获机",
  });
  return <SceneViewer scene={harvesterScene} />;
}

