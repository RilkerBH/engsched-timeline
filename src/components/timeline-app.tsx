"use client"

import { useState, useRef, useMemo, useEffect, useCallback } from "react"
import { DndContext, type DragEndEvent } from "@dnd-kit/core"
import { toPng } from "html-to-image"
import { format } from "date-fns"

import type { ProjectSettings, TaskData, MilestoneData, PeriodData } from "@/domain/types"
import { selectionSize } from "@/domain/bulk"
import { getPositionAndWidth, layoutTaskRows } from "@/domain/layout"
import { useProject } from "@/application/use-project"
import { getProjectStorage } from "@/infrastructure/project-storage"
import { useSelection } from "@/hooks/use-selection"
import { useToast } from "@/hooks/use-toast"
import { ProjectSettingsForm } from "./project-settings-form"
import { ProjectSettingsDialog } from "./project-settings-dialog"
import { TimelineControls } from "./timeline-controls"
import { TimelineHeader } from "./timeline-header"
import { TaskRow } from "./task-row"
import { TaskForm } from "./task-form"
import { MilestoneForm } from "./milestone-form"
import { PeriodForm } from "./period-form"
import { PeriodBand } from "./period-band"
import { SelectionToolbar } from "./selection-toolbar"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog"
import { Skeleton } from "./ui/skeleton"

const ROW_GAP = 20
/** Height of the milestone strip in TimelineHeader (Tailwind h-20). Bands extend up through it. */
const MILESTONE_STRIP_HEIGHT = 80
const projectStorage = getProjectStorage()

export default function TimelineApp() {
  const [isClient, setIsClient] = useState(false)
  const project = useProject()
  const { settings, tasks, milestones, periods } = project
  const { toast } = useToast()

  const [isResetAlertOpen, setIsResetAlertOpen] = useState(false)
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskData | undefined>(undefined)
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<MilestoneData | undefined>(undefined)
  const [isMilestoneFormOpen, setIsMilestoneFormOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<PeriodData | undefined>(undefined)
  const [isPeriodFormOpen, setIsPeriodFormOpen] = useState(false)

  const exportableAreaRef = useRef<HTMLDivElement>(null)
  const rowsRef = useRef<HTMLDivElement>(null)

  const requestBulkDelete = useCallback(() => setIsBulkDeleteAlertOpen(true), [])
  const sel = useSelection(tasks, milestones, requestBulkDelete)
  const { selection, hasSelection } = sel

  useEffect(() => {
    setIsClient(true)
  }, [])

  // ----- Project -----

  const handleProjectSettingsSubmit = (data: Omit<ProjectSettings, "id">) => {
    const isEditing = !!settings
    project.configureProject(data)
    toast({
      title: isEditing ? "Projeto Atualizado!" : "Projeto Criado!",
      description: isEditing ? "As configurações do projeto foram salvas." : "Você pode agora adicionar tarefas e marcos.",
    })
  }

  const handleReset = () => {
    project.resetProject()
    setIsResetAlertOpen(false)
    toast({ title: "Cronograma Resetado", description: "Todos os dados foram apagados." })
  }

  const handleSaveProject = async () => {
    try {
      const saved = await projectStorage.save(project.toProjectFile())
      if (saved) toast({ title: "Projeto Salvo!", description: "Arquivo salvo com sucesso." })
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar o projeto." })
    }
  }

  const handleLoadProject = async () => {
    try {
      const file = await projectStorage.load()
      if (!file) return
      project.loadProject(file)
      toast({ title: "Projeto Carregado!", description: "Todos os dados foram restaurados." })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao Abrir", description: err?.message || "Arquivo de projeto inválido." })
    }
  }

  const handleExport = async () => {
    if (hasSelection) {
      // Drop the selection highlight before capturing the image
      sel.clear()
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    if (!exportableAreaRef.current) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível encontrar o elemento do cronograma para exportar." })
      return
    }
    const title = settings?.title.replace(/\s+/g, "_") || "timeline"
    const date = format(new Date(), "yyyyMMdd_HHmm")
    try {
      const dataUrl = await toPng(exportableAreaRef.current, { pixelRatio: 2, backgroundColor: "#FFFFFF", style: { overflow: "visible" } })
      const link = document.createElement("a")
      link.download = `cronograma-${title}-${date}.png`
      link.href = dataUrl
      link.click()
      toast({ title: "Sucesso!", description: "Cronograma exportado como PNG." })
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível exportar o cronograma." })
    }
  }

  // ----- Items -----

  const handleLabelDragEnd = (event: DragEndEvent) => {
    const data = event.active.data.current as { type?: string; id?: string; intervalId?: string } | undefined
    if (!data?.type || !data.id) return
    const [label, item] = data.type.split("-")
    if ((label !== "name" && label !== "date") || (item !== "task" && item !== "milestone" && item !== "period")) return
    project.dragLabel(item, label, data.id, event.delta, data.intervalId)
  }

  const handleTaskSubmit = (data: TaskData) => {
    const exists = tasks.some(p => p.id === data.id)
    project.saveTask(data)
    toast({ title: exists ? "Tarefa Atualizada" : "Tarefa Criada" })
  }

  const handleDeleteTask = (id: string) => {
    project.deleteTask(id)
    toast({ title: "Tarefa Excluída", variant: "destructive" })
  }

  const handleMilestoneSubmit = (data: MilestoneData) => {
    const exists = milestones.some(m => m.id === data.id)
    project.saveMilestone(data)
    toast({ title: exists ? "Marco Atualizado" : "Marco Criado" })
  }

  const handleDeleteMilestone = (id: string) => {
    project.deleteMilestone(id)
    toast({ title: "Marco Deletado", variant: "destructive" })
  }

  const handlePeriodSubmit = (data: PeriodData) => {
    const exists = periods.some(p => p.id === data.id)
    project.savePeriod(data)
    toast({ title: exists ? "Período Atualizado" : "Período Criado" })
  }

  const handleDeletePeriod = (id: string) => {
    project.deletePeriod(id)
    toast({ title: "Período Excluído", variant: "destructive" })
  }

  const periodBands = useMemo(
    () => settings ? periods.map(p => ({ ...p, ...getPositionAndWidth(p.startDate, p.endDate, settings.startDate, settings.endDate) })) : [],
    [periods, settings]
  )

  /**
   * Double-click on empty space of the timeline: opens the period under the
   * cursor, if any. Tasks, milestones and the period handle stop here via
   * data-keep-selection, so they keep their own double-click behaviour.
   */
  const handleTimelineDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-keep-selection]")) return
    const rows = rowsRef.current
    if (!rows || periodBands.length === 0) return
    const rect = rows.getBoundingClientRect()
    if (e.clientY < rect.top - MILESTONE_STRIP_HEIGHT || e.clientY > rect.bottom) return
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    // Last match wins: it is the one drawn on top
    const hit = [...periodBands].reverse().find(p => xPct >= p.left && xPct <= p.left + p.width)
    if (!hit) return
    setEditingPeriod(hit)
    setIsPeriodFormOpen(true)
  }

  // ----- Bulk actions -----

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-keep-selection]")) return
    if (hasSelection) sel.clear()
  }

  const handleBulkColor = (color: string) => {
    project.patchItems(selection, { color })
    toast({ title: "Cor aplicada", description: `${selectionSize(selection)} item(ns) atualizado(s).` })
  }

  const handleBulkDateFormat = (dateFormat: "dd/MM/yyyy" | "MMM/yy") => {
    project.patchItems(selection, { dateFormat })
    toast({ title: "Formato de data aplicado", description: `${selectionSize(selection)} item(ns) atualizado(s).` })
  }

  const handleBulkShiftDates = (days: number) => {
    const { moved, skipped } = project.shiftDates(selection, days)
    const label = days > 0 ? `atrasado(s) ${days} dia(s)` : `adiantado(s) ${-days} dia(s)`
    if (skipped > 0) {
      toast({
        variant: "destructive",
        title: "Deslocamento parcial",
        description: `${moved} item(ns) ${label}. ${skipped} item(ns) sairia(m) do período do projeto e não foi/foram alterado(s).`,
      })
    } else {
      toast({ title: "Datas deslocadas", description: `${moved} item(ns) ${label}.` })
    }
  }

  const handleBulkResetLabels = () => {
    project.resetLabels(selection)
    toast({ title: "Posições redefinidas", description: `${selectionSize(selection)} item(ns) com textos na posição padrão.` })
  }

  const handleBulkDelete = () => {
    const total = selectionSize(selection)
    project.deleteItems(selection)
    sel.clear()
    setIsBulkDeleteAlertOpen(false)
    toast({ title: "Itens excluídos", description: `${total} item(ns) removido(s).`, variant: "destructive" })
  }

  // ----- Layout -----

  const { rows, height: rowsHeight } = useMemo(
    () => settings ? layoutTaskRows(tasks, settings.startDate, settings.endDate, ROW_GAP) : { rows: [], height: ROW_GAP },
    [tasks, settings]
  )


  if (!isClient) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        <Skeleton className="h-12 w-1/2 rounded-lg" />
        <Skeleton className="h-8 w-1/3 rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    )
  }

  if (!settings) {
    return <ProjectSettingsForm onSubmit={handleProjectSettingsSubmit} onLoadProject={handleLoadProject} />
  }

  return (
    <div className="p-4 md:p-8">
      <div ref={exportableAreaRef} className="w-full overflow-x-auto py-4 bg-white" onClick={handleBackgroundClick}>
        <div className="w-full">
          <DndContext onDragEnd={handleLabelDragEnd}>
            <div className="w-full px-[5%]">
              <header className="mb-4">
                <h1 className="font-headline text-3xl font-bold">{settings.title}</h1>
              </header>
              <div onDoubleClick={handleTimelineDoubleClick}>
              <TimelineHeader
                projectSettings={settings}
                milestones={milestones}
                handleEditMilestone={(milestone) => {
                  setEditingMilestone(milestone)
                  setIsMilestoneFormOpen(true)
                }}
                selectedMilestoneIds={selection.milestones}
                onSelectMilestone={sel.selectMilestone}
              />
              <div ref={rowsRef} className="relative" style={{ height: `${rowsHeight}px` }}>
                {periodBands.map(period => (
                  <PeriodBand
                    key={period.id}
                    period={period}
                    extendUp={MILESTONE_STRIP_HEIGHT}
                    onDoubleClick={() => {
                      setEditingPeriod(period)
                      setIsPeriodFormOpen(true)
                    }}
                  />
                ))}
                {rows.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onDoubleClick={() => {
                      setEditingTask(task)
                      setIsTaskFormOpen(true)
                    }}
                    onOrderChange={(dir) => project.moveTasks([task.id], dir)}
                    selected={selection.tasks.includes(task.id)}
                    onSelect={(e) => sel.selectTask(task.id, e)}
                  />
                ))}
              </div>
              </div>
            </div>
          </DndContext>
        </div>
      </div>

      {hasSelection && (
        <SelectionToolbar
          selection={selection}
          totalTasks={tasks.length}
          totalMilestones={milestones.length}
          onClear={sel.clear}
          onSelectAll={sel.selectAll}
          onColor={handleBulkColor}
          onDateFormat={handleBulkDateFormat}
          onMove={(dir) => project.moveTasks(selection.tasks, dir)}
          onShiftDates={handleBulkShiftDates}
          onShowTextInside={(showTextInside) => project.patchItems(selection, { showTextInside })}
          onPreventLineBreak={(preventNameLineBreak) => project.patchItems(selection, { preventNameLineBreak })}
          onResetLabels={handleBulkResetLabels}
          onDelete={requestBulkDelete}
        />
      )}

      <TimelineControls
        onExport={handleExport}
        onReset={() => setIsResetAlertOpen(true)}
        onAddTask={() => { setEditingTask(undefined); setIsTaskFormOpen(true) }}
        onAddMilestone={() => { setEditingMilestone(undefined); setIsMilestoneFormOpen(true) }}
        onAddPeriod={() => { setEditingPeriod(undefined); setIsPeriodFormOpen(true) }}
        onEditProject={() => setIsSettingsDialogOpen(true)}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
      />

      <ProjectSettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        onSubmit={handleProjectSettingsSubmit}
        defaultValues={settings}
      />

      {isTaskFormOpen && (
        <TaskForm
          isOpen={isTaskFormOpen}
          onClose={() => setIsTaskFormOpen(false)}
          onSubmit={handleTaskSubmit}
          onDelete={handleDeleteTask}
          projectSettings={settings}
          defaultValues={editingTask}
        />
      )}

      {isMilestoneFormOpen && (
        <MilestoneForm
          isOpen={isMilestoneFormOpen}
          onClose={() => setIsMilestoneFormOpen(false)}
          onSubmit={handleMilestoneSubmit}
          onDelete={handleDeleteMilestone}
          projectSettings={settings}
          defaultValues={editingMilestone}
        />
      )}

      {isPeriodFormOpen && (
        <PeriodForm
          isOpen={isPeriodFormOpen}
          onClose={() => setIsPeriodFormOpen(false)}
          onSubmit={handlePeriodSubmit}
          onDelete={handleDeletePeriod}
          projectSettings={settings}
          defaultValues={editingPeriod}
        />
      )}

      <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir itens selecionados?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectionSize(selection)} item(ns) será(ão) removido(s) do cronograma. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isResetAlertOpen} onOpenChange={setIsResetAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente todos os dados do cronograma do seu armazenamento local.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
