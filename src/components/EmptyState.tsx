import React from "react";
import { Button } from "@/components/ui/button";

/**
 * EmptyState
 * Component informing about lack of travel plans.
 * Shows CTA to create a new plan.
 */
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="text-3xl mb-4">🗺️</div>
    <div className="text-lg font-semibold mb-2">You don&apos;t have any travel plans yet</div>
    <div className="text-muted-foreground mb-6">Create your first plan and start exploring the world!</div>
    <Button asChild>
      <a href="/generate" className="shadcn-btn shadcn-btn-primary">
        Create new plan
      </a>
    </Button>
  </div>
);

export default EmptyState;
