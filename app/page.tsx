"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy
} from "firebase/firestore";
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
import { CalendarIcon, Trash, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Expense {
  id: string;
  despesa: string;
  valor: number;
  categoria: string;
  data: string;
  descricao: string;
}

interface Provento {
  id: string;
  valor: number;
  periodo: string; // formato: "YYYY-MM"
  descricao: string;
}

type SortField = "despesa" | "valor" | "categoria" | "data" | "descricao";
type SortDirection = "asc" | "desc" | null;

export default function Home() {
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [expensesList, setExpensesList] = useState<Expense[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    despesa: "",
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
  const [proventosList, setProventosList] = useState<Provento[]>([]);
  const [isProventosDialogOpen, setIsProventosDialogOpen] = useState(false);
  const [proventoFormData, setProventoFormData] = useState({
    valor: "",
    descricao: "",
  });
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Carregar despesas do Firestore
  useEffect(() => {
    loadExpenses();
    loadCategories();
    loadProventos();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "despesas"), orderBy("data", "desc"));
      const querySnapshot = await getDocs(q);
      const expensesData: Expense[] = [];
      querySnapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() } as Expense);
      });
      setExpensesList(expensesData);
    } catch (error) {
      console.error("Erro ao carregar despesas:", error);
      toast.error("Erro ao carregar despesas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categorias"));
      const categoriesData: string[] = [];
      querySnapshot.forEach((doc) => {
        categoriesData.push(doc.data().nome);
      });
      if (categoriesData.length > 0) {
        setCategories(categoriesData);
      } else {
        // Se não houver categorias, criar as padrões
        const defaultCategories = [
          "Alimentação",
          "Moradia",
          "Transporte",
          "Entretenimento",
          "Saúde",
          "Educação",
          "Outros",
        ];
        for (const category of defaultCategories) {
          await addDoc(collection(db, "categorias"), { nome: category });
        }
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const loadProventos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "proventos"));
      const proventosData: Provento[] = [];
      querySnapshot.forEach((doc) => {
        proventosData.push({ id: doc.id, ...doc.data() } as Provento);
      });
      setProventosList(proventosData);
    } catch (error) {
      console.error("Erro ao carregar proventos:", error);
    }
  };

  // Filtrar despesas pelo período selecionado
  const filteredExpenses = expensesList.filter((expense) => {
    const expenseDate = new Date(expense.data + 'T00:00:00');
    const expenseMonth = expenseDate.getMonth() + 1; // 1-12
    const expenseYear = expenseDate.getFullYear();

    const [selectedYear, selectedMonth] = selectedPeriod.split("-");

    return expenseYear === parseInt(selectedYear) && expenseMonth === parseInt(selectedMonth);
  });

  // Calcular total apenas das despesas filtradas
  const totalDespesas = filteredExpenses.reduce((acc, expense) => acc + expense.valor, 0);

  // Calcular total de proventos do período selecionado
  const proventoPeriodo = proventosList.find(p => p.periodo === selectedPeriod);
  const totalProventos = proventoPeriodo ? proventoPeriodo.valor : 0;

  // Calcular saldo (proventos - despesas)
  const saldo = totalProventos - totalDespesas;

  // Gerar lista de períodos disponíveis (mês atual + meses com despesas)
  const getAvailablePeriods = () => {
    const periods = new Set<string>();

    // Adicionar mês atual
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    periods.add(currentPeriod);

    // Adicionar meses que têm despesas
    expensesList.forEach((expense) => {
      const expenseDate = new Date(expense.data + 'T00:00:00');
      const period = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
      periods.add(period);
    });

    // Converter para array e ordenar (mais recente primeiro)
    return Array.from(periods).sort((a, b) => b.localeCompare(a));
  };

  const availablePeriods = getAvailablePeriods();

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
      setSelectedIds(filteredExpenses.map(expense => expense.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const openConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialogData({ title, message, onConfirm });
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmAction = () => {
    confirmDialogData.onConfirm();
    setIsConfirmDialogOpen(false);
  };

  const handleDelete = async () => {
    const count = selectedIds.length;
    openConfirmDialog(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir ${count} despesa${count > 1 ? "s" : ""}? Esta ação não pode ser desfeita.`,
      async () => {
        try {
          for (const id of selectedIds) {
            await deleteDoc(doc(db, "despesas", id));
          }
          setExpensesList(expensesList.filter(expense => !selectedIds.includes(expense.id)));
          setSelectedIds([]);
          toast.success(`${count} despesa${count > 1 ? "s excluídas" : " excluída"} com sucesso!`);
        } catch (error) {
          console.error("Erro ao deletar despesas:", error);
          toast.error("Erro ao deletar despesas. Tente novamente.");
        }
      }
    );
  };

  const handleOpenAddDialog = () => {
    setEditingExpense(null);
    setFormData({
      despesa: "",
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
        despesa: expense.despesa,
        valor: expense.valor.toString(),
        categoria: expense.categoria,
        data: expense.data,
        descricao: expense.descricao,
      });
      setIsDialogOpen(true);
    }
  };

  const handleSaveExpense = async () => {
    if (!formData.despesa || !formData.valor || !formData.categoria || !formData.data) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (formData.despesa.length > 20) {
      toast.error("O título deve ter no máximo 20 caracteres.");
      return;
    }

    if (formData.descricao.length > 100) {
      toast.error("A descrição deve ter no máximo 100 caracteres.");
      return;
    }

    const saveExpense = async () => {
      try {
        const expenseData = {
          despesa: formData.despesa,
          valor: parseFloat(formData.valor),
          categoria: formData.categoria,
          data: formData.data,
          descricao: formData.descricao,
        };

        if (editingExpense) {
          // Editar
          await updateDoc(doc(db, "despesas", editingExpense.id), expenseData);
          setExpensesList(expensesList.map(expense =>
            expense.id === editingExpense.id
              ? { ...expense, ...expenseData }
              : expense
          ));
        } else {
          // Adicionar
          const docRef = await addDoc(collection(db, "despesas"), expenseData);
          const newExpense: Expense = {
            id: docRef.id,
            ...expenseData,
          };
          setExpensesList([...expensesList, newExpense]);
        }

        setIsDialogOpen(false);
        setSelectedIds([]);
        toast.success(editingExpense ? "Despesa atualizada com sucesso!" : "Despesa adicionada com sucesso!");
      } catch (error) {
        console.error("Erro ao salvar despesa:", error);
        toast.error("Erro ao salvar despesa. Tente novamente.");
      }
    };

    // Se estiver editando, mostrar confirmação
    if (editingExpense) {
      openConfirmDialog(
        "Confirmar Edição",
        `Deseja salvar as alterações na despesa "${formData.despesa}"?`,
        saveExpense
      );
    } else {
      // Se estiver adicionando, salvar diretamente
      await saveExpense();
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Por favor, digite um nome para a categoria.");
      return;
    }

    if (categories.includes(newCategoryName.trim())) {
      toast.error("Esta categoria já existe.");
      return;
    }

    try {
      await addDoc(collection(db, "categorias"), { nome: newCategoryName.trim() });
      setCategories([...categories, newCategoryName.trim()]);
      setFormData({ ...formData, categoria: newCategoryName.trim() });
      setNewCategoryName("");
      setIsAddCategoryDialogOpen(false);
      setIsManageCategoriesDialogOpen(false);
      toast.success("Categoria adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);
      toast.error("Erro ao adicionar categoria. Tente novamente.");
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === "__manage__") {
      setIsManageCategoriesDialogOpen(true);
    } else {
      setFormData({ ...formData, categoria: value });
    }
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
    const isInUse = expensesList.some(expense => expense.categoria === categoryToDelete);

    if (isInUse) {
      const confirmDelete = window.confirm(
        `A categoria "${categoryToDelete}" está sendo usada em ${expensesList.filter(e => e.categoria === categoryToDelete).length} despesa(s). Deseja realmente excluir? As despesas associadas não serão excluídas, mas ficarão sem categoria.`
      );
      if (!confirmDelete) return;
    }

    try {
      // Encontrar e deletar o documento da categoria
      const querySnapshot = await getDocs(collection(db, "categorias"));
      querySnapshot.forEach(async (document) => {
        if (document.data().nome === categoryToDelete) {
          await deleteDoc(doc(db, "categorias", document.id));
        }
      });

      setCategories(categories.filter(cat => cat !== categoryToDelete));

      // Se a categoria sendo deletada é a que está selecionada no form, limpar a seleção
      if (formData.categoria === categoryToDelete) {
        setFormData({ ...formData, categoria: "" });
      }
      toast.success("Categoria excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao deletar categoria:", error);
      toast.error("Erro ao deletar categoria. Tente novamente.");
    }
  };

  const handleOpenProventosDialog = () => {
    const provento = proventosList.find(p => p.periodo === selectedPeriod);
    if (provento) {
      setProventoFormData({
        valor: provento.valor.toString(),
        descricao: provento.descricao,
      });
    } else {
      setProventoFormData({
        valor: "",
        descricao: "",
      });
    }
    setIsProventosDialogOpen(true);
  };

  const handleSaveProvento = async () => {
    if (!proventoFormData.valor) {
      toast.error("Por favor, preencha o valor.");
      return;
    }

    try {
      const proventoData = {
        valor: parseFloat(proventoFormData.valor),
        periodo: selectedPeriod,
        descricao: proventoFormData.descricao,
      };

      const existingProvento = proventosList.find(p => p.periodo === selectedPeriod);

      if (existingProvento) {
        // Atualizar provento existente
        await updateDoc(doc(db, "proventos", existingProvento.id), proventoData);
        setProventosList(proventosList.map(p =>
          p.id === existingProvento.id
            ? { ...p, ...proventoData }
            : p
        ));
      } else {
        // Criar novo provento
        const docRef = await addDoc(collection(db, "proventos"), proventoData);
        setProventosList([...proventosList, { id: docRef.id, ...proventoData }]);
      }

      setIsProventosDialogOpen(false);
      toast.success(existingProvento ? "Proventos atualizados com sucesso!" : "Proventos adicionados com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar provento:", error);
      toast.error("Erro ao salvar provento. Tente novamente.");
    }
  };

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    let comparison = 0;

    if (sortField === "valor") {
      comparison = a.valor - b.valor;
    } else if (sortField === "data") {
      comparison = new Date(a.data + 'T00:00:00').getTime() - new Date(b.data + 'T00:00:00').getTime();
    } else {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";
      comparison = aValue.toString().localeCompare(bValue.toString());
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
      <div className="container mx-auto px-4 xl:px-24 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-50 mb-2">
            Personal Finance
          </h1>
          <p className="text-slate-400">
            Gerencie suas despesas de forma simples e eficiente
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-slate-800/50 rounded-lg shadow-sm p-6 mb-6 border border-slate-700 flex justify-between">
          <div className="flex gap-24">
            {/* Proventos */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm text-slate-400">Proventos</p>
                <button
                  onClick={handleOpenProventosDialog}
                  className="text-slate-400 hover:text-slate-50 transition-colors cursor-pointer"
                  title={totalProventos > 0 ? "Editar proventos" : "Adicionar proventos"}
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
              <p className="text-2xl font-bold text-green-400">
                R$ {totalProventos.toFixed(2).replace(".", ",")}
              </p>
            </div>

            {/* Despesas */}
            <div className="flex flex-col">
              <p className="text-sm text-slate-400 mb-2">Despesas</p>
              <p className="text-2xl font-bold text-red-400">
                R$ {totalDespesas.toFixed(2).replace(".", ",")}
              </p>
            </div>

            {/* Saldo */}
            <div className="flex flex-col">
              <p className="text-sm text-slate-400 mb-2">Saldo</p>
              <p className={`text-2xl font-bold ${saldo >= 0 ? "text-blue-400" : "text-orange-400"
                }`}>
                R$ {saldo >= 0 ? "" : "-"}{Math.abs(saldo).toFixed(2).replace(".", ",")}
              </p>
            </div>
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
                  {availablePeriods.map((period) => (
                    <SelectItem
                      key={period}
                      value={period}
                      className="text-slate-200 focus:bg-slate-700 focus:text-slate-50"
                    >
                      {getMonthYear(period)}
                    </SelectItem>
                  ))}
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
                      checked={selectedIds.length === filteredExpenses.length && filteredExpenses.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead
                    className="font-semibold cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => handleSort("despesa")}
                  >
                    <div className="flex items-center">
                      Despesa
                      <SortIcon field="despesa" />
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
                      {expense.despesa}
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
                      {new Date(expense.data + 'T00:00:00').toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-slate-400 max-w-xs truncate py-4">
                      {expense.descricao}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-50"></div>
            </div>
          )}
          {!loading && filteredExpenses.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <p className="text-slate-400">
                {expensesList.length === 0
                  ? "Nenhuma despesa cadastrada. Clique em 'Adicionar' para começar."
                  : "Nenhuma despesa encontrada neste período."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de Adicionar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-50">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Editar Despesa" : "Adicionar Despesa"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingExpense ? "Edite as informações da despesa abaixo." : "Preencha as informações da nova despesa."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="despesa">Título *</Label>
              <Input
                id="despesa"
                value={formData.despesa}
                onChange={(e) => setFormData({ ...formData, despesa: e.target.value })}
                maxLength={20}
                className="bg-slate-700 border-slate-600 text-slate-50"
                placeholder="Ex: Supermercado"
              />
              <span className="text-xs text-slate-500">{formData.despesa.length}/20 caracteres</span>
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

      {/* Dialog de Proventos */}
      <Dialog open={isProventosDialogOpen} onOpenChange={setIsProventosDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Proventos de {getMonthYear(selectedPeriod)}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Informe o total de proventos (salário, renda, etc.) deste mês.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="valorProvento">Valor Total *</Label>
              <Input
                id="valorProvento"
                type="number"
                step="0.01"
                value={proventoFormData.valor}
                onChange={(e) => setProventoFormData({ ...proventoFormData, valor: e.target.value })}
                className="bg-slate-700 border-slate-600 text-slate-50"
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricaoProvento">Descrição</Label>
              <Textarea
                id="descricaoProvento"
                value={proventoFormData.descricao}
                onChange={(e) => setProventoFormData({ ...proventoFormData, descricao: e.target.value })}
                maxLength={100}
                className="bg-slate-700 border-slate-600 text-slate-50 resize-none"
                placeholder="Ex: Salário, freelance, rendimentos..."
                rows={3}
              />
              <span className="text-xs text-slate-500">{proventoFormData.descricao.length}/100 caracteres</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => setIsProventosDialogOpen(false)}
              className="bg-slate-700 hover:bg-slate-600 border-slate-600 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveProvento}
              className="bg-slate-700 hover:bg-slate-600 border-slate-600 cursor-pointer"
              variant="outline"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmDialogData.title}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {confirmDialogData.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
              className="bg-slate-700 hover:bg-slate-600 border-slate-600 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              Confirmar
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
                          <span className="text-xs text-slate-400">Usado em {usageCount} despesa(s)</span>
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
