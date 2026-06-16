"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Columns3, Download, Eye, EyeOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptySearchState } from "./empty-state";

interface FilterConfig {
  column: string;
  placeholder: string;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchColumn?: string;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  exportFilename?: string;
  pageSize?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = "Tìm kiếm...",
  filters,
  exportFilename,
  pageSize = 10,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    initialState: { pagination: { pageSize } },
  });

  const hasFilter = searchColumn || (filters && filters.length > 0);
  const selectedCount = Object.keys(rowSelection).length;
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  const escapeCSV = (val: unknown): string => {
    const s = String(val ?? "");
    return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const exportCSV = () => {
    const headers = columns.map((c) => (c as any).accessorKey || (c as any).id).filter(Boolean);
    const rows = data.map((row: any) => headers.map((h: string) => escapeCSV(row[h])).join(","));
    const csv = [headers.map(escapeCSV).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;",});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename || "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 py-4 flex-wrap">
        {hasFilter && (
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            {searchColumn && (
              <Input
                placeholder={searchPlaceholder}
                value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn(searchColumn)?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
            )}
            {filters?.map((filter) => (
              <Input
                key={filter.column}
                placeholder={filter.placeholder}
                value={(table.getColumn(filter.column)?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn(filter.column)?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {exportFilename && (
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" />
              Xuất CSV
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="h-4 w-4 mr-1" />
                Cột
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table.getAllColumns().filter((c) => c.getCanHide()).map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(v) => column.toggleVisibility(!!v)}
                >
                  {column.columnDef.header as string || column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} aria-sort={
                      header.column.getIsSorted() === "asc" ? "ascending" :
                      header.column.getIsSorted() === "desc" ? "descending" : undefined
                    }>
                      {header.isPlaceholder ? null : (
                        <div
                          className={header.column.getCanSort() ? "cursor-pointer select-none flex items-center gap-1 hover:text-foreground transition-colors" : ""}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <ChevronUp className="h-4 w-4" />,
                            desc: <ChevronDown className="h-4 w-4" />,
                          }[header.column.getIsSorted() as string] ??
                            (header.column.getCanSort() ? <ChevronsUpDown className="h-4 w-4 opacity-30" /> : null)}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="group cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48">
                    <EmptySearchState query={(table.getColumn(searchColumn ?? "")?.getFilterValue() as string) ?? undefined} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4 py-4">
        <div className="text-sm text-muted-foreground">
          {selectedCount > 0 ? (
            <span>{selectedCount} / {totalRows} đã chọn</span>
          ) : (
            <span>Tổng: {totalRows} dòng</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Trang {pageIndex + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
