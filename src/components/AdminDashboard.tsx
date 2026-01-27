import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Palette, FolderTree, FileText, Users } from "lucide-react";
import AdminVisualTab from "./admin/AdminVisualTab";
import AdminCategoriasTab from "./admin/AdminCategoriasTab";
import AdminItensTab from "./admin/AdminItensTab";
import AdminUsersTab from "./admin/AdminUsersTab";

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminDashboard = ({ isOpen, onClose }: AdminDashboardProps) => {
  const { user, adminRole, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("visual");

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Painel de Administração</DialogTitle>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.email} ({adminRole})
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="categorias" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="itens" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Rotinas e Itens
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="visual" className="m-0 h-full">
              <AdminVisualTab />
            </TabsContent>
            
            <TabsContent value="categorias" className="m-0 h-full">
              <AdminCategoriasTab />
            </TabsContent>
            
            <TabsContent value="itens" className="m-0 h-full">
              <AdminItensTab />
            </TabsContent>
            
            <TabsContent value="usuarios" className="m-0 h-full">
              <AdminUsersTab />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AdminDashboard;
