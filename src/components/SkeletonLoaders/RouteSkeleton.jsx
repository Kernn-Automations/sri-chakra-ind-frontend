import { Skeleton } from "../ui/skeleton";

function RouteSkeleton() {
  return (
    <div className="row m-0 p-3">
      <div className="col-2 mx-3">
        <Skeleton height={10} />
      </div>
      <div className="col-2 mx-3">
        <Skeleton height={10} />
      </div>
      <div className="col-2 mx-3">
        <Skeleton height={10} />
      </div>
      
    </div>
  );
}

export default RouteSkeleton;
