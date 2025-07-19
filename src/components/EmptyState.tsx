import React from "react";
import { Button } from "@/components/ui/button";

/**
 * EmptyState
 * Component informing about lack of travel plans.
 * Shows CTA to create a new plan.
 */
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div
      data-testid="empty-state-icon"
      className="w-24 h-24 mb-8 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center shadow-soft"
    >
      <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
        />
      </svg>
    </div>

    <h3 className="text-2xl font-bold text-gray-900 mb-3">No Travel Plans Yet</h3>

    <p className="text-gray-600 text-center max-w-md mb-8 leading-relaxed">
      Start your journey by creating your first AI-powered travel plan. Get personalized itineraries tailored to your
      preferences and budget.
    </p>

    <div className="flex flex-col sm:flex-row gap-4">
      <Button asChild size="lg" className="gradient-primary hover:opacity-90 transition-opacity shadow-medium">
        <a href="/generate">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Your First Plan
        </a>
      </Button>

      <Button variant="outline" size="lg" asChild>
        <a href="/generate">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Learn More
        </a>
      </Button>
    </div>

    {/* Feature highlights */}
    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-green-50 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h4 className="font-semibold text-gray-900 mb-1">AI-Powered</h4>
        <p className="text-sm text-gray-600">Smart recommendations</p>
      </div>

      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-blue-50 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
        </div>
        <h4 className="font-semibold text-gray-900 mb-1">Budget-Friendly</h4>
        <p className="text-sm text-gray-600">Cost-optimized plans</p>
      </div>

      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-purple-50 flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <h4 className="font-semibold text-gray-900 mb-1">Personalized</h4>
        <p className="text-sm text-gray-600">Tailored to you</p>
      </div>
    </div>
  </div>
);

export default EmptyState;
