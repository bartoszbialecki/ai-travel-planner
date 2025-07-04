import React from "react";

/**
 * EmptyState
 * Component informing about lack of travel plans.
 * Shows CTA to create a new plan.
 */
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="text-3xl mb-4">🗺️</div>
    <div className="text-lg font-semibold mb-2">Nie masz jeszcze żadnych planów podróży</div>
    <div className="text-muted-foreground mb-6">Stwórz swój pierwszy plan i zacznij odkrywać świat!</div>
    <a href="/generate" className="shadcn-btn shadcn-btn-primary">
      Utwórz nowy plan
    </a>
  </div>
);

export default EmptyState;
