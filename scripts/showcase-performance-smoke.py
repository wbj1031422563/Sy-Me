import os

from playwright.sync_api import sync_playwright


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    base_url = os.environ.get("SY_ME_TEST_BASE_URL", "http://127.0.0.1:5173/")

    page.goto(f"{base_url.rstrip('/')}/viewer/harvester")
    page.wait_for_load_state("networkidle")
    page.get_by_role("button", name="打开示例展台", exact=True).click(force=True)
    try:
        page.wait_for_selector(".harvester-showcase-toolbar", timeout=90000)
    except Exception:
        print(f"url: {page.url}")
        print(f"console_errors: {errors}")
        print(page.locator("body").inner_text().encode("ascii", "backslashreplace").decode()[:2000])
        raise
    page.wait_for_selector(".scene-viewer-performance-toggle", timeout=30000)
    page.locator(".scene-viewer-performance-toggle").click(force=True)
    page.wait_for_selector(".scene-viewer-performance-body", timeout=10000)
    page.wait_for_timeout(12000)
    print(page.locator(".scene-viewer-performance-toggle").inner_text().encode("ascii", "backslashreplace").decode())
    print(page.locator(".scene-viewer-performance-body").inner_text().encode("ascii", "backslashreplace").decode())
    print(f"console_errors: {errors}")
    browser.close()
