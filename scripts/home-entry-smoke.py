import os
import struct

from playwright.sync_api import sync_playwright


def make_minimal_glb():
    json_bytes = b'{"asset":{"version":"2.0"},"scene":0,"scenes":[{"nodes":[]}],"nodes":[],"meshes":[],"materials":[]}'
    json_bytes += b" " * ((4 - len(json_bytes) % 4) % 4)
    chunk = struct.pack("<II", len(json_bytes), 0x4E4F534A) + json_bytes
    return struct.pack("<III", 0x46546C67, 2, 12 + len(chunk)) + chunk


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))

    base_url = os.environ.get("SY_ME_TEST_BASE_URL", "http://127.0.0.1:5173/")
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    page.wait_for_selector(".home-tool-entry", timeout=30000)
    page.locator(".home-tool-entry").click(force=True)
    page.wait_for_url("**/studio", timeout=30000)
    page.wait_for_selector(".studio-shell", timeout=30000)
    page.locator(".studio-theme-action .page-theme-control-trigger").click(force=True)
    page.wait_for_selector(".page-theme-center", timeout=10000)
    assert page.locator(".page-theme-color-field").count() == 7
    page.locator("#page-theme-accent").evaluate("""(element) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(element, '#f2a65a');
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }""")
    page.wait_for_function("() => JSON.parse(localStorage.getItem('sy-me.page-theme.v1') || '{}').customPalette?.accent === '#f2a65a'")
    page.get_by_role("button", name="重置", exact=True).click(force=True)
    page.wait_for_function("() => !JSON.parse(localStorage.getItem('sy-me.page-theme.v1') || '{}').customPalette?.accent")
    page.get_by_role("button", name="关闭主题中心", exact=True).click(force=True)
    assert page.get_by_role("link", name="场景库", exact=True).count() == 1
    page.get_by_role("link", name="场景库", exact=True).click(force=True)
    page.wait_for_url("**/studio/scenes", timeout=30000)
    page.wait_for_selector(".studio-library-page", timeout=10000)
    assert page.locator(".studio-library-page").count() == 1
    scene_filters = page.locator(".studio-library-page .studio-filter-row button")
    scene_filters.nth(2).click(force=True)
    assert page.locator(".studio-library-card").count() == 1
    scene_filters.first.click(force=True)
    assert page.locator(".studio-library-card").count() == 2
    page.locator(".studio-library-card").filter(has_text="收获机展示场景").click(force=True)
    page.wait_for_url("**/viewer/harvester", timeout=30000)
    page.wait_for_selector(".harvester-showcase-page, .harvester-showcase-landing", timeout=30000)
    showcase_input = page.locator('input[type="file"][accept=".glb,.gltf"]')
    showcase_input.set_input_files({
        "name": "showcase-smoke.glb",
        "mimeType": "model/gltf-binary",
        "buffer": make_minimal_glb(),
    })
    page.wait_for_selector(".harvester-showcase-toolbar", timeout=60000)
    assert "showcase-smoke" in page.locator(".harvester-showcase-toolbar").inner_text()
    page.locator(".harvester-showcase-preset-summary").click(force=True)
    page.locator(".harvester-showcase-preset-list button").first.click(force=True)
    assert "已应用" in page.locator(".harvester-showcase-toolbar").inner_text()
    page.get_by_role("button", name="全部隐藏", exact=True).click(force=True)
    page.get_by_role("button", name="全部显示", exact=True).click(force=True)
    page.locator(".scene-viewer-node-toggle").click(force=True)
    page.wait_for_selector(".scene-viewer-node-body", timeout=10000)
    assert "节点可单独控制" in page.locator(".scene-viewer-node-footer").inner_text()
    page.locator(".scene-viewer-performance-toggle").click(force=True)
    page.wait_for_selector(".scene-viewer-performance-body", timeout=10000)
    assert "模型体检" in page.locator(".scene-viewer-performance-body").inner_text()
    assert "Draw Call 峰值" in page.locator(".scene-viewer-performance-body").inner_text()
    assert "三角面峰值" in page.locator(".scene-viewer-performance-body").inner_text()
    assert "渲染后端" in page.locator(".scene-viewer-performance-body").inner_text()
    assert "自动画质" in page.locator(".scene-viewer-performance-body").inner_text()
    page.get_by_role("button", name="关闭自动优化", exact=True).click(force=True)
    page.get_by_role("button", name="开启自动优化", exact=True).click(force=True)
    canvas = page.locator("canvas").first
    canvas.dispatch_event("webglcontextlost")
    page.wait_for_selector(".scene-viewer-context-overlay", timeout=10000)
    assert "WebGL 渲染上下文已丢失" in page.locator(".scene-viewer-context-overlay").inner_text()
    canvas.dispatch_event("webglcontextrestored")
    page.wait_for_function("() => !document.querySelector('.scene-viewer-context-overlay')")
    page.get_by_role("button", name="适配全部", exact=True).click(force=True)
    page.get_by_role("button", name="自动旋转", exact=True).click(force=True)
    page.get_by_role("button", name="停止旋转", exact=True).click(force=True)
    page.get_by_role("button", name="纯净展示", exact=True).click(force=True)
    page.wait_for_selector(".scene-viewer.is-presentation", timeout=10000)
    page.get_by_role("button", name="显示控制", exact=True).click(force=True)
    page.wait_for_function("() => !document.querySelector('.scene-viewer')?.classList.contains('is-presentation')")
    screenshot_button = page.get_by_role("button", name="导出截图", exact=True)
    screenshot_button.wait_for(state="attached")
    page.wait_for_function("""() => Array.from(document.querySelectorAll('button')).some((button) => button.textContent.includes('导出截图') && !button.disabled)""")
    with page.expect_download(timeout=10000) as download_info:
        screenshot_button.click(force=True)
    screenshot_download = download_info.value
    assert screenshot_download.suggested_filename.endswith(".png")
    screenshot_path = screenshot_download.path()
    assert screenshot_path and os.path.getsize(screenshot_path) > 100
    page.goto(f"{base_url.rstrip('/')}/studio/scenes")
    page.wait_for_selector(".studio-library-page", timeout=10000)
    page.get_by_role("link", name="资产目录", exact=True).click(force=True)
    page.wait_for_url("**/studio/assets", timeout=30000)
    page.wait_for_selector(".studio-asset-catalog-page h2", timeout=10000)
    assert page.locator(".studio-asset-catalog-page h2").inner_text() == "资产目录"
    page.locator('input[type="file"]').set_input_files({
        "name": "smoke-catalog.glb",
        "mimeType": "model/gltf-binary",
        "buffer": make_minimal_glb(),
    })
    page.get_by_text("smoke-catalog", exact=True).wait_for(timeout=10000)
    assert page.locator(".studio-asset-card").count() == 3
    assert page.locator(".studio-asset-performance-badge").count() >= 1
    page.get_by_role("link", name="直接加载到工作台", exact=False).click(force=True)
    page.wait_for_url("**/tools/asset-workbench?assetToken=*")
    try:
        page.wait_for_selector(".asset-workbench-panel", timeout=60000)
    except Exception:
        print(f"workbench_url: {page.url}")
        print(f"workbench_errors: {errors}")
        body_text = page.locator("body").inner_text()[:1800].encode("ascii", "backslashreplace").decode()
        print(f"workbench_body: {body_text}")
        raise
    try:
        page.locator(".asset-model-slot-select strong").get_by_text("smoke-catalog", exact=True).wait_for(timeout=60000)
    except Exception:
        print(f"handoff_url: {page.url}")
        print(f"handoff_errors: {errors}")
        print(f"handoff_message: {page.locator('.asset-workbench-message').all_inner_texts()}")
        body_text = page.locator("body").inner_text()[:1800].encode("ascii", "backslashreplace").decode()
        print(f"handoff_body: {body_text}")
        raise
    performance_panel = page.locator(".asset-performance-panel")
    assert "Draw Call 峰值" in performance_panel.inner_text()
    assert "三角面峰值" in performance_panel.inner_text()
    page.goto(f"{base_url.rstrip('/')}/studio/assets")
    page.wait_for_selector(".studio-asset-catalog-page", timeout=10000)
    local_card = page.locator(".studio-asset-card").filter(has_text="smoke-catalog")
    local_card.get_by_role("button", name="移除登记", exact=True).click(force=True)
    local_card.wait_for(state="detached", timeout=10000)
    page.get_by_role("link", name="诊断中心", exact=True).click(force=True)
    page.wait_for_url("**/studio/diagnostics", timeout=30000)
    page.wait_for_selector(".studio-diagnostics-page h2", timeout=10000)
    assert page.locator(".studio-diagnostics-page h2").inner_text() == "诊断中心"
    assert page.locator(".studio-diagnostic-check").count() == 4
    page.wait_for_selector(".studio-diagnostics-render-info", timeout=10000)
    assert "实际渲染信息" in page.locator(".studio-diagnostics-render-info").inner_text()
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    page.locator(".home-legacy-entry").click(force=True)
    page.wait_for_url("**/tools/asset-workbench", timeout=30000)
    try:
        page.wait_for_selector(".asset-workbench-panel", timeout=60000)
    except Exception:
        print(f"debug_url: {page.url}")
        print(f"debug_errors: {errors}")
        print(f"debug_body: {page.locator('body').inner_text()[:1000]}")
        raise
    assert page.locator(".asset-model-slots").count() == 1
    assert page.locator(".asset-toolbox-nav").count() == 1
    assert page.locator("#asset-tool-workflow[open]").count() == 1
    page.get_by_role("button", name="视觉镜头", exact=True).click(force=True)
    page.wait_for_function("document.querySelector('#asset-tool-visual')?.open === true")
    page.locator("#asset-tool-visual > summary").click(force=True)
    page.wait_for_function("document.querySelector('#asset-tool-visual')?.open === false")
    toolbox_state = page.evaluate("localStorage.getItem('sy-me.asset-workbench.toolbox-state.v1')")
    assert '"visual":false' in toolbox_state
    page.get_by_role("button", name="紧凑模式", exact=True).click(force=True)
    assert "is-compact" in page.locator(".asset-workbench-panel").get_attribute("class")
    page.get_by_role("button", name="标准模式", exact=True).click(force=True)
    assert "is-compact" not in page.locator(".asset-workbench-panel").get_attribute("class")
    page.get_by_role("button", name="工具设置", exact=True).click(force=True)
    settings = page.locator(".asset-toolbox-settings")
    assert settings.count() == 1
    motion_visibility = settings.locator("label").filter(has_text="动作与检查").locator("input").first
    motion_visibility.uncheck(force=True)
    page.wait_for_function("document.querySelector('#asset-tool-motion') === null")
    motion_visibility.check(force=True)
    page.wait_for_function("document.querySelector('#asset-tool-motion') !== null")
    workflow_visibility = settings.locator("label").filter(has_text="工作流工具").locator("input").first
    visual_visibility = settings.locator("label").filter(has_text="视觉与镜头").locator("input").first
    workflow_visibility.uncheck(force=True)
    visual_visibility.uncheck(force=True)
    motion_visibility.click(force=True)
    assert motion_visibility.is_checked()
    assert page.locator("#asset-tool-motion").count() == 1
    workflow_visibility.check(force=True)
    visual_visibility.check(force=True)
    settings.get_by_role("button", name="恢复工具箱默认", exact=True).click(force=True)
    assert errors == []
    print("home_asset_workbench_entry: ok")
    print(f"console_errors: {errors}")
    browser.close()
