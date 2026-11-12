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

    page.get_by_role("button", name="性能优先").click()
    page.get_by_role("button", name="技术光点").click()
    assert page.locator(".asset-color-grade").count() == 1
    assert page.locator(".asset-rgb-channel-group").count() == 3
    page.locator(".asset-color-grade .asset-theme-list button").nth(1).click(force=True)
    assert page.locator(".asset-color-grade .asset-tuning-control output").first.inner_text() == "-8°"

    page.locator('input[type="file"]').first.set_input_files({
        "name": "probe-motion.glb",
        "mimeType": "model/gltf-binary",
        "buffer": make_motion_glb(),
    })
    page.get_by_text("probe-motion.glb", exact=True).wait_for(timeout=30000)
    assert page.locator("section.asset-motion-capabilities").count() > 0
    assert page.locator(".asset-motion-candidate").count() == 2
    page.locator(".asset-motion-capability-actions button").first.click(force=True)
    assert page.locator("section.asset-part-motion").count() > 0
    diagnostics_button = page.locator(".asset-motion-capability-actions button").nth(1)
    diagnostics_button.click(force=True)
    assert diagnostics_button.inner_text() == "隐藏诊断轴"
    page.locator(".asset-part-motion .asset-primary-button").first.click(force=True)
    assert page.locator(".asset-part-motion .asset-primary-button").first.inner_text() == "暂停动作"

    print("motion_candidates: ok")
    print("render_tuning: ok")
    print("particle_preset: ok")
    print("console_errors:", errors)
    if errors:
        raise SystemExit("browser errors detected")
    browser.close()

