import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { inspectAssetFile } from "../../features/asset-workbench/asset-inspector.js";
import { discardLocalAsset, stageLocalAsset } from "../../features/asset-workbench/local-asset-session.js";
import "./asset-catalog.less";

const STORAGE_KEY = "sy-me.asset-catalog.v1";
const ACCEPT = ".glb,.gltf,.fbx,.obj,.stl,.ply,.dae";

const WORKSPACE_ASSETS = [
  {
    id: "workspace-header",
    label: "工作区割台",
    fileName: "text_model001.glb",
    format: "glb",
    source: "workspace",
    status: "工作区可用",
    previewSupported: true,
    note: "项目内置模型，可在资产工作台直接加载。",
  },
  {
    id: "demo-harvester",
    label: "示例汽车",
    fileName: "汽车.glb",
    format: "glb",
    source: "workspace",
    status: "示例资产",
    previewSupported: true,
    note: "用于验证单模型、多模型和材质流程。",
  },
];

function readLocalAssets() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function formatSize(bytes = 0) {
  if (!bytes) return "大小未知";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function persistAssets(assets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
    return true;
  } catch {
    return false;
  }
}

function withoutSessionToken(asset) {
  const persistedAsset = { ...asset };
  delete persistedAsset.sessionToken;
  return persistedAsset;
}

export default function AssetCatalogPage() {
  const inputRef = useRef(null);
  const [assets, setAssets] = useState(readLocalAssets);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("选择本地文件后，系统会先登记元数据，不会上传文件。");

  const allAssets = useMemo(() => [...WORKSPACE_ASSETS, ...assets], [assets]);
  const filteredAssets = useMemo(() => allAssets.filter((asset) => {
    const matchesFilter = filter === "all"
      || (filter === "previewable" && asset.previewSupported)
      || (filter === "convert" && !asset.previewSupported);
    const searchable = `${asset.label} ${asset.fileName} ${asset.format}`.toLowerCase();
    return matchesFilter && searchable.includes(query.trim().toLowerCase());
  }), [allAssets, filter, query]);

  const processFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setBusy(true);
    setMessage(`正在检查 ${files.length} 个本地资产…`);
    const nextAssets = [];
    for (const file of files) {
      const report = await inspectAssetFile(file);
      nextAssets.push({
        id: `${file.name}-${file.lastModified || Date.now()}`,
        label: file.name.replace(/\.(glb|gltf|fbx|obj|stl|ply|dae)$/i, ""),
        fileName: file.name,
        format: report.format,
        size: report.size || formatSize(file.size),
        source: "local",
        status: report.previewSupported ? "可直接预览" : "建议转换",
        previewSupported: report.previewSupported,
        meshes: report.meshes,
        materials: report.materials,
        triangles: report.triangles,
        primitiveCount: report.primitiveCount,
        textures: report.textures,
        nodes: report.nodes,
        animations: report.animations,
        performanceLevel: report.performanceLevel,
        performanceLabel: report.performanceLabel,
        recommendations: report.recommendations,
        note: report.notes?.[0] || "已完成基础格式检查。",
        addedAt: new Date().toISOString(),
        sessionToken: stageLocalAsset(file, report),
      });
    }
    const byFile = new Map(assets.map((asset) => [asset.fileName, asset]));
    nextAssets.forEach((asset) => byFile.set(asset.fileName, asset));
    const next = [...byFile.values()];
    const persistedAssets = next.map(withoutSessionToken);
    const persisted = persistAssets(persistedAssets);
    setAssets(next);
    setBusy(false);
    setMessage(persisted
      ? `已登记 ${nextAssets.length} 个资产；本会话可直接送入工作台，文件仍保留在本地。`
      : "资产已暂存到当前页面，但浏览器本地存储不可用；刷新后可能需要重新登记。");
  };

  const removeLocalAsset = (asset) => {
    if (!asset || asset.source !== "local") return;
    discardLocalAsset(asset.sessionToken);
    const next = assets.filter((item) => item.id !== asset.id);
    const persisted = persistAssets(next.map(withoutSessionToken));
    setAssets(next);
    setMessage(persisted ? `已移除本地登记“${asset.label}”。` : "已从当前页面移除，但浏览器本地存储不可用。");
  };

  return (
    <div className="studio-asset-catalog-page">
      <section className="studio-library-toolbar">
        <div>
          <span className="studio-section-kicker">ASSET CATALOG</span>
          <h2>资产目录</h2>
          <p>先登记和体检文件，再把可用资产送入场景装配流程。</p>
        </div>
        <div className="studio-library-actions">
          <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>＋ 登记本地资产</button>
          <Link to="/tools/asset-workbench">打开工作台</Link>
        </div>
      </section>

      <input
        ref={inputRef}
        hidden
        type="file"
        accept={ACCEPT}
        multiple
        onChange={(event) => {
          processFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        className={`studio-asset-dropzone ${dragActive ? "is-active" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (event.currentTarget === event.target) setDragActive(false); }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          processFiles(event.dataTransfer.files);
        }}
        disabled={busy}
      >
        <span className="studio-asset-dropzone-icon">＋</span>
        <strong>{busy ? "正在预处理资产…" : "拖入 GLB / GLTF 或其他模型文件"}</strong>
        <small>支持多选；GLB / 内嵌依赖 GLTF 可直接进入资产工作台预览</small>
      </button>

      <div className="studio-asset-catalog-toolbar">
        <div className="studio-filter-row" aria-label="资产筛选">
          <button type="button" className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>全部 <b>{allAssets.length.toString().padStart(2, "0")}</b></button>
          <button type="button" className={filter === "previewable" ? "is-active" : ""} onClick={() => setFilter("previewable")}>可预览</button>
          <button type="button" className={filter === "convert" ? "is-active" : ""} onClick={() => setFilter("convert")}>需转换</button>
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索资产名称 / 文件名" aria-label="搜索资产" />
      </div>

      <p className="studio-asset-catalog-message" role="status">{message}</p>

      <section className="studio-asset-catalog-grid" aria-label="资产列表">
        {filteredAssets.map((asset) => (
          <article key={asset.id} className="studio-asset-card">
            <div className="studio-asset-card-visual">
              <span>{asset.format.toUpperCase()}</span>
              <i className={asset.previewSupported ? "is-ready" : "is-warning"} />
            </div>
            <div className="studio-asset-card-body">
              <div className="studio-asset-card-meta"><span>{asset.source === "workspace" ? "工作区资产" : "本地登记"}</span><small>{asset.status}</small></div>
              <h3>{asset.label}</h3>
              <p>{asset.fileName} · {asset.size || "大小未知"}</p>
              {asset.performanceLabel && asset.performanceLevel !== "unknown" && (
                <span className={`studio-asset-performance-badge is-${asset.performanceLevel}`}>
                  展示负载 · {asset.performanceLabel}
                </span>
              )}
              <div className="studio-asset-card-stats">
                <span>网格 <b>{asset.meshes ?? "—"}</b></span>
                <span>材质 <b>{asset.materials ?? "—"}</b></span>
                <span>三角面 <b>{asset.triangles ? asset.triangles.toLocaleString() : "—"}</b></span>
                <span>动画 <b>{asset.animations ?? "—"}</b></span>
              </div>
              <small className="studio-asset-card-note">{asset.note}</small>
              {asset.source === "local" && (
                <small className="studio-asset-card-session">
                  {asset.sessionToken ? "本会话可直接加载" : "刷新后需重新选择本地文件"}
                </small>
              )}
              <Link to={asset.sessionToken
                ? `/tools/asset-workbench?assetToken=${encodeURIComponent(asset.sessionToken)}`
                : "/tools/asset-workbench"}
              >
                {asset.sessionToken ? "直接加载到工作台" : "前往资产工作台"} <em>→</em>
              </Link>
              {asset.source === "local" && (
                <button type="button" className="studio-asset-card-remove" onClick={() => removeLocalAsset(asset)}>
                  移除登记
                </button>
              )}
            </div>
          </article>
        ))}
        {filteredAssets.length === 0 && (
          <div className="studio-asset-catalog-empty">
            <strong>没有匹配的资产</strong>
            <span>调整筛选条件，或拖入一个新的本地模型文件。</span>
          </div>
        )}
      </section>
    </div>
  );
}
