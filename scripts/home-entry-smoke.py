import os

from playwright.sync_api import sync_playwright


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
    assert page.get_by_role("link", name="场景库", exact=True).count() == 1
    page.get_by_role("link", name="场景库", exact=True).click(force=True)
    page.wait_for_url("**/studio/scenes", timeout=30000)
    page.wait_for_selector(".studio-library-page", timeout=10000)
    assert page.locator(".studio-library-page").count() == 1
    page.get_by_role("link", name="资产目录", exact=True).click(force=True)
    page.wait_for_url("**/studio/assets", timeout=30000)
    page.wait_for_selector(".studio-placeholder-page h2", timeout=10000)
    assert page.locator(".studio-placeholder-page h2").inner_text() == "资产目录"
    page.get_by_role("link", name="作业模拟", exact=True).click(force=True)
    page.wait_for_url("**/studio/operations", timeout=30000)
    page.wait_for_selector(".studio-placeholder-page h2", timeout=10000)
    assert page.locator(".studio-placeholder-page h2").inner_text() == "作业模拟"
    page.get_by_role("link", name="诊断中心", exact=True).click(force=True)
    page.wait_for_url("**/studio/diagnostics", timeout=30000)
    page.wait_for_selector(".studio-placeholder-page h2", timeout=10000)
    assert page.locator(".studio-placeholder-page h2").inner_text() == "诊断中心"
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
