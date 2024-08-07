/**
这部分shader是根据 node_modules\three\src\renderers\shaders\ShaderLib\linedashed.glsl.js
 中的选线材质进行，修改而实现的
*/



uniform float totalSize;

varying float vLineDistance;
uniform float dashSize;

uniform vec3 diffuse;
uniform float opacity;

#include <common>
#include <color_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {
	#include <clipping_planes_fragment>

    if ( mod( vLineDistance, totalSize/2.0 ) >  dashSize) {

		discard;

	}

    vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( vec3(0.0,1.0,0.0), opacity );

	#include <logdepthbuf_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}