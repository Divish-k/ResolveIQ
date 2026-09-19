import { Navigate } from "react-router-dom";
import { useListCases } from "@/lib/api";
import { useCustomer } from "@/context/customer";
import { Skeleton } from "@/components/ui/skeleton";

// /customer/track with no case id → send the customer to their most recent
// case, or to My Complaints if they have none yet.
export default function TrackCaseRedirect() {
  const { customer } = useCustomer();
  const { data, isLoading } = useListCases();

  const mine = (data?.cases ?? [])
    .filter((c) => c.customer_email?.toLowerCase() === customer.email.toLowerCase())
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-64 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (mine.length > 0) {
    return <Navigate to={`/customer/track/${mine[0].id}`} replace />;
  }
  return <Navigate to="/customer/complaints" replace />;
}
