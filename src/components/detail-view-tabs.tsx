"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ReactNode, Suspense, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DetailViewTabsProps {
  viewTab: ReactNode;
  editTab: ReactNode;
  viewLabel?: string;
  editLabel?: string;
  defaultTab?: "view" | "edit";
}

function DetailViewTabsInner({
  viewTab,
  editTab,
  viewLabel = "Chi tiết",
  editLabel = "Chỉnh sửa",
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
        <TabsTrigger value="edit">{editLabel}</TabsTrigger>
      </TabsList>
      <TabsContent value="view" className="mt-6">{viewTab}</TabsContent>
      <TabsContent value="edit" className="mt-6">{editTab}</TabsContent>
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
