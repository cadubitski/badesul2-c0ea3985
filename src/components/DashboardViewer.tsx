import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ItemRotina } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, BarChart3, PieChartIcon, RefreshCw } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
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
  LineChart,
  Line,
  AreaChart,
  Area,
  LabelList,
} from "recharts";

interface DashboardData {
  id: string;
  item_id: string;
  sheet_name: string;
  row_index: number;
  data: Record<string, string | number | boolean | null>;
  created_at: string;
}

type ChartType = 'bar' | 'pie' | 'line' | 'area';

interface DrilldownColumn {
  key: string;
  label: string;
}

interface ParsedInstruction {
  groups: Array<{
    name: string;
    sheets: string[];
  }>;
  countColumn: string;
  countColumnLabel: string;
  chartType: ChartType;
  drilldownColumns: DrilldownColumn[];
  showTotals: boolean;
  teamComparison?: {
    enabled: boolean;
    totvs: string[];
    badesul: string[];
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a855f7', '#ec4899'];

// Função para mapear instruções de texto para configurações de gráfico
const parseInstructions = (instructions: string | null, allSheets: string[]): ParsedInstruction => {
  const defaultResult: ParsedInstruction = {
    groups: [{ name: 'Todos', sheets: allSheets }],
    countColumn: 'H',
    countColumnLabel: 'Estado',
    chartType: 'bar',
    drilldownColumns: [],
    showTotals: false,
  };

  if (!instructions) return defaultResult;

  const groups: Array<{ name: string; sheets: string[] }> = [];
  let countColumn = 'H';
  let countColumnLabel = 'Estado';
  let chartType: ChartType = 'bar';
  const drilldownColumns: DrilldownColumn[] = [];
  let showTotals = false;
  let teamComparison: ParsedInstruction['teamComparison'] = undefined;

  // Detectar tipo de gráfico - mais flexível
  const lowerInstructions = instructions.toLowerCase();
  
  if (lowerInstructions.includes('pizza') || lowerInstructions.includes('pie')) {
    chartType = 'pie';
  } else if (lowerInstructions.includes('linha') || lowerInstructions.includes('line')) {
    chartType = 'line';
  } else if (lowerInstructions.includes('área') || lowerInstructions.includes('area')) {
    chartType = 'area';
  } else if (lowerInstructions.includes('barra') || lowerInstructions.includes('bar')) {
    chartType = 'bar';
  }

  // Detectar se deve mostrar totais
  if (lowerInstructions.includes('totalizador') || lowerInstructions.includes('total')) {
    showTotals = true;
  }

  // Procurar por grupos definidos nas instruções
  const groupRegex = /[Aa]grupe\s+as\s+abas\s+['"]?([^'"]+?)['"]?(?:\s*,\s*['"]?([^'"]+?)['"]?)*(?:\s+e\s+['"]?([^'"]+?)['"]?)?\s+como\s+(?:grupo\s+)?['"]?([^'"\.]+?)['"]?(?:\.|$)/gi;
  
  let match;
  while ((match = groupRegex.exec(instructions)) !== null) {
    const fullMatch = match[0];
    const sheetsMatch = fullMatch.match(/abas\s+(.+?)\s+como/i);
    
    if (sheetsMatch) {
      const sheetsString = sheetsMatch[1];
      const names = sheetsString
        .split(/,|\s+e\s+/i)
        .map(s => s.replace(/['"]/g, '').trim())
        .filter(Boolean);
      
      const groupNameMatch = fullMatch.match(/como\s+(?:grupo\s+)?['"]?([^'"\.]+?)['"]?(?:\.|$)/i);
      const groupName = groupNameMatch ? groupNameMatch[1].trim() : 'Grupo';
      
      if (names.length > 0) {
        groups.push({ name: groupName, sheets: names });
      }
    }
  }

  // Procurar coluna para contagem
  const columnMatch = instructions.match(/[Cc]oluna\s+([A-Z])\s*\(([^)]+)\)/);
  if (columnMatch) {
    countColumn = columnMatch[1];
    countColumnLabel = columnMatch[2];
  }

  // Procurar colunas de drilldown
  const drilldownMatch = instructions.match(/[Dd]rilldown[^:]*:\s*([^\.]+)/i);
  if (drilldownMatch) {
    const drilldownText = drilldownMatch[1];
    // Formato: "Aba, Ticket na coluna A, Titulo na coluna B"
    const columnDefs = drilldownText.split(',').map(s => s.trim());
    
    columnDefs.forEach(def => {
      if (def.toLowerCase() === 'aba') {
        drilldownColumns.push({ key: '_sheet_name', label: 'Aba' });
      } else {
        const colMatch = def.match(/(.+?)\s+(?:na\s+)?[Cc]oluna\s+([A-Z])/i);
        if (colMatch) {
          drilldownColumns.push({ 
            key: `col_${colMatch[2]}`, 
            label: colMatch[1].trim() 
          });
        }
      }
    });
  }

  // Procurar comparação de times (TOTVS vs Badesul)
  if (lowerInstructions.includes('time totvs') || lowerInstructions.includes('time badesul')) {
    const totvsKeywords: string[] = [];
    const badesulKeywords: string[] = [];
    
    // Extrair palavras-chave para TOTVS
    const totvsMatch = instructions.match(/Time\s+TOTVS[^:]*:\s*([^]*?)(?=Time\s+Badesul|$)/i);
    if (totvsMatch) {
      const lines = totvsMatch[1].split('\n');
      lines.forEach(line => {
        const keywordMatch = line.match(/palavra\s+['"]?([^'"]+)['"]?/i) || 
                            line.match(/contenha[^'"]*['"]([^'"]+)['"]/i);
        if (keywordMatch) {
          totvsKeywords.push(keywordMatch[1].toLowerCase());
        }
        if (line.includes("'SER'")) totvsKeywords.push('ser');
        if (line.includes("'PRIME'")) totvsKeywords.push('prime');
        if (line.includes("'TOTVS'")) totvsKeywords.push('totvs');
        if (line.includes("'CLOUD'")) totvsKeywords.push('cloud');
        if (line.includes("'BSO'")) totvsKeywords.push('bso');
      });
    }
    
    // Extrair palavras-chave para Badesul
    const badesulMatch = instructions.match(/Time\s+Badesul[^:]*:\s*([^]*?)$/i);
    if (badesulMatch) {
      const lines = badesulMatch[1].split('\n');
      lines.forEach(line => {
        const keywordMatch = line.match(/palavra\s+['"]?([^'"]+)['"]?/i) ||
                            line.match(/contenha[^'"]*['"]([^'"]+)['"]/i);
        if (keywordMatch) {
          badesulKeywords.push(keywordMatch[1].toLowerCase());
        }
        if (line.includes("'Cliente'")) badesulKeywords.push('cliente');
      });
    }
    
    if (totvsKeywords.length > 0 || badesulKeywords.length > 0) {
      teamComparison = {
        enabled: true,
        totvs: totvsKeywords.length > 0 ? totvsKeywords : ['ser', 'prime', 'totvs', 'cloud', 'bso'],
        badesul: badesulKeywords.length > 0 ? badesulKeywords : ['cliente'],
      };
    }
  }

  return {
    groups: groups.length > 0 ? groups : [{ name: 'Todos', sheets: allSheets }],
    countColumn,
    countColumnLabel,
    chartType,
    drilldownColumns: drilldownColumns.length > 0 ? drilldownColumns : [],
    showTotals,
    teamComparison,
  };
};

const DashboardViewer = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { trackDashboardView, trackChartClick } = useAnalytics();
  const [item, setItem] = useState<ItemRotina | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drilldownData, setDrilldownData] = useState<DashboardData[] | null>(null);
  const [drilldownTitle, setDrilldownTitle] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!itemId) return;

    try {
      // Buscar informações do item (sempre buscar para ter o prompt atualizado)
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
    }
  }, [itemId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    };
    loadData();
  }, [fetchData]);

  // Rastrear visualização do dashboard quando item carregar
  useEffect(() => {
    if (item?.nome) {
      trackDashboardView(item.nome);
    }
  }, [item?.nome, trackDashboardView]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Obter todas as abas únicas dos dados
  const allSheets = useMemo(() => 
    [...new Set(dashboardData.map(d => d.sheet_name))],
    [dashboardData]
  );

  // Parsear as instruções do prompt
  const parsedInstructions = useMemo(() => 
    parseInstructions(item?.prompt_instrucao || null, allSheets),
    [item?.prompt_instrucao, allSheets]
  );

  // Processar dados para os gráficos
  const processedData = useMemo(() => {
    if (dashboardData.length === 0) return null;

    const result: Array<{
      groupName: string;
      chartData: Array<{ name: string; count: number; items: DashboardData[] }>;
    }> = [];

    parsedInstructions.groups.forEach(group => {
      const groupData = dashboardData.filter(row => 
        group.sheets.some(sheet => 
          row.sheet_name.toLowerCase().includes(sheet.toLowerCase())
        )
      );

      // Contar por status (usando a coluna especificada)
      const statusCounts: Record<string, { count: number; items: DashboardData[] }> = {};
      
      groupData.forEach(row => {
        const columnKey = `col_${parsedInstructions.countColumn}`;
        const statusValue = row.data[columnKey] ?? 
                           row.data[parsedInstructions.countColumnLabel] ?? 
                           row.data['Estado'] ?? 
                           row.data['status'] ?? 
                           'Não definido';
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
  }, [dashboardData, parsedInstructions]);

  // Processar dados de comparação de times
  const teamComparisonData = useMemo(() => {
    if (!parsedInstructions.teamComparison?.enabled || dashboardData.length === 0) return null;

    const totvs = { count: 0, items: [] as DashboardData[] };
    const badesul = { count: 0, items: [] as DashboardData[] };

    dashboardData.forEach(row => {
      const columnKey = `col_${parsedInstructions.countColumn}`;
      const statusValue = String(row.data[columnKey] ?? row.data['Estado'] ?? '').toLowerCase();
      
      const isTotvs = parsedInstructions.teamComparison!.totvs.some(keyword => 
        statusValue.includes(keyword)
      );
      const isBadesul = parsedInstructions.teamComparison!.badesul.some(keyword => 
        statusValue.includes(keyword)
      );

      if (isTotvs) {
        totvs.count++;
        totvs.items.push(row);
      } else if (isBadesul) {
        badesul.count++;
        badesul.items.push(row);
      }
    });

    return [
      { name: 'TOTVS', count: totvs.count, items: totvs.items, fill: '#0088FE' },
      { name: 'Badesul', count: badesul.count, items: badesul.items, fill: '#00C49F' },
    ];
  }, [dashboardData, parsedInstructions]);

  const handleChartClick = (data: { name: string; count: number; items: DashboardData[] }, groupName: string) => {
    // Rastrear clique no gráfico
    if (item?.nome) {
      trackChartClick(item.nome, groupName, data.name);
    }
    setDrilldownTitle(`${groupName} - ${data.name} (${data.count} itens)`);
    setDrilldownData(data.items);
  };

  // Obter colunas para drilldown
  const getDrilldownColumns = (): DrilldownColumn[] => {
    if (parsedInstructions.drilldownColumns.length > 0) {
      return parsedInstructions.drilldownColumns;
    }
    // Colunas padrão se não especificadas
    const sampleData = drilldownData?.[0]?.data;
    if (!sampleData) return [];
    return Object.keys(sampleData).slice(0, 6).map(key => ({ key, label: key }));
  };

  // Renderizar gráfico baseado no tipo
  const renderChart = (chartData: Array<{ name: string; count: number; items: DashboardData[] }>, groupName: string, colorIndex: number) => {
    const chartType = parsedInstructions.chartType;
    
    switch (chartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label={({ name, count, percent }) => `${name}: ${count} (${(percent * 100).toFixed(0)}%)`}
                onClick={(data) => handleChartClick(data, groupName)}
                cursor="pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Quantidade']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                name="Quantidade"
                stroke={COLORS[colorIndex % COLORS.length]}
                strokeWidth={2}
                dot={{ cursor: 'pointer' }}
                activeDot={{ r: 8, cursor: 'pointer' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="count"
                name="Quantidade"
                fill={COLORS[colorIndex % COLORS.length]}
                stroke={COLORS[colorIndex % COLORS.length]}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="count"
                name="Quantidade"
                fill={COLORS[colorIndex % COLORS.length]}
                onClick={(data) => handleChartClick(data, groupName)}
                cursor="pointer"
              >
                {parsedInstructions.showTotals && (
                  <LabelList dataKey="count" position="top" />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
    }
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

  const chartTypeIcon = parsedInstructions.chartType === 'pie' ? 
    <PieChartIcon className="h-6 w-6" /> : 
    <BarChart3 className="h-6 w-6" />;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1e3a5f] to-[#2e7d32] text-white p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {chartTypeIcon}
                {item.nome}
              </h1>
              <p className="text-white/80">{item.descricao}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh} 
            className="text-white hover:bg-white/20"
            disabled={refreshing}
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {/* Info do tipo de gráfico */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
          <strong>Tipo de Gráfico:</strong> {
            parsedInstructions.chartType === 'pie' ? 'Pizza' :
            parsedInstructions.chartType === 'line' ? 'Linha' :
            parsedInstructions.chartType === 'area' ? 'Área' : 'Barras'
          } | 
          <strong> Coluna de Agrupamento:</strong> {parsedInstructions.countColumnLabel} (Coluna {parsedInstructions.countColumn})
        </div>
      </div>

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
                  <CardTitle className="flex items-center gap-2">
                    {chartTypeIcon}
                    {group.groupName}
                    {parsedInstructions.showTotals && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        (Total: {group.chartData.reduce((sum, d) => sum + d.count, 0)})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderChart(group.chartData, group.groupName, index)}
                </CardContent>
              </Card>
            ))}

            {/* Gráfico de comparação de times */}
            {teamComparisonData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Responsabilidade - TOTVS vs Badesul
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={teamComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        name="Quantidade"
                        onClick={(data) => handleChartClick(data, 'Responsabilidade')}
                        cursor="pointer"
                      >
                        {teamComparisonData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                        <LabelList dataKey="count" position="top" />
                        <LabelList dataKey="name" position="bottom" offset={20} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

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
                            <TableCell key={i}>{String(value ?? '')}</TableCell>
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
                  {getDrilldownColumns().map(col => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {drilldownData?.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.sheet_name}</TableCell>
                    {getDrilldownColumns().map(col => (
                      <TableCell key={col.key}>
                        {col.key === '_sheet_name' 
                          ? row.sheet_name 
                          : String(row.data[col.key] ?? '')}
                      </TableCell>
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
