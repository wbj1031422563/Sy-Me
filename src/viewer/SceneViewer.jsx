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
  Component,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
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
import { MeshoptDecoder } from "three-stdlib";
import TWEEN from "@tweenjs/tween.js";
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  Noise,
  SMAA,
  Vignette,
} from "@react-three/postprocessing";
import { buildNodeHierarchy, mergeById, inspectModel, PREFIX } from "./conventions.js";
import { normalizeScene } from "../core/scene/scene-normalize.js";
import PageThemeControl from "../features/page-theme/PageThemeControl.jsx";
import { inspectWebGLContext } from "./webgl-info.js";
import { applyQualityTier, nextQualityTier, resolveModelLodUrl, QUALITY_TIER_LABELS } from "./adaptive-quality.js";
import { createSceneRuntime, useSceneRuntime } from "../core/scene/scene-runtime.js";
import {
  SceneEffectExtensions,
  SceneNodeExtensions,
} from "../core/scene/SceneExtensionLayer.jsx";
import MachinePanel from "./MachinePanel.jsx";
import HarvesterAnimationDriver from "./HarvesterAnimationDriver.jsx";
import MachineSimTicker from "./MachineSimTicker.jsx";
import AssemblyGroundAligner from "./AssemblyGroundAligner.jsx";
import AssemblyBoundsOverlay from "./AssemblyBoundsOverlay.jsx";
import { offsetShotByLift } from "./assembly-bounds.js";
import ModelClipAnimationDriver from "./ModelClipAnimationDriver.jsx";
import ModelMotionDriver from "./ModelMotionDriver.jsx";
import MotionDiagnostics from "./MotionDiagnostics.jsx";
import SceneParticles from "./SceneParticles.jsx";
import ScenePerformanceProbe from "./ScenePerformanceProbe.jsx";
import RgbColorGrade from "./RgbColorGrade.jsx";
import { describeAnimationClips } from "./animation-clips.js";
import { VISUAL_LIMITS, resolveCameraConstraints } from "../core/scene/scene-visual-limits.js";
import "./scene-viewer.less";

// 网页优化分件使用 EXT_meshopt_compression + KHR_mesh_quantization；全局只需设置一次解码器
if (typeof useGLTF.setMeshoptDecoder === "function") {
  useGLTF.setMeshoptDecoder(MeshoptDecoder);
}

/* ---------------- 相机地面碰撞 ---------------- */

/**
 * 真实感视角约束：监听 OrbitControls change，把相机与目标点钳制在地面以上。
 * 配合 OrbitControls 的 maxPolarAngle 软上限；阻尼/平移过程中逐帧生效。
 */
function CameraGroundGuard({ controlsRef, groundY = 0, constraints }) {
  useEffect(() => {
    if (!constraints?.groundClamp) return undefined;
    const controls = controlsRef.current;
    if (!controls) return undefined;
    const minCameraY = groundY + constraints.minCameraHeight;
    const minTargetY = groundY + constraints.minTargetHeight;
    const clampView = () => {
      const position = controls.object?.position;
      if (position && position.y < minCameraY) position.y = minCameraY;
      const target = controls.target;
      if (target && target.y < minTargetY) target.y = minTargetY;
    };
    clampView();
    controls.addEventListener("change", clampView);
    return () => controls.removeEventListener("change", clampView);
  }, [controlsRef, groundY, constraints]);
  return null;
}

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

function NodeSelectionHelpers({ root, parentRef, selectedNodeIds }) {
  const helpersRef = useRef([]);

  useEffect(() => {
    const parent = parentRef.current?.parent;
    if (!parent || selectedNodeIds.length === 0) return undefined;
    const selected = new Set(selectedNodeIds);
    const helpers = [];
    root.traverse((node) => {
      if (!selected.has(node.userData?.__editorNodeKey)) return;
      const helper = new THREE.BoxHelper(node, 0x78e1ae);
      helper.renderOrder = 999;
      helper.material.depthTest = false;
      helper.material.transparent = true;
      helper.material.opacity = 0.9;
      parent.add(helper);
      helpers.push(helper);
    });
    helpersRef.current = helpers;
    return () => {
      helpers.forEach((helper) => {
        parent.remove(helper);
        helper.geometry.dispose();
        helper.material.dispose();
      });
      helpersRef.current = [];
    };
  }, [root, parentRef, selectedNodeIds]);

  useFrame(() => {
    helpersRef.current.forEach((helper) => helper.update());
  });

  return null;
}

function ViewerModel({
  entry,
  dracoPath,
  variant,
  visible,
  modelRefCb,
  onInspect,
  motionPreview,
  selectedNodeIds = [],
  onNodeSelect,
  materialMode,
  textureAnisotropy = 0,
  children,
}) {
  const gl = useThree((state) => state.gl);
  const gltf = useGLTF(entry.url, dracoPath);
  const scene3 = useMemo(() => gltf.scene.clone(true), [gltf]);

  // 贴图锐化：在倾斜视角下减少糊感（各向异性过滤）
  useEffect(() => {
    if (!textureAnisotropy) return;
    const max = Math.min(Number(gl?.capabilities?.getMaxAnisotropy?.()) || 1, Number(textureAnisotropy) || 1);
    if (!Number.isFinite(max) || max <= 1) return;
    scene3.traverse((node) => {
      if (!node.isMesh) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((material) => {
        ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap", "bumpMap"].forEach((slot) => {
          const texture = material?.[slot];
          if (texture && "anisotropy" in texture) {
            texture.anisotropy = max;
            texture.needsUpdate = true;
          }
        });
      });
    });
  }, [scene3, gl, textureAnisotropy]);
  const clipPreview = motionPreview || entry.clipAnimation
    ? {
      ...(motionPreview || {}),
      clipId: motionPreview?.clipId || entry.clipAnimation?.clipId,
      clipRate: motionPreview?.clipRate ?? entry.clipAnimation?.rate ?? 1,
      clipPlaying: motionPreview?.clipPlaying ?? entry.clipAnimation?.playing ?? false,
    }
    : null;
  const groupRef = useRef(null);
  const invalidate = useThree((state) => state.invalidate);
  const meshMaterials = useMemo(() => {
    const meshes = [];
    scene3.traverse((mesh) => {
      if (mesh.isMesh && mesh.material) meshes.push([mesh, mesh.material]);
    });
    return meshes;
  }, [scene3]);

  useEffect(() => {
    buildNodeHierarchy(scene3, { annotate: true });
  }, [scene3]);

  useEffect(() => {
    const overrides = entry.nodeVisibility || {};
    scene3.traverse((node) => {
      const userData = node.userData || (node.userData = {});
      if (userData.__editorDefaultVisible == null) {
        userData.__editorDefaultVisible = node.visible;
      }
      const key = userData.__editorNodeKey;
      node.visible = Object.prototype.hasOwnProperty.call(overrides, key)
        ? overrides[key] !== false
        : userData.__editorDefaultVisible;
    });
  }, [scene3, entry.nodeVisibility]);

  useEffect(() => {
    buildNodeHierarchy(scene3, { annotate: true });
    const deltas = entry.nodeTransformDeltas || {};
    scene3.traverse((node) => {
      if (!node.userData.__editorBaseTransform) {
        node.userData.__editorBaseTransform = {
          position: node.position.clone(),
          rotation: node.rotation.clone(),
          scale: node.scale.clone(),
        };
      }
      const base = node.userData.__editorBaseTransform;
      const delta = deltas[node.userData?.__editorNodeKey];
      if (!delta) {
        node.position.copy(base.position);
        node.rotation.copy(base.rotation);
        node.scale.copy(base.scale);
        node.updateMatrix();
        return;
      }
      const position = delta.position || [0, 0, 0];
      const rotation = delta.rotation || [0, 0, 0];
      const scale = delta.scale ?? 1;
      node.position.set(
        base.position.x + (position[0] || 0),
        base.position.y + (position[1] || 0),
        base.position.z + (position[2] || 0),
      );
      node.rotation.set(
        base.rotation.x + (rotation[0] || 0),
        base.rotation.y + (rotation[1] || 0),
        base.rotation.z + (rotation[2] || 0),
        base.rotation.order,
      );
      node.scale.set(
        base.scale.x * scale,
        base.scale.y * scale,
        base.scale.z * scale,
      );
      node.updateMatrix();
    });
  }, [scene3, entry.nodeTransformDeltas]);

  useEffect(() => {
    if (gltf.animations?.length > 0 || entry.motionTracks?.length > 0) return undefined;
    scene3.updateMatrixWorld(true);
    scene3.traverse((node) => {
      node.updateMatrix();
      node.matrixAutoUpdate = false;
    });
    scene3.updateMatrixWorld(true);
    return () => {
      scene3.traverse((node) => {
        node.matrixAutoUpdate = true;
      });
    };
  }, [entry.motionTracks?.length, gltf.animations?.length, scene3, entry.nodeTransformDeltas]);

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
      .onUpdate(({ v }) => {
        g.scale.setScalar(v);
        invalidate();
      })
      .start();
    invalidate();
    return () => tween.stop();
  }, [invalidate, scene3, entry.autoFrame, entry.position, entry.scale, entry.reveal]);

  // 材质：变体目标模型用 variant，其他模型可用 entry.material 做覆盖；都没有则保留原材质
  useEffect(() => {
    const preset = entry.variantTarget ? variant : entry.material;
    const materialOverrides = entry.materialOverrides || [];
    if ((!preset || preset.useOriginal) && materialOverrides.length === 0) return;

    const hasVariantSlot = (material) => material?.name?.startsWith(PREFIX.VARIANT_SLOT);
    const variantSlots = entry.variantTarget && meshMaterials.some(([, original]) =>
      Array.isArray(original) ? original.some(hasVariantSlot) : hasVariantSlot(original)
    );
    const generated = new Map();
    const replaceMaterial = (material) => {
      if (!material) return material;
      const override = materialOverrides.find((item) => item.materialName === material.name);
      const nextPreset = override || preset;
      if (!nextPreset || nextPreset.useOriginal || (!override && variantSlots && !hasVariantSlot(material))) {
        return material;
      }
      const generatedKey = override ? `${material.uuid}:${override.materialName}` : material;
      if (!generated.has(generatedKey)) {
        generated.set(generatedKey, applyMaterialPreset(material, nextPreset));
      }
      return generated.get(generatedKey);
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
  }, [meshMaterials, variant, entry.variantTarget, entry.material, entry.materialOverrides]);

  useEffect(() => {
    if (materialMode !== "basic" && materialMode !== "flat") return undefined;
    const generated = [];
    const previousMaterials = new Map();
    const simplify = (material) => {
      if (!material) return material;
      const basic = new THREE.MeshBasicMaterial({
        alphaMap: material.alphaMap || null,
        alphaTest: material.alphaTest ?? 0,
        color: material.color?.clone?.() || 0xffffff,
        // 性能降级仍保留原始贴图，避免模型在低端设备上变成无纹理轮廓。
        map: material.map || null,
        opacity: material.opacity ?? 1,
        side: material.side ?? THREE.FrontSide,
        transparent: material.transparent ?? false,
        vertexColors: material.vertexColors ?? false,
      });
      basic.name = material.name || "performance-material";
      generated.push(basic);
      return basic;
    };
    meshMaterials.forEach(([mesh]) => {
      const material = mesh.material;
      previousMaterials.set(mesh, material);
      mesh.material = Array.isArray(material) ? material.map(simplify) : simplify(material);
    });
    return () => {
      previousMaterials.forEach((material, mesh) => {
        mesh.material = material;
      });
      generated.forEach((material) => material.dispose());
    };
  }, [materialMode, meshMaterials]);

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
      <primitive
        object={scene3}
        onClick={(event) => {
          event.stopPropagation();
          const nodeId = event.object?.userData?.__editorNodeKey;
          if (nodeId) onNodeSelect?.(entry.id, nodeId, { multi: Boolean(event.shiftKey) });
        }}
      />
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
      {children}
      <NodeSelectionHelpers
        root={scene3}
        parentRef={groupRef}
        selectedNodeIds={selectedNodeIds}
      />
    </group>
  );
}

class ModelLoadBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    this.props.onError?.(this.props.modelId, error);
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <Html center zIndexRange={[30, 0]}>
          <div className="scene-viewer-model-error" role="status">
            <strong>模型加载失败</strong>
            <span>{this.props.label || this.props.modelId}</span>
            <small>可在右侧模型管理中重试</small>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

function ModelLoadingPlaceholder({ label }) {
  return (
    <Html center zIndexRange={[25, 0]}>
      <div className="scene-viewer-model-loading" role="status">
        <span className="scene-viewer-model-loading-dot" />
        <span>正在加载 {label || "模型"}</span>
      </div>
    </Html>
  );
}

function EmptyViewerModel({ entry, visible, modelRefCb, children }) {
  const groupRef = useRef(null);

  useEffect(() => {
    modelRefCb(entry.id, groupRef.current);
    return () => modelRefCb(entry.id, null);
  }, [entry.id, modelRefCb]);

  return (
    <group
      ref={groupRef}
      name={`model-${entry.id}`}
      position={entry.position || [0, 0, 0]}
      rotation={entry.rotation || [0, 0, 0]}
      scale={entry.scale || 1}
      visible={visible}
    >
      <Html center distanceFactor={6} zIndexRange={[10, 0]}>
        <div className="scene-viewer-empty-model-label">{entry.label || "未加载模型"}</div>
      </Html>
      {children}
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
  const rgbGain = colorGrade.rgbGain || [1, 1, 1];
  const rgbLift = colorGrade.rgbLift || [0, 0, 0];
  const rgbGamma = colorGrade.rgbGamma || [1, 1, 1];
  const hasColorGrade = colorGrade.enabled !== false && (
    colorGrade.hue !== 0
    || colorGrade.saturation !== 0
    || colorGrade.brightness !== 0
    || colorGrade.contrast !== 0
    || rgbGain.some((value, index) => Number(value) !== [1, 1, 1][index])
    || rgbLift.some((value, index) => Number(value) !== [0, 0, 0][index])
    || rgbGamma.some((value, index) => Number(value) !== [1, 1, 1][index])
  );
  const hasPostEffect = hasColorGrade || config.bloom?.enabled || config.vignette?.enabled || config.noise?.enabled;
  const hasSmaa = Boolean(config.smaa?.enabled);
  if (!hasPostEffect && !hasSmaa) return null;
  return (
    <EffectComposer multisampling={config.multisampling ?? 0}>
      {hasSmaa && <SMAA />}
      {hasColorGrade && (
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

function SceneCapture({ requestRef, requestToken }) {
  const { gl, scene, camera, invalidate } = useThree();

  useEffect(() => {
    if (requestToken > 0) invalidate();
  }, [invalidate, requestToken]);

  useFrame(() => {
    const resolve = requestRef.current;
    if (!resolve) return;
    requestRef.current = null;

    let target = null;
    let previousTarget = null;
    try {
      const size = gl.getDrawingBufferSize(new THREE.Vector2());
      const width = Math.max(1, Math.floor(size.x));
      const height = Math.max(1, Math.floor(size.y));
      target = new THREE.WebGLRenderTarget(width, height, {
        depthBuffer: true,
        stencilBuffer: false,
        colorSpace: THREE.SRGBColorSpace,
      });
      previousTarget = gl.getRenderTarget();
      gl.setRenderTarget(target);
      gl.clear();
      gl.render(scene, camera);
      const pixels = new Uint8Array(width * height * 4);
      gl.readRenderTargetPixels(target, 0, 0, width, height, pixels);
      gl.setRenderTarget(previousTarget);

      const output = document.createElement("canvas");
      output.width = width;
      output.height = height;
      const context = output.getContext("2d");
      if (!context) {
        resolve(null);
        return;
      }
      const imageData = context.createImageData(width, height);
      const rowSize = width * 4;
      for (let row = 0; row < height; row += 1) {
        const sourceOffset = (height - row - 1) * rowSize;
        imageData.data.set(pixels.subarray(sourceOffset, sourceOffset + rowSize), row * rowSize);
      }
      context.putImageData(imageData, 0, 0);
      resolve(output.toDataURL("image/png"));
    } catch {
      resolve(null);
    } finally {
      if (gl.getRenderTarget() === target) gl.setRenderTarget(previousTarget);
      target?.dispose();
    }
  });

  return null;
}

/* ---------------- 镜头编排 ---------------- */

function CameraRig({ shot, controlsRef, assemblyLiftY = 0 }) {
  const { camera, invalidate } = useThree();

  useEffect(() => {
    if (!shot) return;
    const lifted = offsetShotByLift(shot, assemblyLiftY);
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
      px: lifted.position[0],
      py: lifted.position[1],
      pz: lifted.position[2],
      tx: lifted.target[0],
      ty: lifted.target[1],
      tz: lifted.target[2],
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
        invalidate();
      })
      .start();
    invalidate();
    return () => tween.stop();
  }, [shot, camera, controlsRef, invalidate, assemblyLiftY]);

  useFrame(() => {
    TWEEN.update();
  });

  return null;
}

/* ---------------- 热点 ---------------- */

function Hotspot({ spot, modelRefs, defaultModelId, active, onToggle, onLookHere, showcase, assemblyLiftY = 0 }) {
  const [worldPos, setWorldPos] = useState(null);

  useEffect(() => {
    // anchor=node/world：直接使用 spot.position（HOT_ 解析结果或 JSON 坐标）
    if (spot.anchor === "node" || spot.anchor === "world") {
      const position = spot.position || [0, 0, 0];
      setWorldPos(new THREE.Vector3(
        position[0],
        (position[1] || 0) + (Number(assemblyLiftY) || 0),
        position[2]
      ));
      return;
    }
    // anchor=object：取所属模型包围盒中心 + offset（模型已在自适应抬升根节点下）
    const model = modelRefs.current.get(spot.modelId || defaultModelId);
    if (!model) return;
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const offset = spot.offset || [0, 0, 0];
    setWorldPos(center.add(new THREE.Vector3(...offset)));
  }, [spot, modelRefs, defaultModelId, assemblyLiftY]);

  if (!worldPos) return null;
  return (
    <Html position={worldPos} center distanceFactor={showcase ? 7 : 6} zIndexRange={[20, 0]}>
      <div className={`viewer-hotspot ${active ? "is-active" : ""} ${showcase ? "is-showcase" : ""}`}>
        <button
          type="button"
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
            {spot.shotId && onLookHere && (
              <button
                type="button"
                className="viewer-hotspot-look"
                onClick={() => onLookHere(spot.shotId)}
              >
                看这里
              </button>
            )}
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
  onHotspotLookHere,
  onInspect,
  modelRefs,
  controlsRef,
  runtime,
  machine,
  motionPreview,
  selectedNodeIds,
  onNodeSelect,
  onModelError,
  modelReloadTokens,
  autoRotate,
  showcase = false,
  onAssemblyAligned,
}) {
  const env = scene.environment || {};
  const controlsCfg = scene.controls || {};
  const cameraConstraints = useMemo(() => resolveCameraConstraints(scene.controls), [scene.controls]);
  const stageGroundY = scene.assemblyMeta?.groundY ?? scene.ground?.y ?? 0;
  const defaultModelId = models[0]?.id;
  const modelById = new Map(models.map((model) => [model.id, model]));
  const childrenById = new Map();
  const assemblyRootRef = useRef(null);
  const adaptiveGround = scene.assemblyMeta?.adaptiveGround !== false
    && (scene.assemblyMeta?.adaptiveGround === true || Boolean(scene.assemblyMeta?.groundOffset));
  const fallbackLiftY = scene.assemblyMeta?.groundOffset?.[1]
    ?? VISUAL_LIMITS.assembly.groundLiftY.default;
  const [assemblyLiftY, setAssemblyLiftY] = useState(adaptiveGround ? fallbackLiftY : 0);
  const [assemblyAlign, setAssemblyAlign] = useState(null);
  const showBoundsOverlay = adaptiveGround
    && (scene.assemblyMeta?.showBounds === true || scene.parameters?.showAssemblyBounds === true);

  useEffect(() => {
    if (!adaptiveGround) {
      setAssemblyLiftY(0);
      setAssemblyAlign(null);
      return;
    }
    setAssemblyLiftY(fallbackLiftY);
    setAssemblyAlign(null);
  }, [adaptiveGround, fallbackLiftY, scene.id, models.length]);

  models.forEach((model) => {
    if (!model.parentId || !modelById.has(model.parentId)) return;
    const childrenForParent = childrenById.get(model.parentId) || [];
    childrenForParent.push(model);
    childrenById.set(model.parentId, childrenForParent);
  });

  const renderModel = (entry, ancestry = new Set()) => {
    if (ancestry.has(entry.id)) return null;
    const nextAncestry = new Set(ancestry);
    nextAncestry.add(entry.id);
    const ModelComponent = entry.url ? ViewerModel : EmptyViewerModel;
    return (
      <ModelLoadBoundary
        key={`${entry.id}-${modelReloadTokens?.[entry.id] || 0}`}
        modelId={entry.id}
        label={entry.label}
        resetKey={`${entry.url || "empty"}-${modelReloadTokens?.[entry.id] || 0}`}
        onError={onModelError}
      >
        <Suspense fallback={<ModelLoadingPlaceholder label={entry.label} />}>
          <ModelComponent
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
            selectedNodeIds={selectedNodeIds?.[entry.id] || []}
            onNodeSelect={onNodeSelect}
            materialMode={scene.renderer?.materialMode}
            textureAnisotropy={scene.renderer?.textureAnisotropy}
          >
            {(childrenById.get(entry.id) || []).map((child) => renderModel(child, nextAncestry))}
          </ModelComponent>
        </Suspense>
      </ModelLoadBoundary>
    );
  };

  const rootModels = models.filter((model) => !model.parentId || !modelById.has(model.parentId));

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

      <group ref={assemblyRootRef} name="assembly-root">
        {rootModels.map((entry) => renderModel(entry))}
      </group>

      {adaptiveGround && (
        <AssemblyGroundAligner
          enabled
          modelRefs={modelRefs}
          models={models}
          visibility={visibility}
          groundY={scene.assemblyMeta?.groundY ?? scene.ground?.y ?? 0}
          wheelPatterns={scene.assemblyMeta?.wheelModelIdPatterns}
          fallbackLiftY={fallbackLiftY}
          assemblyRootRef={assemblyRootRef}
          onAligned={(result) => {
            setAssemblyLiftY(result.liftY);
            setAssemblyAlign(result);
            onAssemblyAligned?.(result);
          }}
        />
      )}

      <AssemblyBoundsOverlay
        enabled={showBoundsOverlay}
        result={assemblyAlign}
      />

      {scene.machine?.enabled && (
        <>
          <MachineSimTicker enabled={Boolean(scene.machine?.enabled)} runtime={runtime} />
          <HarvesterAnimationDriver
            modelRefs={modelRefs}
            modelId={models[0]?.id}
            modelIds={models.map((model) => model.id)}
            machine={machine}
          />
        </>
      )}

      {env.contactShadow && (
        <ContactShadows
          position={env.contactShadowPosition || [0, 0.02, 0]}
          opacity={0.55}
          scale={env.contactShadowScale || 8}
          blur={2.2}
          far={3}
          frames={env.contactShadowFrames ?? 1}
        />
      )}

      <SceneEffects config={{ ...(scene.effects || {}), colorGrade: scene.colorGrade }} />

      {hotspots.map((spot) => (
        <Hotspot
          key={spot.id}
          spot={spot}
          modelRefs={modelRefs}
          defaultModelId={defaultModelId}
          showcase={showcase}
          onLookHere={onHotspotLookHere}
          active={activeHotspot === spot.id}
          onToggle={setActiveHotspot}
          assemblyLiftY={adaptiveGround ? assemblyLiftY : 0}
        />
      ))}

      <CameraRig
        shot={shot}
        controlsRef={controlsRef}
        assemblyLiftY={adaptiveGround ? assemblyLiftY : 0}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        autoRotate={autoRotate}
        autoRotateSpeed={controlsCfg.autoRotateSpeed ?? 0.6}
        enableDamping
        dampingFactor={0.08}
        enablePan={controlsCfg.enablePan ?? true}
        minDistance={controlsCfg.minDistance ?? 1.5}
        maxDistance={controlsCfg.maxDistance ?? 12}
        maxPolarAngle={controlsCfg.maxPolarAngle ?? cameraConstraints.maxPolarAngle}
      />
      <CameraGroundGuard
        controlsRef={controlsRef}
        groundY={stageGroundY}
        constraints={cameraConstraints}
      />
    </>
  );
}

/* ---------------- 模型管理面板 ---------------- */

function ModelPanel({
  models,
  modelsInfo,
  modelErrors,
  visibility,
  onToggleVisible,
  onSetAllVisible,
  onRetry,
  onFocus,
}) {
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
          <div className="scene-viewer-models-actions">
            <span>场景部件</span>
            <div>
              <button type="button" onClick={() => onSetAllVisible(true)}>全部显示</button>
              <button type="button" onClick={() => onSetAllVisible(false)}>全部隐藏</button>
            </div>
          </div>
          {models.map((m) => {
            const info = modelsInfo[m.id];
            const error = modelErrors[m.id];
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
                {error ? (
                  <div className="model-item-error">
                    <span>加载失败：{error}</span>
                    <button type="button" onClick={() => onRetry(m.id)}>重试</button>
                  </div>
                ) : info ? (
                  <div className="model-item-stats">
                    <span>网格 {info.meshCount}</span>
                    <span>顶点 {info.vertexCount.toLocaleString()}</span>
                    <span>三角面 {info.triangleCount.toLocaleString()}</span>
                    <span>
                      尺寸 {info.bbox.size.map((n) => n.toFixed(1)).join(" × ")}
                    </span>
                  </div>
                ) : (
                  <div className="model-item-stats">{m.url ? "加载中…" : "待加载本地文件"}</div>
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

function ViewerPerformancePanel({ stats, models, modelsInfo, renderInfo, adaptiveQuality, qualityTier, onToggleAdaptive, open, onOpenChange }) {
  const loadedCount = models.filter((model) => modelsInfo[model.id]).length;
  const fps = stats?.fps;
  const tone = !stats ? "is-pending" : fps < 30 ? "is-danger" : fps < 45 ? "is-warning" : "is-ready";
  const advice = !stats
    ? "正在采集渲染数据。"
    : fps < 30
      ? "帧率偏低，建议关闭高成本灯光、后期或粒子。"
      : stats.triangles > 5000000
        ? "三角面较高，建议准备减面或 LOD 版本。"
        : stats.calls > 800
          ? "Draw Call 较高，建议合并材质槽。"
          : "当前展台负载正常。";
  const format = (value) => Number.isFinite(value) ? value.toLocaleString("zh-CN") : "—";

  return (
    <aside className={`scene-viewer-performance ${open ? "is-open" : ""}`} aria-label="实时性能监控">
      <button type="button" className="scene-viewer-performance-toggle" onClick={() => onOpenChange((value) => !value)}>
        <span>性能监控</span>
        <strong className={tone}>{stats ? `${format(fps)} FPS` : "采集中"}</strong>
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="scene-viewer-performance-body">
          <div className="scene-viewer-performance-grid">
            <span>模型体检<strong>{loadedCount}/{models.length}</strong><small>已加载 / 总数</small></span>
            <span>Draw Call<strong>{format(stats?.calls)}</strong><small>次 / 帧</small></span>
            <span>三角面<strong>{format(stats?.triangles)}</strong><small>面 / 帧</small></span>
            <span>纹理<strong>{format(stats?.textures)}</strong><small>张</small></span>
          </div>
          <div className="scene-viewer-performance-peak-grid">
            <span>Draw Call 峰值<strong>{format(stats?.callsPeak)}</strong><small>采样周期内</small></span>
            <span>三角面峰值<strong>{format(stats?.trianglesPeak)}</strong><small>面 / 帧</small></span>
            <span>采样帧数<strong>{format(stats?.sampleFrames)}</strong><small>{format(stats?.sampleDurationMs)} ms</small></span>
          </div>
          <p className="scene-viewer-performance-note">平均值用于判断持续负载，峰值用于定位瞬时卡顿；这里不等于系统 GPU 占用率。</p>
          <p className={`scene-viewer-performance-advice ${tone}`}>{advice}</p>
          <div className="scene-viewer-render-info" title={renderInfo?.renderer || "等待渲染器信息"}>
            <span>渲染后端</span>
            <strong className={`is-${renderInfo?.hardware || "unknown"}`}>{renderInfo?.hardwareLabel || "等待检测"}</strong>
            <small>{renderInfo?.context || "WebGL"} · {renderInfo?.renderer || "等待 GPU 信息"}</small>
          </div>
          <div className="scene-viewer-quality-control">
            <span>自动画质<strong>{adaptiveQuality ? QUALITY_TIER_LABELS[qualityTier] : "手动高质量"}</strong></span>
            <button type="button" onClick={onToggleAdaptive}>{adaptiveQuality ? "关闭自动优化" : "开启自动优化"}</button>
          </div>
        </div>
      )}
    </aside>
  );
}

function ShowcaseNodePanel({ models, modelsInfo, nodeVisibility, onToggle, onIsolate, onReset }) {
  const [open, setOpen] = useState(false);
  const loadedModels = models.filter((model) => modelsInfo[model.id]?.nodeHierarchy?.length);
  const [activeModelId, setActiveModelId] = useState(loadedModels[0]?.id || models[0]?.id || "");

  useEffect(() => {
    if (loadedModels.some((model) => model.id === activeModelId)) return;
    setActiveModelId(loadedModels[0]?.id || models[0]?.id || "");
  }, [activeModelId, loadedModels, models]);

  const activeModel = models.find((model) => model.id === activeModelId) || models[0];
  const nodes = modelsInfo[activeModel?.id]?.nodeHierarchy || [];
  const visibility = nodeVisibility[activeModel?.id] || {};
  const hiddenCount = nodes.filter((node) => visibility[node.id] === false).length;

  return (
    <aside className={`scene-viewer-node-panel ${open ? "is-open" : ""}`} aria-label="模型节点树">
      <button type="button" className="scene-viewer-node-toggle" onClick={() => setOpen((value) => !value)}>
        <span>节点树</span>
        <strong>{nodes.length ? `${nodes.length} 个` : "待加载"}</strong>
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="scene-viewer-node-body">
          {models.length > 1 && (
            <label className="scene-viewer-node-model-select">
              <span>当前模型</span>
              <select value={activeModel?.id || ""} onChange={(event) => setActiveModelId(event.target.value)}>
                {models.map((model) => <option key={model.id} value={model.id}>{model.label || model.id}</option>)}
              </select>
            </label>
          )}
          {nodes.length > 0 ? (
            <div className="scene-viewer-node-list">
              {nodes.map((node) => {
                const hidden = visibility[node.id] === false;
                return (
                  <div key={node.id} className={`scene-viewer-node-row ${hidden ? "is-hidden" : ""}`} style={{ paddingLeft: `${7 + node.depth * 12}px` }}>
                    <span className="scene-viewer-node-name" title={node.id}>
                      <i>{node.childCount > 0 ? "▾" : "·"}</i>{node.name}
                    </span>
                    <div>
                      <button type="button" aria-label={`${hidden ? "显示" : "隐藏"}${node.name}`} onClick={() => onToggle(activeModel.id, node.id, !hidden)}>{hidden ? "显示" : "隐藏"}</button>
                      <button type="button" aria-label={`隔离${node.name}`} onClick={() => onIsolate(activeModel.id, node.id)}>隔离</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="scene-viewer-node-empty">模型加载完成后，这里会显示 GLB 内部节点结构。</p>
          )}
          <div className="scene-viewer-node-footer">
            <span>{hiddenCount > 0 ? `已隐藏 ${hiddenCount} 个节点` : "节点可单独控制"}</span>
            <button type="button" onClick={() => onReset(activeModel?.id)} disabled={!activeModel || nodes.length === 0}>恢复全部</button>
          </div>
        </div>
      )}
    </aside>
  );
}

/* ---------------- 外壳：UI + Canvas ---------------- */

const VIEWER_UI_DEFAULTS = {
  showcase: {
    header: true,
    dock: true,
    models: false,
    nodes: false,
    performance: false,
    themeControl: true,
    utility: true,
  },
  studio: {
    header: true,
    dock: true,
    models: true,
    nodes: true,
    performance: true,
    themeControl: true,
    utility: true,
  },
};

export default function SceneViewer({
  scene,
  mode = "studio",
  ui = null,
  onRuntimeReady,
  onModelInspect,
  onModelStatus,
  onAssemblyAligned,
  motionPreview,
  onPerformance,
  onCaptureReady,
  selectedNodeIds = {},
  onNodeSelect,
  onSceneApiReady,
}) {
  const isShowcase = mode === "showcase";
  const uiFlags = useMemo(
    () => ({ ...(VIEWER_UI_DEFAULTS[isShowcase ? "showcase" : "studio"]), ...(ui || {}) }),
    [isShowcase, ui]
  );
  const normalizedScene = useMemo(() => normalizeScene(scene), [scene]);
  const runtimeRef = useRef(null);
  if (!runtimeRef.current) runtimeRef.current = createSceneRuntime(normalizedScene);
  const runtime = runtimeRef.current;
  useLayoutEffect(() => {
    runtime.syncScene?.(normalizedScene);
  }, [runtime, normalizedScene]);
  const runtimeState = useSceneRuntime(runtime);

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
  const rendererContextCleanupRef = useRef(null);
  const captureRequestRef = useRef(null);
  const [modelErrors, setModelErrors] = useState({});
  const [modelReloadTokens, setModelReloadTokens] = useState({});
  const [performanceStats, setPerformanceStats] = useState(null);
  const [renderInfo, setRenderInfo] = useState(null);
  const [rendererContextStatus, setRendererContextStatus] = useState("ready");
  const [adaptiveQuality, setAdaptiveQuality] = useState(normalizedScene.renderer?.adaptiveQuality !== false);
  const [qualityTier, setQualityTier] = useState("high");
  const qualityCountersRef = useRef({ down: 0, up: 0 });
  const [nodeVisibility, setNodeVisibility] = useState({});
  const [autoRotate, setAutoRotate] = useState(Boolean(normalizedScene.controls?.autoRotate));
  const [presentationMode, setPresentationMode] = useState(false);
  const [constrainedRenderer, setConstrainedRenderer] = useState(false);

  const models = useMemo(() => normalizedScene.models.map((model) => {
    // LOD：自适应性能档切 L2 低模（从 normalizedScene 重算，升档自动回到 L1）
    const lodUrl = resolveModelLodUrl(model, { tier: qualityTier, adaptive: adaptiveQuality });
    const withLod = lodUrl !== model.url ? { ...model, url: lodUrl } : model;
    const override = nodeVisibility[model.id];
    return override
      ? { ...withLod, nodeVisibility: { ...withLod.nodeVisibility, ...override } }
      : withLod;
  }), [nodeVisibility, normalizedScene.models, qualityTier, adaptiveQuality]);

  // 空闲预载 L2 低模：性能档首次降档时无需等待网络（useGLTF 缓存后切换即时）
  useEffect(() => {
    if (!adaptiveQuality) return undefined;
    const l2Urls = normalizedScene.models.map((m) => m?.lodL2Url).filter(Boolean);
    if (l2Urls.length === 0) return undefined;
    let cancelled = false;
    const preloadAll = () => {
      if (cancelled) return;
      l2Urls.forEach((url) => useGLTF.preload(url, normalizedScene.dracoDecoderPath || "/draco/"));
    };
    const idleId = typeof window !== "undefined" && window.requestIdleCallback
      ? window.requestIdleCallback(preloadAll, { timeout: 12000 })
      : setTimeout(preloadAll, 10000);
    return () => {
      cancelled = true;
      if (typeof window !== "undefined" && window.requestIdleCallback && window.cancelIdleCallback) {
        window.cancelIdleCallback(idleId);
      } else {
        clearTimeout(idleId);
      }
    };
  }, [normalizedScene.models, normalizedScene.dracoDecoderPath, adaptiveQuality]);

  useEffect(() => {
    setNodeVisibility({});
    setModelErrors({});
    setModelReloadTokens({});
  }, [normalizedScene.models]);

  useEffect(() => {
    if (!onModelStatus) return undefined;
    const failed = models
      .filter((model) => modelErrors[model.id])
      .map((model) => ({
        id: model.id,
        label: model.label || model.id,
        message: modelErrors[model.id],
      }));
    const loaded = models.filter((model) => modelsInfo[model.id] && !modelErrors[model.id]).length;
    onModelStatus({
      total: models.length,
      loaded,
      failed,
      pending: Math.max(0, models.length - loaded - failed.length),
    });
    return undefined;
  }, [models, modelsInfo, modelErrors, onModelStatus]);

  useEffect(() => {
    setAutoRotate(Boolean(normalizedScene.controls?.autoRotate));
  }, [normalizedScene.controls?.autoRotate]);

  useEffect(() => {
    setAdaptiveQuality(normalizedScene.renderer?.adaptiveQuality !== false);
    setQualityTier("high");
    qualityCountersRef.current = { down: 0, up: 0 };
  }, [normalizedScene.models, normalizedScene.renderer?.adaptiveQuality]);

  useEffect(() => {
    if (!presentationMode) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setPresentationMode(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [presentationMode]);

  const sceneApi = useMemo(() => ({
    alignSocket({ childId, childSocketId, parentId, parentSocketId }) {
      const childGroup = modelRefs.current.get(childId);
      const parentGroup = modelRefs.current.get(parentId);
      if (!childGroup || !parentGroup) return null;
      let childSocket = null;
      let parentSocket = null;
      childGroup.traverse((node) => {
        if (!childSocket && node.userData?.__editorSocketId === childSocketId) childSocket = node;
      });
      parentGroup.traverse((node) => {
        if (!parentSocket && node.userData?.__editorSocketId === parentSocketId) parentSocket = node;
      });
      if (!childSocket || !parentSocket) return null;

      childGroup.updateMatrixWorld(true);
      parentGroup.updateMatrixWorld(true);
      const childSocketLocal = new THREE.Matrix4()
        .copy(childGroup.matrixWorld)
        .invert()
        .multiply(childSocket.matrixWorld);
      const desiredChildWorld = new THREE.Matrix4()
        .copy(parentSocket.matrixWorld)
        .multiply(new THREE.Matrix4().copy(childSocketLocal).invert());
      const parentWorldInverse = new THREE.Matrix4()
        .copy(childGroup.parent?.matrixWorld || new THREE.Matrix4())
        .invert();
      const desiredChildLocal = parentWorldInverse.multiply(desiredChildWorld);
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      desiredChildLocal.decompose(position, quaternion, scale);
      const rotation = new THREE.Euler().setFromQuaternion(quaternion, "XYZ");
      return {
        position: position.toArray(),
        rotation: [rotation.x, rotation.y, rotation.z],
        scale: Math.max(Math.abs(scale.x), 0.001),
      };
    },
  }), []);

  useEffect(() => {
    onSceneApiReady?.(sceneApi);
  }, [onSceneApiReady, sceneApi]);

  const handleInspect = useCallback((id, info, url) => {
    runtime.dispatch({ type: "model/inspected", payload: { id, info } });
    setModelErrors((previous) => {
      if (!previous[id]) return previous;
      const next = { ...previous };
      delete next[id];
      return next;
    });
    onModelInspect?.(id, info, url);
  }, [onModelInspect, runtime]);

  const handleModelError = useCallback((id, error) => {
    const message = String(error?.message || "无法解析模型文件")
      .replace(/\s+/g, " ")
      .slice(0, 120);
    setModelErrors((previous) => ({ ...previous, [id]: message || "无法解析模型文件" }));
  }, []);

  const handlePerformance = useCallback((stats) => {
    setPerformanceStats(stats);
    onPerformance?.(stats);
    if (!adaptiveQuality) return;
    const result = nextQualityTier(qualityTier, stats, qualityCountersRef.current);
    qualityCountersRef.current = result.counters;
    if (result.tier !== qualityTier) setQualityTier(result.tier);
  }, [adaptiveQuality, onPerformance, qualityTier]);

  const toggleAdaptiveQuality = useCallback(() => {
    setAdaptiveQuality((enabled) => {
      const nextEnabled = !enabled;
      if (!nextEnabled) {
        setQualityTier("high");
        qualityCountersRef.current = { down: 0, up: 0 };
      }
      return nextEnabled;
    });
  }, []);

  const toggleNodeVisibility = useCallback((modelId, nodeId, visible) => {
    setNodeVisibility((previous) => ({
      ...previous,
      [modelId]: { ...previous[modelId], [nodeId]: visible },
    }));
  }, []);

  const isolateNode = useCallback((modelId, nodeId) => {
    const nodes = modelsInfo[modelId]?.nodeHierarchy || [];
    const target = nodes.find((node) => node.id === nodeId);
    if (!target) return;
    const allowed = new Set(nodes.filter((node) => node.id === nodeId || node.id.startsWith(`${nodeId}/`)).map((node) => node.id));
    const parentById = new Map(nodes.map((node) => [node.id, node.parentId]));
    let cursor = target.parentId;
    while (cursor) {
      allowed.add(cursor);
      cursor = parentById.get(cursor) || null;
    }
    setNodeVisibility((previous) => ({
      ...previous,
      [modelId]: Object.fromEntries(nodes.map((node) => [node.id, allowed.has(node.id)])),
    }));
  }, [modelsInfo]);

  const resetNodeVisibility = useCallback((modelId) => {
    if (!modelId) return;
    setNodeVisibility((previous) => {
      if (!previous[modelId]) return previous;
      const next = { ...previous };
      delete next[modelId];
      return next;
    });
  }, []);

  const retryModel = useCallback((id) => {
    const model = models.find((item) => item.id === id);
    if (model?.url) useGLTF.clear(model.url);
    setModelErrors((previous) => {
      if (!previous[id]) return previous;
      const next = { ...previous };
      delete next[id];
      return next;
    });
    setModelReloadTokens((previous) => ({
      ...previous,
      [id]: (previous[id] || 0) + 1,
    }));
  }, [models]);

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

  // 机位序列自动巡演（优先使用 scene.tour.shotIds，否则按 shots 顺序）
  useEffect(() => {
    if (!autoPlay || shots.length < 2) return;
    const tourIds = Array.isArray(normalizedScene.tour?.shotIds) && normalizedScene.tour.shotIds.length > 1
      ? normalizedScene.tour.shotIds.filter((id) => shots.some((shot) => shot.id === id))
      : shots.map((shot) => shot.id);
    if (tourIds.length < 2) return;
    const intervalMs = normalizedScene.tour?.intervalMs || 3800;
    const timer = setInterval(() => {
      const currentShotId = runtime.getState().shotId;
      const idx = tourIds.findIndex((id) => id === currentShotId);
      const nextId = tourIds[(idx + 1 + tourIds.length) % tourIds.length];
      runtime.dispatch({
        type: "shot/set",
        payload: { id: nextId },
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoPlay, normalizedScene.tour, runtime, shots]);

  useEffect(() => {
    if (!isShowcase || !normalizedScene.tour?.autoStart || shots.length < 2) return;
    runtime.dispatch({ type: "autoplay/set", payload: { value: true } });
  }, [isShowcase, normalizedScene.tour?.autoStart, runtime, shots.length]);

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

  // 将当前可见模型整体收入镜头，适合多模型展台快速构图。
  const focusAllModels = useCallback(() => {
    const box = new THREE.Box3();
    const visibleGroups = models
      .filter((model) => visibility[model.id] !== false)
      .map((model) => modelRefs.current.get(model.id))
      .filter(Boolean);
    const groups = visibleGroups.length > 0
      ? visibleGroups
      : models.map((model) => modelRefs.current.get(model.id)).filter(Boolean);
    groups.forEach((group) => box.expandByObject(group));
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 0.8);
    const cam = controlsRef.current;
    const dir = new THREE.Vector3(0.6, 0.45, 1).normalize();
    if (cam?.object) {
      dir.copy(cam.object.position).sub(cam.target).normalize();
    }
    const pos = center.clone().add(dir.multiplyScalar(radius * 2.35));
    focusShot.current = {
      id: "__focus_all",
      position: pos.toArray(),
      target: center.toArray(),
      durationMs: 1200,
    };
    runtime.dispatch({ type: "shot/set", payload: { id: "__focus_all" } });
  }, [models, runtime, visibility]);

  const activeShot = shotId?.startsWith("__focus_") ? focusShot.current : shot;
  const renderScene = useMemo(
    () => {
      const qualityScene = applyQualityTier(normalizedScene, adaptiveQuality ? qualityTier : "high");
      if (!constrainedRenderer) return qualityScene;
      const constrainedDpr = qualityTier === "performance"
        ? [0.5, 0.65]
        : qualityTier === "balanced"
          ? [0.7, 0.8]
          : [0.8, 0.9];
      return {
        ...qualityScene,
        renderer: {
          ...qualityScene.renderer,
          dpr: constrainedDpr,
        },
      };
    },
    [adaptiveQuality, constrainedRenderer, normalizedScene, qualityTier]
  );
  const renderer = renderScene.renderer;
  const viewerRootRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rendererReady, setRendererReady] = useState(false);
  const [captureToken, setCaptureToken] = useState(0);
  const [performancePanelOpen, setPerformancePanelOpen] = useState(false);
  const handleRendererCreated = useCallback(({ gl }) => {
    rendererContextCleanupRef.current?.();
    setRendererReady(true);
    setRendererContextStatus("ready");
    const inspected = inspectWebGLContext(gl);
    setRenderInfo(inspected);
    // 仅在明确识别为软件渲染时强制进入受限档位；WebGL 1 或信息未知不代表没有 GPU。
    const isConstrained = inspected.hardware === "software";
    setConstrainedRenderer(isConstrained);
    if (isConstrained) {
      setQualityTier("performance");
    }
    const handleContextLost = (event) => {
      event.preventDefault();
      setRendererReady(false);
      setRendererContextStatus("lost");
    };
    const handleContextRestored = () => {
      setRendererReady(true);
      setRendererContextStatus("ready");
      setRenderInfo(inspectWebGLContext(gl));
    };
    gl.domElement.addEventListener("webglcontextlost", handleContextLost, false);
    gl.domElement.addEventListener("webglcontextrestored", handleContextRestored, false);
    rendererContextCleanupRef.current = () => {
      gl.domElement.removeEventListener("webglcontextlost", handleContextLost);
      gl.domElement.removeEventListener("webglcontextrestored", handleContextRestored);
    };
    gl.toneMapping = getToneMapping(renderer.toneMapping);
    gl.toneMappingExposure = renderer.exposure;
  }, [renderer.exposure, renderer.toneMapping, rendererContextCleanupRef]);

  const requestCapture = useCallback(() => new Promise((resolve) => {
    if (!rendererReady) {
      resolve(null);
      return;
    }
    captureRequestRef.current = resolve;
    setCaptureToken((token) => token + 1);
  }), [rendererReady]);

  useEffect(() => {
    onCaptureReady?.(requestCapture);
  }, [onCaptureReady, requestCapture]);

  useEffect(() => () => rendererContextCleanupRef.current?.(), []);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === viewerRootRef.current);
    };
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await viewerRootRef.current?.requestFullscreen?.();
      }
    } catch {
      // 浏览器禁止全屏时保持当前展示状态，不影响模型浏览。
    }
  }, []);

  const captureScreenshot = useCallback(async () => {
    const dataUrl = await requestCapture();
    if (!dataUrl) return;
    const fileName = (normalizedScene.title || "model-showcase")
      .replace(/[\\/:*?"<>|]/g, "-")
      .trim() || "model-showcase";
    const anchor = document.createElement("a");
    anchor.download = `${fileName}.png`;
    anchor.href = dataUrl;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }, [normalizedScene.title, requestCapture]);

  const continuousRender = autoRotate
    || autoPlay
    || Boolean(motionPreview?.playing || motionPreview?.clipPlaying)
    || performancePanelOpen
    || machine?.state === "driving"
    || machine?.state === "harvesting"
    || machine?.state === "unloading";

  const lookAtHotspotShot = useCallback((nextShotId) => {
    if (!nextShotId) return;
    runtime.dispatch({ type: "autoplay/set", payload: { value: false } });
    runtime.dispatch({ type: "shot/set", payload: { id: nextShotId } });
  }, [runtime]);

  const bootstrapLiftY = (
    normalizedScene.assemblyMeta?.adaptiveGround === true
    || Boolean(normalizedScene.assemblyMeta?.groundOffset)
  )
    ? (normalizedScene.assemblyMeta?.groundOffset?.[1] ?? VISUAL_LIMITS.assembly.groundLiftY.default)
    : 0;
  const canvasCameraShot = offsetShotByLift(activeShot, bootstrapLiftY);

  return (
    <div
      ref={viewerRootRef}
      className={`scene-viewer ${presentationMode ? "is-presentation" : ""} ${isShowcase ? "is-showcase-mode" : ""}`}
      data-viewer-mode={mode}
    >
      <Canvas
        frameloop={continuousRender ? "always" : "demand"}
        dpr={renderer.dpr}
        camera={{
          position: canvasCameraShot?.position || [0, 0, 5],
          fov: renderScene.camera?.fov ?? 40,
          near: renderScene.camera?.near ?? 0.1,
          far: renderScene.camera?.far ?? 200,
        }}
        gl={{
          antialias: renderer.antialias === true,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
          logarithmicDepthBuffer: renderer.logarithmicDepthBuffer === true,
        }}
        onCreated={handleRendererCreated}
        shadows={renderer.shadows}
      >
        <ScenePerformanceProbe onUpdate={handlePerformance} />
        <SceneCapture requestRef={captureRequestRef} requestToken={captureToken} />
        <SceneContent
          scene={renderScene}
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
          onHotspotLookHere={lookAtHotspotShot}
          onInspect={handleInspect}
          modelRefs={modelRefs}
          controlsRef={controlsRef}
          runtime={runtime}
          machine={machine}
          motionPreview={motionPreview}
          selectedNodeIds={selectedNodeIds}
          onNodeSelect={onNodeSelect}
          onModelError={handleModelError}
          modelReloadTokens={modelReloadTokens}
          autoRotate={autoRotate}
          showcase={isShowcase}
          onAssemblyAligned={onAssemblyAligned}
        />
      </Canvas>
      <Loader />
      {rendererContextStatus === "lost" && (
        <div className="scene-viewer-context-overlay" role="alert">
          <div>
            <strong>WebGL 渲染上下文已丢失</strong>
            <p>浏览器暂时无法继续使用当前 GPU 渲染器，正在等待恢复。</p>
            <button type="button" onClick={() => window.location.reload()}>重新初始化渲染器</button>
          </div>
        </div>
      )}

      <div className="scene-viewer-ui">
        {uiFlags.header && (
          <header className="scene-viewer-header">
            <div className="scene-viewer-header-content">
              <div className="scene-viewer-header-copy">
                {isShowcase && <span className="scene-viewer-brand-mark">SY·ME</span>}
                <h2>{normalizedScene.title}</h2>
              </div>
              {uiFlags.themeControl && (
                <PageThemeControl className="scene-viewer-theme-control" />
              )}
            </div>
          </header>
        )}

        <MachinePanel
          config={normalizedScene.machine}
          machine={machine}
          showcase={isShowcase}
          onDispatch={runtime.dispatch}
          onFocusPart={(part) => {
            runtime.dispatch({ type: "autoplay/set", payload: { value: false } });
            if (Array.isArray(part?.modelIds) && part.modelIds.length > 0) {
              const known = new Set(models.map((model) => model.id));
              const focusIds = part.modelIds.filter((id) => known.has(id));
              if (focusIds.length > 0) {
                // 先保证关联分件可见，再切镜头
                focusIds.forEach((id) => {
                  runtime.dispatch({
                    type: "model/set-visibility",
                    payload: { id, visible: true },
                  });
                });
              }
            }
            if (part?.shotId) {
              runtime.dispatch({ type: "shot/set", payload: { id: part.shotId } });
            } else if (part?.modelIds?.[0]) {
              focusModel(part.modelIds[0]);
            }
          }}
        />

        {uiFlags.models && (
          <ModelPanel
            models={models}
            modelsInfo={modelsInfo}
            modelErrors={modelErrors}
            visibility={visibility}
            onToggleVisible={(id) =>
              runtime.dispatch({
                type: "model/toggle-visibility",
                payload: { id },
              })
            }
            onSetAllVisible={(visible) =>
              runtime.dispatch({
                type: "model/set-visibility",
                payload: { visible },
              })
            }
            onRetry={retryModel}
            onFocus={focusModel}
          />
        )}

        {uiFlags.nodes && (
          <ShowcaseNodePanel
            models={models}
            modelsInfo={modelsInfo}
            nodeVisibility={nodeVisibility}
            onToggle={toggleNodeVisibility}
            onIsolate={isolateNode}
            onReset={resetNodeVisibility}
          />
        )}

        {uiFlags.performance && (
          <ViewerPerformancePanel
            stats={performanceStats}
            models={models}
            modelsInfo={modelsInfo}
            renderInfo={renderInfo}
            adaptiveQuality={adaptiveQuality}
            qualityTier={qualityTier}
            onToggleAdaptive={toggleAdaptiveQuality}
            open={performancePanelOpen}
            onOpenChange={setPerformancePanelOpen}
          />
        )}

        {uiFlags.dock && (
          <div className={`scene-viewer-dock ${isShowcase ? "is-showcase" : ""}`}>
            {shots.length > 0 && (
              <div className="scene-viewer-group scene-viewer-shot-rail">
                <span className="scene-viewer-group-label">镜头</span>
                {shots.map((s) => (
                  <button
                    type="button"
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
                    type="button"
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
            {uiFlags.utility && (
              <div className="scene-viewer-group scene-viewer-utility-group">
                <span className="scene-viewer-group-label">展示</span>
                <button type="button" onClick={focusAllModels} title="将当前可见模型全部收入镜头">适配全部</button>
                <button type="button" disabled={!rendererReady} onClick={captureScreenshot} title="导出当前展台画面">导出截图</button>
                <button type="button" onClick={toggleFullscreen} title="切换全屏展示">
                  {isFullscreen ? "退出全屏" : "全屏展示"}
                </button>
                <button type="button" className={autoRotate ? "is-active" : ""} onClick={() => setAutoRotate((value) => !value)}>
                  {autoRotate ? "停止旋转" : "自动旋转"}
                </button>
                <button type="button" onClick={() => setPresentationMode(true)}>纯净展示</button>
              </div>
            )}
          </div>
        )}
        {presentationMode && (
          <button type="button" className="scene-viewer-presentation-restore" onClick={() => setPresentationMode(false)}>
            显示控制
          </button>
        )}
      </div>
    </div>
  );
}

// 预加载工具：路由跳转前可调用
SceneViewer.preload = (scene) => {
  for (const m of scene?.models || []) {
    if (m?.url) useGLTF.preload(m.url, scene.dracoDecoderPath || "/draco/");
  }
};
