import MaxWellGround from "../maxwell-ground/maxwell-ground";
import MaxwellText from "../maxwell-text/maxwell-text";
import { Suspense, useMemo } from "react";
import MaxwellLightformers from "@/example/maxwell-car/maxwell-car-three/maxwell-lightformers/maxwell-lightformers.jsx";

function MaxWellRoomScene() {
  const maxWellGround = useMemo(() => <MaxWellGround />, []); // 通过 useMemo 缓存 MaxWellGround

  return (
    <>
      <Suspense>

          <MaxwellLightformers/>
        {maxWellGround} {/* 使用缓存的 MaxWellGround */}
        <MaxwellText position={[4, 2, 1]} rotation={[0, -Math.PI, 0]} scale={[1.5, 1.5, 1.5]} />
      </Suspense>
    </>
  );
}

export default MaxWellRoomScene;
