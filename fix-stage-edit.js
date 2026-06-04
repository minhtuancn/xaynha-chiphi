const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/(dashboard)/stages/[id]/page-client.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Imports to add
const tabsImport = 'import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";\n';
const stageFormImport = 'import { stageSchema, type StageFormData } from "@/schemas/stage";\n';

if (!content.includes('TabsContent')) {
  content = content.replace(
    'import { StatusBadge }',
    tabsImport + 'import { StatusBadge }'
  );
}

if (!content.includes('stageSchema')) {
  content = content.replace(
    'import { taskSchema, type TaskFormData } from "@/schemas/stage";',
    'import { taskSchema, type TaskFormData, stageSchema, type StageFormData } from "@/schemas/stage";'
  );
}

// Stage Edit Form component
const stageEditForm = `
function StageEditForm({
  stage,
  onSubmit,
  isSubmitting,
}: {
  stage: ConstructionStage & { project: { id: string; name: string } };
  onSubmit: (data: StageFormData) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<StageFormData>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      name: stage.name,
      status: stage.status,
      startDate: stage.startDate || undefined,
      endDate: stage.endDate || undefined,
      progress: stage.progress,
      estimatedBudget: Number(stage.estimatedBudget),
      notes: stage.notes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
               <FormItem>
                 <FormLabel>Tên giai đoạn</FormLabel>
                 <FormControl>
                   <Input {...field} placeholder="Nhập tên giai đoạn" />
                 </FormControl>
                 <FormMessage />
               </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
               <FormItem>
                 <FormLabel>Trạng thái</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                   <FormControl>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                   </FormControl>
                   <SelectContent>
                     {Object.entries(STAGE_STATUS_LABELS).map(([value, label]) => (
                       <SelectItem key={value} value={value}>
                         {label}
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
             name="startDate"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Ngày bắt đầu</FormLabel>
                 <FormControl>
                   <Input
                     type="date"
                     {...field}
                     value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                   />
                 </FormControl>
                 <FormMessage />
               </FormItem>
             )}
           />
           <FormField
             control={form.control}
             name="endDate"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Ngày kết thúc</FormLabel>
                 <FormControl>
                   <Input
                     type="date"
                     {...field}
                     value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                   />
                 </FormControl>
                 <FormMessage />
               </FormItem>
             )}
           />
           <FormField
             control={form.control}
             name="progress"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Tiến độ (%)</FormLabel>
                 <FormControl>
                   <Input
                     type="number"
                     min={0}
                     max={100}
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
             name="estimatedBudget"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Ngân sách ước tính</FormLabel>
                 <FormControl>
                   <Input
                     type="number"
                     min={0}
                     {...field}
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
                <Textarea {...field} value={field.value ?? ""} placeholder="Ghi chú" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Form>
  );
}
`;

if (!content.includes('StageEditForm')) {
  content = content.replace(
    'export default function StageDetailPage',
    stageEditForm + '\nexport default function StageDetailPage'
  );
}

const handleUpdateStage = `
  async function handleUpdateStageForm(data: StageFormData) {
    setIsSubmitting(true);
    try {
      await updateStage(stage.id, data);
      router.refresh();
      alert("Cập nhật thành công!");
    } catch (e) {
      alert("Lỗi cập nhật!");
    } finally {
      setIsSubmitting(false);
    }
  }
`;

if (!content.includes('handleUpdateStageForm')) {
  content = content.replace(
    'return (',
    handleUpdateStage + '\n  return ('
  );
}

const mainContentMatch = content.match(/<div className="space-y-6">([\s\S]+?)<\/div>\s*$/);
if (mainContentMatch) {
  let mainContent = mainContentMatch[1];
  
  // Extract header part
  const headerMatch = mainContent.match(/(<div className="flex items-center gap-4">[\s\S]+?<\/div>)\s*<Card>/);
  const header = headerMatch ? headerMatch[1] : '';
  
  // Extract content part (after header)
  const afterHeaderMatch = mainContent.match(/<\/div>\s*(<Card>[\s\S]+)$/);
  const afterHeader = afterHeaderMatch ? afterHeaderMatch[1] : '';
  
  const wrappedContent = `
    <div className="space-y-6">
      ${header}

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Chi tiết</TabsTrigger>
          <TabsTrigger value="edit">Sửa</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-6">
          ${afterHeader}
        </TabsContent>
        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Chỉnh sửa giai đoạn</CardTitle>
            </CardHeader>
            <CardContent>
              <StageEditForm stage={stage} onSubmit={handleUpdateStageForm} isSubmitting={isSubmitting} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  `;
  
  content = content.replace(
    /<div className="space-y-6">([\s\S]+?)<\/div>\s*;?\s*\}\s*$/, 
    wrappedContent + '\n  );\n}'
  );
}

fs.writeFileSync(filePath, content);
