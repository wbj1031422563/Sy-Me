import MaxwellEffects from "../maxwell-effects/maxwell-effects";
import MaxWellGround from "../maxwell-ground/maxwell-ground";
import MaxwellText from "../maxwell-text/maxwell-text";
import { Suspense } from "react";
function MaxWellRoomScene() {
    return (
      <Suspense>
        <MaxwellEffects/>
        <MaxWellGround/>
        <MaxwellText position={[4,2,1]} rotation={[0,-Math.PI,0]} scale={[1.5,1.5,1.5]}/>
      </Suspense>
    );
  }
  export default MaxWellRoomScene;