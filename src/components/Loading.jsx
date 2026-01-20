import {
  ProgressCircleRing,
  ProgressCircleRoot,
} from "@/components/ui/progress-circle";
import { Spinner, Text } from "@chakra-ui/react";

function Loading() {
  return (
    <>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-2">
            {/* <div className="spinner-border text-danger text-center" role="status">
              <span className="visually-hidden">Loading...</span>
            </div> */}
            {/* <ProgressCircleRoot value={null} size="sm">
              <ProgressCircleRing cap="round" />
            </ProgressCircleRoot> */}
            <Spinner size="lg" color={"#003176"} borderWidth="3px"/>
            {/* <Text color="#a92427">Loading...</Text> */}
          </div>
        </div>
      </div>
    </>
  );
}

export default Loading;
