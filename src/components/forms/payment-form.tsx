"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentSchema, type PaymentFormData } from "@/schemas/financial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatDateInput } from "@/lib/utils";

interface PaymentFormProps {
  debts: { id: string; amount: number; paidAmount: number; type: string; supplierName?: string; workerName?: string }[];
  accounts: { id: string; name: string; type: string; balance: number }[];
  onSubmit: (data: PaymentFormData) => void;
  isSubmitting?: boolean;
}

const PAYMENT_METHOD_OPTIONS = [
  { value: "CASH", label: "Tiền mặt" },
  { value: "BANK", label: "Ngân hàng" },
  { value: "TRANSFER", label: "Chuyển khoản" },
];

export function PaymentForm({ debts, accounts, onSubmit, isSubmitting = false }: PaymentFormProps) {
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      debtId: "",
      accountId: "",
      amount: 0,
      date: new Date(),
      method: "CASH",
      notes: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tài khoản chi</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tài khoản" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} - {account.balance.toLocaleString("vi-VN")} ₫
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="debtId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Khoản nợ</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khoản nợ" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {debts.map((debt) => {
                      const name = debt.supplierName || debt.workerName || "Không xác định";
                      const typeLabel = debt.type === "PAYABLE" ? "Phải trả" : "Phải thu";
                      const remaining = debt.amount - debt.paidAmount;
                      return (
                        <SelectItem key={debt.id} value={debt.id}>
                          {name} - {typeLabel} (Còn: {remaining.toLocaleString("vi-VN")} ₫)
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số tiền thanh toán</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0.01}
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày thanh toán</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={formatDateInput(field.value)}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phương thức</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phương thức" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú (tùy chọn)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Ghi chú thanh toán..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Thanh toán"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
