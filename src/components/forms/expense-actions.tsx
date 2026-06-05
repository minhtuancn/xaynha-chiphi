"use client";

import { Button } from "@/components/ui/button";
import { CheckIcon, XIcon, TrashIcon } from "lucide-react";
import { updateExpenseStatus, deleteExpense } from "@/actions/financial";

export function ApproveExpenseButton({ id }: { id: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
      onClick={() => updateExpenseStatus(id, "APPROVED")}
      title="Duyệt"
    >
      <CheckIcon className="h-4 w-4" />
    </Button>
  );
}

export function RejectExpenseButton({ id }: { id: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
      onClick={() => updateExpenseStatus(id, "REJECTED")}
      title="Từ chối"
    >
      <XIcon className="h-4 w-4" />
    </Button>
  );
}

export function DeleteExpenseButton({ id }: { id: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      onClick={() => {
        if (confirm("Bạn có chắc chắn muốn xóa?")) {
          deleteExpense(id);
        }
      }}
      title="Xóa"
    >
      <TrashIcon className="h-4 w-4" />
    </Button>
  );
}
