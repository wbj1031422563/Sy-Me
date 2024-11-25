	void main() {
	    vec4 modelPosition=modelMatrix*vec4(position,1.);
		vec4 viewPosition=viewMatrix*modelPosition;
		gl_Position=projectionMatrix*viewPosition;
  }


  