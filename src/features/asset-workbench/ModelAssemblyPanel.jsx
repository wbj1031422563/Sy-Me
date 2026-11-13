import { useEffect, useState } from "react";

export default function ModelAssemblyPanel({
  models,
  selectedModelId,
  modelSockets,
  onSelectModel,
  onParentChange,
  onAlignSockets,
}) {
  const activeModel = models.find((model) => model.id === selectedModelId) || models[0];
  const parentModel = models.find((model) => model.id === activeModel?.parentId);
  const childSockets = modelSockets?.[activeModel?.id] || [];
  const parentSockets = modelSockets?.[parentModel?.id] || [];
  const [childSocketId, setChildSocketId] = useState("");
  const [parentSocketId, setParentSocketId] = useState("");

  useEffect(() => {
    setChildSocketId(childSockets[0]?.id || "");
  }, [activeModel?.id, childSockets.map((socket) => socket.id).join("|")]);

  useEffect(() => {
    setParentSocketId(parentSockets[0]?.id || "");
  }, [parentModel?.id, parentSockets.map((socket) => socket.id).join("|")]);

  if (!activeModel) return null;

  const parentOptions = models.filter((model) => model.id !== activeModel.id);

  return (
    <section className="asset-model-assembly" aria-label="模型装配关系">
      <div className="asset-capability-heading">
        <div>
          <h3>模型装配关系</h3>
          <p>将多个 GLB 建立父子关系，父模型移动时子模型会跟随。</p>
        </div>
        <span className="asset-capability-state">{models.length} 个部件</span>
      </div>
      <label className="asset-select-label">
        <span>当前部件</span>
        <select value={activeModel.id} onChange={(event) => onSelectModel(event.target.value)}>
          {models.map((model) => <option key={model.id} value={model.id}>{model.label || model.id}</option>)}
        </select>
      </label>
      <label className="asset-select-label">
        <span>父模型</span>
        <select
          value={activeModel.parentId || ""}
          aria-label="父模型"
          onChange={(event) => onParentChange(activeModel.id, event.target.value || null)}
        >
          <option value="">无（根部件）</option>
          {parentOptions.map((model) => <option key={model.id} value={model.id}>{model.label || model.id}</option>)}
        </select>
      </label>
      <p className="asset-workbench-hint">
        {activeModel.parentId
          ? `当前部件挂载于：${models.find((model) => model.id === activeModel.parentId)?.label || activeModel.parentId}`
          : "当前部件是装配体根部件。"}
      </p>
      {activeModel.parentId && (
        <div className="asset-socket-align">
          <span className="asset-tuning-label">挂载点自动对齐</span>
          {childSockets.length > 0 && parentSockets.length > 0 ? (
            <>
              <label className="asset-select-label">
                <span>当前部件挂载点</span>
                <select value={childSocketId} aria-label="当前部件挂载点" onChange={(event) => setChildSocketId(event.target.value)}>
                  {childSockets.map((socket) => <option key={socket.id} value={socket.id}>{socket.label}</option>)}
                </select>
              </label>
              <label className="asset-select-label">
                <span>父模型挂载点</span>
                <select value={parentSocketId} aria-label="父模型挂载点" onChange={(event) => setParentSocketId(event.target.value)}>
                  {parentSockets.map((socket) => <option key={socket.id} value={socket.id}>{socket.label}</option>)}
                </select>
              </label>
              <button
                type="button"
                className="asset-primary-button"
                disabled={!childSocketId || !parentSocketId}
                onClick={() => onAlignSockets({
                  childId: activeModel.id,
                  childSocketId,
                  parentId: activeModel.parentId,
                  parentSocketId,
                })}
              >
                自动对齐挂载点
              </button>
            </>
          ) : (
            <p className="asset-workbench-hint">需要父模型和当前部件都包含 SOCKET_、MOUNT_ 或 ANCHOR_ 节点。</p>
          )}
        </div>
      )}
    </section>
  );
}
