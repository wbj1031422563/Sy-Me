const SOFTWARE_RENDERER_PATTERN = /swiftshader|llvmpipe|software rasterizer|software renderer|microsoft basic render|mesa offscreen/i;

function readParameter(gl, parameter, fallback = "") {
  try {
    return gl.getParameter(parameter) || fallback;
  } catch {
    return fallback;
  }
}

export function inspectWebGLContext(gl) {
  if (!gl) {
    return {
      supported: false,
      label: "WebGL 不可用",
      context: "—",
      vendor: "—",
      renderer: "—",
      version: "—",
      shadingLanguageVersion: "—",
      hardware: "unknown",
      hardwareLabel: "无法判断",
    };
  }

  const debugInfo = gl.getExtension?.("WEBGL_debug_renderer_info");
  const vendor = debugInfo
    ? readParameter(gl, debugInfo.UNMASKED_VENDOR_WEBGL, "未知厂商")
    : readParameter(gl, gl.VENDOR, "浏览器未提供厂商信息");
  const renderer = debugInfo
    ? readParameter(gl, debugInfo.UNMASKED_RENDERER_WEBGL, "未知渲染器")
    : readParameter(gl, gl.RENDERER, "浏览器未提供渲染器信息");
  const version = readParameter(gl, gl.VERSION, "未知 WebGL 版本");
  const shadingLanguageVersion = readParameter(gl, gl.SHADING_LANGUAGE_VERSION, "未知 GLSL 版本");
  const isSoftware = SOFTWARE_RENDERER_PATTERN.test(`${vendor} ${renderer}`);
  const isWebGL2 = /WebGL 2/i.test(version) || gl.constructor?.name === "WebGL2RenderingContext";

  return {
    supported: true,
    label: isWebGL2 ? "WebGL 2 可用" : "WebGL 1 可用",
    context: isWebGL2 ? "WebGL 2" : "WebGL 1",
    vendor,
    renderer,
    version,
    shadingLanguageVersion,
    hardware: isSoftware ? "software" : debugInfo ? "hardware" : "unknown",
    hardwareLabel: isSoftware ? "疑似软件渲染" : debugInfo ? "硬件加速" : "无法判断",
  };
}

export function inspectCanvasWebGL(canvas) {
  try {
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return inspectWebGLContext(gl);
  } catch {
    return inspectWebGLContext(null);
  }
}
