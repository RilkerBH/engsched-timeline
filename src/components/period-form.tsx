"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type * as z from "zod"
import { Trash2 } from "lucide-react"
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
import { Slider } from "@/components/ui/slider"
import { ColorPicker } from "@/components/color-picker"
import type { PeriodData } from "@/domain/types"
import { DEFAULT_PERIOD_COLOR, DEFAULT_PERIOD_OPACITY, hexToRgba } from "@/domain/colors"
import { PERIOD_OPACITY, periodSchema } from "@/domain/validation"

type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PeriodData) => void
  onDelete?: (id: string) => void
  projectSettings: { startDate: string, endDate: string }
  defaultValues?: PeriodData
}

export function PeriodForm({ isOpen, onClose, onSubmit, onDelete, projectSettings, defaultValues }: Props) {
  const dynamicSchema = periodSchema(projectSettings)

  const initialFormValues = {
    name: "",
    startDate: projectSettings.startDate,
    endDate: projectSettings.endDate,
    color: DEFAULT_PERIOD_COLOR,
    opacity: DEFAULT_PERIOD_OPACITY,
  }

  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: { ...initialFormValues, ...(defaultValues || {}) },
  })

  useEffect(() => {
    form.reset({ ...initialFormValues, ...(defaultValues || {}) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues, form, projectSettings.startDate, projectSettings.endDate])

  const handleSubmit = (data: z.infer<typeof dynamicSchema>) => {
    onSubmit({ ...defaultValues, ...data, id: defaultValues?.id || crypto.randomUUID() })
    onClose()
  }

  const previewColor = form.watch("color")
  const previewOpacity = form.watch("opacity")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{defaultValues ? "Editar" : "Novo"} Período</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Período (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="ex.: Período chuvoso" {...field} />
                  </FormControl>
                  <FormMessage />
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
              name="opacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transparência ({field.value}% de opacidade)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        min={PERIOD_OPACITY.min}
                        max={PERIOD_OPACITY.max}
                        step={1}
                        className="flex-1"
                      />
                      <div
                        aria-hidden
                        className="h-8 w-12 shrink-0 rounded border border-black/15"
                        style={{ backgroundColor: hexToRgba(previewColor, previewOpacity) }}
                      />
                    </div>
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
