import {
  HARVESTER_COMMANDS,
  HARVESTER_MACHINE_STATES,
} from "../core/machine/harvester-machine.js";

const STATE_LABELS = {
  [HARVESTER_MACHINE_STATES.IDLE]: "待机",
  [HARVESTER_MACHINE_STATES.DRIVING]: "行驶",
  [HARVESTER_MACHINE_STATES.HARVESTING]: "收割作业",
  [HARVESTER_MACHINE_STATES.UNLOADING]: "卸粮",
  [HARVESTER_MACHINE_STATES.WARNING]: "告警",
  [HARVESTER_MACHINE_STATES.MAINTENANCE]: "维护",
};

const COMMANDS = [
  [HARVESTER_COMMANDS.STOP, "停止"],
  [HARVESTER_COMMANDS.DRIVE, "行驶"],
  [HARVESTER_COMMANDS.HARVEST, "收割"],
  [HARVESTER_COMMANDS.UNLOAD, "卸粮"],
];

export default function MachinePanel({ config, machine, onDispatch }) {
  if (!config?.enabled || !machine) return null;

  const telemetry = config.telemetryLabels || {};
  const telemetryItems = [
    ["speed", telemetry.speed || "速度", "km/h"],
    ["fuel", telemetry.fuel || "燃油", "%"],
    ["grainFill", telemetry.grainFill || "粮仓", "%"],
    ["engineHours", telemetry.engineHours || "工时", "h"],
  ];

  return (
    <aside className="scene-viewer-machine-panel">
      <div className="machine-panel-heading">
        <span>{config.label || "机器状态"}</span>
        <strong className={`machine-state machine-state-${machine.state}`}>
          {STATE_LABELS[machine.state] || machine.state}
        </strong>
      </div>

      <div className="machine-panel-commands">
        {COMMANDS.map(([command, label]) => (
          <button
            key={command}
            className={
              (command === HARVESTER_COMMANDS.STOP && machine.state === HARVESTER_MACHINE_STATES.IDLE) ||
              (command === HARVESTER_COMMANDS.DRIVE && machine.state === HARVESTER_MACHINE_STATES.DRIVING) ||
              (command === HARVESTER_COMMANDS.HARVEST && machine.state === HARVESTER_MACHINE_STATES.HARVESTING) ||
              (command === HARVESTER_COMMANDS.UNLOAD && machine.state === HARVESTER_MACHINE_STATES.UNLOADING)
                ? "is-active"
                : ""
            }
            onClick={() => onDispatch({ type: "machine/command", payload: { command } })}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="machine-panel-telemetry">
        {telemetryItems.map(([key, label, unit]) => (
          <div key={key} className="machine-telemetry-item">
            <span>{label}</span>
            <strong>
              {machine.telemetry[key] ?? 0}
              <small>{unit}</small>
            </strong>
          </div>
        ))}
      </div>

      {config.parts?.length > 0 && (
        <div className="machine-panel-parts">
          <span className="machine-panel-label">部件</span>
          <div className="machine-parts-list">
            {config.parts.map((part) => (
              <button
                key={part.id}
                className={machine.selectedPart === part.id ? "is-active" : ""}
                onClick={() =>
                  onDispatch({
                    type: "machine/select-part",
                    payload: { id: machine.selectedPart === part.id ? null : part.id },
                  })
                }
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

