import { Skeleton } from "../ui/skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="row m-0 p-0 justify-content-around">
      {/* Header */}

      {/* Stats or Cards */}
      <div className="col-1 m-0 p-0">
        <Skeleton height="100vh" />
      </div>
      <div className="col m-0 p-0">
        <Skeleton height="60px" />
        <div className="row m-0 p-3 justify-content-around">
          <div className="col-3 m-3">
            <Skeleton height="200px" />
          </div>
          <div className="col-3 m-3">
            <Skeleton height="200px" />
          </div>
          <div className="col-3 m-3">
            <Skeleton height="200px" />
          </div>
          <div className="col-3 m-3">
            <Skeleton height="200px" />
          </div>
          <div className="col-3 m-3">
            <Skeleton height="200px" />
          </div>
        </div>

        {/* Table or content area */}
        <div className="row m-0 p-3 justify-content-around">
          <Skeleton height="30px" mb="4" />
          <div className="row m-0 p-3 justify-content-around">
            <div className="col-2">
              <Skeleton height="20px" />
            </div>
            <div className="col-2">
              <Skeleton height="20px" />
            </div>
            <div className="col-2">
              <Skeleton height="20px" />
            </div>
            <div className="col-2">
              <Skeleton height="20px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
