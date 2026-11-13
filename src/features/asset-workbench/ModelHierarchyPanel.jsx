export default function ModelHierarchyPanel({
  model,
  nodes,
  selectedNodeIds = [],
  onSelectNode,
  onToggleVisibility,
  onIsolate,
  onReset,
}) {
  const visibility = model?.nodeVisibility || {};
  const hiddenCount = nodes.filter((node) => visibility[node.id] === false).length;

  if (!model) return null;

  return (
    <section className="asset-model-hierarchy" aria-label="模型节点树">
      <div className="asset-capability-heading">
        <div>
          <h3>模型节点树</h3>
          <p>查看 GLB 内部父子结构，可单独隐藏或隔离展示节点。</p>
        </div>
        <span className="asset-capability-state is-ready">{nodes.length} 个</span>
      </div>
      <p className="asset-workbench-hint">当前模型：{model.label || model.id}</p>
      {nodes.length > 0 ? (
        <div className="asset-node-tree">
          {nodes.map((node) => {
            const hidden = visibility[node.id] === false;
            const selected = selectedNodeIds.includes(node.id);
            return (
              <div
                key={node.id}
                className={`asset-node-tree-row ${selected ? "is-selected" : ""} ${hidden ? "is-hidden" : ""}`}
                style={{ paddingLeft: `${8 + node.depth * 14}px` }}
              >
                <button
                  type="button"
                  className="asset-node-tree-select"
                  onClick={(event) => onSelectNode(node.id, { multi: event.shiftKey })}
                  title={node.id}
                >
                  <span className="asset-node-tree-marker">{node.childCount > 0 ? "▾" : "·"}</span>
                  <strong>{node.name}</strong>
                  <small>{node.isMesh ? "网格" : node.type}</small>
                </button>
                <div className="asset-node-tree-actions">
                  <button
                    type="button"
                    aria-label={`${hidden ? "显示" : "隐藏"}${node.name}`}
                    title={hidden ? "显示节点" : "隐藏节点"}
                    onClick={() => onToggleVisibility(node.id, !hidden)}
                  >
                    {hidden ? "显示" : "隐藏"}
                  </button>
                  <button
                    type="button"
                    aria-label={`隔离${node.name}`}
                    title="只显示该节点及其父子链"
                    onClick={() => onIsolate(node.id)}
                  >
                    隔离
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="asset-workbench-hint">模型加载完成后，这里会显示 GLB 的节点父子结构。</p>
      )}
      {hiddenCount > 0 && (
        <p className="asset-node-tree-visibility-status">
          已隐藏 {hiddenCount} 个节点，可点击对应行的“显示”按钮逐个恢复。
        </p>
      )}
      <div className="asset-node-tree-footer">
        <span>{selectedNodeIds.length > 0 ? `已选择 ${selectedNodeIds.length} 个节点` : "点击节点名称进行选择，Shift 可多选"}</span>
        <button type="button" className="asset-secondary-button" disabled={Object.keys(visibility).length === 0} onClick={onReset}>
          恢复全部节点
        </button>
      </div>
    </section>
  );
}
