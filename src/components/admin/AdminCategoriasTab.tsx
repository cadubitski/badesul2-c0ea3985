import { useState } from "react";
import { useCategorias, useCategoriaMutations } from "@/hooks/usePortalData";
import { Categoria } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import IconPicker, { getIconComponent } from "@/components/IconPicker";

const AdminCategoriasTab = () => {
  const { data: categorias, isLoading } = useCategorias(true); // incluir inativos
  const { create, update, remove } = useCategoriaMutations();
  const { toast } = useToast();
  
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    icone: "folder",
    ordem: 0,
    ativo: true,
  });

  const handleNew = () => {
    setEditingCategoria(null);
    setFormData({
      nome: "",
      descricao: "",
      icone: "folder",
      ordem: (categorias?.length || 0) + 1,
      ativo: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nome: categoria.nome,
      descricao: categoria.descricao || "",
      icone: categoria.icone,
      ordem: categoria.ordem,
      ativo: categoria.ativo,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingCategoria) {
        await update.mutateAsync({
          id: editingCategoria.id,
          ...formData,
        });
        toast({ title: "Categoria atualizada com sucesso" });
      } else {
        await create.mutateAsync(formData);
        toast({ title: "Categoria criada com sucesso" });
      }
      setIsModalOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a categoria.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await remove.mutateAsync(deleteId);
      toast({ title: "Categoria removida com sucesso" });
      setDeleteId(null);
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a categoria. Verifique se não há itens vinculados.",
        variant: "destructive",
      });
    }
  };

  const handleToggleAtivo = async (categoria: Categoria) => {
    try {
      await update.mutateAsync({
        id: categoria.id,
        ativo: !categoria.ativo,
      });
      toast({
        title: categoria.ativo ? "Categoria desativada" : "Categoria ativada",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Categorias do Portal</h3>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>
      
      <div className="space-y-2">
        {categorias?.map((categoria) => {
          const IconComponent = getIconComponent(categoria.icone);
          return (
            <Card key={categoria.id} className={!categoria.ativo ? "opacity-60" : ""}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{categoria.nome}</p>
                    <p className="text-sm text-muted-foreground">{categoria.descricao}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 mr-4">
                    <Label htmlFor={`ativo-${categoria.id}`} className="text-sm text-muted-foreground">
                      Ativo
                    </Label>
                    <Switch
                      id={`ativo-${categoria.id}`}
                      checked={categoria.ativo}
                      onCheckedChange={() => handleToggleAtivo(categoria)}
                    />
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={() => handleEdit(categoria)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteId(categoria.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {(!categorias || categorias.length === 0) && (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma categoria cadastrada
          </p>
        )}
      </div>
      
      {/* Modal de Edição/Criação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome da categoria"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição da categoria"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icone">Ícone</Label>
                <IconPicker
                  value={formData.icone}
                  onChange={(value) => setFormData(prev => ({ ...prev, icone: value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ordem">Ordem</Label>
                <Input
                  id="ordem"
                  type="number"
                  value={formData.ordem}
                  onChange={(e) => setFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
              <Label htmlFor="ativo">Categoria ativa</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Todos os itens vinculados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCategoriasTab;
