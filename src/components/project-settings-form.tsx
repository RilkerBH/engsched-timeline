"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderOpen } from "lucide-react"
import type { ProjectSettings } from "@/lib/types"

const formSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
  startDate: z.string().min(1, "A data de início é obrigatória"),
  endDate: z.string().min(1, "A data final é obrigatória"),
}).refine(data => new Date(data.startDate) < new Date(data.endDate), {
  message: "A data final deve ser posterior à data de início",
  path: ["endDate"],
});

type ProjectSettingsFormProps = {
  onSubmit: (data: Omit<ProjectSettings, 'id'>) => void;
  onLoadProject?: () => void;
}

export function ProjectSettingsForm({ onSubmit, onLoadProject }: ProjectSettingsFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "Novo Projeto de Engenharia",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
    },
  })

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Novo Projeto</CardTitle>
          <CardDescription>Configure o período do seu cronograma de engenharia.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Projeto</FormLabel>
                    <FormControl>
                      <Input placeholder="ex.: Obra Residencial Alfa" {...field} />
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
                        <Input type="date" {...field} />
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
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full">Criar Projeto</Button>
            </form>
          </Form>
        </CardContent>
        {onLoadProject && (
          <CardFooter className="flex flex-col gap-3 border-t pt-4">
            <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>ou</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={onLoadProject}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Abrir projeto existente (.engsched)
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
