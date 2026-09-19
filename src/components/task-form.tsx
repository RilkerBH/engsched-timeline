"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type * as z from "zod"
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
import type { TaskData } from "@/domain/types"
import { useEffect } from "react"
import { Plus, RotateCcw, Trash2 } from "lucide-react"
import { ColorPicker } from "@/components/color-picker"
import { DEFAULT_COLOR } from "@/domain/colors"
import { TASK_HEIGHT, taskSchema } from "@/domain/validation"
import { ZERO_OFFSETS } from "@/domain/label-layout"




type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TaskData) => void
  onDelete?: (id: string) => void
  projectSettings: { startDate: string, endDate: string }
  defaultValues?: TaskData
}

/**
 * Splits a task's persisted `intervals` into the primary range (shown in the
 * main start/end fields) and the extra ones (shown as additional rows),
 * sorted by startDate. A task with no (or a single) interval falls back to
 * its own startDate/endDate as the primary range.
 */
function splitIntervals(defaultValues: TaskData | undefined, projectSettings: { startDate: string, endDate: string }) {
  const sorted = defaultValues?.intervals && defaultValues.intervals.length > 1
    ? [...defaultValues.intervals].sort((a, b) => a.startDate.localeCompare(b.startDate))
    : undefined;
  const primary = sorted?.[0] ?? {
    id: crypto.randomUUID(),
    startDate: defaultValues?.startDate ?? projectSettings.startDate,
    endDate: defaultValues?.endDate ?? projectSettings.endDate,
  };
  const extraIntervals = sorted?.slice(1) ?? [];
  return { primary, extraIntervals };
}

export function TaskForm({ isOpen, onClose, onSubmit, onDelete, projectSettings, defaultValues }: Props) {
  const dynamicSchema = taskSchema(projectSettings);
  const { primary, extraIntervals } = splitIntervals(defaultValues, projectSettings);

  const initialFormValues = {
    name: "",
    startDate: projectSettings.startDate,
    endDate: projectSettings.endDate,
    extraIntervals: [] as { id: string; startDate: string; endDate: string }[],
    color: DEFAULT_COLOR,
    height: 32,
    showTextInside: false,
    ...ZERO_OFFSETS,
    preventNameLineBreak: false,
    dateFormat: 'dd/MM/yyyy' as const,
  };

  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      ...initialFormValues,
      ...(defaultValues || {}),
      startDate: primary.startDate,
      endDate: primary.endDate,
      extraIntervals,
      dateFormat: defaultValues?.dateFormat || 'dd/MM/yyyy',
    }
  })

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "extraIntervals", keyName: "rowKey" });

  useEffect(() => {
    const { primary, extraIntervals } = splitIntervals(defaultValues, projectSettings);
    form.reset({
      ...initialFormValues,
      ...(defaultValues || {}),
      startDate: primary.startDate,
      endDate: primary.endDate,
      extraIntervals,
      dateFormat: defaultValues?.dateFormat || 'dd/MM/yyyy',
    });
    replace(extraIntervals);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues, form, projectSettings.startDate, projectSettings.endDate]);


  const handleSubmit = (data: z.infer<typeof dynamicSchema>, resetOffsets = false) => {
    const { extraIntervals: extras, ...taskFields } = data;
    const allRanges = [
      { id: primary.id, startDate: taskFields.startDate, endDate: taskFields.endDate },
      ...(extras ?? []),
    ].sort((a, b) => a.startDate.localeCompare(b.startDate));

    const intervals = allRanges.length > 1 ? allRanges : undefined;
    const startDate = allRanges[0].startDate;
    const endDate = allRanges.reduce((max, r) => (r.endDate > max ? r.endDate : max), allRanges[0].endDate);

    onSubmit({
      ...defaultValues,
      ...taskFields,
      startDate,
      endDate,
      intervals,
      id: defaultValues?.id || crypto.randomUUID(),
      order: defaultValues?.order || 0,
      // Keep manual label position adjustments (or reset them when requested)
      labelOffsetX: resetOffsets ? 0 : (defaultValues?.labelOffsetX ?? 0),
      labelOffsetY: resetOffsets ? 0 : (defaultValues?.labelOffsetY ?? 0),
      dateLabelOffsetX: resetOffsets ? 0 : (defaultValues?.dateLabelOffsetX ?? 0),
      dateLabelOffsetY: resetOffsets ? 0 : (defaultValues?.dateLabelOffsetY ?? 0),
    })
    onClose();
  }

  const hasCustomOffsets = !!defaultValues && (
    (defaultValues.labelOffsetX || 0) !== 0 || (defaultValues.labelOffsetY || 0) !== 0 ||
    (defaultValues.dateLabelOffsetX || 0) !== 0 || (defaultValues.dateLabelOffsetY || 0) !== 0
  );
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">{defaultValues ? "Editar" : "Nova"} Tarefa</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => handleSubmit(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Tarefa</FormLabel>
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
                    <FormLabel>Impedir quebra de linha no nome</FormLabel>
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
                    <FormLabel>Data de Início</FormLabel>
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
                    <FormLabel>Data Final</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} min={projectSettings.startDate} max={projectSettings.endDate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {fields.map((field, index) => (
              <div key={field.rowKey} className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`extraIntervals.${index}.startDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início do intervalo {index + 2}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} min={projectSettings.startDate} max={projectSettings.endDate} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 items-start">
                  <FormField
                    control={form.control}
                    name={`extraIntervals.${index}.endDate`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Fim do intervalo {index + 2}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} min={projectSettings.startDate} max={projectSettings.endDate} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" className="mt-8" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ id: crypto.randomUUID(), startDate: projectSettings.startDate, endDate: projectSettings.endDate })}
            >
              <Plus className="mr-1 h-4 w-4" />
              Adicionar intervalo
            </Button>
            <FormField
              control={form.control}
              name="dateFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formato da Data</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um formato" />
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
                        <FormLabel>Cor</FormLabel>
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
                  <FormLabel>Altura ({field.value}px)</FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      min={TASK_HEIGHT.min}
                      max={TASK_HEIGHT.max}
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
                      <FormLabel>Mostrar nome dentro da barra</FormLabel>
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
              <div className="flex items-center gap-2">
                {defaultValues && onDelete && (
                  <Button type="button" variant="destructive" size="icon" onClick={() => { onDelete(defaultValues.id); onClose(); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {hasCustomOffsets && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Volta nome e data para a posição padrão"
                    onClick={form.handleSubmit((data) => handleSubmit(data, true))}
                  >
                    <RotateCcw className="mr-1 h-4 w-4" />
                    Redefinir textos
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Salvar</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
