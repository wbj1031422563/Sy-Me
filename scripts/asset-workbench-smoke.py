from pathlib import Path
import struct
import sys

from playwright.sync_api import sync_playwright


sys.stdout.reconfigure(encoding="utf-8")


ROOT = Path(r"C:\Users\10314\Desktop\雷沃-工作\2026-2027\SY-Me")
MODEL = ROOT / "text_model001.glb"


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
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    errors = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))

    page.goto("http://127.0.0.1:4173/tools/asset-workbench")
    page.wait_for_selector(".asset-workbench-panel", timeout=60000)
    page.wait_for_timeout(1500)
    buttons = page.locator("button").all_text_contents()
    print("initial_url:", page.url)
    print("initial_title:", page.title())
    print("initial_body:", page.locator("body").inner_text()[:1000])
    print("initial_buttons:", buttons)
    print("initial_errors:", errors)
    page.screenshot(path="asset-workbench-initial.png", full_page=True)
    page.locator("button").filter(has_text="技术演示").first.click(force=True, timeout=60000)
    page.locator("button").filter(has_text="技术 EXR").first.click(force=True, timeout=60000)

    model_input = page.locator('input[type="file"]').first
    model_input.set_input_files({
        "name": "probe.glb",
        "mimeType": "model/gltf-binary",
        "buffer": make_minimal_glb(),
    })
    page.get_by_text("probe.glb", exact=True).wait_for(timeout=10000)
    page.get_by_text("可直接替换到当前场景", exact=True).wait_for(timeout=10000)

    model_input.set_input_files(str(MODEL))
    page.get_by_text("text_model001.glb", exact=True).wait_for(timeout=180000)
    page.wait_for_function(
        "document.querySelector('.model-item-stats')?.textContent?.includes('尺寸')",
        timeout=180000,
    )
    page.screenshot(path="asset-workbench-text-model001.png", full_page=True, timeout=180000)
    print("buttons:", page.locator("button").all_text_contents())
    print("report:", page.locator(".asset-report").inner_text())
    print("console_errors:", errors)
    browser.close()
