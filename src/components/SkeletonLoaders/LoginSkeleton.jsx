import { Skeleton } from "../ui/skeleton";

const LoginSkeleton = () => {
  return (
    <>
      <div className="row m-0 p-3 justify-content-center">
        <div className="col-4 pt-3">
          <Skeleton height="120px" mb="40px" /> {/* Title */}
          <Skeleton height="60px" mx={20} mb={5} /> {/* Username input */}
          <Skeleton height="100px" mx={5} mb={5} /> {/* Password input */}
          <Skeleton height="45px" mx={20} mb={50} /> {/* Login button */}
        </div>
      </div>
      <div className="row m-0 p-3 pt-5 justify-content-center">
        <div className="col-8 pt-5">
          <Skeleton height="80px" mx={20} mb={10} /> {/* Login button */}
        </div>
      </div>
    </>
  );
};

export default LoginSkeleton;
