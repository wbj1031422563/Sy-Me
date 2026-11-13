const STATUS_LABELS = {
  pending: "等待",
  processing: "预处理",
  loaded: "已加载",
  skipped: "需转换",
  failed: "失败",
};

export default function BatchModelLoadPanel({ items, onClear, busy }) {
  if (!items.length) return null;

  const loadedCount = items.filter((item) => item.status === "loaded").length;
  const warningCount = items.filter((item) => item.status === "skipped" || item.status === "failed").length;

  return (
    <section className="asset-batch-model-queue" aria-label="批量模型加载队列">
      <div className="asset-capability-heading">
        <div>
          <h3>批量模型加载队列</h3>
          <p>逐个完成格式检查，成功项会自动创建新的模型槽位。</p>
        </div>
        <span className={warningCount > 0 ? "asset-capability-state" : "asset-capability-state is-ready"}>
          {loadedCount}/{items.length}
        </span>
      </div>
      <div className="asset-batch-model-list">
        {items.map((item) => (
          <div key={item.id} className={`asset-batch-model-item is-${item.status}`}>
            <div>
              <strong>{item.name}</strong>
              <small>{STATUS_LABELS[item.status] || item.status}{item.message ? ` · ${item.message}` : ""}</small>
            </div>
            <span>{item.status === "loaded" ? "✓" : item.status === "processing" ? "…" : item.status === "skipped" || item.status === "failed" ? "!" : "·"}</span>
          </div>
        ))}
      </div>
      <button type="button" className="asset-secondary-button" disabled={busy} onClick={onClear}>
        清空批量队列
      </button>
    </section>
  );
}
