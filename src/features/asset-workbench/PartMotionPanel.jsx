export default function PartMotionPanel({ definitions, boundTrackIds, preview, onChange }) {
  const ready = definitions.some((track) => boundTrackIds?.includes(track.id));
  return (
    <section className="asset-part-motion" aria-label="割台动作预览">
      <h3>割台动作预览</h3>
      <div className="asset-motion-actions">
        <button type="button" className="asset-primary-button" disabled={!ready}
          onClick={() => onChange((state) => ({ ...state, playing: !state.playing }))}>
          {preview.playing ? "暂停动作" : "播放动作"}
        </button>
        <button type="button" className="asset-secondary-button" disabled={!ready}
          onClick={() => onChange((state) => ({ ...state, playing: false, resetVersion: state.resetVersion + 1 }))}>
          复位动作
        </button>
      </div>
      {definitions.map((track) => {
        const rate = preview.rates[track.id] ?? track.rate;
        const rotating = track.kind === "rotation";
        const unit = rotating ? "转/分" : "次/秒";
        const direction = preview.directions[track.id] ?? track.direction ?? 1;
        const available = boundTrackIds?.includes(track.id);
        return (
          <div key={track.id}>
            <label className="asset-motion-rate">
              <span>{track.label}</span>
              <output>{rate} {unit}</output>
              <input
                type="range"
                min="0"
                max={track.maxRate}
                step={track.step}
                value={rate}
                aria-label={track.label}
                aria-valuetext={`${rate} ${unit}`}
                disabled={!available}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  onChange((state) => ({ ...state, rates: { ...state.rates, [track.id]: value } }));
                }}
              />
              {boundTrackIds && !available && <small>未找到对应部件</small>}
            </label>
            {rotating && (
              <div className="asset-motion-direction" role="group" aria-label={track.directionLabel || "旋转方向"}>
                <span>旋转方向</span>
                <div className="asset-theme-list">
                  {[[1, "正向"], [-1, "反向"]].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      disabled={!available}
                      className={direction === value ? "is-active" : ""}
                      aria-pressed={direction === value}
                      onClick={() => onChange((state) => ({
                        ...state,
                        directions: { ...state.directions, [track.id]: value },
                      }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <p className="asset-workbench-hint" role="status">
        {boundTrackIds
          ? (ready ? "调到 0 可停住单个部件；可切到「动刀近景」查看往复。" : "模型未匹配到可驱动部件。")
          : "正在加载并匹配部件…"}
      </p>
    </section>
  );
}
