import { useState, useEffect } from "react";
import { useConfiguracoes, useUpdateConfiguracao } from "@/hooks/usePortalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminVisualTab = () => {
  const { data: config, isLoading } = useConfiguracoes();
  const updateConfig = useUpdateConfiguracao();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    corPrimaria: "#1e3a5f",
    corSecundaria: "#2e7d32",
    tituloHeader: "Banco de Conhecimento",
    subtituloHeader: "Central de Recursos e Procedimentos do Badesul",
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      await Promise.all([
        updateConfig.mutateAsync({ chave: 'cor_primaria', valor: formData.corPrimaria }),
        updateConfig.mutateAsync({ chave: 'cor_secundaria', valor: formData.corSecundaria }),
        updateConfig.mutateAsync({ chave: 'titulo_header', valor: formData.tituloHeader }),
        updateConfig.mutateAsync({ chave: 'subtitulo_header', valor: formData.subtituloHeader }),
      ]);
      
      toast({
        title: "Configurações salvas",
        description: "As alterações visuais foram aplicadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Cores do Portal
          </CardTitle>
          <CardDescription>
            Defina as cores predominantes do gradiente do cabeçalho
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="corPrimaria">Cor Primária (Azul)</Label>
              <div className="flex gap-2">
                <Input
                  id="corPrimaria"
                  type="color"
                  value={formData.corPrimaria}
                  onChange={(e) => setFormData(prev => ({ ...prev, corPrimaria: e.target.value }))}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.corPrimaria}
                  onChange={(e) => setFormData(prev => ({ ...prev, corPrimaria: e.target.value }))}
                  className="flex-1"
                  placeholder="#1e3a5f"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="corSecundaria">Cor Secundária (Verde)</Label>
              <div className="flex gap-2">
                <Input
                  id="corSecundaria"
                  type="color"
                  value={formData.corSecundaria}
                  onChange={(e) => setFormData(prev => ({ ...prev, corSecundaria: e.target.value }))}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.corSecundaria}
                  onChange={(e) => setFormData(prev => ({ ...prev, corSecundaria: e.target.value }))}
                  className="flex-1"
                  placeholder="#2e7d32"
                />
              </div>
            </div>
          </div>
          
          {/* Preview do gradiente */}
          <div className="mt-4">
            <Label>Preview do Gradiente</Label>
            <div 
              className="h-16 rounded-lg mt-2 flex items-center justify-center text-white font-semibold"
              style={{ 
                background: `linear-gradient(to right, ${formData.corPrimaria}, ${formData.corSecundaria})` 
              }}
            >
              {formData.tituloHeader}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Textos do Cabeçalho</CardTitle>
          <CardDescription>
            Configure o título e subtítulo exibidos no topo do portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tituloHeader">Título Principal</Label>
            <Input
              id="tituloHeader"
              value={formData.tituloHeader}
              onChange={(e) => setFormData(prev => ({ ...prev, tituloHeader: e.target.value }))}
              placeholder="Banco de Conhecimento"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subtituloHeader">Subtítulo</Label>
            <Input
              id="subtituloHeader"
              value={formData.subtituloHeader}
              onChange={(e) => setFormData(prev => ({ ...prev, subtituloHeader: e.target.value }))}
              placeholder="Central de Recursos e Procedimentos do Badesul"
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AdminVisualTab;
