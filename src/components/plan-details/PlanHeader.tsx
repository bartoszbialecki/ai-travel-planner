import React, { useState } from "react";
import type { PlanDetailResponse } from "@/types";
import { Card, CardHeader, CardAction } from "../ui/card";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader as DialogHeaderUI,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";

interface PlanHeaderProps {
  plan: PlanDetailResponse;
  onDelete: () => void;
}

const PlanHeader: React.FC<PlanHeaderProps> = ({ plan, onDelete }) => {
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    setOpen(false);
    onDelete();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-bold mb-1">{plan.name}</div>
          <div className="text-gray-600 dark:text-gray-300 text-sm">
            {plan.destination} | {plan.start_date} - {plan.end_date} | {plan.adults_count} adults, {plan.children_count}{" "}
            children
          </div>
          {plan.budget_total && (
            <div className="text-sm mt-1">
              Budget: {plan.budget_total} {plan.budget_currency}
            </div>
          )}
        </div>
        <CardAction>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" onClick={() => setOpen(true)}>
                Delete plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeaderUI>
                <DialogTitle>Confirm plan deletion</DialogTitle>
              </DialogHeaderUI>
              <div className="py-2">Are you sure you want to delete this plan? This action cannot be undone.</div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardAction>
      </CardHeader>
    </Card>
  );
};

export default PlanHeader;
