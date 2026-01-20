import { Skeleton } from "../ui/skeleton";

const HomePageSkeleton = () => {
  return (
    <div className="p-4">
      {/* Dashboard Header Skeleton */}
      <div className="mb-6">
        <div className="d-flex justify-content-between align-items-center mb-4">
          {/* Welcome Section */}
          <div className="d-flex align-items-center">
            <Skeleton height="40px" width="300px" />
            <Skeleton height="20px" width="400px" className="ms-3" />
          </div>
          {/* Date Time */}
          <div className="d-flex align-items-center">
            <Skeleton height="30px" width="200px" />
          </div>
        </div>
      </div>

      {/* Statistics Cards Row Skeleton */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="d-flex align-items-center p-3 border rounded">
            <Skeleton height="50px" width="50px" className="me-3" />
            <div className="flex-grow-1">
              <Skeleton height="24px" width="80px" className="mb-2" />
              <Skeleton height="16px" width="120px" className="mb-1" />
              <Skeleton height="14px" width="100px" />
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="d-flex align-items-center p-3 border rounded">
            <Skeleton height="50px" width="50px" className="me-3" />
            <div className="flex-grow-1">
              <Skeleton height="24px" width="80px" className="mb-2" />
              <Skeleton height="16px" width="120px" className="mb-1" />
              <Skeleton height="14px" width="100px" />
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="d-flex align-items-center p-3 border rounded">
            <Skeleton height="50px" width="50px" className="me-3" />
            <div className="flex-grow-1">
              <Skeleton height="24px" width="80px" className="mb-2" />
              <Skeleton height="16px" width="120px" className="mb-1" />
              <Skeleton height="14px" width="100px" />
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="d-flex align-items-center p-3 border rounded">
            <Skeleton height="50px" width="50px" className="me-3" />
            <div className="flex-grow-1">
              <Skeleton height="24px" width="80px" className="mb-2" />
              <Skeleton height="16px" width="120px" className="mb-1" />
              <Skeleton height="14px" width="100px" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content Skeleton */}
      <div className="row">
        {/* First Row */}
        <div className="col-md-8 mb-4">
          <div className="border rounded p-3">
            <Skeleton height="24px" width="200px" className="mb-3" />
            <div className="row">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <Skeleton height="40px" width="40px" className="me-2" />
                    <div className="flex-grow-1">
                      <Skeleton height="16px" width="120px" className="mb-1" />
                      <Skeleton height="14px" width="80px" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-4">
          <div className="border rounded p-3">
            <Skeleton height="24px" width="150px" className="mb-3" />
            <div className="row mb-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="col-6 mb-3">
                  <div className="text-center">
                    <Skeleton height="40px" width="40px" className="mx-auto mb-2" />
                    <Skeleton height="16px" width="60px" className="mx-auto mb-1" />
                    <Skeleton height="14px" width="80px" className="mx-auto" />
                  </div>
                </div>
              ))}
            </div>
            
            <Skeleton height="24px" width="100px" className="mb-3" />
            <div className="row">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="col-6 mb-3">
                  <div className="text-center">
                    <Skeleton height="40px" width="40px" className="mx-auto mb-2" />
                    <Skeleton height="16px" width="60px" className="mx-auto mb-1" />
                    <Skeleton height="14px" width="80px" className="mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="border rounded p-3">
            <Skeleton height="24px" width="150px" className="mb-3" />
            {[1, 2, 3].map((item) => (
              <div key={item} className="d-flex align-items-center mb-3">
                <Skeleton height="30px" width="30px" className="me-2" />
                <div className="flex-grow-1">
                  <Skeleton height="16px" width="120px" className="mb-1" />
                  <Skeleton height="14px" width="80px" />
                </div>
                <Skeleton height="20px" width="60px" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="border rounded p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Skeleton height="24px" width="120px" />
              <Skeleton height="24px" width="24px" />
            </div>
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="d-flex align-items-center mb-3">
                <Skeleton height="24px" width="24px" className="me-2" />
                <div className="flex-grow-1">
                  <Skeleton height="16px" width="100px" className="mb-1" />
                  <Skeleton height="14px" width="60px" />
                </div>
                <Skeleton height="20px" width="80px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageSkeleton;
