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
    page.wait_for_url("**/tools/asset-workbench", timeout=30000)
    page.wait_for_selector(".asset-workbench-panel", timeout=60000)
    assert page.locator(".asset-model-slots").count() == 1
    assert errors == []
    print("home_asset_workbench_entry: ok")
    print(f"console_errors: {errors}")
    browser.close()
