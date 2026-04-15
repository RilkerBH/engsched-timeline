"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Plus, Minus, RefreshCw, Download, PlusCircle, Milestone, Settings, Save, FolderOpen } from "lucide-react"

type TimelineControlsProps = {
  zoom: number
  setZoom: (zoom: number) => void
  onExport: () => void
  onReset: () => void
  onAddPackage: () => void
  onAddMilestone: () => void
  onEditProject: () => void
  onSaveProject: () => void
  onLoadProject: () => void
}

export function TimelineControls({ zoom, setZoom, onExport, onReset, onAddPackage, onAddMilestone, onEditProject, onSaveProject, onLoadProject }: TimelineControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-b-lg border-t-0 border">
      <div className="flex items-center gap-2">
         <Button onClick={onAddPackage} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Pacote
        </Button>
        <Button onClick={onAddMilestone} size="sm" variant="outline">
          <Milestone className="mr-2 h-4 w-4" />
          Add Marco
        </Button>
      </div>
      <div className="flex items-center gap-4 flex-grow justify-center min-w-[300px]">
        <Button size="icon" variant="ghost" onClick={() => setZoom(Math.max(10, zoom - 10))}>
          <Minus className="h-4 w-4" />
        </Button>
        <Slider
          value={[zoom]}
          onValueChange={(value) => setZoom(value[0])}
          min={10}
          max={300}
          step={10}
          className="w-48"
        />
        <Button size="icon" variant="ghost" onClick={() => setZoom(Math.min(300, zoom + 10))}>
          <Plus className="h-4 w-4" />
        </Button>
        <span className="text-sm font-mono w-12 text-center">{zoom}%</span>
        <Button variant="outline" size="sm" onClick={() => setZoom(100)}>
          Reset Zoom
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
