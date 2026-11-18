import os
import struct

from playwright.sync_api import sync_playwright


def make_minimal_glb():
    json_bytes = (
        b'{"asset":{"version":"2.0"},"scene":0,"scenes":[{"nodes":[]}],'
        b'"nodes":[],"meshes":[],"materials":[]}'
    )
    json_bytes += b" " * ((4 - len(json_bytes) % 4) % 4)
    chunk = struct.pack("<II", len(json_bytes), 0x4E4F534A) + json_bytes
    return struct.pack("<III", 0x46546C67, 2, 12 + len(chunk)) + chunk


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))

    base_url = os.environ.get("SY_ME_TEST_BASE_URL", "http://127.0.0.1:4173/")
    page.goto(f"{base_url.rstrip('/')}/tools/asset-workbench")
    page.wait_for_selector(".asset-workbench-panel", timeout=60000)
    page.wait_for_function(
        "document.querySelectorAll('.asset-node-tree-row').length > 1",
        timeout=30000,
    )

    canvas = page.locator("canvas").first
    box = canvas.bounding_box()
    assert box is not None
    selected_by_canvas = False
    for x_ratio in (0.35, 0.45, 0.55, 0.65):
        for y_ratio in (0.35, 0.45, 0.55, 0.65):
            canvas.click(position={"x": box["width"] * x_ratio, "y": box["height"] * y_ratio}, force=True)
            selected_row = page.locator(".asset-node-tree-row.is-selected").first
            padding_left = selected_row.evaluate("(element) => parseInt(element.style.paddingLeft, 10)") if selected_row.count() else 0
            if "已选择" in page.locator(".asset-node-tree-footer").inner_text() and padding_left > 8:
                selected_by_canvas = True
                break
        if selected_by_canvas:
            break

    hierarchy = page.locator(".asset-model-hierarchy")
    selected_row = hierarchy.locator(".asset-node-tree-row.is-selected").first
    if not selected_by_canvas:
        hierarchy.locator(".asset-node-tree-select").nth(1).click(force=True)
        selected_row = hierarchy.locator(".asset-node-tree-row.is-selected").first
    selected_row.get_by_role("button", name="隔离", exact=False).click(force=True)
    page.wait_for_function(
        "document.querySelector('.asset-workbench-message')?.textContent.includes('已隔离当前节点')",
        timeout=5000,
    )
    hierarchy.get_by_role("button", name="恢复全部节点", exact=True).click(force=True)
    page.wait_for_function(
        "document.querySelector('.asset-workbench-message')?.textContent.includes('已恢复当前模型的全部节点显示')",
        timeout=5000,
    )
    assert selected_row.count() == 1
    selected_row.get_by_role("button", name="隐藏", exact=False).click(force=True)
    page.wait_for_function(
        "document.querySelector('.asset-workbench-message')?.textContent.includes('已隐藏当前节点')",
        timeout=5000,
    )
    selected_row.get_by_role("button", name="显示", exact=False).click(force=True)
    page.wait_for_function(
        "document.querySelector('.asset-workbench-message')?.textContent.includes('已显示当前节点')",
        timeout=5000,
    )

    with page.expect_file_chooser() as chooser_info:
        page.get_by_role("button", name="＋ 新增模型槽位", exact=True).click(force=True)
    chooser_info.value.set_files({
        "name": "assembled.glb",
        "mimeType": "model/gltf-binary",
        "buffer": make_minimal_glb(),
    })
    page.wait_for_function("document.querySelectorAll('.asset-model-slot').length === 2", timeout=10000)
    page.locator(".asset-model-slot").nth(1).locator(".asset-model-slot-select strong").get_by_text("assembled", exact=True).wait_for(timeout=10000)
    assembly = page.locator(".asset-model-assembly")
    assembly.locator("select").first.select_option("model-2")
    assembly.get_by_label("父模型", exact=True).select_option("harvester")
    slot_two = page.locator(".asset-model-slot").nth(1)
    slot_two.locator('button[aria-label^="隐藏"]').click(force=True)
    page.wait_for_function(
        "Boolean(document.querySelectorAll('.asset-model-slot')[1]?.querySelector('button[aria-label^=\"显示\"]'))",
        timeout=5000,
    )
    slot_two.locator('button[aria-label^="显示"]').click(force=True)

    print(f"selected_by_canvas: {selected_by_canvas}")
    print(f"console_errors: {errors}")
    if errors:
        raise SystemExit("browser errors detected")
    browser.close()
