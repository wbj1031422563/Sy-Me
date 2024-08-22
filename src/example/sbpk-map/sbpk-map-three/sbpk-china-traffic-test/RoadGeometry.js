import * as THREE from "three";
// THREE。THREE.TubeGeometry
class RoadTestGeometry extends THREE.BufferGeometry {
  constructor(
    pathList = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(2, 0, 2),
        new THREE.Vector3(3, 0, 10)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(7, 0, 2),
        new THREE.Vector3(8, 0, 10)
      ]), new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2, 0, 4),
        new THREE.Vector3(10, 0, 4)
      ]), new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2, 0, 6),
        new THREE.Vector3(10, 0, 6)
      ])
    ],
    // tubularSegments = 80
  ) {
    super();

    this.type = "RoadGeometry";

    this.parameters = {
      // tubularSegments: tubularSegments,
      pathList: pathList,
    };
    const roadWidth = 0.01;
    const tubularSegments=80;

    // const frames = path.computeFrenetFrames(tubularSegments, closed);

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

    const verticesList = [];
    const normals = [];
    const uvs = [];
    const globalUvs = [];
    const indicesList = [];

    // create buffer data

    generateBufferData();

    // build geometry

    this.setIndex(indicesList);
    this.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(verticesList, 3)
    );
    // generateGlobalUvs();
    // this.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    // this.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

    // functions

    function generateBufferData() {
      for (let i = 0; i < pathList.length; i++) {
        generatePath(pathList[i]);
      }
      const c=pathList;
      debugger

      // if the geometry is not closed, generate the last row of verticesList and normals
      // at the regular position on the given path
      //
      // if the geometry is closed, duplicate the first row of verticesList and normals (uvs will differ)

      // generateSegment(closed === false ? tubularSegments : 0);

      // uvs are generated in a separate function.
      // this makes it easy compute correct values for closed geometries

      generateUVs();

      // finally create faces

      generateindicesList();
    }

    function generatePath(path) {
      const pathFrames = path.computeFrenetFrames(tubularSegments, false);
      const pathVertices = [];
      // let P = new THREE.Vector3();
      for (let i = 0; i < tubularSegments; i++) {
        P = path.getPointAt(i / tubularSegments, P);
        const B = pathFrames.binormals[i];
        vertex.x = P.x + (roadWidth / 2) * B.x;
        vertex.y = P.y;
        vertex.z = P.z + (roadWidth / 2) * B.z;
        verticesList.push(vertex.x, vertex.y, vertex.z);

        vertex.x = P.x - (roadWidth / 2) * B.x;
        vertex.y = P.y;
        vertex.z = P.z - (roadWidth / 2) * B.z;
        pathVertices.push(vertex.x, vertex.y, vertex.z);
        // generateSegment(i);
      }
      verticesList.push(...pathVertices)
    }
    function generateSegment(i) {
      // we use getPointAt to sample evenly distributed points from the given path

      P = path.getPointAt(i / tubularSegments, P);

      // retrieve corresponding normal and binormal

      const N = frames.normals[i];
      const B = frames.binormals[i];

      // generate normals and verticesList for the current segment

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

      //   verticesList.push(vertex.x, vertex.y, vertex.z);
      // }
      // const v1=
      vertex.x = P.x + (roadWidth / 2) * B.x;
      vertex.y = P.y;
      vertex.z = P.z + (roadWidth / 2) * B.z;
      verticesList.push(vertex.x, vertex.y, vertex.z);

      vertex.x = P.x - (roadWidth / 2) * B.x;
      vertex.y = P.y;
      vertex.z = P.z - (roadWidth / 2) * B.z;
      verticesList.push(vertex.x, vertex.y, vertex.z);
    }

    function generateindicesList() {
      for (let i = 0; i < pathList.length; i++) {
        const indexOffset = i * tubularSegments * 3;
        for (let j = 0; j < tubularSegments; j++) {
          const a = (2 * j) + indexOffset;     // 当前段左边顶点
          const b = (2 * j + 1) + indexOffset; // 当前段右边顶点
          const c = (2 * j + 2) + indexOffset; // 下一段左边顶点
          const d = (2 * j + 3) + indexOffset; // 下一段右边顶点
          // faces
          indicesList.push(a, b, d); // 三角形 (a, b, d)
          indicesList.push(a, d, c); // 三角形 (a, d, c)
        }
      }
    }
    function generateIndices() {
      for (let j = 0; j < tubularSegments; j++) {
        const a = 2 * j;     // 当前段左边顶点
        const b = 2 * j + 1; // 当前段右边顶点
        const c = 2 * j + 2; // 下一段左边顶点
        const d = 2 * j + 3; // 下一段右边顶点

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
      const count=verticesList.length;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const i2 = i * 2;
  
        //地图块位于x-z平面上
        globalUvs[i2] = (verticesList[i3] - basePosition.x) / size.x;
        globalUvs[i2 + 1] = (verticesList[i3 + 2] - basePosition.y) / size.z;
      }
    }
    function generateUVs() {
      for (let i = 0; i < pathList.length; i++) {
        for (let j = 0; j <= tubularSegments; j++) {
          uvs.push(j / tubularSegments, 0);
          uvs.push(j / tubularSegments, 1);
        }
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
