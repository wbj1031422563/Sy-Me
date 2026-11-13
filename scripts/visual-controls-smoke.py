import json
import re
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
        "materials": [{"name": "车身漆面"}, {"name": "轮胎橡胶"}],
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
    hierarchy = page.locator(".asset-model-hierarchy")
    page.wait_for_function(
        "document.querySelectorAll('.asset-node-tree-row').length > 0",
        timeout=30000,
    )
    assert hierarchy.locator(".asset-node-tree-row").count() > 0
    hierarchy.locator(".asset-node-tree-select").first.click(force=True)
    assert "已选择 1 个节点" in hierarchy.locator(".asset-node-tree-footer").inner_text()
    hierarchy.locator(".asset-node-tree-select").nth(1).click(force=True, modifiers=["Shift"])
    assert "已选择 2 个节点" in hierarchy.locator(".asset-node-tree-footer").inner_text()
    node_transform = page.locator(".asset-node-transform")
    assert node_transform.count() == 1
    node_transform.get_by_label("X 位移", exact=True).fill("0.25")
    node_transform.get_by_role("button", name="应用批量变换", exact=True).click(force=True)
    page.wait_for_function(
        "document.querySelector('.asset-workbench-message')?.textContent.includes('批量变换')",
        timeout=5000,
    )
    node_transform.get_by_role("button", name="恢复选中节点变换", exact=True).click(force=True)
    page.wait_for_function(
        "document.querySelector('.asset-workbench-message')?.textContent.includes('局部变换')",
        timeout=5000,
    )
    first_node_row = hierarchy.locator(".asset-node-tree-row").first
    first_node_row.get_by_role("button", name=re.compile("隐藏"), exact=False).click(force=True)
    assert "已隐藏 1 个节点" in hierarchy.locator(".asset-node-tree-visibility-status").inner_text()
    first_node_row.get_by_role("button", name=re.compile("显示"), exact=False).click(force=True)
    page.wait_for_function(
        "document.querySelector('.asset-workbench-message')?.textContent.includes('已显示当前节点')",
        timeout=5000,
    )
    hierarchy.locator(".asset-node-tree-row").first.get_by_role("button", name=re.compile("隐藏"), exact=False).click(force=True)
    hierarchy.get_by_role("button", name="恢复全部节点", exact=True).click(force=True)
    model_slots = page.locator(".asset-model-slot")
    page.wait_for_function(
        "document.querySelectorAll('.asset-model-slot').length === 1",
        timeout=30000,
    )
    assert model_slots.count() == 1
    page.get_by_role("button", name="＋ 新增模型槽位", exact=True).click(force=True)
    page.wait_for_function(
        "document.querySelectorAll('.asset-model-slot').length === 2",
        timeout=10000,
    )
    assert model_slots.count() == 2
    assembly = page.locator(".asset-model-assembly")
    assembly.get_by_label("父模型", exact=True).select_option("harvester")
    page.wait_for_function(
        "document.querySelector('.asset-workbench-message')?.textContent.includes('父子装配')",
        timeout=5000,
    )
    assembly_presets = page.locator(".asset-assembly-presets")
    assert assembly_presets.count() == 1
    assembly_presets.get_by_label("装配方案名称", exact=True).fill("烟测装配方案")
    assembly_presets.get_by_role("button", name="保存当前装配", exact=True).click(force=True)
    page.wait_for_function(
        "document.querySelector('.asset-workbench-message')?.textContent.includes('保存装配方案')",
        timeout=5000,
    )
    assembly_presets.get_by_role("button", name="应用", exact=True).click(force=True)
    page.wait_for_function(
        "document.querySelector('.asset-workbench-message')?.textContent.includes('应用装配方案')",
        timeout=5000,
    )
    slot_two = model_slots.nth(1)
    slot_two.locator('button[aria-label^="隐藏"]').click(force=True)
    show_slot = slot_two.locator('button[aria-label^="显示"]')
    show_slot.wait_for(timeout=5000)
    assert show_slot.count() == 1
    remove_slot_two = slot_two.locator('button[aria-label^="移除"]')
    remove_slot_two.click(force=True)
    assert model_slots.count() == 1
    transform = page.locator(".asset-model-transform")
    assert transform.count() == 1
    transform.get_by_label("统一缩放", exact=True).fill("1.1")
    assert transform.get_by_label("统一缩放", exact=True).input_value() == "1.1"
    transform.get_by_role("button", name="重置变换", exact=True).click(force=True)
    assert transform.get_by_label("统一缩放", exact=True).input_value() == "1"
    camera = page.locator(".asset-camera-presets")
    assert camera.count() == 1
    camera_select = camera.get_by_label("选择镜头", exact=True)
    initial_shot_count = camera_select.locator("option").count()
    camera.get_by_role("button", name="＋新增", exact=True).click(force=True)
    assert camera_select.locator("option").count() == initial_shot_count + 1
    camera.get_by_role("button", name="删除", exact=True).click(force=True)
    assert camera_select.locator("option").count() == initial_shot_count

    batch_input = page.locator('input[type="file"][multiple][accept=".glb,.gltf"]')
    batch_input.set_input_files([
        {"name": "batch-a.glb", "mimeType": "model/gltf-binary", "buffer": make_motion_glb()},
        {"name": "batch-b.glb", "mimeType": "model/gltf-binary", "buffer": make_motion_glb()},
    ])
    batch_queue = page.locator(".asset-batch-model-queue")
    batch_queue.wait_for(timeout=5000)
    page.wait_for_function(
        "document.querySelectorAll('.asset-batch-model-item.is-loaded').length === 2",
        timeout=15000,
    )
    assert model_slots.count() == 3
    for _ in range(2):
        model_slots.nth(model_slots.count() - 1).locator('button[aria-label^="移除"]').click(force=True)
        page.wait_for_function("document.querySelectorAll('.asset-model-slot').length >= 1", timeout=5000)
    assert model_slots.count() == 1
    batch_queue.get_by_role("button", name="清空批量队列", exact=True).click(force=True)
    assert batch_queue.count() == 0

    with page.expect_download(timeout=15000) as download_info:
        page.locator(".asset-action-center button").filter(has_text="导出当前画面").click(force=True)
    assert download_info.value.suggested_filename.endswith(".png")
    page.get_by_role("button", name="激进优化", exact=True).click(force=True)
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

    library = page.locator(".asset-visual-library")
    library.get_by_placeholder("方案名称，例如：雷沃主视觉").fill("Smoke 视觉方案")
    library.get_by_role("button", name="保存当前", exact=True).click(force=True)
    assert library.get_by_text("Smoke 视觉方案", exact=True).count() == 1
    library.get_by_role("button", name="应用", exact=True).click(force=True)
    library.get_by_role("button", name="删除", exact=True).click(force=True)
    assert library.get_by_text("Smoke 视觉方案", exact=True).count() == 0
    library.get_by_placeholder("方案名称，例如：雷沃主视觉").fill("Smoke 导出方案")
    library.get_by_role("button", name="保存当前", exact=True).click(force=True)
    with page.expect_download(timeout=15000) as library_download_info:
        library.get_by_role("button", name="导出方案库", exact=True).click(force=True)
    assert library_download_info.value.suggested_filename == "sy-me-visual-library.json"
    library.get_by_role("button", name="删除", exact=True).click(force=True)
    library.locator('input[type="file"][accept*="application/json"]').set_input_files({
        "name": "imported-visual-library.json",
        "mimeType": "application/json",
        "buffer": json.dumps({
            "version": 1,
            "entries": [{
                "id": "shared-entry",
                "name": "Smoke 导入方案",
                "scene": {"models": [{"id": "harvester", "url": "/model/汽车.glb"}]},
            }],
        }).encode("utf-8"),
    })
    library.get_by_text("Smoke 导入方案", exact=True).wait_for(timeout=5000)
    assert library.get_by_text("Smoke 导入方案", exact=True).count() == 1
    library.get_by_role("button", name="删除", exact=True).click(force=True)

    visual_presets = page.locator(".asset-visual-presets")
    visual_presets.get_by_role("button", name=re.compile("电影金色"), exact=False).click(force=True)
    assert "电影金色" in visual_presets.locator("button.is-active").inner_text()
    render_tuning = page.locator(".asset-render-tuning")
    render_tuning.get_by_role("button", name="性能优先", exact=True).click(force=True)
    assert "自定义" in visual_presets.locator(".asset-capability-state").inner_text()
    render_tuning.get_by_role("button", name="技术光点", exact=True).click(force=True)
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

    page.locator('input[type="file"][accept*=".fbx"]').set_input_files({
        "name": "probe-motion.glb",
        "mimeType": "model/gltf-binary",
        "buffer": make_motion_glb(),
    })
    page.get_by_text("probe-motion.glb", exact=True).wait_for(timeout=30000)
    assert page.locator("section.asset-motion-capabilities").count() > 0
    assert page.locator(".asset-motion-candidate").count() == 2
    page.locator(".asset-motion-capability-actions button").first.click(force=True)
    assert page.locator("section.asset-part-motion").count() > 0
    material_panel = page.locator(".asset-material-overrides")
    assert material_panel.count() == 1
    material_panel.get_by_role("button", name="应用材质", exact=True).click(force=True)
    material_panel.get_by_role("button", name="恢复原材质", exact=True).click(force=True)
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

