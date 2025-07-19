import React, { useCallback, useState } from "react";
import GenerationForm from "./GenerationForm";
import StatusModal from "./StatusModal";

const GenerationPage: React.FC = () => {
  const [jobId, setJobId] = useState<string | null>(null);

  const handleFormSubmit = (jobId: string) => {
    setJobId(jobId);
  };

  const handleStatusComplete = useCallback((planId: string) => {
    window.location.href = `/plans/${planId}`;
  }, []);

  const handleRetry = () => {
    setJobId(null);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto py-12 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center shadow-medium">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Create Your Perfect Travel Plan</h1>
            <p className="text-xl text-gray-600 max-w-lg mx-auto">
              Let AI craft a personalized itinerary based on your preferences, budget, and travel style
            </p>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8" data-test-id="generation-page">
            <GenerationForm onSubmit={handleFormSubmit} />
          </div>

          {/* Features Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-gray-600 text-sm">
                Advanced AI algorithms create optimal itineraries tailored to your preferences
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Budget-Friendly</h3>
              <p className="text-gray-600 text-sm">
                Get detailed cost estimates and recommendations within your budget
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Personalized</h3>
              <p className="text-gray-600 text-sm">
                Customized plans based on your travel style, group size, and interests
              </p>
            </div>
          </div>
        </div>
      </div>

      {jobId && <StatusModal jobId={jobId} onComplete={handleStatusComplete} onRetry={handleRetry} />}
    </div>
  );
};

export default GenerationPage;
