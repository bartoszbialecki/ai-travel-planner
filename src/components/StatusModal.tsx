import React, { useEffect, useRef, useState } from "react";
import { usePlanGenerationStatus } from "./hooks/usePlanGenerationStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface StatusModalProps {
  jobId: string;
  onComplete: (planId: string) => void;
  onRetry: () => void;
}

const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

const StatusModal: React.FC<StatusModalProps> = ({ jobId, onComplete, onRetry }) => {
  const { status, progress, planId, error } = usePlanGenerationStatus(jobId);
  const modalRef = useRef<HTMLDivElement>(null);
  const [timedOut, setTimedOut] = useState(false);

  // Focus trap on modal open
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (modalRef.current) {
      modalRef.current.focus();
    }
    return () => {
      if (previouslyFocused) previouslyFocused.focus();
    };
  }, []);

  // Timeout logic
  useEffect(() => {
    if (status === "completed" || status === "failed") return;
    const timeout = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [status]);

  // Retry logic
  // const handleRetry = () => {
  //   setTimedOut(false);
  //   setRetryKey((k) => k + 1);
  // };

  // Return to form
  const handleReturn = () => {
    window.location.reload();
  };

  // Complete on success
  useEffect(() => {
    if (status === "completed" && planId) {
      setTimeout(() => onComplete(planId), 1000);
    }
  }, [status, planId, onComplete]);

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay background */}
      <div className="absolute inset-0 bg-gray-500 opacity-80"></div>

      {/* Modal container */}
      <div
        className="relative flex items-center justify-center min-h-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-desc"
        data-test-id="status-modal"
      >
        <Card className="w-full max-w-md outline-none" tabIndex={-1} ref={modalRef} data-test-id="status-modal-card">
          <CardHeader>
            <CardTitle id="modal-title" className="text-lg font-semibold">
              Generating your travel plan...
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timedOut ? (
              <>
                <div className="text-red-600 text-center mb-4" aria-live="assertive" data-test-id="timeout-message">
                  The generation process timed out.
                  <br />
                  Please try again later or return to the form.
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={handleReturn}
                    data-test-id="timeout-return-button"
                  >
                    Return to form
                  </Button>
                  <Button className="flex-1" onClick={onRetry} data-test-id="timeout-retry-button">
                    Try again
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-full mb-4">
                  <Progress
                    value={progress}
                    max={100}
                    className="h-3"
                    aria-label="Generation progress"
                    data-test-id="generation-progress-bar"
                  />
                  <div className="text-center text-sm mt-1" aria-live="polite" data-test-id="generation-progress-text">
                    {progress}%
                  </div>
                </div>
                <div id="modal-desc" className="sr-only">
                  {status === "processing"
                    ? "Your plan is being generated. Please wait."
                    : status === "failed"
                      ? error || "An error occurred while generating the plan."
                      : "Your plan has been generated."}
                </div>
                {status === "processing" && (
                  <div
                    className="flex items-center gap-2 text-gray-600"
                    aria-live="polite"
                    data-test-id="processing-status"
                  >
                    <span className="animate-spin inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                    <span>Generating plan...</span>
                  </div>
                )}
                {status === "failed" && (
                  <div className="text-red-600 text-center mt-4" aria-live="assertive" data-test-id="failed-status">
                    {error || "An error occurred while generating the plan."}
                    <div className="mt-4">
                      <Button onClick={onRetry} data-test-id="failed-retry-button">
                        Try again
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatusModal;
