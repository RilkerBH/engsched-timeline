"use client"

import { useForm } from "react-hook-form"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MilestoneData, MilestoneShape } from "@/domain/types"
import { useEffect } from "react"
import { RotateCcw, Trash2 } from "lucide-react"
import { ColorPicker } from "@/components/color-picker"
import { DEFAULT_COLOR } from "@/domain/colors"
import { MILESTONE_HEIGHT, MILESTONE_SHAPES, MILESTONE_STEM_HEIGHT, milestoneSchema } from "@/domain/validation"
import { DEFAULT_MILESTONE_SHAPE, MILESTONE_SHAPE_LABELS, getMilestoneShapeGeometry } from "@/domain/milestone-shape"
import { cn } from "@/lib/utils"
import { MilestoneShapeElement } from "@/components/milestone-marker"
import { ZERO_OFFSETS } from "@/domain/label-layout"
import { Switch } from "@/components/ui/switch"



type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MilestoneData) => void
  onDelete?: (id: string) => void
  projectSettings: { startDate: string, endDate: string }
  defaultValues?: MilestoneData
}

export function MilestoneForm({ isOpen, onClose, onSubmit, onDelete, projectSettings, defaultValues }: Props) {
  const dynamicSchema = milestoneSchema(projectSettings);

  const initialFormValues = {
    name: "",
    date: projectSettings.startDate,
    color: DEFAULT_COLOR,
    height: 30,
    shape: DEFAULT_MILESTONE_SHAPE,
    stemHeight: 0,
    stemColor: "",
    ...ZERO_OFFSETS,
    preventNameLineBreak: false,
    dateFormat: 'dd/MM/yyyy' as const,
  };

  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      ...initialFormValues,
      ...(defaultValues || {}),
      dateFormat: defaultValues?.dateFormat || 'dd/MM/yyyy',
      shape: defaultValues?.shape || DEFAULT_MILESTONE_SHAPE,
      stemHeight: defaultValues?.stemHeight ?? 0,
      stemColor: defaultValues?.stemColor ?? "",
    }
  })
  
  useEffect(() => {
    form.reset({
      ...initialFormValues,
      ...(defaultValues || {}),
      dateFormat: defaultValues?.dateFormat || 'dd/MM/yyyy',
      shape: defaultValues?.shape || DEFAULT_MILESTONE_SHAPE,
      stemHeight: defaultValues?.stemHeight ?? 0,
      stemColor: defaultValues?.stemColor ?? "",
    });
  }, [defaultValues, form, projectSettings.startDate]);

  const handleSubmit = (data: z.infer<typeof dynamicSchema>, resetOffsets = false) => {
    onSubmit({
      ...defaultValues,
      ...data,
      stemColor: data.stemColor || undefined,
      id: defaultValues?.id || crypto.randomUUID(),
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
          <DialogTitle className="font-headline">{defaultValues ? "Editar" : "Novo"} Marco</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => handleSubmit(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Marco</FormLabel>
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
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
            </div>
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
                  <FormLabel>Tamanho do símbolo ({field.value}px)</FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      min={MILESTONE_HEIGHT.min}
                      max={MILESTONE_HEIGHT.max}
                      step={1}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shape"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formato</FormLabel>
                  <div className="grid grid-cols-7 gap-1" role="radiogroup" aria-label="Formato do marco">
                    {MILESTONE_SHAPES.map(shape => (
                      <ShapeOption
                        key={shape}
                        shape={shape}
                        color={form.watch("color")}
                        selected={(field.value ?? DEFAULT_MILESTONE_SHAPE) === shape}
                        onSelect={() => field.onChange(shape)}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stemHeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Altura da linha vertical ({field.value ?? 0}px{(field.value ?? 0) === 0 ? " — sem linha" : ""})</FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value ?? 0]}
                      onValueChange={(value) => field.onChange(value[0])}
                      min={MILESTONE_STEM_HEIGHT.min}
                      max={MILESTONE_STEM_HEIGHT.max}
                      step={2}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {(form.watch("stemHeight") ?? 0) > 0 && (
              <FormField
                control={form.control}
                name="stemColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor da linha</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <ColorPicker value={field.value ?? ""} onChange={field.onChange} placeholder="Mesma cor do marco" className="flex-1" />
                      </FormControl>
                      {field.value && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => field.onChange("")}>
                          Usar cor do marco
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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

function ShapeOption({ shape, color, selected, onSelect }: { shape: MilestoneShape; color: string; selected: boolean; onSelect: () => void }) {
  const g = getMilestoneShapeGeometry(shape, 18)
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      title={MILESTONE_SHAPE_LABELS[shape]}
      aria-label={MILESTONE_SHAPE_LABELS[shape]}
      onClick={onSelect}
      className={cn(
        "flex h-10 items-center justify-center rounded-md border transition-colors hover:bg-accent",
        selected && "border-primary ring-2 ring-primary/40"
      )}
    >
      <svg width={g.width} height={g.height} viewBox={`0 0 ${g.width} ${g.height}`} style={{ overflow: "visible" }}>
        <MilestoneShapeElement geometry={g} fill={color} />
      </svg>
    </button>
  )
}
