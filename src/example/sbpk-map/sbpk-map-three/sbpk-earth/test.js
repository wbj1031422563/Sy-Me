function makeGlobeOfPoints(){
    let dummyObj = new THREE.Object3D();
    let p = new THREE.Vector3();//向量
    let sph = new THREE.Spherical();//球坐标
    let geoms = [];//存储生成的几何体
    let tex = new THREE.TextureLoader().load(imgData);
    let counter = 75000;//点的数量
    let rad = 5;//球体半径
    let r = 0;
    let dlong = Math.PI * (3 - Math.sqrt(5));//生成点使用的经度步长,这里取得黄金角 ，经度指的是与x轴正方向的夹角，范围是【0,2*PI]
    /**
     * 标准球坐标系的半径为1，纬度角指的是球面上一点到赤道面的垂直距离，2 / counter
     * 计算出维度的步长，直径为2，在这个直径上均匀分布，所以步长是这么多，当纬度角为1的时候在北极，0在赤道，-1在南极
     */
    let dz = 2 / counter;//生成点使用的纬度步长，默认的球体直径为2，2/count得到维度补充
    let long = 0;
    // 设置初始值，确保点从北极向南极均匀分布
    let z = 1 - dz / 2;
    for (let i = 0; i < counter; i++) {
    //r是当前纬度角对应的球面的半径
      r = Math.sqrt(1 - z * z);
    //   当前纬度和经度对应的x-y-z坐标
      p.set( Math.cos(long) * r, z, -Math.sin(long) * r).multiplyScalar(rad);
      z = z - dz;
      long = long + dlong;
    //   将直角坐标转为球坐标
      sph.setFromVector3(p);
      dummyObj.lookAt(p);
      dummyObj.updateMatrix();
      let g =  new THREE.PlaneGeometry(1, 1);
      g.applyMatrix4(dummyObj.matrix);
      g.translate(p.x, p.y, p.z);
      //每个粒子是一个PlaneGeometry，它有四个顶点，所以这里重复的4次
      let centers = [
        p.x, p.y, p.z,
        p.x, p.y, p.z,
        p.x, p.y, p.z,
        p.x, p.y, p.z
      ];
      let uv = new THREE.Vector2(
        (sph.theta + Math.PI) / (Math.PI * 2),
        1. - sph.phi / Math.PI
      );
       //每个粒子是一个PlaneGeometry，它有四个顶点，所以这里重复的4次
      let uvs = [
        uv.x, uv.y,
        uv.x, uv.y,
        uv.x, uv.y,
        uv.x, uv.y
      ];
      g.setAttribute('center', new THREE.Float32BufferAttribute(centers, 3));
      g.setAttribute('baseUv', new THREE.Float32BufferAttribute(uvs, 2));
      geoms.push(g);
    }
    let g = mergeBufferGeometries(geoms);
    let m = new THREE.MeshBasicMaterial({
      color: new THREE.Color(params.colors.base),
      onBeforeCompile: shader => {
        shader.uniforms.impacts = uniforms.impacts;
        shader.uniforms.maxSize = uniforms.maxSize;
        shader.uniforms.minSize = uniforms.minSize;
        shader.uniforms.waveHeight = uniforms.waveHeight;
        shader.uniforms.scaling = uniforms.scaling;
        shader.uniforms.gradInner = uniforms.gradInner;
        shader.uniforms.gradOuter = uniforms.gradOuter;
        shader.uniforms.tex = {value: tex};
        shader.vertexShader = `
          struct impact {
            vec3 impactPosition;
            float impactMaxRadius;
            float impactRatio;
          };
          uniform impact impacts[${maxImpactAmount}];
          uniform sampler2D tex;
          uniform float maxSize;
          uniform float minSize;
          uniform float waveHeight;
          uniform float scaling;

          attribute vec3 center;
          attribute vec2 baseUv;

          varying float vFinalStep;
          varying float vMap;

          ${shader.vertexShader}
        `.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
          float finalStep = 0.0;
          for (int i = 0; i < ${maxImpactAmount};i++){
            float dist = distance(center, impacts[i].impactPosition);
            float curRadius = impacts[i].impactMaxRadius * impacts[i].impactRatio;
            float sstep = smoothstep(0., curRadius, dist) - smoothstep(curRadius - ( 0.25 * impacts[i].impactRatio ), curRadius, dist);
            sstep *= 1. - impacts[i].impactRatio;
            finalStep += sstep;
          }
          finalStep = clamp(finalStep, 0., 1.);
          vFinalStep = finalStep;

          float map = texture(tex, baseUv).g;
          vMap = map;
          float pSize = map < 0.5 ? maxSize : minSize;
          float scale = scaling;

          transformed = (position - center) * pSize * mix(1., scale * 1.25, finalStep) + center; // scale on wave
          transformed += normal * finalStep * waveHeight; // lift on wave
          `
        );
        shader.fragmentShader = `
          uniform vec3 gradInner;
          uniform vec3 gradOuter;
          varying float vFinalStep;
          varying float vMap;
          ${shader.fragmentShader}
          `.replace(
          `vec4 diffuseColor = vec4( diffuse, opacity );`,
          `
          // shaping the point, pretty much from The Book of Shaders
          vec2 hUv = (vUv - 0.5);
          int N = 8;
          float a = atan(hUv.x,hUv.y);
          float r = PI2/float(N);
          float d = cos(floor(.5+a/r)*r-a)*length(hUv);
          float f = cos(PI / float(N)) * 0.5;
          if (d > f) discard;

          vec3 grad = mix(gradInner, gradOuter, clamp( d / f, 0., 1.)); // gradient
          vec3 diffuseMap = diffuse * ((vMap > 0.5) ? 0.5 : 1.);
          vec3 col = mix(diffuseMap, grad, vFinalStep); // color on wave
          //if (!gl_FrontFacing) col *= 0.25; // moderate the color on backside
          vec4 diffuseColor = vec4( col , opacity );
          `
        );
      }
    });
    m.defines = {'USE_UV':''};
    earth = new THREE.Mesh(g, m);
    earth.rotation.y = Math.PI;
    trails.forEach(t => {earth.add(t)});
    earth.position.set(0, -.4, 0);
    scene.add(earth);
  }

  https://github.com/dragonir/3d/blob/master/src/containers/EarthDigital/index.js