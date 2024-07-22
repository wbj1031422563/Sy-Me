/**
这部分shader是根据 node_modules\three\src\renderers\shaders\ShaderLib\linedashed.glsl.js
 中的选线材质进行，修改而实现的
*/


uniform float actionRatio;
uniform float lineLength;
uniform vec3 lineColor;
uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;

#include <common>
#include <color_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {
	#include <clipping_planes_fragment>
  float halfDash = dashSize * 0.5;//虚线长度的一半
  float currPos = (lineLength + dashSize) * actionRatio;//当前位置,actionRatio为动画step的值
  float d = (vLineDistance + halfDash) - currPos;//
  if (abs(d) > halfDash ) discard;

  float grad = ((vLineDistance + halfDash) - (currPos - halfDash)) / halfDash;
	vec3 outgoingLight = vec3( 0.0 );
  vec4 diffuseColor = vec4( lineColor, grad );

	#include <logdepthbuf_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}