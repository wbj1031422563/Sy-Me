import * as THREE from "three";
// THREE。THREE.TubeGeometry
class RoadTestGeometry extends THREE.BufferGeometry {
  constructor(pathList, tubularSegments = 50) {
    super();

    this.type = "RoadGeometry";

    this.parameters = {
      // tubularSegments: tubularSegments,
      pathList: pathList,
    };
    const roadWidth = 0.01;
    // const tubularSegments=2;

    // const frames = path.computeFrenetFrames(tubularSegments, closed);

    // expose internals

    /**
     * 
    切线向量（Tangent）：路径的方向，即路径在每一点的瞬时方向。
    法线向量（Normal）：垂直于切线向量的向量，用于确定几何体的正面方向。
    副法线向量（Binormal）：垂直于切线和法线的向量，形成完整的局部坐标系。
     */
    let frames = null;
    let path = new THREE.Curve();
    // this.tangents = frames.tangents;
    // this.normals = frames.normals;
    // this.binormals = frames.binormals;

    // helper variables

    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const uv = new THREE.Vector2();
    // const aTotalLen=0;
    let P = new THREE.Vector3();

    // buffer

    const vertices = [];
    const normals = [];
    const uvs = [];
    const globalUvs = [];
    const indicesList = [];
    const aLens=[];

    // create buffer data

    generateBufferData();

    // build geometry

    this.setIndex(indicesList);
    this.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    // generateGlobalUvs();
    // this.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    this.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    this.setAttribute("aLen", new THREE.Float32BufferAttribute(aLens, 1));

    // functions

    function generateBufferData() {
      generatePath();

      // generateindicesList();
    }

    function generatePath() {
      let offset=0;
      for (let i = 0; i < pathList.length; i++) {
        path = pathList[i];
        frames = path.computeFrenetFrames(tubularSegments, false);
        // 
        for (let j = 0; j < tubularSegments; j++) {
          generateSegment(j);
        }
        generateSegment(tubularSegments);
        generateIndices(offset);
        generateUVs();
        generateLens(path.getLength());
        // aLens.push()
        // path.getLength();
        offset=vertices.length/3;
      }
    }
    function generateSegment(i) {
      // we use getPointAt to sample evenly distributed points from the given path

      P = path.getPointAt(i / tubularSegments, P);

      const N = frames.normals[i];
      const B = frames.binormals[i];
      vertex.x = P.x + (roadWidth / 2) * B.x;
      vertex.y = P.y;
      vertex.z = P.z + (roadWidth / 2) * B.z;
      vertices.push(vertex.x, vertex.y, vertex.z);

      vertex.x = P.x - (roadWidth / 2) * B.x;
      vertex.y = P.y;
      vertex.z = P.z - (roadWidth / 2) * B.z;
      vertices.push(vertex.x, vertex.y, vertex.z);
    }

    function generateIndices(offset) {
      for (let j = 0; j < tubularSegments; j++) {
        const a = 2 * j+offset;     // 当前段左边顶点
        const b = 2 * j + 1+offset; // 当前段右边顶点
        const c = 2 * j + 2+offset; // 下一段左边顶点
        const d = 2 * j + 3+offset; // 下一段右边顶点
    
        // faces
        indicesList.push(a, b, d); // 三角形 (a, b, d)
        indicesList.push(a, d, c); // 三角形 (a, d, c)
      }
    }

    function generateGlobalUvs() {
      this.computeBoundingBox();
      const bbox = this.boundingBox;
      const size = bbox.getSize(new THREE.Vector3());
      const min = bbox.min;
      const max = bbox.max;

      // 得到包围基点，注意这里是二维平面上的
      const basePosition = new THREE.Vector2(
        Math.min(min.x, max.x),
        Math.min(min.z, max.z)
      );
      const count = vertices.length;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const i2 = i * 2;

        //地图块位于x-z平面上
        globalUvs[i2] = (vertices[i3] - basePosition.x) / size.x;
        globalUvs[i2 + 1] = (vertices[i3 + 2] - basePosition.y) / size.z;
      }

      // this.setAttribute("uv", new THREE.Float32BufferAttribute(globalUvs, 2));
    }
    function generateUVs() {
      for (let i = 0; i <= tubularSegments; i++) {
        uvs.push(i / tubularSegments, 0);
        uvs.push(i / tubularSegments, 1);
      }
    }
    function generateLens(len) {
      for (let i = 0; i <= tubularSegments; i++) {
        aLens.push(len);
        aLens.push(len);
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
export default RoadTestGeometry;
