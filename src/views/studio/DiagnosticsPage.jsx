import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { inspectCanvasWebGL } from "../../viewer/webgl-info.js";
import "./diagnostics.less";

const ASSET_CATALOG_KEY = "sy-me.asset-catalog.v1";
const LOCAL_SCENE_KEY = "sy-me.asset-workbench.scene.v1";

function readJson(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function checkStorage() {
  const probeKey = "sy-me.diagnostics.probe";
  try {
    localStorage.setItem(probeKey, "ok");
    localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

function checkWebGL() {
  return inspectCanvasWebGL(document.createElement("canvas"));
}

function formatDate(value) {
  if (!value) return "尚未保存";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "时间未知" : date.toLocaleString("zh-CN");
}

function buildDiagnostics() {
  const storedAssets = readJson(ASSET_CATALOG_KEY, []);
  const assets = (Array.isArray(storedAssets) ? storedAssets : [])
    .filter((asset) => asset && typeof asset === "object");
  const sceneRecord = readJson(LOCAL_SCENE_KEY, null);
  const scene = sceneRecord?.scene;
  const models = Array.isArray(scene?.models) ? scene.models : [];
  const unsupportedAssets = assets.filter((asset) => asset.previewSupported === false);
  const pendingModels = models.filter((model) => !model?.url);
  const webgl = checkWebGL();
  const storage = checkStorage();
  const issues = [];

  if (!webgl.supported) issues.push("当前浏览器无法启用 WebGL，三维场景无法正常预览。");
  if (webgl.hardware === "software") issues.push("当前 WebGL 疑似使用软件渲染，复杂模型可能出现明显卡顿。");
  if (!storage) issues.push("浏览器本地存储不可写，资产目录和本地场景方案无法可靠保存。");
  if (unsupportedAssets.length > 0) issues.push(`${unsupportedAssets.length} 个本地资产建议先转换为单文件 GLB。`);
  if (pendingModels.length > 0) issues.push(`${pendingModels.length} 个模型槽位尚未加载本地文件。`);
  if (!sceneRecord) issues.push("还没有保存本地场景方案，当前修改刷新后不会自动恢复。");

  const formats = assets.reduce((result, asset) => {
    const format = String(asset.format || "unknown").toUpperCase();
    result[format] = (result[format] || 0) + 1;
    return result;
  }, {});

  return {
    assets,
    sceneRecord,
    models,
    unsupportedAssets,
    pendingModels,
    formats,
    webgl,
    storage,
    issues,
    health: !webgl.supported || !storage ? "critical" : issues.length > 0 ? "attention" : "ready",
  };
}

const HEALTH_LABELS = {
  ready: "状态良好",
  attention: "需要关注",
  critical: "存在阻断风险",
};

export default function DiagnosticsPage() {
  const [report, setReport] = useState(buildDiagnostics);
  const assetFormatSummary = useMemo(() => Object.entries(report.formats), [report.formats]);

  return (
    <div className="studio-diagnostics-page">
      <section className="studio-diagnostics-hero">
        <div>
          <span className="studio-section-kicker">DIAGNOSTICS CENTER</span>
          <h2>诊断中心</h2>
          <p>集中查看本地资产、场景配置和浏览器运行能力，优先定位加载与预览风险。</p>
        </div>
        <div className={`studio-diagnostics-health is-${report.health}`}>
          <small>WORKSPACE HEALTH</small>
          <strong>{HEALTH_LABELS[report.health]}</strong>
          <span>{report.issues.length ? `${report.issues.length} 项待处理` : "没有发现阻断问题"}</span>
        </div>
      </section>

      <div className="studio-diagnostics-actions">
        <button type="button" onClick={() => setReport(buildDiagnostics())}>重新检查</button>
        <Link to="/studio/assets">打开资产目录</Link>
        <Link to="/tools/asset-workbench">打开资产工作台</Link>
      </div>

      <section className="studio-diagnostic-check-grid" aria-label="运行检查">
        <article className={`studio-diagnostic-check is-${report.webgl.supported ? "ready" : "critical"}`}>
          <span>01</span><div><strong>三维渲染</strong><small>{report.webgl.label}</small></div>
        </article>
        <article className={`studio-diagnostic-check is-${report.storage ? "ready" : "critical"}`}>
          <span>02</span><div><strong>本地存储</strong><small>{report.storage ? "可读写" : "不可写入"}</small></div>
        </article>
        <article className={`studio-diagnostic-check is-${report.pendingModels.length ? "attention" : "ready"}`}>
          <span>03</span><div><strong>模型槽位</strong><small>{report.pendingModels.length ? `${report.pendingModels.length} 个待加载` : `${report.models.length || 1} 个已配置`}</small></div>
        </article>
        <article className={`studio-diagnostic-check is-${report.unsupportedAssets.length ? "attention" : "ready"}`}>
          <span>04</span><div><strong>资产预处理</strong><small>{report.unsupportedAssets.length ? `${report.unsupportedAssets.length} 个建议转换` : "格式检查通过"}</small></div>
        </article>
      </section>

      <section className="studio-diagnostics-render-info" aria-label="实际渲染信息">
        <div className="studio-section-heading"><div><span className="studio-section-kicker">RENDER BACKEND</span><h3>实际渲染信息</h3></div><p>浏览器当前创建的 WebGL 上下文信息</p></div>
        <div className="studio-diagnostics-render-grid">
          <div><span>渲染后端</span><strong className={`is-${report.webgl.hardware}`}>{report.webgl.hardwareLabel}</strong></div>
          <div><span>上下文</span><strong>{report.webgl.context}</strong></div>
          <div><span>厂商</span><strong title={report.webgl.vendor}>{report.webgl.vendor}</strong></div>
          <div><span>Renderer</span><strong title={report.webgl.renderer}>{report.webgl.renderer}</strong></div>
          <div><span>WebGL 版本</span><strong title={report.webgl.version}>{report.webgl.version}</strong></div>
          <div><span>设备像素比</span><strong>{window.devicePixelRatio || 1}×</strong></div>
        </div>
      </section>

      <section className="studio-diagnostics-summary-grid">
        <article className="studio-diagnostics-summary-card">
          <div className="studio-diagnostics-card-heading"><span>ASSET INVENTORY</span><strong>{report.assets.length.toString().padStart(2, "0")}</strong></div>
          <h3>资产目录</h3>
          <p>{report.assets.length ? "已登记资产可从资产目录直接送入工作台。" : "还没有登记本地资产。"}</p>
          <div className="studio-diagnostics-format-list">
            {assetFormatSummary.length ? assetFormatSummary.map(([format, count]) => <span key={format}>{format} <b>{count}</b></span>) : <span>等待资产登记</span>}
          </div>
        </article>
        <article className="studio-diagnostics-summary-card">
          <div className="studio-diagnostics-card-heading"><span>LOCAL SCENE</span><strong>{report.models.length.toString().padStart(2, "0")}</strong></div>
          <h3>本地场景方案</h3>
          <p>{report.sceneRecord ? "浏览器中存在可恢复的本地场景配置。" : "暂无本地保存方案，建议完成关键调整后保存。"}</p>
          <div className="studio-diagnostics-meta"><span>最近保存</span><b>{formatDate(report.sceneRecord?.savedAt)}</b></div>
          <div className="studio-diagnostics-meta"><span>Schema</span><b>{report.sceneRecord?.scene?.schema?.version || report.sceneRecord?.scene?.schemaVersion || "—"}</b></div>
        </article>
      </section>

      <section className="studio-diagnostics-issues" aria-label="诊断建议">
        <div className="studio-section-heading"><div><span className="studio-section-kicker">NEXT ACTIONS</span><h3>建议处理</h3></div><p>根据当前浏览器和本地配置自动生成。</p></div>
        {report.issues.length ? (
          <ul>{report.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
        ) : (
          <div className="studio-diagnostics-clear">当前资产和场景状态可以继续进入装配与视觉调整。</div>
        )}
      </section>
    </div>
  );
}
