"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUserSettings } from "@/hooks/use-user-settings";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

type Project = { id: string; name: string; status: string };

export function ProjectSelector() {
  const { selectedProjectId, setSelectedProject } = useUserSettings();
  const [open, setOpen] = useState(false);

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const { getProjects } = await import("@/actions/projects");
      return getProjects();
    },
  });

  const selected = useMemo(
    () => projects?.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[220px] justify-between gap-2 border-dashed"
        >
          <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {selected ? selected.name : "Tất cả dự án"}
          </span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0">
        <Command>
          <CommandInput placeholder="Tìm dự án..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy dự án.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__all__"
                onSelect={() => {
                  setSelectedProject(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !selectedProjectId ? "opacity-100" : "opacity-0"
                  )}
                />
                <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
                Tất cả dự án
              </CommandItem>
              {projects?.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.id}
                  onSelect={() => {
                    setSelectedProject(p.id === selectedProjectId ? null : p.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProjectId === p.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span
                    className={cn(
                      "ml-2 h-1.5 w-1.5 rounded-full",
                      p.status === "ACTIVE"
                        ? "bg-emerald-500"
                        : p.status === "COMPLETED"
                          ? "bg-blue-500"
                          : p.status === "PAUSED"
                            ? "bg-amber-500"
                            : "bg-slate-400"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
