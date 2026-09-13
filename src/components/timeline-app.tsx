"use client"

import { useState, useRef, useMemo, useEffect, useCallback } from "react"
import { DndContext, type DragEndEvent } from "@dnd-kit/core"
import { toPng } from "html-to-image"
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import type { ProjectSettings, ServicePackageData, MilestoneData } from "@/lib/types"
import {
  createProjectFile,
  isElectron,
  saveProjectWeb,
  loadProjectWeb,
  saveProjectElectron,
  loadProjectElectron,
} from "@/lib/project-file"
import useLocalStorage from "@/hooks/use-local-storage"
import { ProjectSettingsForm } from "./project-settings-form"
import { TimelineControls } from "./timeline-controls"
import { TimelineHeader } from "./timeline-header"
import { ServicePackageRow } from "./service-package-row"
import { ServicePackageForm } from "./service-package-form"
import { MilestoneForm } from "./milestone-form"
import { getPositionAndWidth } from "@/lib/utils"
import {
  EMPTY_SELECTION,
  type Selection,
  selectionSize,
  toggleId,
  rangeSelectPackages,
  movePackagesBlock,
  applyPatch,
  shiftPackageDates,
  shiftMilestoneDates,
} from "@/lib/bulk"
import { SelectionToolbar } from "./selection-toolbar"
import {
  LABEL_SCHEMA_VERSION,
  ZERO_OFFSETS,
  migratePackageLabelOffsets,
  migrateMilestoneLabelOffsets,
} from "@/lib/label-layout"

const LABEL_SCHEMA_KEY = "engsched-label-schema"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "./ui/skeleton"
import { ProjectSettingsDialog } from "./project-settings-dialog"


export default function TimelineApp() {
  const [isClient, setIsClient] = useState(false)
  const [projectSettings, setProjectSettings] = useLocalStorage<ProjectSettings | null>("engsched-settings", null)
  const [servicePackages, setServicePackages] = useLocalStorage<ServicePackageData[]>("engsched-packages", [])
  const [milestones, setMilestones] = useLocalStorage<MilestoneData[]>("engsched-milestones", [])
  const [zoom, setZoom] = useState(100)

  const [isResetAlertOpen, setIsResetAlertOpen] = useState(false)
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false)
  const [rawSelection, setRawSelection] = useState<Selection>(EMPTY_SELECTION)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<ServicePackageData | undefined>(undefined)
  const [isPackageFormOpen, setIsPackageFormOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<MilestoneData | undefined>(undefined)
  const [isMilestoneFormOpen, setIsMilestoneFormOpen] = useState(false)
  
  const exportableAreaRef = useRef<HTMLDivElement>(null)
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast()
  const GAP = 20;

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Migração única dos dados do localStorage para o esquema atual de rótulos
  useEffect(() => {
    try {
      const stored = Number(window.localStorage.getItem(LABEL_SCHEMA_KEY) || "1");
      if (stored >= LABEL_SCHEMA_VERSION) return;
      setServicePackages(pkgs => pkgs.map(migratePackageLabelOffsets));
      setMilestones(ms => ms.map(migrateMilestoneLabelOffsets));
      window.localStorage.setItem(LABEL_SCHEMA_KEY, String(LABEL_SCHEMA_VERSION));
    } catch (error) {
      console.error(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleProjectSettingsSubmit = (data: Omit<ProjectSettings, 'id'>) => {
    const isEditing = !!projectSettings;
    setProjectSettings({ ...data, id: projectSettings?.id || crypto.randomUUID() })
    toast({ title: isEditing ? "Projeto Atualizado!" : "Projeto Criado!", description: isEditing ? "As configurações do projeto foram salvas." : "Você pode agora adicionar pacotes e marcos." })
  }

  const handleReset = () => {
    setProjectSettings(null)
    setServicePackages([])
    setMilestones([])
    setZoom(100)
    setIsResetAlertOpen(false)
    toast({ title: "Cronograma Resetado", description: "Todos os dados foram apagados." })
  }

  const handleExport = async () => {
    if (selectionSize(rawSelection) > 0) {
      // Remove o destaque de seleção antes de capturar a imagem
      setRawSelection(EMPTY_SELECTION);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (exportableAreaRef.current) {
      const title = projectSettings?.title.replace(/\s+/g, '_') || 'timeline';
      const date = format(new Date(), 'yyyyMMdd_HHmm');

      toPng(exportableAreaRef.current, {
        pixelRatio: 2,
        backgroundColor: '#FFFFFF',
        style: {
          overflow: 'visible',
        }
      }).then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `cronograma-${title}-${date}.png`;
        link.href = dataUrl;
        link.click();
        toast({ title: "Sucesso!", description: "Cronograma exportado como PNG." });
      }).catch(() => {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível exportar o cronograma." });
      });
    } else {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível encontrar o elemento do cronograma para exportar." });
    }
  }

  const handleSaveProject = async () => {
    const project = createProjectFile(projectSettings, servicePackages, milestones, zoom);
    try {
      if (isElectron()) {
        const saved = await saveProjectElectron(project);
        if (saved) {
          toast({ title: "Projeto Salvo!", description: "Arquivo salvo com sucesso." });
        }
      } else {
        saveProjectWeb(project);
        toast({ title: "Projeto Salvo!", description: "Arquivo baixado com sucesso." });
      }
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar o projeto." });
    }
  };

  const handleLoadProject = async () => {
    try {
      let project;
      if (isElectron()) {
        project = await loadProjectElectron();
      } else {
        project = await loadProjectWeb();
      }
      if (!project) return;

      setProjectSettings(project.projectSettings);
      setServicePackages(project.servicePackages);
      setMilestones(project.milestones);
      setZoom(project.zoom);
      toast({ title: "Projeto Carregado!", description: "Todos os dados foram restaurados." });
    } catch (err: any) {
      if (err?.message === "cancelled") return;
      toast({ variant: "destructive", title: "Erro ao Abrir", description: err?.message || "Arquivo de projeto inválido." });
    }
  };

  const handleLabelDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const activeId = active.id.toString();

    const parts = activeId.split('-');
    if (parts.length < 3) return;

    const labelType = parts[0]; // 'name' or 'date'
    const itemType = parts[1]; // 'package' or 'milestone'
    const id = parts.slice(2).join('-');

    if (itemType === 'package') {
      setServicePackages(pkgs => pkgs.map(p => {
        if (p.id !== id) return p;
        if (labelType === 'name') {
          return {
            ...p,
            labelOffsetX: (p.labelOffsetX || 0) + delta.x,
            labelOffsetY: (p.labelOffsetY || 0) + delta.y
          };
        }
        if (labelType === 'date') {
          return {
            ...p,
            dateLabelOffsetX: (p.dateLabelOffsetX || 0) + delta.x,
            dateLabelOffsetY: (p.dateLabelOffsetY || 0) + delta.y
          };
        }
        return p;
      }));
    } else if (itemType === 'milestone') {
      setMilestones(ms => ms.map(m => {
        if (m.id !== id) return m;
        if (labelType === 'name') {
          return {
            ...m,
            labelOffsetX: (m.labelOffsetX || 0) + delta.x,
            labelOffsetY: (m.labelOffsetY || 0) + delta.y,
          };
        }
        if (labelType === 'date') {
          return {
            ...m,
            dateLabelOffsetX: (m.dateLabelOffsetX || 0) + delta.x,
            dateLabelOffsetY: (m.dateLabelOffsetY || 0) + delta.y,
          };
        }
        return m;
      }));
    }
  };
  
  const handlePackageSubmit = (data: ServicePackageData) => {
    const exists = servicePackages.some(p => p.id === data.id);
    if (exists) {
      setServicePackages(servicePackages.map(p => p.id === data.id ? data : p));
      toast({ title: "Pacote Atualizado" });
    } else {
      const newOrder = servicePackages.length > 0 ? Math.max(...servicePackages.map(p => p.order)) + 1 : 0;
      setServicePackages([...servicePackages, {...data, order: newOrder}]);
      toast({ title: "Pacote Criado" });
    }
  };

  const handleDeletePackage = (id: string) => {
    setServicePackages(servicePackages.filter(p => p.id !== id));
    toast({ title: "Pacote Deletado", variant: "destructive" });
  }

  const handleMilestoneSubmit = (data: MilestoneData) => {
    const exists = milestones.some(m => m.id === data.id);
    if (exists) {
        setMilestones(milestones.map(m => m.id === data.id ? data : m));
        toast({ title: "Marco Atualizado" });
    } else {
        setMilestones([...milestones, data]);
        toast({ title: "Marco Criado" });
    }
  }

  const handleDeleteMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
    toast({ title: "Marco Deletado", variant: "destructive" });
  }

  const handleOrderChange = (id: string, direction: 'up' | 'down') => {
    const pkgs = [...servicePackages].sort((a, b) => a.order - b.order);
    const index = pkgs.findIndex(p => p.id === id);

    if (direction === 'up' && index > 0) {
      [pkgs[index].order, pkgs[index - 1].order] = [pkgs[index - 1].order, pkgs[index].order];
    } else if (direction === 'down' && index < pkgs.length - 1) {
      [pkgs[index].order, pkgs[index + 1].order] = [pkgs[index + 1].order, pkgs[index].order];
    }
    setServicePackages(pkgs);
  };


  // ----- Seleção múltipla / edição em bloco -----

  // Mantém apenas ids que ainda existem (itens podem ter sido excluídos)
  const selection = useMemo<Selection>(() => ({
    packages: rawSelection.packages.filter(id => servicePackages.some(p => p.id === id)),
    milestones: rawSelection.milestones.filter(id => milestones.some(m => m.id === id)),
  }), [rawSelection, servicePackages, milestones]);
  const hasSelection = selectionSize(selection) > 0;

  const clearSelection = useCallback(() => setRawSelection(EMPTY_SELECTION), []);

  const handleSelectPackage = (id: string, e: React.MouseEvent) => {
    const multi = e.ctrlKey || e.metaKey;
    setRawSelection(sel => {
      if (e.shiftKey) {
        return { ...sel, packages: rangeSelectPackages(servicePackages, sel.packages, id) };
      }
      if (multi) {
        return { ...sel, packages: toggleId(sel.packages, id) };
      }
      const isOnlyOne = selectionSize(sel) === 1 && sel.packages[0] === id;
      return isOnlyOne ? EMPTY_SELECTION : { packages: [id], milestones: [] };
    });
  };

  const handleSelectMilestone = (id: string, e: React.MouseEvent) => {
    const multi = e.ctrlKey || e.metaKey || e.shiftKey;
    setRawSelection(sel => {
      if (multi) {
        return { ...sel, milestones: toggleId(sel.milestones, id) };
      }
      const isOnlyOne = selectionSize(sel) === 1 && sel.milestones[0] === id;
      return isOnlyOne ? EMPTY_SELECTION : { packages: [], milestones: [id] };
    });
  };

  const handleSelectAll = () => {
    setRawSelection({
      packages: servicePackages.map(p => p.id),
      milestones: milestones.map(m => m.id),
    });
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-keep-selection]")) return;
    if (hasSelection) clearSelection();
  };

  const handleBulkColor = (color: string) => {
    if (selection.packages.length) setServicePackages(applyPatch(servicePackages, selection.packages, { color }));
    if (selection.milestones.length) setMilestones(applyPatch(milestones, selection.milestones, { color }));
    toast({ title: "Cor aplicada", description: `${selectionSize(selection)} item(ns) atualizado(s).` });
  };

  const handleBulkDateFormat = (dateFormat: 'dd/MM/yyyy' | 'MMM/yy') => {
    if (selection.packages.length) setServicePackages(applyPatch(servicePackages, selection.packages, { dateFormat }));
    if (selection.milestones.length) setMilestones(applyPatch(milestones, selection.milestones, { dateFormat }));
    toast({ title: "Formato de data aplicado", description: `${selectionSize(selection)} item(ns) atualizado(s).` });
  };

  const handleBulkMove = (direction: 'up' | 'down') => {
    setServicePackages(movePackagesBlock(servicePackages, selection.packages, direction));
  };

  const handleBulkShiftDates = (days: number) => {
    if (!projectSettings) return;
    const pk = shiftPackageDates(servicePackages, selection.packages, days, projectSettings.startDate, projectSettings.endDate);
    const ms = shiftMilestoneDates(milestones, selection.milestones, days, projectSettings.startDate, projectSettings.endDate);
    setServicePackages(pk.items);
    setMilestones(ms.items);
    const skipped = pk.outOfRange.length + ms.outOfRange.length;
    const moved = selectionSize(selection) - skipped;
    const label = days > 0 ? `atrasado(s) ${days} dia(s)` : `adiantado(s) ${-days} dia(s)`;
    if (skipped > 0) {
      toast({
        variant: "destructive",
        title: "Deslocamento parcial",
        description: `${moved} item(ns) ${label}. ${skipped} item(ns) sairia(m) do período do projeto e não foi/foram alterado(s).`,
      });
    } else {
      toast({ title: "Datas deslocadas", description: `${moved} item(ns) ${label}.` });
    }
  };

  const handleBulkShowTextInside = (showTextInside: boolean) => {
    setServicePackages(applyPatch(servicePackages, selection.packages, { showTextInside }));
  };

  const handleBulkPreventLineBreak = (preventNameLineBreak: boolean) => {
    setServicePackages(applyPatch(servicePackages, selection.packages, { preventNameLineBreak }));
    setMilestones(applyPatch(milestones, selection.milestones, { preventNameLineBreak }));
  };

  const handleBulkResetLabels = () => {
    setServicePackages(applyPatch(servicePackages, selection.packages, { ...ZERO_OFFSETS }));
    setMilestones(applyPatch(milestones, selection.milestones, { ...ZERO_OFFSETS }));
    toast({ title: "Posições redefinidas", description: `${selectionSize(selection)} item(ns) com textos na posição padrão.` });
  };

  const handleBulkDelete = () => {
    const pkSet = new Set(selection.packages);
    const msSet = new Set(selection.milestones);
    const total = selectionSize(selection);
    setServicePackages(servicePackages.filter(p => !pkSet.has(p.id)));
    setMilestones(milestones.filter(m => !msSet.has(m.id)));
    clearSelection();
    setIsBulkDeleteAlertOpen(false);
    toast({ title: "Itens excluídos", description: `${total} item(ns) removido(s).`, variant: "destructive" });
  };

  // Atalhos: Esc limpa a seleção; Delete abre a confirmação de exclusão
  useEffect(() => {
    if (!hasSelection) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "Escape") {
        clearSelection();
      } else if ((e.key === "Delete" || e.key === "Backspace") && !typing) {
        e.preventDefault();
        setIsBulkDeleteAlertOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasSelection, clearSelection]);

  const packagesWithPositions = useMemo(() => {
    if (!projectSettings) return [];
    
    const sortedPackages = [...servicePackages].sort((a, b) => a.order - b.order);
    
    let currentTop = 0;
    
    return sortedPackages.map(pkg => {
      const positionAndWidth = getPositionAndWidth(pkg.startDate, pkg.endDate, projectSettings.startDate, projectSettings.endDate);
      const pkgWithLayout = {
        ...pkg,
        ...positionAndWidth,
        top: currentTop,
      };
      currentTop += pkg.height + GAP;
      return pkgWithLayout;
    });
  }, [servicePackages, projectSettings, GAP]);

  const timelineContainerHeight = useMemo(() => {
    if (packagesWithPositions.length === 0) return 20;
    const lastPackage = packagesWithPositions[packagesWithPositions.length - 1];
    return lastPackage.top + lastPackage.height + 20; // 20px bottom padding
  }, [packagesWithPositions]);


  if (!isClient) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        <Skeleton className="h-12 w-1/2 rounded-lg" />
        <Skeleton className="h-8 w-1/3 rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!projectSettings) {
    return <ProjectSettingsForm onSubmit={handleProjectSettingsSubmit} onLoadProject={handleLoadProject} />;
  }
  
  return (
    <div className="p-4 md:p-8">
      <div ref={exportableAreaRef} className="w-full overflow-x-auto py-4 bg-white" onClick={handleBackgroundClick}>
        <div style={{ width: `${zoom}%`, minWidth: '100%' }}>
          <DndContext onDragEnd={handleLabelDragEnd}>
            <div className="w-full px-[5%]">
              <header className="mb-4">
                <h1 className="font-headline text-3xl font-bold">{projectSettings.title}</h1>
              </header>
              <TimelineHeader 
                projectSettings={projectSettings} 
                milestones={milestones}
                handleEditMilestone={(milestone) => {
                  setEditingMilestone(milestone);
                  setIsMilestoneFormOpen(true);
                }}
                selectedMilestoneIds={selection.milestones}
                onSelectMilestone={handleSelectMilestone}
              />
              <div ref={timelineContainerRef} className="relative" style={{ height: `${timelineContainerHeight}px` }}>
                {packagesWithPositions.map(pkg => (
                  <ServicePackageRow
                    key={pkg.id}
                    packageData={pkg}
                    onDoubleClick={() => {
                      setEditingPackage(pkg);
                      setIsPackageFormOpen(true);
                    }}
                    onOrderChange={(dir) => handleOrderChange(pkg.id, dir)}
                    selected={selection.packages.includes(pkg.id)}
                    onSelect={(e) => handleSelectPackage(pkg.id, e)}
                  />
                ))}
              </div>
            </div>
          </DndContext>
        </div>
      </div>

      {hasSelection && (
        <SelectionToolbar
          selection={selection}
          totalPackages={servicePackages.length}
          totalMilestones={milestones.length}
          onClear={clearSelection}
          onSelectAll={handleSelectAll}
          onColor={handleBulkColor}
          onDateFormat={handleBulkDateFormat}
          onMove={handleBulkMove}
          onShiftDates={handleBulkShiftDates}
          onShowTextInside={handleBulkShowTextInside}
          onPreventLineBreak={handleBulkPreventLineBreak}
          onResetLabels={handleBulkResetLabels}
          onDelete={() => setIsBulkDeleteAlertOpen(true)}
        />
      )}

      <TimelineControls
        zoom={zoom}
        setZoom={setZoom}
        onExport={handleExport}
        onReset={() => setIsResetAlertOpen(true)}
        onAddPackage={() => { setEditingPackage(undefined); setIsPackageFormOpen(true); }}
        onAddMilestone={() => { setEditingMilestone(undefined); setIsMilestoneFormOpen(true); }}
        onEditProject={() => setIsSettingsDialogOpen(true)}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
      />
      
      <ProjectSettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        onSubmit={handleProjectSettingsSubmit}
        defaultValues={projectSettings}
      />

      {isPackageFormOpen && (
        <ServicePackageForm 
            isOpen={isPackageFormOpen}
            onClose={() => setIsPackageFormOpen(false)}
            onSubmit={handlePackageSubmit}
            onDelete={handleDeletePackage}
            projectSettings={projectSettings}
            defaultValues={editingPackage}
        />
      )}

      {isMilestoneFormOpen && (
        <MilestoneForm 
            isOpen={isMilestoneFormOpen}
            onClose={() => setIsMilestoneFormOpen(false)}
            onSubmit={handleMilestoneSubmit}
            onDelete={handleDeleteMilestone}
            projectSettings={projectSettings}
            defaultValues={editingMilestone}
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
