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
import type { ServicePackageData } from "@/domain/types"
import { useEffect } from "react"
import { RotateCcw, Trash2 } from "lucide-react"
import { ColorPicker } from "@/components/color-picker"
import { DEFAULT_COLOR, isValidHex } from "@/domain/colors"
import { ZERO_OFFSETS } from "@/domain/label-layout"


const formSchema = (projectStart: string, projectEnd: string) => z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  startDate: z.string(),
  endDate: z.string(),
  color: z.string().refine(isValidHex, "Cor inválida. Use o formato #RRGGBB."),
  height: z.number().min(16).max(80),
  showTextInside: z.boolean(),
  preventNameLineBreak: z.boolean().optional(),
  dateFormat: z.enum(['dd/MM/yyyy', 'MMM/yy']).optional(),
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: "A data final deve ser igual ou posterior à data de início",
  path: ["endDate"],
}).refine(data => new Date(data.startDate) >= new Date(projectStart), {
  message: "A data de início deve estar dentro do período do projeto",
  path: ["startDate"],
}).refine(data => new Date(data.endDate) <= new Date(projectEnd), {
  message: "A data final deve estar dentro do período do projeto",
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
    }
  })

  useEffect(() => {
    form.reset({
      ...initialFormValues,
      ...(defaultValues || {}),
       dateFormat: defaultValues?.dateFormat || 'dd/MM/yyyy',
    });
  }, [defaultValues, form, projectSettings.startDate, projectSettings.endDate]);


  const handleSubmit = (data: z.infer<typeof dynamicSchema>, resetOffsets = false) => {
    onSubmit({
      ...defaultValues,
      ...data,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{defaultValues ? "Editar" : "Novo"} Pacote de Serviço</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => handleSubmit(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Pacote</FormLabel>
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
