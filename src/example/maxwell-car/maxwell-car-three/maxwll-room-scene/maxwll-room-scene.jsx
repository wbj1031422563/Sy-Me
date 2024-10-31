import MaxWellGround from "../maxwell-ground/maxwell-ground";
import MaxwellText from "../maxwell-text/maxwell-text";
import { Suspense, useMemo } from "react";

function MaxWellRoomScene() {
  const maxWellGround = useMemo(() => <MaxWellGround />, []); // 通过 useMemo 缓存 MaxWellGround

  return (
    <>
      <Suspense>
        {maxWellGround} {/* 使用缓存的 MaxWellGround */}
        <MaxwellText position={[4, 2, 1]} rotation={[0, -Math.PI, 0]} scale={[1.5, 1.5, 1.5]} />
      </Suspense>
    </>
  );
}

export default MaxWellRoomScene;
