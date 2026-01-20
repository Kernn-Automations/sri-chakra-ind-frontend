import { Skeleton } from "../ui/skeleton";

function PageSkeleton() {
  return (
    <div className="p-4">
      <Skeleton height="40px" mb="4" />
      <Skeleton height="20px" mb="2" />
      <Skeleton height="20px" mb="2" />
      <Skeleton height="300px" />
    </div>
  );
}

export default PageSkeleton;
