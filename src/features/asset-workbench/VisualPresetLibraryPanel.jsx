import { useRef, useState } from "react";

function formatSavedAt(value) {
  if (!value) return "未记录时间";
  return new Date(value).toLocaleString("zh-CN");
}

export default function VisualPresetLibraryPanel({ entries, onSave, onApply, onDelete, onExport, onImport }) {
  const [name, setName] = useState("");
  const importInputRef = useRef(null);

  const save = () => {
    const nextName = name.trim();
    if (!nextName) return;
    onSave(nextName);
    setName("");
  };

  return (
    <section className="asset-visual-library" aria-label="视觉方案库">
      <div className="asset-capability-heading">
        <div>
          <h3>视觉方案库</h3>
          <p>把当前调好的整套视觉参数保存成可重复使用的方案。</p>
        </div>
        <span className="asset-capability-state is-ready">{entries.length} 个</span>
      </div>
      <div className="asset-library-save-row">
        <input
          value={name}
          placeholder="方案名称，例如：雷沃主视觉"
          aria-label="方案名称"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
          }}
        />
        <button type="button" className="asset-primary-button" disabled={!name.trim()} onClick={save}>
          保存当前
        </button>
      </div>
      <div className="asset-library-transfer-row">
        <button type="button" onClick={onExport} disabled={entries.length === 0}>导出方案库</button>
        <button type="button" onClick={() => importInputRef.current?.click()}>导入方案库</button>
        <input
          ref={importInputRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImport(file);
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
                <small>{entry.scene?.models?.length || 0} 个模型 · {formatSavedAt(entry.savedAt)}</small>
              </div>
              <div className="asset-library-entry-actions">
                <button type="button" onClick={() => onApply(entry)}>应用</button>
                <button type="button" onClick={() => onDelete(entry.id)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="asset-workbench-hint">还没有自定义方案，先调整参数并保存一套。</p>
      )}
      <p className="asset-workbench-hint">方案只保存配置和资源清单，模型文件与 HDR / EXR 文件仍需单独保留；导出的 JSON 可复制到其他工作区继续使用。</p>
    </section>
  );
}
