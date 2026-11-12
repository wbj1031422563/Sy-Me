/*
 * 猴头场景页：只组装场景 JSON + SceneViewer，不写三维细节
 */
import SceneViewer from "../../viewer/SceneViewer.jsx";
import houtouScene from "../../scenes/houtou.scene.json";

export default function HoutouPage() {
  return <SceneViewer scene={houtouScene} />;
}
