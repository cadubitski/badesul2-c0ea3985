import { useState } from "react";
import { useItensRotinas, useCategorias, useItemMutations } from "@/hooks/usePortalData";
import { ItemRotina, ItemTipo } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const tipoLabels: Record<ItemTipo, string> = {
  link: "Link",
  faq: "FAQ",
  dashboard: "Dashboard",
  manual: "Manual",
};

const AdminItensTab = () => {
  const { data: itens, isLoading } = useItensRotinas(undefined, true);
  const { data: categorias } = useCategorias(true);
  const { create, update, remove } = useItemMutations();
  const { toast } = useToast();
  
  const [editingItem, setEditingItem] = useState<ItemRotina | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    categoria_id: "",
    nome: "",
    descricao: "",
    link: "",
    tipo: "link" as ItemTipo,
    icone: "file",
    ordem: 0,
    ativo: true,
    prompt_instrucao: "",
  });

  const handleNew = () => {
    setEditingItem(null);
    setFormData({
      categoria_id: categorias?.[0]?.id || "",
      nome: "",
      descricao: "",
      link: "",
      tipo: "link",
      icone: "file",
      ordem: (itens?.length || 0) + 1,
      ativo: true,
      prompt_instrucao: "",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: ItemRotina) => {
    setEditingItem(item);
    setFormData({
      categoria_id: item.categoria_id,
      nome: item.nome,
      descricao: item.descricao || "",
      link: item.link || "",
      tipo: item.tipo,
      icone: item.icone,
      ordem: item.ordem,
      ativo: item.ativo,
      prompt_instrucao: item.prompt_instrucao || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.categoria_id) {
      toast({
        title: "Selecione uma categoria",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (editingItem) {
        await update.mutateAsync({
          id: editingItem.id,
          ...formData,
        });
        toast({ title: "Item atualizado com sucesso" });
      } else {
        await create.mutateAsync(formData);
        toast({ title: "Item criado com sucesso" });
      }
      setIsModalOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o item.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await remove.mutateAsync(deleteId);
      toast({ title: "Item removido com sucesso" });
      setDeleteId(null);
    } catch (error) {
      toast({
        title: "Erro ao remover",
        variant: "destructive",
      });
    }
  };

  const handleToggleAtivo = async (item: ItemRotina) => {
    try {
      await update.mutateAsync({
        id: item.id,
        ativo: !item.ativo,
      });
      toast({
        title: item.ativo ? "Item desativado" : "Item ativado",
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
        <h3 className="text-lg font-medium">Rotinas e Itens</h3>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Item
        </Button>
      </div>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {itens?.map((item) => (
          <Card key={item.id} className={!item.ativo ? "opacity-60" : ""}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{item.nome}</p>
                  <Badge variant="outline" className="text-xs">
                    {tipoLabels[item.tipo]}
                  </Badge>
                  {item.categoria && (
                    <Badge variant="secondary" className="text-xs">
                      {item.categoria.nome}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{item.descricao}</p>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {item.link.substring(0, 50)}...
                  </a>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-4">
                  <Label htmlFor={`ativo-${item.id}`} className="text-sm text-muted-foreground">
                    Ativo
                  </Label>
                  <Switch
                    id={`ativo-${item.id}`}
                    checked={item.ativo}
                    onCheckedChange={() => handleToggleAtivo(item)}
                  />
                </div>
                
                <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDeleteId(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {(!itens || itens.length === 0) && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum item cadastrado
          </p>
        )}
      </div>
      
      {/* Modal de Edição/Criação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Item" : "Novo Item"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={formData.categoria_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as ItemTipo }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="faq">FAQ</SelectItem>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do item"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição breve do item"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icone">Ícone</Label>
                <Input
                  id="icone"
                  value={formData.icone}
                  onChange={(e) => setFormData(prev => ({ ...prev, icone: e.target.value }))}
                  placeholder="help-circle, bot, monitor..."
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
            
            {formData.tipo === "dashboard" && (
              <div className="space-y-2">
                <Label htmlFor="prompt_instrucao">
                  Prompt de Instrução (para Dashboards)
                </Label>
                <Textarea
                  id="prompt_instrucao"
                  value={formData.prompt_instrucao}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt_instrucao: e.target.value }))}
                  placeholder="Instruções para renderização do dashboard..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Este campo será usado para interpretar e renderizar gráficos dinâmicos a partir do link.
                </p>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
              <Label htmlFor="ativo">Item ativo</Label>
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
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
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

export default AdminItensTab;
