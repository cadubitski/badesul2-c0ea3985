import { useState } from "react";
import KnowledgeHeader from "@/components/KnowledgeHeader";
import KnowledgeSidebar from "@/components/KnowledgeSidebar";
import KnowledgeContent from "@/components/KnowledgeContent";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("all");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <KnowledgeHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <div className="flex flex-1">
        <KnowledgeSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <KnowledgeContent 
          activeSection={activeSection} 
          searchQuery={searchQuery} 
        />
      </div>
    </div>
  );
};

export default Index;
