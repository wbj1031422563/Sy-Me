import { useEffect, useRef, useState } from "react";
import { normalizeModelCollection } from "../../core/scene/scene-safety.js";

const STORAGE_KEY = "sy-me.asset-workbench.assembly-library.v1";
const FILE_VERSION = 1;

function formatSavedAt(value) {
  if (!value) return "未记录时间";
  return new Date(value).toLocaleString("zh-CN");
}

function snapshotModels(models = []) {
  return models.map((model) => ({
    id: model.id,
    assetId: model.assetId || model.id,
    label: model.label || model.id,
    parentId: model.parentId || null,
    assemblyId: model.assemblyId || null,
    position: [...(model.position || [0, 0, 0])],
    rotation: [...(model.rotation || [0, 0, 0])],
    scale: model.scale ?? 1,
    visible: model.visible !== false,
  }));
}

function normalizeEntries(candidates = []) {
  const importedAt = new Date().toISOString();
  return candidates
    .filter((entry) => entry
      && typeof entry.name === "string"
      && entry.name.trim()
      && Array.isArray(entry.models)
      && entry.models.length > 0)
    .slice(0, 20)
    .map((entry, index) => ({
      ...entry,
      id: `assembly-import-${Date.now()}-${index}`,
      name: entry.name.trim().slice(0, 80),
      savedAt: entry.savedAt || importedAt,
      models: normalizeModelCollection(
        entry.models.filter((model) => model && typeof model.id === "string")
      ),
    }))
    .filter((entry) => entry.models.length > 0);
}

function vectorsDiffer(left = [], right = [], epsilon = 0.0001) {
  return [0, 1, 2].some((index) => Math.abs((left[index] || 0) - (right[index] || 0)) > epsilon);
}

function findModelMatch(snapshot, models, usedIds) {
  const candidates = [
    (model) => model.id === snapshot.id,
    (model) => (model.assetId || model.id) === (snapshot.assetId || snapshot.id),
    (model) => (model.label || model.id) === snapshot.label,
  ];
  for (const predicate of candidates) {
    const match = models.find((model) => !usedIds.has(model.id) && predicate(model));
    if (match) return match;
  }
  return null;
}

function compareAssembly(entry, models = []) {
  const usedIds = new Set();
  const matchedBySnapshotId = new Map();
  let missingCount = 0;
  let relationshipChanges = 0;
  let transformChanges = 0;
  let visibilityChanges = 0;

  entry.models.forEach((snapshot) => {
    const match = findModelMatch(snapshot, models, usedIds);
    if (!match) {
      missingCount += 1;
      return;
    }
    usedIds.add(match.id);
    matchedBySnapshotId.set(snapshot.id, match);
  });

  entry.models.forEach((snapshot) => {
    const match = matchedBySnapshotId.get(snapshot.id);
    if (!match) return;
    const expectedParentId = snapshot.parentId
      ? matchedBySnapshotId.get(snapshot.parentId)?.id || null
      : null;
    if ((match.parentId || null) !== expectedParentId) relationshipChanges += 1;
    if (vectorsDiffer(match.position, snapshot.position)
      || vectorsDiffer(match.rotation, snapshot.rotation)
      || Math.abs((match.scale ?? 1) - (snapshot.scale ?? 1)) > 0.0001) {
      transformChanges += 1;
    }
    if ((match.visible !== false) !== (snapshot.visible !== false)) visibilityChanges += 1;
  });

  return {
    matchedCount: matchedBySnapshotId.size,
    missingCount,
    extraCount: Math.max(0, models.length - matchedBySnapshotId.size),
    relationshipChanges,
    transformChanges,
    visibilityChanges,
  };
}

export default function AssemblyPresetPanel({ models, onApply, onMessage }) {
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState("");
  const [comparisonId, setComparisonId] = useState(null);
  const importInputRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setEntries(Array.isArray(saved) ? normalizeEntries(saved) : []);
    } catch {
      setEntries([]);
    }
  }, []);

  const persist = (nextEntries) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
    setEntries(nextEntries);
  };

  const save = () => {
    const nextName = name.trim();
    if (!nextName || models.length === 0) return;
    const entry = {
      id: `assembly-${Date.now()}`,
      name: nextName.slice(0, 80),
      savedAt: new Date().toISOString(),
      models: snapshotModels(models),
    };
    try {
      persist([entry, ...entries].slice(0, 20));
      setName("");
      onMessage?.(`已保存装配方案“${entry.name}”。`);
    } catch (error) {
      onMessage?.(`装配方案保存失败：${error.message}`);
    }
  };

  const remove = (entryId) => {
    try {
      persist(entries.filter((entry) => entry.id !== entryId));
      onMessage?.("已删除装配方案。");
    } catch (error) {
      onMessage?.(`装配方案删除失败：${error.message}`);
    }
  };

  const exportEntries = () => {
    if (entries.length === 0) {
      onMessage?.("装配方案库为空，先保存至少一套方案再导出。");
      return;
    }
    const blob = new Blob([JSON.stringify({
      version: FILE_VERSION,
      exportedAt: new Date().toISOString(),
      entries,
    }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sy-me-assembly-library.json";
    link.click();
    URL.revokeObjectURL(url);
    onMessage?.(`已导出 ${entries.length} 套装配方案。`);
  };

  const importEntries = async (file) => {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const candidates = Array.isArray(payload) ? payload : payload?.entries;
      if (!Array.isArray(candidates)) throw new Error("文件缺少 entries 方案列表");
      const imported = normalizeEntries(candidates);
      if (imported.length === 0) throw new Error("没有包含有效部件的装配方案");
      const nextEntries = [...imported, ...entries].slice(0, 20);
      persist(nextEntries);
      onMessage?.(`已导入 ${imported.length} 套装配方案。`);
    } catch (error) {
      onMessage?.(`装配方案导入失败：${error.message}`);
    }
  };

  const comparisonEntry = entries.find((entry) => entry.id === comparisonId);
  const comparison = comparisonEntry ? compareAssembly(comparisonEntry, models) : null;

  return (
    <section className="asset-assembly-presets" aria-label="装配方案预设">
      <div className="asset-capability-heading">
        <div>
          <h3>装配方案预设</h3>
          <p>保存父子关系、挂载后的变换和部件显隐状态。</p>
        </div>
        <span className="asset-capability-state is-ready">{entries.length} 个</span>
      </div>
      <div className="asset-library-save-row">
        <input
          value={name}
          placeholder="方案名称，例如：收割台完整装配"
          aria-label="装配方案名称"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
          }}
        />
        <button type="button" className="asset-primary-button" disabled={!name.trim()} onClick={save}>
          保存当前装配
        </button>
      </div>
      <div className="asset-library-transfer-row">
        <button type="button" onClick={exportEntries} disabled={entries.length === 0}>导出装配库</button>
        <button type="button" onClick={() => importInputRef.current?.click()}>导入装配库</button>
        <input
          ref={importInputRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) importEntries(file);
            event.target.value = "";
          }}
        />
      </div>
      {entries.length > 0 ? (
        <div className="asset-library-list">
          {entries.map((entry) => (
            <div key={entry.id} className="asset-library-entry">
              <div className="asset-library-entry-info">
                <strong>{entry.name}</strong>
                <small>{entry.models.length} 个部件 · {entry.models.filter((model) => !model.parentId).length} 个根部件 · {formatSavedAt(entry.savedAt)}</small>
              </div>
              <div className="asset-library-entry-actions">
                <button type="button" onClick={() => setComparisonId(entry.id)}>对比</button>
                <button type="button" onClick={() => onApply?.(entry)}>应用</button>
                <button type="button" onClick={() => remove(entry.id)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="asset-workbench-hint">还没有装配方案，先建立多个模型的父子关系并保存。</p>
      )}
      {comparisonEntry && comparison && (
        <div className="asset-assembly-diff" role="status">
          <div className="asset-assembly-diff-heading">
            <strong>与当前场景对比：{comparisonEntry.name}</strong>
            <button type="button" onClick={() => setComparisonId(null)}>关闭</button>
          </div>
          <div className="asset-assembly-diff-grid">
            <span>匹配部件 <strong>{comparison.matchedCount}</strong></span>
            <span>方案缺失 <strong>{comparison.missingCount}</strong></span>
            <span>当前多出 <strong>{comparison.extraCount}</strong></span>
            <span>关系差异 <strong>{comparison.relationshipChanges}</strong></span>
            <span>位姿差异 <strong>{comparison.transformChanges}</strong></span>
            <span>显隐差异 <strong>{comparison.visibilityChanges}</strong></span>
          </div>
          <p>
            应用方案会覆盖关系、位姿、缩放和显隐；如需撤回，可使用工作台的撤销操作。
          </p>
        </div>
      )}
      <p className="asset-workbench-hint">方案只保存模型槽位的关系与变换，不复制 GLB 文件；应用时会按模型 ID、资产 ID或名称匹配当前槽位。</p>
    </section>
  );
}
