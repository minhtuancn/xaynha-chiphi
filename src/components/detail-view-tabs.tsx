"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ReactNode, Suspense, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DetailViewTabsProps {
  viewTab: ReactNode;
  editTab?: ReactNode;
  logsTab?: ReactNode;
  expensesTab?: ReactNode;
  photosTab?: ReactNode;
  viewLabel?: string;
  editLabel?: string;
  logsLabel?: string;
  expensesLabel?: string;
  photosLabel?: string;
  defaultTab?: "view" | "edit" | "logs" | "expenses" | "photos";
}

function DetailViewTabsInner({
  viewTab,
  editTab,
  logsTab,
  expensesTab,
  photosTab,
  viewLabel = "Chi tiết",
  editLabel = "Chỉnh sửa",
  logsLabel = "Nhật ký",
  expensesLabel = "Chi phí",
  photosLabel = "Hình ảnh",
  defaultTab = "view",
}: DetailViewTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = searchParams.get("tab") || defaultTab;

  const onTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return (
    <Tabs value={currentTab} onValueChange={onTabChange}>
      <TabsList>
        <TabsTrigger value="view">{viewLabel}</TabsTrigger>
        {logsTab && <TabsTrigger value="logs">{logsLabel}</TabsTrigger>}
        {expensesTab && <TabsTrigger value="expenses">{expensesLabel}</TabsTrigger>}
        {photosTab && <TabsTrigger value="photos">{photosLabel}</TabsTrigger>}
        {editTab && <TabsTrigger value="edit">{editLabel}</TabsTrigger>}
      </TabsList>
      <TabsContent value="view" className="mt-6">{viewTab}</TabsContent>
      {logsTab && <TabsContent value="logs" className="mt-6">{logsTab}</TabsContent>}
      {expensesTab && <TabsContent value="expenses" className="mt-6">{expensesTab}</TabsContent>}
      {photosTab && <TabsContent value="photos" className="mt-6">{photosTab}</TabsContent>}
      {editTab && <TabsContent value="edit" className="mt-6">{editTab}</TabsContent>}
    </Tabs>
  );
}

export function DetailViewTabs(props: DetailViewTabsProps) {
  return (
    <Suspense fallback={<div className="h-20" />}>
      <DetailViewTabsInner {...props} />
    </Suspense>
  );
}
