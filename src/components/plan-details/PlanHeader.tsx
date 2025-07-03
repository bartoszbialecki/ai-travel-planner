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
            {plan.destination} | {plan.start_date} - {plan.end_date} | {plan.adults_count} dorosłych,{" "}
            {plan.children_count} dzieci
          </div>
          {plan.budget_total && (
            <div className="text-sm mt-1">
              Budżet: {plan.budget_total} {plan.budget_currency}
            </div>
          )}
        </div>
        <CardAction>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" onClick={() => setOpen(true)}>
                Usuń plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeaderUI>
                <DialogTitle>Potwierdź usunięcie planu</DialogTitle>
              </DialogHeaderUI>
              <div className="py-2">Czy na pewno chcesz usunąć ten plan? Tej operacji nie można cofnąć.</div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Anuluj</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleDelete}>
                  Usuń
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
