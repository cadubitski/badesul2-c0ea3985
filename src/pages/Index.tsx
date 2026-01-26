import { useState } from "react";
import KnowledgeHeader from "@/components/KnowledgeHeader";
import KnowledgeSidebar from "@/components/KnowledgeSidebar";
import KnowledgeContent from "@/components/KnowledgeContent";
import AdminDashboard from "@/components/AdminDashboard";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("all");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const { isAdmin, loading } = useAuth();

  const handleOpenAdmin = () => {
    if (isAdmin) {
      setShowAdminPanel(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <KnowledgeHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <div className="flex flex-1">
        <KnowledgeSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          onOpenAdmin={handleOpenAdmin}
        />
        <KnowledgeContent 
          activeSection={activeSection} 
          searchQuery={searchQuery} 
        />
      </div>
      
      {/* Painel de Administração */}
      <AdminDashboard 
        isOpen={showAdminPanel} 
        onClose={() => setShowAdminPanel(false)} 
      />
    </div>
  );
};

export default Index;
