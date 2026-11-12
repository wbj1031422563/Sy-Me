function formatDuration(duration) {
  return Number.isFinite(duration) ? `${duration.toFixed(2)} 秒` : "时长待读取";
}

export default function ClipMotionPanel({ clips = [], clipCount = 0, preview, onChange }) {
  const availableClips = clips.length
    ? clips
    : Array.from({ length: clipCount }, (_, index) => ({
      id: `clip-${index}-fallback`,
      label: `动画片段 ${index + 1}`,
      duration: null,
    }));

  if (!availableClips.length) return null;

  const selectedId = preview.clipId || availableClips[0].id;
  const selectedClip = availableClips.find((clip) => clip.id === selectedId) || availableClips[0];
  const rate = preview.clipRate ?? 1;

  return (
    <section className="asset-clip-motion" aria-label="GLTF 内置动画片段">
      <h3>内置动画片段</h3>
      <label className="asset-select-label">
        选择动画
        <select
          value={selectedClip.id}
          onChange={(event) => onChange((state) => ({
            ...state,
            clipId: event.target.value,
            clipPlaying: false,
            resetVersion: state.resetVersion + 1,
          }))}
        >
          {availableClips.map((clip) => (
            <option key={clip.id} value={clip.id}>
              {clip.label} · {formatDuration(clip.duration)}
            </option>
          ))}
        </select>
      </label>
      <div className="asset-motion-actions">
        <button
          type="button"
          className="asset-primary-button"
          onClick={() => onChange((state) => ({
            ...state,
            clipId: selectedClip.id,
            clipPlaying: !state.clipPlaying,
          }))}
        >
          {preview.clipPlaying ? "暂停片段" : "播放片段"}
        </button>
        <button
          type="button"
          className="asset-secondary-button"
          onClick={() => onChange((state) => ({
            ...state,
            clipId: selectedClip.id,
            clipPlaying: false,
            resetVersion: state.resetVersion + 1,
          }))}
        >
          复位片段
        </button>
      </div>
      <label className="asset-motion-rate">
        <span>播放速度</span>
        <output>{rate.toFixed(1)}×</output>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={rate}
          aria-label="内置动画播放速度"
          aria-valuetext={`${rate.toFixed(1)} 倍速`}
          onChange={(event) => onChange((state) => ({
            ...state,
            clipRate: Number(event.target.value),
          }))}
        />
      </label>
      <p className="asset-workbench-hint" role="status">
        当前：{selectedClip.label}。内置动画与拨禾轮、刀片等手动动作可以独立预览。
      </p>
    </section>
  );
}
