/*
 * SceneViewer —— 通用三维场景查看器（最小运行时）
 *
 * 输入一份场景 JSON（src/scenes/*.scene.json），负责：
 * 1. 多模型填充：models[] 描述模型与摆放变换，逐个加载（支持 Draco）
 * 2. 模型数据：加载后自动体检（网格/顶点/三角形/包围盒/材质），管理面板展示
 * 3. 模型管理：显隐开关、相机定位、变体目标
 * 4. 镜头：JSON shots + 模型内 CAM_* 空物体，补间切换；支持序列自动巡演
 * 5. 材质变体：materialVariants，作用于 variantTarget 的模型（按 VAR_* 槽或全模型）
 * 6. 热点：JSON hotspots + 模型内 HOT_* 空物体
 *
 * 命名约定见 viewer/conventions.js。业务页只传 scene 描述，不写三维细节。
 */
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  Loader,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { mergeById, inspectModel, PREFIX } from "./conventions.js";
import { normalizeScene } from "../core/scene/scene-normalize.js";
import { createSceneRuntime, useSceneRuntime } from "../core/scene/scene-runtime.js";
import {
  SceneEffectExtensions,
  SceneNodeExtensions,
} from "../core/scene/SceneExtensionLayer.jsx";
import MachinePanel from "./MachinePanel.jsx";
import HarvesterAnimationDriver from "./HarvesterAnimationDriver.jsx";
import ModelClipAnimationDriver from "./ModelClipAnimationDriver.jsx";
import ModelMotionDriver from "./ModelMotionDriver.jsx";
import MotionDiagnostics from "./MotionDiagnostics.jsx";
import SceneParticles from "./SceneParticles.jsx";
import RgbColorGrade from "./RgbColorGrade.jsx";
import { describeAnimationClips } from "./animation-clips.js";
import "./scene-viewer.less";

/* ---------------- 模型 ---------------- */

function applyMaterialPreset(baseMaterial, preset) {
  const material = preset.physical
    ? new THREE.MeshPhysicalMaterial({
      color: baseMaterial.color?.clone?.() || 0xffffff,
      map: baseMaterial.map || null,
      alphaMap: baseMaterial.alphaMap || null,
      aoMap: baseMaterial.aoMap || null,
      bumpMap: baseMaterial.bumpMap || null,
      displacementMap: baseMaterial.displacementMap || null,
      emissiveMap: baseMaterial.emissiveMap || null,
      metalnessMap: baseMaterial.metalnessMap || null,
      normalMap: baseMaterial.normalMap || null,
      roughnessMap: baseMaterial.roughnessMap || null,
      emissive: baseMaterial.emissive?.clone?.() || 0x000000,
      emissiveIntensity: baseMaterial.emissiveIntensity ?? 1,
      metalness: baseMaterial.metalness ?? 0,
      roughness: baseMaterial.roughness ?? 0.5,
      normalScale: baseMaterial.normalScale?.clone?.() || new THREE.Vector2(1, 1),
      opacity: baseMaterial.opacity ?? 1,
      transparent: baseMaterial.transparent ?? false,
      alphaTest: baseMaterial.alphaTest ?? 0,
      side: baseMaterial.side ?? THREE.FrontSide,
      vertexColors: baseMaterial.vertexColors ?? false,
      flatShading: baseMaterial.flatShading ?? false,
    })
    : baseMaterial.clone();
  if (preset.color && material.color) material.color.set(preset.color);
  if (preset.metalness != null && "metalness" in material) {
    material.metalness = preset.metalness;
  }
  if (preset.roughness != null && "roughness" in material) {
    material.roughness = preset.roughness;
  }
  if (preset.emissive && material.emissive) {
    material.emissive.set(preset.emissive);
    material.emissiveIntensity = preset.emissiveIntensity ?? 0.3;
  }
  if (preset.clearcoat != null && "clearcoat" in material) {
    material.clearcoat = preset.clearcoat;
    material.clearcoatRoughness = preset.clearcoatRoughness ?? 0.12;
  }
  if (preset.opacity != null) {
    material.opacity = preset.opacity;
    material.transparent = preset.opacity < 1 || preset.transparent === true;
  }
  material.needsUpdate = true;
  return material;
}

function ViewerModel({ entry, dracoPath, variant, visible, modelRefCb, onInspect, motionPreview }) {
  const gltf = useGLTF(entry.url, dracoPath);
  const scene3 = useMemo(() => gltf.scene.clone(true), [gltf]);
  const clipPreview = motionPreview || entry.clipAnimation
    ? {
      ...(motionPreview || {}),
      clipId: motionPreview?.clipId || entry.clipAnimation?.clipId,
      clipRate: motionPreview?.clipRate ?? entry.clipAnimation?.rate ?? 1,
      clipPlaying: motionPreview?.clipPlaying ?? entry.clipAnimation?.playing ?? false,
    }
    : null;
  const groupRef = useRef(null);
  const meshMaterials = useMemo(() => {
    const meshes = [];
    scene3.traverse((mesh) => {
      if (mesh.isMesh && mesh.material) meshes.push([mesh, mesh.material]);
    });
    return meshes;
  }, [scene3]);

  useEffect(() => {
    if (!entry.variantTarget && !entry.material) return;
    for (const [mesh] of meshMaterials) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  }, [meshMaterials, entry.variantTarget, entry.material]);

  // 体检 + 命名约定解析，上报给外壳
  useEffect(() => {
    if (!onInspect) return;
    const motionTrackIds = (entry.motionTracks || [])
      .filter((track) => scene3.getObjectByName(track.node))
      .map((track) => track.id);
    onInspect(entry.id, {
      ...inspectModel(scene3),
      motionTrackIds,
      animationNames: describeAnimationClips(gltf.animations || []),
    }, entry.url);
  }, [gltf.animations, scene3, entry.id, entry.motionTracks, entry.url, onInspect]);

  // 进场渐显（gamemcu 式的分块出现）：缩放从 1% 弹到目标值
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    if (entry.autoFrame) {
      const box = new THREE.Box3().setFromObject(scene3);
      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        const anchor = new THREE.Vector3(...(entry.position || [0, 0, 0]));
        g.position.set(
          anchor.x - center.x,
          anchor.y - box.min.y,
          anchor.z - center.z
        );
      }
    }
    const target = entry.scale ?? 1;
    if (entry.reveal === false) {
      g.scale.setScalar(target);
      return;
    }
    g.scale.setScalar(target * 0.01);
    const tween = new TWEEN.Tween({ v: target * 0.01 })
      .to({ v: target }, 900)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(({ v }) => g.scale.setScalar(v))
      .start();
    return () => tween.stop();
  }, [scene3, entry.autoFrame, entry.position, entry.scale, entry.reveal]);

  // 材质：变体目标模型用 variant，其他模型可用 entry.material 做覆盖；都没有则保留原材质
  useEffect(() => {
    const preset = entry.variantTarget ? variant : entry.material;
    if (!preset || preset.useOriginal) return;

    const hasVariantSlot = (material) => material?.name?.startsWith(PREFIX.VARIANT_SLOT);
    const variantSlots = entry.variantTarget && meshMaterials.some(([, original]) =>
      Array.isArray(original) ? original.some(hasVariantSlot) : hasVariantSlot(original)
    );
    const generated = new Map();
    const replaceMaterial = (material) => {
      if (!material || (variantSlots && !hasVariantSlot(material))) return material;
      if (!generated.has(material)) {
        generated.set(material, applyMaterialPreset(material, preset));
      }
      return generated.get(material);
    };

    for (const [mesh, original] of meshMaterials) {
      mesh.material = Array.isArray(original)
        ? original.map(replaceMaterial)
        : replaceMaterial(original);
    }

    // 切换预设或卸载前恢复 GLB 的材质引用，只释放预设生成的副本。
    return () => {
      for (const [mesh, original] of meshMaterials) mesh.material = original;
      for (const material of generated.values()) material.dispose();
    };
  }, [meshMaterials, variant, entry.variantTarget, entry.material]);

  return (
    <group
      ref={(g) => {
        groupRef.current = g;
        modelRefCb(entry.id, g);
      }}
      name={`model-${entry.id}`}
      position={entry.position || [0, 0, 0]}
      rotation={entry.rotation || [0, 0, 0]}
      visible={visible}
    >
      <primitive object={scene3} />
      {gltf.animations?.length > 0 && (
        <ModelClipAnimationDriver
          root={scene3}
          animations={gltf.animations}
          preview={clipPreview}
        />
      )}
      {entry.motionTracks?.length > 0 && (
        <>
          <ModelMotionDriver root={scene3} definitions={entry.motionTracks} preview={motionPreview} />
          <MotionDiagnostics
            root={scene3}
            containerRef={groupRef}
            definitions={entry.motionTracks}
            visible={motionPreview?.diagnostics}
          />
        </>
      )}
    </group>
  );
}

function SceneGround({ config }) {
  if (!config?.enabled) return null;
  const size = config.size ?? 40;
  return (
    <>
      <mesh
        position={[0, config.y ?? 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          color={config.color || "#11161b"}
          metalness={config.metalness ?? 0.12}
          roughness={config.roughness ?? 0.62}
        />
      </mesh>
      {config.grid && (
        <gridHelper
          args={[
            size,
            config.grid.divisions ?? 40,
            config.grid.colorCenter || "#45515b",
            config.grid.color || "#202a31",
          ]}
          position={[0, (config.y ?? 0) + 0.002, 0]}
        />
      )}
    </>
  );
}

function SceneEffects({ config }) {
  if (!config?.enabled) return null;
  const colorGrade = config.colorGrade || {};
  return (
    <EffectComposer multisampling={config.multisampling ?? 2}>
      {colorGrade.enabled !== false && (
        <>
          <HueSaturation
            hue={THREE.MathUtils.degToRad(colorGrade.hue ?? 0)}
            saturation={colorGrade.saturation ?? 0}
          />
          <BrightnessContrast
            brightness={colorGrade.brightness ?? 0}
            contrast={colorGrade.contrast ?? 0}
          />
          <RgbColorGrade
            gain={colorGrade.rgbGain}
            lift={colorGrade.rgbLift}
            gamma={colorGrade.rgbGamma}
          />
        </>
      )}
      {config.bloom?.enabled && (
        <Bloom
          luminanceThreshold={config.bloom.threshold ?? 0.75}
          intensity={config.bloom.intensity ?? 1.1}
          radius={config.bloom.radius ?? 0.7}
          mipmapBlur
          luminanceSmoothing={0.08}
        />
      )}
      {config.vignette?.enabled && (
        <Vignette
          eskil
          offset={config.vignette.offset ?? 0.25}
          darkness={config.vignette.darkness ?? 0.65}
        />
      )}
      {config.noise?.enabled && (
        <Noise opacity={config.noise.opacity ?? 0.025} />
      )}
    </EffectComposer>
  );
}

function getToneMapping(name) {
  return {
    None: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping,
    Cineon: THREE.CineonToneMapping,
  }[name] ?? THREE.NoToneMapping;
}

function RendererSettings({ renderer }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = getToneMapping(renderer.toneMapping);
    gl.toneMappingExposure = renderer.exposure ?? 1;
    gl.shadowMap.enabled = renderer.shadows !== false;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl, renderer.exposure, renderer.shadows, renderer.toneMapping]);
  return null;
}

/* ---------------- 镜头编排 ---------------- */

function CameraRig({ shot, controlsRef }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!shot) return;
    const controls = controlsRef.current;
    const from = {
      px: camera.position.x,
      py: camera.position.y,
      pz: camera.position.z,
      tx: controls ? controls.target.x : 0,
      ty: controls ? controls.target.y : 0,
      tz: controls ? controls.target.z : 0,
    };
    const to = {
      px: shot.position[0],
      py: shot.position[1],
      pz: shot.position[2],
      tx: shot.target[0],
      ty: shot.target[1],
      tz: shot.target[2],
    };
    const tween = new TWEEN.Tween(from)
      .to(to, shot.durationMs ?? 1500)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate((v) => {
        camera.position.set(v.px, v.py, v.pz);
        if (controls) {
          controls.target.set(v.tx, v.ty, v.tz);
          controls.update();
        } else {
          camera.lookAt(v.tx, v.ty, v.tz);
        }
      })
      .start();
    return () => tween.stop();
  }, [shot, camera, controlsRef]);

  useFrame(() => {
    TWEEN.update();
  });

  return null;
}

/* ---------------- 热点 ---------------- */

function Hotspot({ spot, modelRefs, defaultModelId, active, onToggle }) {
  const [worldPos, setWorldPos] = useState(null);

  useEffect(() => {
    // anchor=node/world：直接使用 spot.position（HOT_ 解析结果或 JSON 坐标）
    if (spot.anchor === "node" || spot.anchor === "world") {
      setWorldPos(new THREE.Vector3(...spot.position));
      return;
    }
    // anchor=object：取所属模型包围盒中心 + offset
    const model = modelRefs.current.get(spot.modelId || defaultModelId);
    if (!model) return;
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const offset = spot.offset || [0, 0, 0];
    setWorldPos(center.add(new THREE.Vector3(...offset)));
  }, [spot, modelRefs, defaultModelId]);

  if (!worldPos) return null;
  return (
    <Html position={worldPos} center distanceFactor={6} zIndexRange={[20, 0]}>
      <div className={`viewer-hotspot ${active ? "is-active" : ""}`}>
        <button
          className="viewer-hotspot-dot"
          title={spot.label}
          onClick={() => onToggle(active ? null : spot.id)}
        >
          <span className="viewer-hotspot-pulse" />
        </button>
        {active && (
          <div className="viewer-hotspot-panel">
            <h4>{spot.panel?.title || spot.label}</h4>
            <p>{spot.panel?.body}</p>
          </div>
        )}
      </div>
    </Html>
  );
}

/* ---------------- 场景内部 ---------------- */

function SceneContent({
  scene,
  models,
  shot,
  variant,
  hotspots,
  visibility,
  activeHotspot,
  setActiveHotspot,
  onInspect,
  modelRefs,
  controlsRef,
  runtime,
  machine,
  motionPreview,
}) {
  const env = scene.environment || {};
  const controlsCfg = scene.controls || {};
  const defaultModelId = models[0]?.id;

  return (
    <>
      <RendererSettings renderer={scene.renderer || {}} />
      <color attach="background" args={[env.background || "#05060a"]} />
      <ambientLight intensity={env.ambientIntensity ?? 0.3} />
      {env.keyLight && (
        <directionalLight
          position={env.keyLight.position}
          intensity={env.keyLight.intensity ?? 1}
          color={env.keyLight.color || "#ffffff"}
          castShadow
        />
      )}
      {env.fillLight && (
        <pointLight
          position={env.fillLight.position}
          intensity={env.fillLight.intensity ?? 1}
          color={env.fillLight.color || "#b7d8ff"}
          distance={env.fillLight.distance ?? 30}
        />
      )}
      {env.rimLight && (
        <directionalLight
          position={env.rimLight.position}
          intensity={env.rimLight.intensity ?? 1}
          color={env.rimLight.color || "#ffffff"}
        />
      )}
      {(env.preset || env.files) && (
        <Suspense fallback={null}>
          <Environment preset={env.preset} files={env.files} background={false} />
        </Suspense>
      )}

      <SceneNodeExtensions
        extensions={scene.extensions.filter((extension) => extension.kind !== "effect")}
        runtime={runtime}
      />

      <SceneEffectExtensions
        extensions={scene.extensions.filter((extension) => extension.kind === "effect")}
        runtime={runtime}
      />

      <SceneGround config={scene.ground} />
      <SceneParticles config={scene.particles} />

      {models.map((entry) => (
        <Suspense key={entry.id} fallback={null}>
          <ViewerModel
            entry={entry}
            dracoPath={scene.dracoDecoderPath || "/draco/"}
            variant={variant}
            visible={visibility[entry.id] !== false}
            modelRefCb={(id, g) => {
              if (g) modelRefs.current.set(id, g);
              else modelRefs.current.delete(id);
            }}
            onInspect={onInspect}
            motionPreview={motionPreview?.modelId === entry.id ? motionPreview : null}
          />
        </Suspense>
      ))}

      {scene.machine?.enabled && models[0] && !models[0].motionTracks?.length && (
        <HarvesterAnimationDriver
          modelRefs={modelRefs}
          modelId={models[0].id}
          machine={machine}
        />
      )}

      {env.contactShadow && (
        <ContactShadows
          position={env.contactShadowPosition || [0, -1.05, 0]}
          opacity={0.55}
          scale={env.contactShadowScale || 8}
          blur={2.2}
          far={3}
        />
      )}

      <SceneEffects config={{ ...(scene.effects || {}), colorGrade: scene.colorGrade }} />

      {hotspots.map((spot) => (
        <Hotspot
          key={spot.id}
          spot={spot}
          modelRefs={modelRefs}
          defaultModelId={defaultModelId}
          active={activeHotspot === spot.id}
          onToggle={setActiveHotspot}
        />
      ))}

      <CameraRig shot={shot} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        autoRotate={controlsCfg.autoRotate ?? false}
        autoRotateSpeed={controlsCfg.autoRotateSpeed ?? 0.6}
        enableDamping
        dampingFactor={0.08}
        enablePan={controlsCfg.enablePan ?? true}
        minDistance={controlsCfg.minDistance ?? 1.5}
        maxDistance={controlsCfg.maxDistance ?? 12}
      />
    </>
  );
}

/* ---------------- 模型管理面板 ---------------- */

function ModelPanel({ models, modelsInfo, visibility, onToggleVisible, onFocus }) {
  const [open, setOpen] = useState(true);

  const totals = useMemo(() => {
    let v = 0;
    let t = 0;
    for (const info of Object.values(modelsInfo)) {
      v += info.vertexCount || 0;
      t += info.triangleCount || 0;
    }
    return { v, t };
  }, [modelsInfo]);

  return (
    <div className={`scene-viewer-models ${open ? "is-open" : ""}`}>
      <button className="scene-viewer-models-toggle" onClick={() => setOpen(!open)}>
        模型管理 {open ? "−" : "+"}
      </button>
      {open && (
        <div className="scene-viewer-models-body">
          {models.map((m) => {
            const info = modelsInfo[m.id];
            const hidden = visibility[m.id] === false;
            return (
              <div key={m.id} className={`scene-viewer-model-item ${hidden ? "is-hidden" : ""}`}>
                <div className="model-item-head">
                  <span className="model-item-name">
                    {m.label || m.id}
                    {m.variantTarget ? <em className="model-item-tag">变体</em> : null}
                  </span>
                  <span className="model-item-actions">
                    <button title="定位到模型" onClick={() => onFocus(m.id)}>◎</button>
                    <button
                      title={hidden ? "显示" : "隐藏"}
                      onClick={() => onToggleVisible(m.id)}
                    >
                      {hidden ? "◌" : "●"}
                    </button>
                  </span>
                </div>
                {info ? (
                  <div className="model-item-stats">
                    <span>网格 {info.meshCount}</span>
                    <span>顶点 {info.vertexCount.toLocaleString()}</span>
                    <span>三角面 {info.triangleCount.toLocaleString()}</span>
                    <span>
                      尺寸 {info.bbox.size.map((n) => n.toFixed(1)).join(" × ")}
                    </span>
                  </div>
                ) : (
                  <div className="model-item-stats">加载中…</div>
                )}
              </div>
            );
          })}
          <div className="scene-viewer-models-total">
            合计：顶点 {totals.v.toLocaleString()} · 三角面 {totals.t.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- 外壳：UI + Canvas ---------------- */

export default function SceneViewer({ scene, onRuntimeReady, onModelInspect, motionPreview }) {
  const normalizedScene = useMemo(() => normalizeScene(scene), [scene]);
  const runtime = useMemo(
    () => createSceneRuntime(normalizedScene),
    [normalizedScene]
  );
  const runtimeState = useSceneRuntime(runtime);

  const models = useMemo(() => {
    return normalizedScene.models;
  }, [normalizedScene.models]);

  const {
    modelsInfo,
    visibility,
    parsedShots,
    parsedHotspots,
    activeHotspot,
    autoPlay,
    shotId,
    variantId,
    machine,
  } = runtimeState;

  const modelRefs = useRef(new Map());
  const controlsRef = useRef(null);

  const handleInspect = useCallback((id, info, url) => {
    runtime.dispatch({ type: "model/inspected", payload: { id, info } });
    onModelInspect?.(id, info, url);
  }, [onModelInspect, runtime]);

  useEffect(() => {
    onRuntimeReady?.(runtime);
  }, [onRuntimeReady, runtime]);

  // JSON 与模型解析结果合并，JSON 优先
  const shots = useMemo(() => {
    const merged = mergeById(normalizedScene.shots, parsedShots);
    return merged.map((s) => ({ target: [0, 0, 0], ...s }));
  }, [normalizedScene.shots, parsedShots]);

  const hotspots = useMemo(
    () => mergeById(normalizedScene.hotspots, parsedHotspots),
    [normalizedScene.hotspots, parsedHotspots]
  );

  const variants = normalizedScene.materialVariants;

  useEffect(() => {
    if (!shotId && shots.length > 0) {
      runtime.dispatch({ type: "shot/set", payload: { id: shots[0].id } });
    }
  }, [runtime, shots, shotId]);

  const shot = shots.find((s) => s.id === shotId) || shots[0];
  const variant = variants.find((v) => v.id === variantId) || variants[0];

  // 机位序列自动巡演（镜头脚本的最小形态）
  useEffect(() => {
    if (!autoPlay || shots.length < 2) return;
    const timer = setInterval(() => {
      const currentShotId = runtime.getState().shotId;
      const idx = shots.findIndex((s) => s.id === currentShotId);
      runtime.dispatch({
        type: "shot/set",
        payload: { id: shots[(idx + 1) % shots.length].id },
      });
    }, 3800);
    return () => clearInterval(timer);
  }, [autoPlay, runtime, shots]);

  const focusShot = useRef(null);

  // 相机定位到指定模型（按包围盒适配，保持当前方位角）
  const focusModel = useCallback((id) => {
    const group = modelRefs.current.get(id);
    if (!group) return;
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 0.5);
    const cam = controlsRef.current;
    const dir = new THREE.Vector3(0.6, 0.45, 1).normalize();
    if (cam?.object) {
      dir.copy(cam.object.position).sub(cam.target).normalize();
    }
    const pos = center.clone().add(dir.multiplyScalar(radius * 2.4));
    focusShot.current = {
      id: `__focus_${id}`,
      position: pos.toArray(),
      target: center.toArray(),
      durationMs: 1200,
    };
    runtime.dispatch({ type: "shot/set", payload: { id: `__focus_${id}` } });
  }, [runtime]);

  const activeShot = shotId?.startsWith("__focus_") ? focusShot.current : shot;
  const renderer = normalizedScene.renderer;
  const handleRendererCreated = useCallback(({ gl }) => {
    gl.toneMapping = getToneMapping(renderer.toneMapping);
    gl.toneMappingExposure = renderer.exposure;
  }, [renderer.exposure, renderer.toneMapping]);

  return (
    <div className="scene-viewer">
      <Canvas
        dpr={renderer.dpr}
        camera={{
          position: shot?.position || [0, 0, 5],
          fov: normalizedScene.camera?.fov ?? 40,
          near: normalizedScene.camera?.near ?? 0.1,
          far: normalizedScene.camera?.far ?? 200,
        }}
        gl={{ antialias: true, outputColorSpace: THREE.SRGBColorSpace }}
        onCreated={handleRendererCreated}
        shadows={renderer.shadows}
      >
        <SceneContent
          scene={normalizedScene}
          models={models}
          shot={activeShot}
          variant={variant}
          hotspots={hotspots}
          visibility={visibility}
          activeHotspot={activeHotspot}
          setActiveHotspot={(id) =>
            runtime.dispatch({
              type: "hotspot/set-active",
              payload: { id },
            })
          }
          onInspect={handleInspect}
          modelRefs={modelRefs}
          controlsRef={controlsRef}
          runtime={runtime}
          machine={machine}
          motionPreview={motionPreview}
        />
      </Canvas>
      <Loader />

      <div className="scene-viewer-ui">
        <header className="scene-viewer-header">
          <h2>{normalizedScene.title}</h2>
        </header>

        <MachinePanel
          config={normalizedScene.machine}
          machine={machine}
          onDispatch={runtime.dispatch}
        />

        <ModelPanel
          models={models}
          modelsInfo={modelsInfo}
          visibility={visibility}
          onToggleVisible={(id) =>
            runtime.dispatch({
              type: "model/toggle-visibility",
              payload: { id },
            })
          }
          onFocus={focusModel}
        />

        <div className="scene-viewer-dock">
          {shots.length > 0 && (
            <div className="scene-viewer-group">
              <span className="scene-viewer-group-label">镜头</span>
              {shots.map((s) => (
                <button
                  key={s.id}
                  className={s.id === shotId ? "is-active" : ""}
                  onClick={() => {
                    runtime.dispatch({ type: "autoplay/set", payload: { value: false } });
                    runtime.dispatch({ type: "shot/set", payload: { id: s.id } });
                  }}
                >
                  {s.label}
                </button>
              ))}
              {shots.length > 1 && (
                <button
                  className={`scene-viewer-play ${autoPlay ? "is-active" : ""}`}
                  title="机位自动巡演"
                  onClick={() =>
                    runtime.dispatch({
                      type: "autoplay/set",
                      payload: { value: !autoPlay },
                    })
                  }
                >
                  {autoPlay ? "⏸ 巡演" : "▶ 巡演"}
                </button>
              )}
            </div>
          )}
          {variants.length > 0 && (
            <div className="scene-viewer-group">
              <span className="scene-viewer-group-label">材质</span>
              {variants.map((v) => (
                <button
                  type="button"
                  key={v.id}
                  className={`scene-viewer-swatch ${
                    v.id === variant?.id ? "is-active" : ""
                  } ${v.useOriginal ? "is-original" : ""}`}
                  style={{ "--swatch": v.color }}
                  title={v.useOriginal ? "使用模型自带的颜色、贴图和材质" : v.label}
                  aria-pressed={v.id === variant?.id}
                  onClick={() =>
                    runtime.dispatch({ type: "variant/set", payload: { id: v.id } })
                  }
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 预加载工具：路由跳转前可调用
SceneViewer.preload = (scene) => {
  for (const m of scene?.models || []) {
    useGLTF.preload(m.url, scene.dracoDecoderPath || "/draco/");
  }
};
