/**
 * 收获机分件 GLB 网页优化管线（阶段 1：减面 + meshopt 压缩 + 纹理压缩）。
 *
 * 输入  ../glb/*.glb（CAD 转出的原始分件，总计约 1.3GB）
 * 输出  ../glb-web/*.glb（同名文件；经 public/model/harvester-web junction 暴露）
 *
 * 处理：dedup → prune(保留命名空节点) → weld → simplify(meshopt) →
 *       reorder → quantize → textureCompress(webp) → EXT_meshopt_compression
 *
 * 刻意不做 flatten/join/palette：工作台动作绑定按节点名寻址，节点树必须原样保留。
 *
 * 用法：
 *   node --max-old-space-size=8192 scripts/optimize-harvester-glb.mjs [--force] [--only <关键字>]
 *     [--ratio <0-1>] [--error <小数>] [--min-size-mb <MB>] [--src <目录>] [--out <目录>]
 * 或： npm run optimize:harvester
 *
 * L2 低模（性能档自动切换）：npm run optimize:harvester:l2
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  prune,
  weld,
  simplify,
  reorder,
  quantize,
  textureCompress,
  meshopt,
} from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function argValue(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

const SRC_DIR = path.resolve(rootDir, argValue("--src") || "../glb");
const OUT_DIR = path.resolve(rootDir, argValue("--out") || "../glb-web");
const FORCE = args.includes("--force");
const ONLY = argValue("--only");
const RATIO_OVERRIDE = argValue("--ratio") ? Number(argValue("--ratio")) : null;
const ERROR_OVERRIDE = argValue("--error") ? Number(argValue("--error")) : null;
const MIN_SIZE_MB = argValue("--min-size-mb") ? Number(argValue("--min-size-mb")) : 0;

/** 按原始体量分档：越大的件减面越激进（误差上限保持一致，避免可见变形） */
function simplifyPolicy(sizeMB) {
  const error = ERROR_OVERRIDE != null && Number.isFinite(ERROR_OVERRIDE) ? ERROR_OVERRIDE : null;
  if (RATIO_OVERRIDE != null && Number.isFinite(RATIO_OVERRIDE)) {
    return { ratio: Math.min(1, Math.max(0.05, RATIO_OVERRIDE)), error: [error ?? 0.001] };
  }
  if (sizeMB >= 100) return { ratio: 0.45, error: [error ?? 0.001] };
  if (sizeMB >= 20) return { ratio: 0.65, error: [error ?? 0.0008] };
  return { ratio: 0.85, error: [error ?? 0.0006] };
}

function formatMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

async function optimizeFile(io, fileName) {
  const inputPath = path.join(SRC_DIR, fileName);
  const outputPath = path.join(OUT_DIR, fileName);
  const inputBytes = fs.statSync(inputPath).size;
  const sizeMB = inputBytes / (1024 * 1024);

  if (!FORCE && fs.existsSync(outputPath)) {
    const outBytes = fs.statSync(outputPath).size;
    console.log(`[skip] ${fileName}（已存在 ${formatMB(outBytes)}MB，--force 可覆盖）`);
    return { fileName, inputBytes, outputBytes: outBytes, skipped: true };
  }

  const startedAt = Date.now();
  const document = await io.read(inputPath);
  const root = document.getRoot();
  const textureCount = root.listTextures().length;
  const meshCount = root.listMeshes().length;
  const nodeCount = root.listNodes().length;

  const policy = simplifyPolicy(sizeMB);
  const steps = [
    dedup(),
    // 保留叶子空节点与属性：动作绑定/装配对齐依赖节点名与世界坐标
    prune({ keepLeaves: true, keepAttributes: true }),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ...policy }),
    reorder({ encoder: MeshoptEncoder }),
    quantize(),
  ];
  if (textureCount > 0) {
    steps.push(textureCompress({
      encoder: sharp,
      targetFormat: "webp",
      resize: [2048, 2048],
    }));
  }
  steps.push(meshopt({ encoder: MeshoptEncoder, level: "medium" }));

  await document.transform(...steps);
  await io.write(outputPath, document);

  const outputBytes = fs.statSync(outputPath).size;
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  const ratio = ((outputBytes / inputBytes) * 100).toFixed(1);
  console.log(
    `[done] ${fileName}  ${formatMB(inputBytes)}MB → ${formatMB(outputBytes)}MB（${ratio}%）` +
    `  nodes=${nodeCount} meshes=${meshCount} textures=${textureCount}` +
    `  ratio=${policy.ratio}  ${seconds}s`
  );
  return { fileName, inputBytes, outputBytes, skipped: false };
}

async function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`源目录不存在：${SRC_DIR}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(SRC_DIR)
    .filter((name) => name.toLowerCase().endsWith(".glb"))
    .filter((name) => !ONLY || name.includes(ONLY))
    .filter((name) => !MIN_SIZE_MB || fs.statSync(path.join(SRC_DIR, name)).size >= MIN_SIZE_MB * 1024 * 1024)
    .sort((a, b) => fs.statSync(path.join(SRC_DIR, a)).size - fs.statSync(path.join(SRC_DIR, b)).size);

  if (files.length === 0) {
    console.error(`没有匹配的 GLB（src=${SRC_DIR}${ONLY ? `, only=${ONLY}` : ""}）`);
    process.exit(1);
  }

  await MeshoptEncoder.ready;
  await MeshoptDecoder.ready;
  await MeshoptSimplifier.ready;

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "meshopt.encoder": MeshoptEncoder,
      "meshopt.decoder": MeshoptDecoder,
    });

  console.log(`源：${SRC_DIR}\n出：${OUT_DIR}\n共 ${files.length} 个 GLB（小 → 大）${FORCE ? " [force]" : ""}\n`);

  const results = [];
  let failed = 0;
  for (const fileName of files) {
    try {
      results.push(await optimizeFile(io, fileName));
    } catch (error) {
      failed += 1;
      console.error(`[fail] ${fileName}: ${error.message}`);
    }
  }

  const done = results.filter((r) => !r.skipped);
  const totalIn = results.reduce((sum, r) => sum + r.inputBytes, 0);
  const totalOut = results.reduce((sum, r) => sum + r.outputBytes, 0);
  console.log("\n—— 汇总 ——");
  console.log(`处理 ${done.length} 个，跳过 ${results.length - done.length} 个，失败 ${failed} 个`);
  console.log(`总体积 ${formatMB(totalIn)}MB → ${formatMB(totalOut)}MB（${((totalOut / totalIn) * 100).toFixed(1)}%）`);
  if (failed > 0) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
