"use client";

import { useState, useCallback } from "react";
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

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  variant?: "default" | "destructive";
}

export function useConfirm() {
  const [state, setState] = useState<{
    resolve: (v: boolean) => void;
    options: ConfirmOptions;
  } | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions | string = {}) => {
      const opts: ConfirmOptions =
        typeof options === "string" ? { title: options } : options;
      return new Promise<boolean>((resolve) => {
        setState({ resolve, options: opts });
      });
    },
    []
  );

  const dialog = state ? (
    <AlertDialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          state.resolve(false);
          setState(null);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {state.options.title || "Xác nhận"}
          </AlertDialogTitle>
          {state.options.description && (
            <AlertDialogDescription>
              {state.options.description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            className={
              state.options.variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
            onClick={() => {
              state.resolve(true);
              setState(null);
            }}
          >
            {state.options.confirmText || "Xác nhận"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;

  return { confirm, dialog };
}
