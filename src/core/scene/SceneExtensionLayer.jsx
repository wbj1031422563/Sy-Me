import { sceneRegistry } from "./scene-registry.js";

function ExtensionLayer({ extensions = [], kind, runtime }) {
  return extensions.map((extension, index) => {
    const getExtension = kind === "effect"
      ? sceneRegistry.getEffect
      : sceneRegistry.getNode;
    const Component = getExtension(extension.type);

    if (!Component) return null;

    return (
      <Component
        key={extension.id || `${extension.type}-${index}`}
        config={extension}
        runtime={runtime}
      />
    );
  });
}

export function SceneNodeExtensions({ extensions, runtime }) {
  return <ExtensionLayer extensions={extensions} kind="node" runtime={runtime} />;
}

export function SceneEffectExtensions({ extensions, runtime }) {
  return <ExtensionLayer extensions={extensions} kind="effect" runtime={runtime} />;
}

