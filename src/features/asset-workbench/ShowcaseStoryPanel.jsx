/**
 * 展厅故事线编辑：热点讲解 + 巡演序列，写回 scene.hotspots / scene.tour / scene.shots 顺序。
 */
function NumberField({ label, value, onChange }) {
  return (
    <label className="asset-camera-number">
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function VectorFields({ label, value = [0, 0, 0], onChange }) {
  return (
    <div className="asset-camera-vector">
      <span className="asset-tuning-label">{label}</span>
      <div className="asset-camera-number-grid">
        {[["X", 0], ["Y", 1], ["Z", 2]].map(([axis, index]) => (
          <NumberField
            key={axis}
            label={axis}
            value={value[index]}
            onChange={(next) => {
              const vector = [...value];
              vector[index] = next;
              onChange(vector);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ShowcaseStoryPanel({
  hotspots = [],
  shots = [],
  tour = {},
  selectedHotspotId,
  onSelectHotspot,
  onUpdateHotspot,
  onAddHotspot,
  onRemoveHotspot,
  onUpdateTour,
  onMoveShot,
}) {
  const selected = hotspots.find((item) => item.id === selectedHotspotId) || hotspots[0];
  const tourIds = Array.isArray(tour?.shotIds) && tour.shotIds.length
    ? tour.shotIds
    : shots.map((shot) => shot.id);

  return (
    <section className="asset-camera-presets asset-showcase-story" aria-label="展厅故事线编辑器">
      <div className="asset-capability-heading">
        <div>
          <h3>展厅故事线</h3>
          <p>编辑热点讲解与巡演序列，导出后可直接在展厅播放。</p>
        </div>
        <span className="asset-capability-state is-ready">{hotspots.length} 热点</span>
      </div>

      <div className="asset-camera-toolbar">
        <select
          value={selected?.id || ""}
          onChange={(event) => onSelectHotspot(event.target.value)}
          aria-label="选择热点"
        >
          {hotspots.length === 0 && <option value="">暂无热点</option>}
          {hotspots.map((spot) => (
            <option key={spot.id} value={spot.id}>{spot.label || spot.id}</option>
          ))}
        </select>
        <button type="button" onClick={onAddHotspot}>＋新增热点</button>
        <button type="button" onClick={() => selected && onRemoveHotspot(selected.id)} disabled={!selected}>
          删除
        </button>
      </div>

      {selected && (
        <>
          <label className="asset-camera-name">
            <span>热点名称</span>
            <input
              value={selected.label || ""}
              onChange={(event) => onUpdateHotspot(selected.id, { label: event.target.value })}
            />
          </label>
          <label className="asset-camera-name">
            <span>面板标题</span>
            <input
              value={selected.panel?.title || selected.label || ""}
              onChange={(event) => onUpdateHotspot(selected.id, {
                panel: { ...(selected.panel || {}), title: event.target.value },
              })}
            />
          </label>
          <label className="asset-camera-name">
            <span>讲解文案</span>
            <textarea
              rows={3}
              value={selected.panel?.body || ""}
              onChange={(event) => onUpdateHotspot(selected.id, {
                panel: { ...(selected.panel || {}), body: event.target.value },
              })}
            />
          </label>
          <label className="asset-camera-name">
            <span>关联镜头</span>
            <select
              value={selected.shotId || ""}
              onChange={(event) => onUpdateHotspot(selected.id, {
                shotId: event.target.value || undefined,
              })}
            >
              <option value="">不关联</option>
              {shots.map((shot) => (
                <option key={shot.id} value={shot.id}>{shot.label || shot.id}</option>
              ))}
            </select>
          </label>
          <VectorFields
            label="相对偏移"
            value={selected.offset || [0, 1.5, 0]}
            onChange={(offset) => onUpdateHotspot(selected.id, { offset, anchor: selected.anchor || "object" })}
          />
        </>
      )}

      <div className="asset-action-subgroup" style={{ marginTop: 12 }}>
        <span className="asset-tuning-label">巡演序列</span>
        <label className="asset-camera-name">
          <span>切换间隔（毫秒）</span>
          <input
            type="number"
            value={tour?.intervalMs ?? 3800}
            onChange={(event) => onUpdateTour({ intervalMs: Math.max(800, Number(event.target.value) || 3800) })}
          />
        </label>
        <label className="asset-camera-name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={Boolean(tour?.autoStart)}
            onChange={(event) => onUpdateTour({ autoStart: event.target.checked })}
          />
          <span>进入展厅自动开场</span>
        </label>
        <div className="asset-theme-list">
          {tourIds.map((shotId, index) => {
            const shot = shots.find((item) => item.id === shotId);
            return (
              <div key={`${shotId}-${index}`} className="asset-showcase-tour-row">
                <span>{shot?.label || shotId}</span>
                <button type="button" disabled={index === 0} onClick={() => onMoveShot(index, -1)}>↑</button>
                <button type="button" disabled={index >= tourIds.length - 1} onClick={() => onMoveShot(index, 1)}>↓</button>
                <button
                  type="button"
                  onClick={() => onUpdateTour({
                    shotIds: tourIds.filter((_, i) => i !== index),
                  })}
                >
                  移除
                </button>
              </div>
            );
          })}
        </div>
        <select
          aria-label="追加巡演镜头"
          defaultValue=""
          onChange={(event) => {
            const shotId = event.target.value;
            event.target.value = "";
            if (!shotId || tourIds.includes(shotId)) return;
            onUpdateTour({ shotIds: [...tourIds, shotId] });
          }}
        >
          <option value="">＋ 追加镜头到巡演</option>
          {shots.map((shot) => (
            <option key={shot.id} value={shot.id}>{shot.label || shot.id}</option>
          ))}
        </select>
      </div>
    </section>
  );
}
