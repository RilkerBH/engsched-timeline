"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ServicePackageData } from "@/lib/types"
import { useEffect } from "react"
import { Trash2 } from "lucide-react"
import { ColorPicker } from "@/components/color-picker"
import { DEFAULT_COLOR, isValidHex } from "@/lib/colors"


const formSchema = (projectStart: string, projectEnd: string) => z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string(),
  endDate: z.string(),
  color: z.string().refine(isValidHex, "Cor inválida. Use o formato #RRGGBB."),
  height: z.number().min(16).max(80),
  showTextInside: z.boolean(),
  preventNameLineBreak: z.boolean().optional(),
  dateFormat: z.enum(['dd/MM/yyyy', 'MMM/yy']).optional(),
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: "End date must be on or after start date",
  path: ["endDate"],
}).refine(data => new Date(data.startDate) >= new Date(projectStart), {
  message: "Start date must be within project range",
  path: ["startDate"],
}).refine(data => new Date(data.endDate) <= new Date(projectEnd), {
  message: "End date must be within project range",
  path: ["endDate"],
});


type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ServicePackageData) => void
  onDelete?: (id: string) => void
  projectSettings: { startDate: string, endDate: string }
  defaultValues?: ServicePackageData
}

export function ServicePackageForm({ isOpen, onClose, onSubmit, onDelete, projectSettings, defaultValues }: Props) {
  const dynamicSchema = formSchema(projectSettings.startDate, projectSettings.endDate);
  
  const initialFormValues = {
    name: "",
    startDate: projectSettings.startDate,
    endDate: projectSettings.endDate,
    color: DEFAULT_COLOR,
    height: 32,
    showTextInside: false,
    labelOffsetX: 10,
    labelOffsetY: 0,
    dateLabelOffsetX: 10,
    dateLabelOffsetY: 15,
    preventNameLineBreak: false,
    dateFormat: 'dd/MM/yyyy' as const,
  };
  
  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      ...initialFormValues,
      ...(defaultValues || {}),
      dateFormat: defaultValues?.dateFormat || 'dd/MM/yyyy',
    }
  })

  useEffect(() => {
    form.reset({
      ...initialFormValues,
      ...(defaultValues || {}),
       dateFormat: defaultValues?.dateFormat || 'dd/MM/yyyy',
    });
  }, [defaultValues, form, projectSettings.startDate, projectSettings.endDate]);


  const handleSubmit = (data: z.infer<typeof dynamicSchema>) => {
    onSubmit({
      ...defaultValues,
      ...data,
      id: defaultValues?.id || crypto.randomUUID(),
      order: defaultValues?.order || 0,
      // Keep existing offsets if not in form
      labelOffsetX: defaultValues?.labelOffsetX || initialFormValues.labelOffsetX,
      labelOffsetY: defaultValues?.labelOffsetY || initialFormValues.labelOffsetY,
      dateLabelOffsetX: defaultValues?.dateLabelOffsetX || initialFormValues.dateLabelOffsetX,
      dateLabelOffsetY: defaultValues?.dateLabelOffsetY || initialFormValues.dateLabelOffsetY,
    })
    onClose();
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{defaultValues ? "Edit" : "Create"} Service Package</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Name</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preventNameLineBreak"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Disable Name Word Wrap</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} min={projectSettings.startDate} max={projectSettings.endDate} />
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
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} min={projectSettings.startDate} max={projectSettings.endDate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="dateFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                      <SelectItem value="MMM/yy">MMM/yy</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Color</FormLabel>
                    <FormControl>
                      <ColorPicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height ({field.value}px)</FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      min={16}
                      max={80}
                      step={1}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="showTextInside"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Show Name Inside</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
            <DialogFooter className="sm:justify-between pt-4 border-t">
              <div>
                {defaultValues && onDelete && (
                  <Button type="button" variant="destructive" size="icon" onClick={() => { onDelete(defaultValues.id); onClose(); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
