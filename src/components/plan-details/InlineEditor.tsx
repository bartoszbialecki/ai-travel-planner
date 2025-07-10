import React from "react";
import { Button } from "../ui/button";

interface InlineEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string | null;
}

const InlineEditor: React.FC<InlineEditorProps> = ({ value, onChange, onCancel, loading, error }) => {
  return (
    <div className="flex flex-col gap-2">
      <textarea
        className="border rounded-md p-2 min-h-[60px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none resize-vertical"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        placeholder="Enter activity description..."
      />
      {error && <div className="text-red-600 text-xs">{error}</div>}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        {loading && <span className="text-blue-600 text-xs self-center">Saving...</span>}
      </div>
    </div>
  );
};

export default InlineEditor;
