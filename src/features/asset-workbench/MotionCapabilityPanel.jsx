import { useMemo, useState } from "react";

const AXIS_OPTIONS = [
  { value: "1,0,0", label: "X 轴" },
  { value: "0,1,0", label: "Y 轴" },
  { value: "0,0,1", label: "Z 轴" },
];

function toDefinition(candidate) {
  const definition = { ...candidate };
  delete definition.kindLabel;
  return {
    ...definition,
  };
}

function definitionKey(definition) {
  return `${definition.node}::${definition.kind}`;
}

function confidenceLabel(value) {
  if (value >= 0.9) return "高置信";
  if (value >= 0.7) return "命名推断";
  return "待确认";
}

function axisLabel(axis = []) {
  const labels = ["X", "Y", "Z"];
  const index = axis.findIndex((value) => Math.abs(value) > 0.5);
  return index >= 0 ? `${labels[index]} 轴` : "未确定轴向";
}

export default function MotionCapabilityPanel({
  report,
  definitions = [],
  boundTrackIds,
  onSetDefinitions,
  diagnostics,
  onToggleDiagnostics,
}) {
  const [manualNode, setManualNode] = useState("");
  const [manualKind, setManualKind] = useState("rotation");
  const [manualAxis, setManualAxis] = useState("0,1,0");
  const [manualRate, setManualRate] = useState(24);
  const motion = report?.motion;
  const candidates = motion?.candidates || [];
  const summary = motion?.summary || {
    rotation: candidates.filter((candidate) => candidate.motionType === "rotation" || candidate.kind === "rotation").length,
    parallel: candidates.filter((candidate) => candidate.motionType === "parallel" || candidate.kind !== "rotation").length,
    needsPivot: candidates.filter((candidate) => candidate.kind === "rotation" && !candidate.pivot).length,
  };
  const selected = useMemo(
    () => new Set(definitions.map(definitionKey)),
    [definitions]
  );
  const nodeNames = useMemo(
    () => [...new Set(report?.nodeNames || [])],
    [report?.nodeNames]
  );

  const toggleCandidate = (candidate) => {
    const key = definitionKey(candidate);
    if (selected.has(key)) {
      onSetDefinitions(definitions.filter((definition) => definitionKey(definition) !== key));
      return;
    }
    onSetDefinitions([...definitions, toDefinition(candidate)]);
  };

  const applySuggestions = () => {
    const suggestions = candidates
      .filter((candidate) => candidate.confidence >= 0.7)
      .map(toDefinition);
    onSetDefinitions(suggestions);
  };

  const addManualMotion = () => {
    const node = manualNode.trim();
    if (!node) return;
    const id = `manual-${node}-${manualKind}`.replace(/[^\w\u4e00-\u9fff-]+/g, "-");
    const axis = manualAxis.split(",").map(Number);
    const definition = {
      id,
      label: `自定义 · ${node}`,
      node,
      kind: manualKind,
      motionType: manualKind === "rotation" ? "rotation" : "parallel",
      motionTypeLabel: manualKind === "rotation" ? "旋转" : "平行往复",
      axis,
      axisSource: "手动选择",
      pivotHint: manualKind === "rotation" ? "请确认节点原点或补充轴心" : "无需轴心，沿轴向往复",
      direction: 1,
      rate: Number(manualRate) || (manualKind === "rotation" ? 24 : 2),
      maxRate: manualKind === "rotation" ? 90 : 12,
      step: manualKind === "rotation" ? 1 : 0.25,
      ...(manualKind === "reciprocation" ? { stroke: 1 } : {}),
      source: "manual",
      reason: "用户手动定义",
      confidence: 1,
    };
    const withoutSameNode = definitions.filter((item) => definitionKey(item) !== definitionKey(definition));
    onSetDefinitions([...withoutSameNode, definition]);
    setManualNode("");
  };

  return (
    <section className="asset-motion-capabilities" aria-label="动作能力检查">
      <div className="asset-capability-heading">
        <div>
          <h3>动作能力检查</h3>
          <p>根据动画通道和节点命名生成可选动作，未命中时可手动定义。</p>
        </div>
        {motion && (
          <span className={motion.ready ? "asset-capability-state is-ready" : "asset-capability-state"}>
            {motion.ready ? "可配置" : "待定义"}
          </span>
        )}
      </div>

      {motion ? (
        <>
          <div className="asset-capability-stats">
            <span>动画片段 <strong>{motion.clipCount}</strong></span>
            <span>旋转候选 <strong>{summary.rotation}</strong></span>
            <span>平行候选 <strong>{summary.parallel}</strong></span>
            <span>需轴心确认 <strong>{summary.needsPivot}</strong></span>
          </div>
          <p className="asset-capability-note">变换通道 {motion.channelCount} · 候选部件 {candidates.length} · 识别优先级：元数据 → 动画通道 → 节点命名</p>
          {candidates.length > 0 ? (
            <div className="asset-motion-candidates">
              {candidates.map((candidate) => {
                const key = definitionKey(candidate);
                const isSelected = selected.has(key);
                const activeDefinition = definitions.find((definition) => definitionKey(definition) === key);
                const displayAxis = activeDefinition?.axis || candidate.axis;
                const displayAxisSource = activeDefinition
                  ? activeDefinition.axisSource || "当前动作绑定"
                  : candidate.axisSource;
                const displayPivotHint = activeDefinition?.pivot
                  ? "已配置轴心"
                  : activeDefinition?.pivotHint || candidate.pivotHint;
                const isBound = boundTrackIds?.includes(candidate.id)
                  || definitions.some((definition) => definitionKey(definition) === key && boundTrackIds?.includes(definition.id));
                return (
                  <label key={key} className={`asset-motion-candidate ${isSelected ? "is-selected" : ""}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCandidate(candidate)}
                    />
                    <span className="asset-motion-candidate-main">
                      <strong>{candidate.label}</strong>
                      <small>
                        {activeDefinition?.motionTypeLabel || candidate.motionTypeLabel || candidate.kindLabel} · {axisLabel(displayAxis)} · {confidenceLabel(candidate.confidence)}
                        {isBound ? " · 已绑定" : ""}
                      </small>
                      <em>{candidate.reason}；{displayAxisSource || "默认轴向"}</em>
                      <em>{displayPivotHint}</em>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="asset-workbench-hint">没有自动识别到明显的旋转或往复节点，可以使用下方的手动定义。</p>
          )}
          {(candidates.length > 0 || definitions.length > 0) && (
            <div className="asset-motion-capability-actions">
              {candidates.length > 0 && (
                <button type="button" className="asset-secondary-button" onClick={applySuggestions}>
                  采用自动建议
                </button>
              )}
              <button type="button" className={`asset-secondary-button ${diagnostics ? "is-active" : ""}`} onClick={onToggleDiagnostics} disabled={!definitions.length}>
                {diagnostics ? "隐藏诊断轴" : "显示诊断轴"}
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="asset-workbench-hint">加载模型后会检查动画片段、变换通道和可疑动作节点。</p>
      )}

      <div className="asset-motion-manual">
        <div className="asset-motion-manual-title">手动定义动作</div>
        <input
          list="asset-motion-node-list"
          value={manualNode}
          onChange={(event) => setManualNode(event.target.value)}
          placeholder="输入或选择节点名称"
          aria-label="动作节点名称"
        />
        <datalist id="asset-motion-node-list">
          {nodeNames.map((name) => <option key={name} value={name} />)}
        </datalist>
        <div className="asset-motion-manual-grid">
          <select value={manualKind} onChange={(event) => setManualKind(event.target.value)} aria-label="动作类型">
            <option value="rotation">旋转</option>
            <option value="reciprocation">平行往复</option>
          </select>
          <select value={manualAxis} onChange={(event) => setManualAxis(event.target.value)} aria-label="动作轴向">
            {AXIS_OPTIONS.map((axis) => <option key={axis.value} value={axis.value}>{axis.label}</option>)}
          </select>
        </div>
        <div className="asset-motion-manual-row">
          <label>
            <span>{manualKind === "rotation" ? "转速" : "频率"}</span>
            <input
              type="number"
              min="0"
              max={manualKind === "rotation" ? 90 : 12}
              step={manualKind === "rotation" ? 1 : 0.25}
              value={manualRate}
              onChange={(event) => setManualRate(event.target.value)}
            />
          </label>
          <button type="button" className="asset-secondary-button" onClick={addManualMotion} disabled={!manualNode.trim()}>
            添加动作
          </button>
        </div>
      </div>
    </section>
  );
}

