import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="bg-gradient-subtle flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="bg-gradient-primary flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-glow">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-5xl font-bold tracking-tight text-white">404</h1>
      <p className="mt-2 max-w-sm text-sm text-white/60">
        This case or page doesn't exist in the ResolveIQ workspace.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
};

export default NotFound;
