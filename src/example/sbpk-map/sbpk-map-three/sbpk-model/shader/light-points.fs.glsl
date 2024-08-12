
void main(){
    vec3 color=vec3(0.,1.,1.);
    
    vec2 uv=gl_PointCoord;
    float distanceToCenter=length(uv-.5);
    float alpha=.05/distanceToCenter-.1;
    alpha=clamp(0.0, 1.0, alpha);
    
    gl_FragColor=vec4(color,alpha);
    // gl_FragColor=vec4(gl_PointCoord,1.,1.);
    // gl_FragColor=vec4(0.0,0.0,1.0,1.0);
}