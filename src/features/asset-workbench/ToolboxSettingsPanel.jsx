const TOOLBOX_GROUPS = [
  { id: "workflow", label: "工作流工具", description: "模型、装配、节点和文件加载" },
  { id: "motion", label: "动作与检查", description: "动作能力、动画片段和体检报告" },
  { id: "visual", label: "视觉与镜头", description: "主题、背景、镜头和渲染" },
];

export default function ToolboxSettingsPanel({ visibility, onChange, onReset }) {
  return (
    <div className="asset-toolbox-settings" role="group" aria-label="工具箱显示设置">
      <div className="asset-toolbox-settings-heading">
        <strong>工具组显示</strong>
        <small>按需隐藏不常用的功能组</small>
      </div>
      <div className="asset-toolbox-settings-list">
        {TOOLBOX_GROUPS.map((group) => (
          <label key={group.id}>
            <input
              type="checkbox"
              checked={visibility[group.id] !== false}
              onChange={(event) => onChange(group.id, event.target.checked)}
            />
            <span>
              <strong>{group.label}</strong>
              <small>{group.description}</small>
            </span>
          </label>
        ))}
      </div>
      <button type="button" className="asset-secondary-button" onClick={onReset}>
        恢复工具箱默认
      </button>
    </div>
  );
}
