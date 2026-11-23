import {
  HARVESTER_COMMANDS,
  HARVESTER_MACHINE_STATES,
  HARVESTER_STATE_HINTS,
  HARVESTER_STATE_LABELS,
} from "../core/machine/harvester-machine.js";

const COMMANDS = [
  [HARVESTER_COMMANDS.STOP, "停止"],
  [HARVESTER_COMMANDS.DRIVE, "行驶"],
  [HARVESTER_COMMANDS.HARVEST, "收割"],
  [HARVESTER_COMMANDS.UNLOAD, "卸粮"],
];

function isCommandActive(command, state) {
  return (
    (command === HARVESTER_COMMANDS.STOP && state === HARVESTER_MACHINE_STATES.IDLE)
    || (command === HARVESTER_COMMANDS.DRIVE && state === HARVESTER_MACHINE_STATES.DRIVING)
    || (command === HARVESTER_COMMANDS.HARVEST && state === HARVESTER_MACHINE_STATES.HARVESTING)
    || (command === HARVESTER_COMMANDS.UNLOAD && state === HARVESTER_MACHINE_STATES.UNLOADING)
  );
}

function formatTelemetry(key, value) {
  const num = Number(value) || 0;
  if (key === "engineHours") return num.toFixed(2);
  if (key === "fuel" || key === "grainFill" || key === "headerHeight") return num.toFixed(0);
  if (key === "rotorRpm") return num.toFixed(0);
  return num.toFixed(1);
}

function TelemetryBar({ value, max = 100, tone = "default" }) {
  const width = Math.max(0, Math.min(100, (Number(value) / max) * 100));
  return (
    <div className={`machine-telemetry-bar tone-${tone}`}>
      <span style={{ width: `${width}%` }} />
    </div>
  );
}

export default function MachinePanel({
  config,
  machine,
  onDispatch,
  onFocusPart,
  showcase = false,
}) {
  if (!config?.enabled || !machine) return null;

  const labels = config.telemetryLabels || {};
  const telemetryItems = [
    ["speed", labels.speed || "速度", "km/h", 40, null],
    ["fuel", labels.fuel || "燃油", "%", 100, "fuel"],
    ["grainFill", labels.grainFill || "粮仓", "%", 100, "grain"],
    ["rotorRpm", labels.rotorRpm || "滚筒", "rpm", 1200, "rotor"],
    ["headerHeight", labels.headerHeight || "割台高度", "%", 100, "header"],
    ["engineHours", labels.engineHours || "工时", "h", null, null],
  ];

  const hint = HARVESTER_STATE_HINTS[machine.state] || "";
  const progress = Math.round((machine.animation?.progress || 0) * 100);

  return (
    <aside className={`scene-viewer-machine-panel ${showcase ? "is-showcase" : ""}`}>
      <div className="machine-panel-heading">
        <div>
          <span>{config.label || "主体状态"}</span>
          <small>{hint}</small>
        </div>
        <strong className={`machine-state machine-state-${machine.state}`}>
          {HARVESTER_STATE_LABELS[machine.state] || machine.state}
        </strong>
      </div>

      <div className="machine-panel-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="machine-panel-commands">
        {COMMANDS.map(([command, label]) => (
          <button
            key={command}
            type="button"
            className={isCommandActive(command, machine.state) ? "is-active" : ""}
            onClick={() => onDispatch({ type: "machine/command", payload: { command } })}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="machine-reset"
          onClick={() => onDispatch({ type: "machine/command", payload: { command: HARVESTER_COMMANDS.RESET } })}
        >
          复位
        </button>
      </div>

      <div className="machine-panel-telemetry">
        {telemetryItems.map(([key, label, unit, barMax, tone]) => (
          <div key={key} className="machine-telemetry-item">
            <span>{label}</span>
            <strong>
              {formatTelemetry(key, machine.telemetry?.[key])}
              <small>{unit}</small>
            </strong>
            {barMax != null && (
              <TelemetryBar value={machine.telemetry?.[key] ?? 0} max={barMax} tone={tone || "default"} />
            )}
          </div>
        ))}
      </div>

      {config.parts?.length > 0 && (
        <div className="machine-panel-parts">
          <span className="machine-panel-label">主体部件</span>
          <div className="machine-parts-list">
            {config.parts.map((part) => (
              <button
                key={part.id}
                type="button"
                className={machine.selectedPart === part.id ? "is-active" : ""}
                title={part.description || part.label || part.id}
                onClick={() => {
                  const nextId = machine.selectedPart === part.id ? null : part.id;
                  onDispatch({
                    type: "machine/select-part",
                    payload: { id: nextId },
                  });
                  if (nextId) onFocusPart?.(part);
                }}
              >
                {part.label || part.id}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
