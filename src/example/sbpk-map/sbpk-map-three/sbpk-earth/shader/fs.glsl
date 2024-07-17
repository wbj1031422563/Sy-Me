varying vec2 vUv;
varying float vMap;
varying float vVisibility;

void main() {
    // if (vVisibility < 0.5) {
    //     discard; // 丢弃背面的粒子
    // }

    float strength = step(0.5, vMap);
    gl_FragColor = vec4(vec3(strength), 1.0);
}
