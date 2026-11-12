import json
import struct
import sys

from playwright.sync_api import sync_playwright


sys.stdout.reconfigure(encoding="utf-8")


def make_motion_glb():
    payload = {
        "asset": {"version": "2.0"},
        "scene": 0,
        "scenes": [{"nodes": [0, 1]}],
        "nodes": [{"name": "拨禾轮"}, {"name": "动刀"}],
    }
    json_bytes = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    json_bytes += b" " * ((4 - len(json_bytes) % 4) % 4)
    chunk = struct.pack("<II", len(json_bytes), 0x4E4F534A) + json_bytes
    return struct.pack("<III", 0x46546C67, 2, 12 + len(chunk)) + chunk


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))

    page.goto("http://127.0.0.1:4173/tools/asset-workbench")
    page.wait_for_selector(".asset-workbench-panel", timeout=60000)
    page.wait_for_selector(".asset-render-tuning", timeout=60000)
    page.wait_for_selector(".asset-performance-panel", timeout=60000)
    page.wait_for_function(
        "document.querySelector('.asset-performance-grid strong')?.textContent !== '—'",
        timeout=10000,
    )
    with page.expect_download(timeout=15000) as download_info:
        page.locator(".asset-action-center button").filter(has_text="导出当前画面").click(force=True)
    assert download_info.value.suggested_filename.endswith(".png")
    page.get_by_role("button", name="一键性能优化", exact=True).click(force=True)
    page.wait_for_function(
        "document.querySelector('.asset-workbench-message')?.textContent.includes('性能优先配置')",
        timeout=5000,
    )
    page.get_by_role("button", name="恢复高质量", exact=True).click(force=True)
    page.wait_for_function(
        "document.querySelector('.asset-workbench-message')?.textContent.includes('恢复高质量')",
        timeout=5000,
    )
    local_actions = page.locator(".asset-action-subgroup").filter(has_text="本地视觉方案")
    local_actions.get_by_role("button", name="保存方案", exact=True).click(force=True)
    restore_local = local_actions.get_by_role("button", name="恢复方案", exact=True)
    assert restore_local.is_enabled()
    local_actions.get_by_role("button", name="清除方案", exact=True).click(force=True)
    assert restore_local.is_disabled()

    page.get_by_role("button", name="性能优先").click()
    page.get_by_role("button", name="技术光点").click()
    assert page.locator(".asset-color-grade").count() == 1
    assert page.locator(".asset-rgb-channel-group").count() == 3
    page.locator(".asset-color-grade .asset-theme-list button").nth(1).click(force=True)
    assert page.locator(".asset-color-grade .asset-tuning-control output").first.inner_text() == "-8°"
    undo_button = page.locator(".asset-history-actions button").first
    assert undo_button.is_enabled()
    undo_button.click(force=True)
    redo_button = page.locator(".asset-history-actions button").nth(1)
    assert redo_button.is_enabled()
    redo_button.click(force=True)

    page.locator('input[type="file"][accept*=".glb"]').set_input_files({
        "name": "probe-motion.glb",
        "mimeType": "model/gltf-binary",
        "buffer": make_motion_glb(),
    })
    page.get_by_text("probe-motion.glb", exact=True).wait_for(timeout=30000)
    assert page.locator("section.asset-motion-capabilities").count() > 0
    assert page.locator(".asset-motion-candidate").count() == 2
    page.locator(".asset-motion-capability-actions button").first.click(force=True)
    assert page.locator("section.asset-part-motion").count() > 0
    page.locator(".asset-action-subgroup button").filter(has_text="收割作业").click(force=True)
    assert page.locator(".asset-part-motion .asset-primary-button").first.inner_text() == "暂停动作"
    global_play = page.locator(".asset-action-center button").filter(has_text="播放全部")
    global_play.click(force=True)
    assert page.locator(".asset-part-motion .asset-primary-button").first.inner_text() == "暂停动作"
    page.locator(".asset-action-center button").filter(has_text="全部暂停").click(force=True)
    assert page.locator(".asset-part-motion .asset-primary-button").first.inner_text() == "播放动作"
    page.locator(".asset-action-center button").filter(has_text="全部复位").click(force=True)
    diagnostics_button = page.locator(".asset-motion-capability-actions button").nth(1)
    diagnostics_button.click(force=True)
    assert diagnostics_button.inner_text() == "隐藏诊断轴"
    page.locator(".asset-part-motion .asset-primary-button").first.click(force=True)
    assert page.locator(".asset-part-motion .asset-primary-button").first.inner_text() == "暂停动作"

    page.locator('input[type="file"][accept*=".scene.json"]').set_input_files({
        "name": "quick-replay.scene.json",
        "mimeType": "application/json",
        "buffer": json.dumps({
            "version": 1,
            "id": "quick-replay",
            "title": "快捷回放场景",
            "models": [{"id": "harvester", "label": "回放模型", "url": "/model/汽车.glb"}],
            "shots": [],
            "materialVariants": [],
        }).encode("utf-8"),
    })
    page.wait_for_function("document.querySelector('.scene-viewer-header h2')?.textContent === '快捷回放场景'", timeout=10000)
    assert page.get_by_text("快捷回放场景", exact=True).count() == 1

    print("motion_candidates: ok")
    print("render_tuning: ok")
    print("particle_preset: ok")
    print("console_errors:", errors)
    if errors:
        raise SystemExit("browser errors detected")
    browser.close()

