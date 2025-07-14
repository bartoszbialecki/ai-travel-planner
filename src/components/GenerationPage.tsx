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
    <div className="container mx-auto max-w-xl py-8" data-test-id="generation-page">
      <GenerationForm onSubmit={handleFormSubmit} />
      {jobId && <StatusModal jobId={jobId} onComplete={handleStatusComplete} onRetry={handleRetry} />}
    </div>
  );
};

export default GenerationPage;
