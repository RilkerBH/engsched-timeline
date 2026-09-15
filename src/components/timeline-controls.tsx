"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, Download, PlusCircle, Milestone, Settings, Save, FolderOpen, RectangleVertical } from "lucide-react"

type TimelineControlsProps = {
  onExport: () => void
  onReset: () => void
  onAddTask: () => void
  onAddMilestone: () => void
  onAddPeriod: () => void
  onEditProject: () => void
  onSaveProject: () => void
  onLoadProject: () => void
}

export function TimelineControls({ onExport, onReset, onAddTask, onAddMilestone, onAddPeriod, onEditProject, onSaveProject, onLoadProject }: TimelineControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-b-lg border-t-0 border">
      <div className="flex items-center gap-2">
         <Button onClick={onAddTask} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Tarefa
        </Button>
        <Button onClick={onAddMilestone} size="sm" variant="outline">
          <Milestone className="mr-2 h-4 w-4" />
          Novo Marco
        </Button>
        <Button onClick={onAddPeriod} size="sm" variant="outline">
          <RectangleVertical className="mr-2 h-4 w-4" />
          Novo Período
        </Button>
      </div>
      <div className="flex items-center gap-2">
         <Button variant="outline" size="sm" onClick={onSaveProject}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Projeto
        </Button>
        <Button variant="outline" size="sm" onClick={onLoadProject}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Abrir Projeto
        </Button>
         <Button variant="outline" size="sm" onClick={onEditProject}>
          <Settings className="mr-2 h-4 w-4" />
          Editar Projeto
        </Button>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar PNG
        </Button>
        <Button variant="destructive" size="sm" onClick={onReset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Resetar Tudo
        </Button>
      </div>
    </div>
  )
}
