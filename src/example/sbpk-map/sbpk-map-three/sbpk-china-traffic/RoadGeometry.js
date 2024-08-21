import * as THREE from "three";
// THREE。THREE.TubeGeometry
class RoadGeometry extends THREE.BufferGeometry {
  constructor(
    path = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1, -1, 0),
      new THREE.Vector3(-1, 1, 0),
      new THREE.Vector3(1, 1, 0)
    ),
    tubularSegments = 64,
    radius = 1,
    radialSegments = 8,
    closed = false
  ) {
    super();

    this.type = "RoadGeometry";

    this.parameters = {
      path: path,
      tubularSegments: tubularSegments,
      radius: radius,
      radialSegments: radialSegments,
      closed: closed,
    };
    const roadWidth = 0.01;

    const frames = path.computeFrenetFrames(tubularSegments, closed);

    // expose internals

    /**
     * 
    切线向量（Tangent）：路径的方向，即路径在每一点的瞬时方向。
    法线向量（Normal）：垂直于切线向量的向量，用于确定几何体的正面方向。
    副法线向量（Binormal）：垂直于切线和法线的向量，形成完整的局部坐标系。
     */
    this.tangents = frames.tangents;
    this.normals = frames.normals;
    this.binormals = frames.binormals;

    // helper variables

    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const uv = new THREE.Vector2();
    let P = new THREE.Vector3();

    // buffer

    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    // create buffer data

    generateBufferData();

    // build geometry

    this.setIndex(indices);
    this.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    this.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    this.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

    // functions

    function generateBufferData() {
      for (let i = 0; i < tubularSegments; i++) {
        generateSegment(i);
      }

      // if the geometry is not closed, generate the last row of vertices and normals
      // at the regular position on the given path
      //
      // if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)

      generateSegment(closed === false ? tubularSegments : 0);

      // uvs are generated in a separate function.
      // this makes it easy compute correct values for closed geometries

      generateUVs();

      // finally create faces

      generateIndices();
    }

    function generateSegment(i) {
      // we use getPointAt to sample evenly distributed points from the given path

      P = path.getPointAt(i / tubularSegments, P);

      // retrieve corresponding normal and binormal

      const N = frames.normals[i];
      const B = frames.binormals[i];

      // generate normals and vertices for the current segment

      // for (let j = 0; j <= radialSegments; j++) {
      //   const v = (j / radialSegments) * Math.PI * 2;

      //   const sin = Math.sin(v);
      //   const cos = -Math.cos(v);

      //   // normal

      //   normal.x = cos * N.x + sin * B.x;
      //   normal.y = cos * N.y + sin * B.y;
      //   normal.z = cos * N.z + sin * B.z;
      //   normal.normalize();

      //   normals.push(normal.x, normal.y, normal.z);

      //   // vertex

      //   vertex.x = P.x + radius * normal.x;
      //   vertex.y = P.y + radius * normal.y;
      //   vertex.z = P.z + radius * normal.z;

      //   vertices.push(vertex.x, vertex.y, vertex.z);
      // }
      // const v1=
      vertex.x = P.x + (roadWidth / 2) * B.x;
      vertex.y = P.y;
      vertex.z = P.z + (roadWidth / 2) * B.z;
      vertices.push(vertex.x, vertex.y, vertex.z);

      vertex.x = P.x - (roadWidth / 2) * B.x;
      vertex.y = P.y;
      vertex.z = P.z - (roadWidth / 2) * B.z;
      vertices.push(vertex.x, vertex.y, vertex.z);
    }

    function generateIndices() {
      for (let j = 0; j < tubularSegments; j++) {
        const a = 2 * j;     // 当前段左边顶点
        const b = 2 * j + 1; // 当前段右边顶点
        const c = 2 * j + 2; // 下一段左边顶点
        const d = 2 * j + 3; // 下一段右边顶点
    
        // faces
        indices.push(a, b, d); // 三角形 (a, b, d)
        indices.push(a, d, c); // 三角形 (a, d, c)
      }
    }
    

    function generateUVs() {
      for (let i = 0; i <= tubularSegments; i++) {
        // uv.x = i / tubularSegments;
        // uv.y = 0;
        uvs.push(i / tubularSegments, 0);
        uvs.push(i / tubularSegments, 1);

        // uv.x = i / tubularSegments;
        // uv.y = 1;
        // uvs.push(uv.x, uv.y);
      }
    }
  }

  toJSON() {
    const data = super.toJSON();

    data.path = this.parameters.path.toJSON();

    return data;
  }

  //   static fromJSON(data) {
  //     // This only works for built-in curves (e.g. CatmullRomCurve3).
  //     // User defined curves or instances of CurvePath will not be deserialized.
  //     return new RoadGeometry(
  //       new Curves[data.path.type]().fromJSON(data.path),
  //       data.tubularSegments,
  //       data.radius,
  //       data.radialSegments,
  //       data.closed
  //     );
  //   }
}
export default RoadGeometry;
