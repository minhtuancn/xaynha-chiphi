"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { workerSchema, type WorkerFormData } from "@/schemas/worker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface WorkerFormProps {
  defaultValues?: Partial<WorkerFormData>;
  onSubmit: (data: WorkerFormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function WorkerForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Lưu",
}: WorkerFormProps) {
  const form = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      phone: defaultValues?.phone ?? "",
      idCard: defaultValues?.idCard ?? "",
      skill: defaultValues?.skill ?? "",
      taxCode: defaultValues?.taxCode ?? "",
      bankName: defaultValues?.bankName ?? "",
      bankAccountNumber: defaultValues?.bankAccountNumber ?? "",
      bankAccountHolder: defaultValues?.bankAccountHolder ?? "",
      bankBranch: defaultValues?.bankBranch ?? "",
      dailyWage: defaultValues?.dailyWage ?? 0,
      notes: defaultValues?.notes ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên công nhân</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nhập tên công nhân" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số điện thoại</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nhập số điện thoại" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="idCard"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số CCCD/CMND</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nhập số CCCD/CMND" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="skill"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tay nghề</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nhập tay nghề" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="taxCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mã số thuế</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nhập mã số thuế (nếu có)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngân hàng</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nhập ngân hàng" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankAccountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số tài khoản</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nhập số tài khoản" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankAccountHolder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chủ tài khoản</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nhập tên chủ tài khoản" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankBranch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chi nhánh ngân hàng</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nhập chi nhánh ngân hàng" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dailyWage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lương ngày</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    placeholder="Nhập lương ngày"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghi chú</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Nhập ghi chú (tùy chọn)"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
