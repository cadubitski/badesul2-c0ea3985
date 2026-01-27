import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ItemRotina } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardData {
  id: string;
  item_id: string;
  sheet_name: string;
  row_index: number;
  data: Record<string, string | number | boolean | null>;
  created_at: string;
}

interface ParsedInstruction {
  groups: Array<{
    name: string;
    sheets: string[];
  }>;
  countColumn: string;
  chartType: 'bar' | 'pie';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const DashboardViewer = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ItemRotina | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drilldownData, setDrilldownData] = useState<DashboardData[] | null>(null);
  const [drilldownTitle, setDrilldownTitle] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!itemId) return;

      setIsLoading(true);
      try {
        // Buscar informações do item
        const { data: itemData, error: itemError } = await supabase
          .from('itens_rotinas')
          .select('*')
          .eq('id', itemId)
          .maybeSingle();

        if (itemError) throw itemError;
        setItem(itemData as ItemRotina);

        // Buscar dados do dashboard
        const { data: dataRows, error: dataError } = await supabase
          .from('dashboard_data')
          .select('*')
          .eq('item_id', itemId)
          .order('sheet_name')
          .order('row_index');

        if (dataError) throw dataError;
        setDashboardData((dataRows || []).map(row => ({
          ...row,
          data: (row.data && typeof row.data === 'object' && !Array.isArray(row.data)) 
            ? row.data as Record<string, string | number | boolean | null>
            : {}
        })));
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [itemId]);

  // Parsear as instruções do prompt
  const parseInstructions = (instructions: string | null): ParsedInstruction | null => {
    if (!instructions) return null;

    const groups: Array<{ name: string; sheets: string[] }> = [];
    let countColumn = 'H'; // Default coluna H (Estado)
    let chartType: 'bar' | 'pie' = 'bar';

    // Procurar por grupos definidos nas instruções
    const groupRegex = /Agrupe as abas ['"]?([^'"]+)['"]?(?:,\s*['"]?([^'"]+)['"]?)*(?:\s+e\s+['"]?([^'"]+)['"]?)?\s+como\s+grupo\s+['"]?([^'"\.]+)['"]?/gi;
    let match;

    while ((match = groupRegex.exec(instructions)) !== null) {
      const sheetNames: string[] = [];
      const fullMatch = match[0];
      
      // Extrair todos os nomes de abas mencionados
      const sheetsMatch = fullMatch.match(/abas\s+(.+?)\s+como/i);
      if (sheetsMatch) {
        const sheetsString = sheetsMatch[1];
        const names = sheetsString.split(/,|\s+e\s+/i).map(s => s.replace(/['"]/g, '').trim()).filter(Boolean);
        sheetNames.push(...names);
      }

      const groupName = match[4] ? match[4].trim() : 'Grupo';
      if (sheetNames.length > 0) {
        groups.push({ name: groupName, sheets: sheetNames });
      }
    }

    // Procurar coluna para contagem
    const columnMatch = instructions.match(/[Cc]oluna\s+([A-Z])\s*\(([^)]+)\)/);
    if (columnMatch) {
      countColumn = columnMatch[1];
    }

    // Tipo de gráfico
    if (instructions.toLowerCase().includes('pizza') || instructions.toLowerCase().includes('pie')) {
      chartType = 'pie';
    }

    return {
      groups: groups.length > 0 ? groups : [{ name: 'Todos', sheets: [...new Set(dashboardData.map(d => d.sheet_name))] }],
      countColumn,
      chartType,
    };
  };

  // Processar dados para os gráficos
  const processedData = useMemo(() => {
    if (!item?.prompt_instrucao || dashboardData.length === 0) return null;

    const instructions = parseInstructions(item.prompt_instrucao);
    if (!instructions) return null;

    const result: Array<{
      groupName: string;
      chartData: Array<{ name: string; count: number; items: DashboardData[] }>;
    }> = [];

    instructions.groups.forEach(group => {
      const groupData = dashboardData.filter(row => 
        group.sheets.some(sheet => 
          row.sheet_name.toLowerCase().includes(sheet.toLowerCase())
        )
      );

      // Contar por status (usando a coluna especificada)
      const statusCounts: Record<string, { count: number; items: DashboardData[] }> = {};
      
      groupData.forEach(row => {
        // Tentar encontrar o valor na coluna especificada
        const columnKey = `col_${instructions.countColumn}`;
        const statusValue = row.data[columnKey] ?? row.data['Estado'] ?? row.data['status'] ?? 'Não definido';
        const status = String(statusValue);
        
        if (!statusCounts[status]) {
          statusCounts[status] = { count: 0, items: [] };
        }
        statusCounts[status].count++;
        statusCounts[status].items.push(row);
      });

      result.push({
        groupName: group.name,
        chartData: Object.entries(statusCounts).map(([name, { count, items }]) => ({
          name,
          count,
          items,
        })),
      });
    });

    return result;
  }, [item, dashboardData]);

  const handleBarClick = (data: { name: string; count: number; items: DashboardData[] }, groupName: string) => {
    setDrilldownTitle(`${groupName} - ${data.name} (${data.count} itens)`);
    setDrilldownData(data.items);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-muted/30">
        <p className="text-muted-foreground mb-4">Dashboard não encontrado</p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1e3a5f] to-[#2e7d32] text-white p-6">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              {item.nome}
            </h1>
            <p className="text-white/80">{item.descricao}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-6">
        {dashboardData.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">
                Nenhum dado carregado para este dashboard.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Faça upload de um arquivo Excel no painel de administração.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {processedData?.map((group, index) => (
              <Card key={group.groupName}>
                <CardHeader>
                  <CardTitle>{group.groupName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={group.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        name="Quantidade"
                        fill={COLORS[index % COLORS.length]}
                        onClick={(data) => handleBarClick(data, group.groupName)}
                        cursor="pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}

            {/* Tabela com todos os dados brutos */}
            <Card>
              <CardHeader>
                <CardTitle>Dados Completos ({dashboardData.length} registros)</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aba</TableHead>
                        <TableHead>#</TableHead>
                        {Object.keys(dashboardData[0]?.data || {}).slice(0, 6).map(key => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.slice(0, 100).map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.sheet_name}</TableCell>
                          <TableCell>{row.row_index}</TableCell>
                          {Object.values(row.data).slice(0, 6).map((value, i) => (
                            <TableCell key={i}>{String(value)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Drilldown Modal */}
      <Dialog open={!!drilldownData} onOpenChange={() => setDrilldownData(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{drilldownTitle}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aba</TableHead>
                  {Object.keys(drilldownData?.[0]?.data || {}).map(key => (
                    <TableHead key={key}>{key}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {drilldownData?.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.sheet_name}</TableCell>
                    {Object.values(row.data).map((value, i) => (
                      <TableCell key={i}>{String(value)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardViewer;
