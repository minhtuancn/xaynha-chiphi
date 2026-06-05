"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, XIcon, TrashIcon } from "lucide-react";
import { updateExpenseStatus, deleteExpense } from "@/actions/financial";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setOpen(false);
    try {
      await deleteExpense(id);
      toast({ title: "Đã xóa chi phí" });
    } catch {
      toast({ title: "Xóa thất bại", variant: "destructive" });
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
        title="Xóa"
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa chi phí này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
