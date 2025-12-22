"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Trash, Trash2 } from "lucide-react";

interface Expense {
  id: number;
  gasto: string;
  valor: number;
  categoria: string;
  data: string;
  descricao: string;
}

// Dados de exemplo
const expenses: Expense[] = [
  {
    id: 1,
    gasto: "Supermercado",
    valor: 350.80,
    categoria: "Alimentação",
    data: "2025-12-15",
    descricao: "Compras mensais no mercado",
  },
  {
    id: 2,
    gasto: "Conta de luz",
    valor: 180.50,
    categoria: "Moradia",
    data: "2025-12-10",
    descricao: "Fatura de energia elétrica",
  },
  {
    id: 3,
    gasto: "Netflix",
    valor: 55.90,
    categoria: "Entretenimento",
    data: "2025-12-05",
    descricao: "Assinatura mensal",
  },
  {
    id: 4,
    gasto: "Gasolina",
    valor: 250.00,
    categoria: "Transporte",
    data: "2025-12-18",
    descricao: "Abastecimento do veículo",
  },
  {
    id: 5,
    gasto: "Restaurante",
    valor: 125.40,
    categoria: "Alimentação",
    data: "2025-12-20",
    descricao: "Jantar com amigos",
  },
];

type SortField = "gasto" | "valor" | "categoria" | "data" | "descricao";
type SortDirection = "asc" | "desc" | null;

export default function Home() {
  const [selectedPeriod, setSelectedPeriod] = useState("2025-12");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [expensesList, setExpensesList] = useState<Expense[]>(expenses);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    gasto: "",
    valor: "",
    categoria: "",
    data: "",
    descricao: "",
  });
  const [categories, setCategories] = useState<string[]>([
    "Alimentação",
    "Moradia",
    "Transporte",
    "Entretenimento",
    "Saúde",
    "Educação",
    "Outros",
  ]);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isManageCategoriesDialogOpen, setIsManageCategoriesDialogOpen] = useState(false);

  const totalGastos = expensesList.reduce((acc, expense) => acc + expense.valor, 0);

  const getMonthYear = (period: string) => {
    const [year, month] = period.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const formatted = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(expensesList.map(expense => expense.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleDelete = () => {
    setExpensesList(expensesList.filter(expense => !selectedIds.includes(expense.id)));
    setSelectedIds([]);
  };

  const handleOpenAddDialog = () => {
    setEditingExpense(null);
    setFormData({
      gasto: "",
      valor: "",
      categoria: "",
      data: "",
      descricao: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = () => {
    const expense = expensesList.find(e => e.id === selectedIds[0]);
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        gasto: expense.gasto,
        valor: expense.valor.toString(),
        categoria: expense.categoria,
        data: expense.data,
        descricao: expense.descricao,
      });
      setIsDialogOpen(true);
    }
  };

  const handleSaveExpense = () => {
    if (!formData.gasto || !formData.valor || !formData.categoria || !formData.data) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (formData.gasto.length > 20) {
      alert("O título deve ter no máximo 20 caracteres.");
      return;
    }

    if (formData.descricao.length > 100) {
      alert("A descrição deve ter no máximo 100 caracteres.");
      return;
    }

    if (editingExpense) {
      // Editar
      setExpensesList(expensesList.map(expense => 
        expense.id === editingExpense.id
          ? { ...expense, ...formData, valor: parseFloat(formData.valor) }
          : expense
      ));
    } else {
      // Adicionar
      const newExpense: Expense = {
        id: Math.max(...expensesList.map(e => e.id), 0) + 1,
        gasto: formData.gasto,
        valor: parseFloat(formData.valor),
        categoria: formData.categoria,
        data: formData.data,
        descricao: formData.descricao,
      };
      setExpensesList([...expensesList, newExpense]);
    }

    setIsDialogOpen(false);
    setSelectedIds([]);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      alert("Por favor, digite um nome para a categoria.");
      return;
    }

    if (categories.includes(newCategoryName.trim())) {
      alert("Esta categoria já existe.");
      return;
    }

    setCategories([...categories, newCategoryName.trim()]);
    setFormData({ ...formData, categoria: newCategoryName.trim() });
    setNewCategoryName("");
    setIsAddCategoryDialogOpen(false);
  };

  const handleCategoryChange = (value: string) => {
    if (value === "__manage__") {
      setIsManageCategoriesDialogOpen(true);
    } else {
      setFormData({ ...formData, categoria: value });
    }
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    const isInUse = expensesList.some(expense => expense.categoria === categoryToDelete);
    
    if (isInUse) {
      const confirmDelete = window.confirm(
        `A categoria "${categoryToDelete}" está sendo usada em ${expensesList.filter(e => e.categoria === categoryToDelete).length} gasto(s). Deseja realmente excluir? Os gastos associados não serão excluídos, mas ficarão sem categoria.`
      );
      if (!confirmDelete) return;
    }

    setCategories(categories.filter(cat => cat !== categoryToDelete));
    
    // Se a categoria sendo deletada é a que está selecionada no form, limpar a seleção
    if (formData.categoria === categoryToDelete) {
      setFormData({ ...formData, categoria: "" });
    }
  };

  const sortedExpenses = [...expensesList].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    let comparison = 0;

    if (sortField === "valor") {
      comparison = a.valor - b.valor;
    } else if (sortField === "data") {
      comparison = new Date(a.data).getTime() - new Date(b.data).getTime();
    } else {
      comparison = a[sortField].localeCompare(b[sortField]);
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortDirection === "asc") {
      return (
        <svg className="w-4 h-4 ml-1 text-slate-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 ml-1 text-slate-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-50 mb-2">
            Controle Financeiro
          </h1>
          <p className="text-slate-400">
            Gerencie seus gastos de forma simples e eficiente
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-slate-800/50 rounded-lg shadow-sm p-6 mb-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">
                Total de Gastos - Dezembro 2025
              </p>
              <p className="text-3xl font-bold text-slate-50">
                R$ {totalGastos.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <div className="bg-slate-800 rounded-full p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-slate-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800/50 rounded-lg shadow-sm border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-slate-50">
                  {getMonthYear(selectedPeriod)}
                </h2>
              </div>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-slate-200">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="2025-12" className="text-slate-200 focus:bg-slate-700 focus:text-slate-50">
                    Dezembro 2025
                  </SelectItem>
                  <SelectItem value="2025-11" className="text-slate-200 focus:bg-slate-700 focus:text-slate-50">
                    Novembro 2025
                  </SelectItem>
                  <SelectItem value="2025-10" className="text-slate-200 focus:bg-slate-700 focus:text-slate-50">
                    Outubro 2025
                  </SelectItem>
                  <SelectItem value="2025-09" className="text-slate-200 focus:bg-slate-700 focus:text-slate-50">
                    Setembro 2025
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleOpenAddDialog}
                variant="outline"
                size="sm"
                className="bg-slate-700 hover:bg-slate-600 border-slate-600 cursor-pointer"
              >
                Adicionar
              </Button>
              <Button
                onClick={handleOpenEditDialog}
                variant="outline"
                size="sm"
                disabled={selectedIds.length !== 1}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed border-slate-600 cursor-pointer"
              >
                Editar
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                disabled={selectedIds.length === 0}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Excluir {selectedIds.length > 0 && `(${selectedIds.length})`}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 pl-6">
                    <Checkbox
                      checked={selectedIds.length === expensesList.length && expensesList.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead
                    className="font-semibold cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => handleSort("gasto")}
                  >
                    <div className="flex items-center">
                      Gasto
                      <SortIcon field="gasto" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="font-semibold cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => handleSort("valor")}
                  >
                    <div className="flex items-center">
                      Valor
                      <SortIcon field="valor" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="font-semibold cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => handleSort("categoria")}
                  >
                    <div className="flex items-center">
                      Categoria
                      <SortIcon field="categoria" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="font-semibold cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => handleSort("data")}
                  >
                    <div className="flex items-center">
                      Data
                      <SortIcon field="data" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="font-semibold cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => handleSort("descricao")}
                  >
                    <div className="flex items-center">
                      Descrição
                      <SortIcon field="descricao" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="py-4 pl-6">
                      <Checkbox
                        checked={selectedIds.includes(expense.id)}
                        onCheckedChange={(checked) => handleSelectOne(expense.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium py-4">
                      {expense.gasto}
                    </TableCell>
                    <TableCell className="text-slate-50 font-semibold py-4">
                      R$ {expense.valor.toFixed(2).replace(".", ",")}
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                        {expense.categoria}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-400 py-4">
                      {new Date(expense.data).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-slate-400 max-w-xs truncate py-4">
                      {expense.descricao}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Dialog de Adicionar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-50">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Editar Gasto" : "Adicionar Gasto"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingExpense ? "Edite as informações do gasto abaixo." : "Preencha as informações do novo gasto."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="gasto">Título *</Label>
              <Input
                id="gasto"
                value={formData.gasto}
                onChange={(e) => setFormData({ ...formData, gasto: e.target.value })}
                maxLength={20}
                className="bg-slate-700 border-slate-600 text-slate-50"
                placeholder="Ex: Supermercado"
              />
              <span className="text-xs text-slate-500">{formData.gasto.length}/20 caracteres</span>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="valor">Valor *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                className="bg-slate-700 border-slate-600 text-slate-50"
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={formData.categoria} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-slate-50">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="text-slate-200 focus:bg-slate-700 focus:text-slate-50">
                      {category}
                    </SelectItem>
                  ))}
                  <SelectItem value="__manage__" className="focus:bg-slate-700 font-bold border-t border-slate-600 pt-2 mt-1">
                    Gerenciar categorias
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="data">Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-slate-50 hover:bg-slate-600 hover:text-slate-50 cursor-pointer"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data ? format(new Date(formData.data + 'T00:00:00'), "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                  <Calendar
                    mode="single"
                    selected={formData.data ? new Date(formData.data + 'T00:00:00') : undefined}
                    onSelect={(date) => setFormData({ ...formData, data: date ? format(date, "yyyy-MM-dd") : "" })}
                    initialFocus
                    className="bg-slate-800 text-slate-50"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                maxLength={100}
                className="bg-slate-700 border-slate-600 text-slate-50 resize-none"
                placeholder="Descrição opcional..."
                rows={3}
              />
              <span className="text-xs text-slate-500">{formData.descricao.length}/100 caracteres</span>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="destructive" 
              onClick={() => setIsDialogOpen(false)} 
              className="bg-slate-700 hover:bg-slate-600 border-slate-600 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveExpense}  
              className="bg-slate-700 hover:bg-slate-600 border-slate-600 cursor-pointer"
              variant="outline"
            >
              {editingExpense ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Adicionar Categoria */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription className="text-slate-400">
              Digite o nome da nova categoria.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newCategory">Categoria *</Label>
              <Input
                id="newCategory"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-50"
                placeholder="Ex: Investimentos"
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="destructive"
              onClick={() => {
                setIsAddCategoryDialogOpen(false);
                setNewCategoryName("");
              }} 
              className="bg-slate-700 hover:bg-slate-600 border-slate-600 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddCategory}  
              className="bg-slate-700 hover:bg-slate-600 border-slate-600 cursor-pointer"
              variant="outline"
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gerenciar Categorias */}
      <Dialog open={isManageCategoriesDialogOpen} onOpenChange={setIsManageCategoriesDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
            <DialogDescription className="text-slate-400">
              Adicione ou exclua categorias.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* Adicionar Nova Categoria */}
            <div className="mb-4 pb-4 border-b border-slate-700">
              <Label htmlFor="newCategoryInline" className="text-sm font-medium mb-2 block">
                Nova Categoria
              </Label>
              <div className="flex gap-2">
                <Input
                  id="newCategoryInline"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-slate-50 flex-1"
                  placeholder="Ex: Investimentos"
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <Button
                  onClick={handleAddCategory}
                  className="bg-slate-700 hover:bg-slate-600 border-slate-600 cursor-pointer"
                  variant="outline"
                >
                  Adicionar
                </Button>
              </div>
            </div>
            
            {/* Lista de Categorias */}
            <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
              <div className="space-y-2">
              {categories.map((category) => {
                const usageCount = expensesList.filter(e => e.categoria === category).length;
                return (
                  <div key={category} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600 w-[99%]">
                    <div className="flex flex-col">
                      <span className="text-slate-50 font-medium">{category}</span>
                      {usageCount > 0 && (
                        <span className="text-xs text-slate-400">Usado em {usageCount} gasto(s)</span>
                      )}
                    </div>
                    <Button
                      onClick={() => handleDeleteCategory(category)}
                      variant="destructive"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 h-8 cursor-pointer"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <p className="text-slate-400 text-center py-8">Nenhuma categoria cadastrada.</p>
              )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
