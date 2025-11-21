import React from 'react';
import { useDeletedJobs, useRestoreJob, useJobsToPermanentlyDelete, usePermanentlyDeleteOldJobs, Job } from '@/hooks/useJobs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RotateCcw, Trash2, Calendar, User, AlertTriangle, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DeletedJobsManagement = () => {
  const { data: deletedJobs, isLoading, error } = useDeletedJobs();
  const { data: jobsToDeleteCount = 0 } = useJobsToPermanentlyDelete();
  const restoreJob = useRestoreJob();
  const permanentlyDelete = usePermanentlyDeleteOldJobs();
  const { toast } = useToast();
  const [jobToRestore, setJobToRestore] = React.useState<Job | null>(null);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = React.useState(false);

  const handleRestore = async () => {
    if (!jobToRestore) return;

    try {
      await restoreJob.mutateAsync(jobToRestore.id);
      toast({
        title: "✅ Vaga Restaurada",
        description: `A vaga "${jobToRestore.title}" foi restaurada com sucesso.`,
      });
      setJobToRestore(null);
    } catch (error: any) {
      toast({
        title: "❌ Erro ao Restaurar",
        description: error?.message || "Não foi possível restaurar a vaga.",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async () => {
    try {
      const result = await permanentlyDelete.mutateAsync();
      const deletedCount = result?.[0]?.deleted_count || 0;
      toast({
        title: "🗑️ Limpeza Executada",
        description: `${deletedCount} vaga(s) foram excluídas permanentemente do banco de dados.`,
      });
      setShowPermanentDeleteConfirm(false);
    } catch (error: any) {
      toast({
        title: "❌ Erro na Limpeza",
        description: error?.message || "Não foi possível executar a limpeza permanente.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-cgb-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600">
            Erro ao carregar vagas excluídas: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Vagas Excluídas
              </CardTitle>
              <CardDescription>
                Histórico completo de vagas excluídas com informações de auditoria.
                Vagas excluídas há mais de 30 dias serão removidas permanentemente.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {jobsToDeleteCount > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {jobsToDeleteCount} para exclusão permanente
                </Badge>
              )}
              <Badge variant="outline" className="text-sm">
                {deletedJobs?.length || 0} vaga(s)
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {jobsToDeleteCount > 0 && (
            <Alert className="mb-4 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Limpeza Pendente</AlertTitle>
              <AlertDescription className="text-orange-700">
                {jobsToDeleteCount} vaga(s) foram excluídas há mais de 30 dias e podem ser removidas permanentemente.
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-3 mt-2"
                  onClick={() => setShowPermanentDeleteConfirm(true)}
                  disabled={permanentlyDelete.isPending}
                >
                  {permanentlyDelete.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <Trash className="w-4 h-4 mr-2" />
                      Executar Limpeza Permanente
                    </>
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {!deletedJobs || deletedJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma vaga excluída encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Excluída em</TableHead>
                    <TableHead>Excluída por</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedJobs.map((job) => (
                    <TableRow key={job.id} className={job.will_be_deleted_soon ? 'bg-orange-50' : ''}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.department}</TableCell>
                      <TableCell>
                        {job.city}, {job.state}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Excluída
                          </Badge>
                          {job.days_until_permanent_deletion !== null && (
                            <span className={`text-xs ${job.will_be_deleted_soon ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                              {job.days_until_permanent_deletion > 0 
                                ? `${job.days_until_permanent_deletion} dia(s) até exclusão permanente`
                                : 'Será excluída permanentemente em breve'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {job.deleted_at
                            ? format(new Date(job.deleted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.deleted_by_name || job.deleted_by_email ? (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{job.deleted_by_name || 'Usuário'}</div>
                              {job.deleted_by_email && (
                                <div className="text-xs text-gray-500">{job.deleted_by_email}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Não disponível</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setJobToRestore(job)}
                          disabled={restoreJob.isPending}
                          className="gap-2"
                        >
                          {restoreJob.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                          Restaurar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação para restaurar */}
      <AlertDialog open={!!jobToRestore} onOpenChange={(open) => !open && setJobToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Vaga</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja restaurar a vaga "{jobToRestore?.title}"?
              <br />
              <br />
              A vaga será restaurada e voltará a aparecer no sistema normalmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={restoreJob.isPending}>
              {restoreJob.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restaurando...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restaurar Vaga
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para exclusão permanente */}
      <AlertDialog open={showPermanentDeleteConfirm} onOpenChange={setShowPermanentDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Exclusão Permanente
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>
                  Tem certeza que deseja excluir permanentemente <strong>{jobsToDeleteCount} vaga(s)</strong> que foram excluídas há mais de 30 dias?
                </p>
                <p className="text-red-600 font-semibold">
                  ⚠️ Esta ação NÃO pode ser desfeita! As vagas serão removidas permanentemente do banco de dados.
                </p>
                <p className="text-sm text-gray-600">
                  Os candidatos associados continuarão no histórico, mas as vagas não poderão mais ser recuperadas.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePermanentDelete} 
              disabled={permanentlyDelete.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {permanentlyDelete.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash className="w-4 h-4 mr-2" />
                  Excluir Permanentemente
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeletedJobsManagement;

