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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MilestoneData } from "@/lib/types"
import { useEffect } from "react"
import { Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#eab308", "#8b5cf6", "#f97316"];

const formSchema = (projectStart: string, projectEnd: string) => z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string(),
  color: z.string(),
  height: z.number().min(20).max(60),
  preventNameLineBreak: z.boolean().optional(),
  dateFormat: z.enum(['dd/MM/yyyy', 'MMM/yy']).optional(),
}).refine(data => new Date(data.date) >= new Date(projectStart) && new Date(data.date) <= new Date(projectEnd), {
  message: "Date must be within project range",
  path: ["date"],
});

type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MilestoneData) => void
  onDelete?: (id: string) => void
  projectSettings: { startDate: string, endDate: string }
  defaultValues?: MilestoneData
}

export function MilestoneForm({ isOpen, onClose, onSubmit, onDelete, projectSettings, defaultValues }: Props) {
  const dynamicSchema = formSchema(projectSettings.startDate, projectSettings.endDate);

  const initialFormValues = {
    name: "",
    date: projectSettings.startDate,
    color: COLORS[0],
    height: 30,
    labelOffsetX: 0,
    labelOffsetY: -10,
    dateLabelOffsetX: 0,
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
  }, [defaultValues, form, projectSettings.startDate]);

  const handleSubmit = (data: z.infer<typeof dynamicSchema>) => {
    onSubmit({
      ...defaultValues,
      ...data,
      id: defaultValues?.id || crypto.randomUUID(),
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
          <DialogTitle className="font-headline">{defaultValues ? "Edit" : "Create"} Milestone</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Milestone Name</FormLabel>
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} min={projectSettings.startDate} max={projectSettings.endDate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Color</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select a color" />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              {COLORS.map(color => (
                                  <SelectItem key={color} value={color}>
                                      <div className="flex items-center gap-2">
                                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                                          {color}
                                      </div>
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
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height ({field.value}px)</FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      min={20}
                      max={60}
                      step={1}
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
