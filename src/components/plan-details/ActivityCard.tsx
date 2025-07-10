import React, { useState, useRef, useEffect } from "react";
import type { ActivityResponse } from "@/types";
import InlineEditor from "./InlineEditor";
import { Card, CardHeader, CardContent, CardAction } from "../ui/card";
import { Button } from "../ui/button";

// Simple badge component for status
const Badge: React.FC<{ status: "accepted" | "rejected" }> = ({ status }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold
      ${
        status === "accepted"
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      }
    `}
  >
    {status === "accepted" ? "Accepted" : "Rejected"}
  </span>
);

interface ActivityCardProps {
  activity: ActivityResponse;
  onEdit: (activityId: string, data: { custom_desc?: string | null }) => Promise<void>;
  onAccept: (activityId: string) => void;
  onReject: (activityId: string) => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onEdit, onAccept, onReject }) => {
  // Local state for editing
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(activity.custom_desc ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup debounce and success timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  // Handle start editing
  const handleEditClick = () => {
    setEditValue(activity.custom_desc ?? "");
    setEditing(true);
    setError(null);
    setSuccess(false);
  };

  // Handle cancel editing
  const handleCancel = () => {
    setEditing(false);
    setError(null);
    setSuccess(false);
  };

  // Handle value change with debounce auto-save
  const handleChange = (value: string) => {
    setEditValue(value);
    setError(null);
    setSuccess(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        await onEdit(activity.id, { custom_desc: value });
        setError(null);
        setSuccess(true);
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = setTimeout(() => setSuccess(false), 1500);
      } catch (e: any) {
        setError(e.message || "Failed to save description");
      } finally {
        setLoading(false);
      }
    }, 600); // 600ms debounce
  };

  // Render InlineEditor if editing
  if (editing) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-2">
          <InlineEditor
            value={editValue}
            onChange={handleChange}
            onCancel={handleCancel}
            loading={loading}
            error={error}
          />
          {success && <div className="text-green-600 text-xs mt-1">Description saved!</div>}
        </CardContent>
      </Card>
    );
  }

  // Show badge if accepted or rejected
  const statusBadge =
    activity.accepted === true ? (
      <Badge status="accepted" />
    ) : activity.accepted === false ? (
      <Badge status="rejected" />
    ) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-lg">{activity.attraction.name}</div>
          <div className="text-sm text-gray-500">{activity.attraction.address}</div>
        </div>
        <CardAction className="flex gap-2 items-center">
          {statusBadge}
          {activity.accepted === undefined || activity.accepted === null ? (
            <>
              <Button variant="outline" size="sm" onClick={() => onAccept(activity.id)}>
                Accept
              </Button>
              <Button variant="outline" size="sm" onClick={() => onReject(activity.id)}>
                Reject
              </Button>
              <Button variant="secondary" size="sm" onClick={handleEditClick}>
                Edit
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={handleEditClick}>
              Edit
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 mt-2">
        <div className="text-gray-700 dark:text-gray-200 text-sm">
          {activity.custom_desc || activity.attraction.description}
        </div>
        {activity.opening_hours && <div className="text-xs text-gray-400">Hours: {activity.opening_hours}</div>}
        {activity.cost !== null && <div className="text-xs text-gray-400">Cost: {activity.cost} zł</div>}
      </CardContent>
    </Card>
  );
};

export default ActivityCard;
