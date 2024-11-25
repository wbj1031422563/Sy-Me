import MaxWellGround from "../maxwell-ground/maxwell-ground";
import MaxwellText from "../maxwell-text/maxwell-text";
import { Suspense, useMemo } from "react";

function MaxWellRoomScene() {
  const maxWellGround = useMemo(() => <MaxWellGround />, []); // 通过 useMemo 缓存 MaxWellGround

  return (
    <>
      <Suspense>
        {maxWellGround} {/* 使用缓存的 MaxWellGround */}
      </Suspense>
    </>
  );
}

export default MaxWellRoomScene;
