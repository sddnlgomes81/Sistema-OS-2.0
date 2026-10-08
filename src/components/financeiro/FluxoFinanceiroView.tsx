import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Printer,
  Plus,
  Trash2,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  CreditCard,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  X,
  Tag,
  AlertCircle,
  Percent,
  Wallet,
} from 'lucide-react';
import {
  Configuracoes,
  DespesaFinanceira,
  FormaPagamento,
  OrdemServico,
  CategoriaDespesa,
} from '../../types';
import {
  formatarData,
  formatarDataHora,
  formatarMoeda,
  formatarTelefone,
} from '../../utils/validation';
import { dataStore } from '../../services/storage';

interface Props {
  ordens: OrdemServico[];
  config: Configuracoes;
  onPrintOS: (ordem: OrdemServico) => void;
  onPrintCupom: (ordem: OrdemServico) => void;
  onPrintRelatorio: (dados: {
    periodoNome: string;
    resumo: any;
    porForma: Record<string, number>;
    ordensPagas: OrdemServico[];
    despesas: DespesaFinanceira[];
  }) => void;
}

type PeriodoFiltro = 'hoje' | '7dias' | '30dias' | 'mes_atual' | 'todos';

const CATEGORIAS_DESPESA: { label: string; value: CategoriaDespesa }[] = [
  { label: 'Peças de Reposição', value: 'pecas' },
  { label: 'Insumos & Tintas', value: 'insumos' },
  { label: 'Ferramentas & Oficina', value: 'ferramentas' },
  { label: 'Contas & Estrutura', value: 'contas' },
  { label: 'Transporte & Frete', value: 'transporte' },
  { label: 'Outros', value: 'outros' },
];

export const FluxoFinanceiroView: React.FC<Props> = ({
  ordens,
  config,
  onPrintOS,
  onPrintCupom,
  onPrintRelatorio,
}) => {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('todos');
  const [abaAtiva, setAbaAtiva] = useState<
    'todas' | 'recebidas' | 'a_receber' | 'despesas'
  >('todas');
  const [busca, setBusca] = useState('');
  const [despesas, setDespesas] = useState<DespesaFinanceira[]>([]);
  const [modalNovaDespesa, setModalNovaDespesa] = useState(false);

  // Formulário de nova despesa
  const [descDespesa, setDescDespesa] = useState('');
  const [catDespesa, setCatDespesa] = useState<CategoriaDespesa>('pecas');
  const [valorDespesa, setValorDespesa] = useState<string>('');
  const [dataDespesa, setDataDespesa] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [formaDespesa, setFormaDespesa] = useState<FormaPagamento>('Pix');
  const [obsDespesa, setObsDespesa] = useState('');
  const [erroDespesa, setErroDespesa] = useState<string | null>(null);

  // Carregar despesas do dataStore
  const recarregarDespesas = async () => {
    const dados = await dataStore.getDespesas();
    setDespesas(dados);
  };

  useEffect(() => {
    recarregarDespesas();
    const unsub = dataStore.subscribe(() => {
      recarregarDespesas();
    });
    return unsub;
  }, []);

  // Filtro de data
  const dataLimite = useMemo(() => {
    const agora = new Date();
    if (periodo === 'hoje') {
      const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      return inicioHoje.getTime();
    }
    if (periodo === '7dias') {
      return agora.getTime() - 7 * 86400000;
    }
    if (periodo === '30dias') {
      return agora.getTime() - 30 * 86400000;
    }
    if (periodo === 'mes_atual') {
      const primeiroDoMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
      return primeiroDoMes.getTime();
    }
    return 0; // todos
  }, [periodo]);

  const nomePeriodo = useMemo(() => {
    switch (periodo) {
      case 'hoje':
        return 'Hoje';
      case '7dias':
        return 'Últimos 7 dias';
      case '30dias':
        return 'Últimos 30 dias';
      case 'mes_atual':
        return 'Mês Atual';
      case 'todos':
      default:
        return 'Todo o Histórico';
    }
  }, [periodo]);

  // Ordens com pagamento (recebidas)
  const ordensPagasFiltradas = useMemo(() => {
    return ordens.filter((o) => {
      // Tem pagamento ou status entregue com valor
      const temPagamento = !!o.pagamento || (o.status === 'entregue' && (o.orcamento?.total || 0) > 0);
      if (!temPagamento) return false;

      const dataOS = o.pagamento?.data || o.criado_em;
      const time = new Date(dataOS).getTime();
      return time >= dataLimite;
    });
  }, [ordens, dataLimite]);

  // Ordens a receber (autorizadas ou prontas para entrega ou aguardando pagamento)
  const ordensAReceber = useMemo(() => {
    return ordens.filter(
      (o) =>
        (o.status === 'autorizado' ||
          o.status === 'pronto' ||
          o.status === 'aguardando_pagamento') &&
        (o.orcamento?.total || 0) > 0
    );
  }, [ordens]);

  // Despesas filtradas por período
  const despesasFiltradas = useMemo(() => {
    return despesas.filter((d) => {
      const time = new Date(d.data).getTime();
      return time >= dataLimite;
    });
  }, [despesas, dataLimite]);

  // Cálculos financeiros
  const totais = useMemo(() => {
    let totalRecebido = 0;
    let totalMaoDeObra = 0;
    let totalPecas = 0;

    ordensPagasFiltradas.forEach((o) => {
      const valor = o.pagamento?.total_pago || o.orcamento?.total || 0;
      totalRecebido += valor;
      totalMaoDeObra += o.orcamento?.mao_de_obra || 0;
      const pecasDaOS =
        o.orcamento?.itens.reduce((acc, it) => acc + it.qtd * it.valor_unit, 0) || 0;
      totalPecas += pecasDaOS;
    });

    const totalAReceber = ordensAReceber.reduce(
      (acc, o) => acc + (o.orcamento?.total || 0),
      0
    );

    const totalDespesas = despesasFiltradas.reduce((acc, d) => acc + d.valor, 0);

    const saldoLiquido = totalRecebido - totalDespesas;

    const ticketMedio =
      ordensPagasFiltradas.length > 0
        ? totalRecebido / ordensPagasFiltradas.length
        : 0;

    return {
      totalRecebido,
      totalAReceber,
      totalDespesas,
      saldoLiquido,
      ticketMedio,
      totalMaoDeObra,
      totalPecas,
      qtdRecebidas: ordensPagasFiltradas.length,
      qtdAReceber: ordensAReceber.length,
    };
  }, [ordensPagasFiltradas, ordensAReceber, despesasFiltradas]);

  // Distribuição por Forma de Pagamento
  const porForma = useMemo(() => {
    const mapa: Record<string, number> = {
      Pix: 0,
      Dinheiro: 0,
      'Cartão de Débito': 0,
      'Cartão de Crédito': 0,
    };

    ordensPagasFiltradas.forEach((o) => {
      const forma = o.pagamento?.forma || 'Pix';
      const valor = o.pagamento?.total_pago || o.orcamento?.total || 0;
      mapa[forma] = (mapa[forma] || 0) + valor;
    });

    return mapa;
  }, [ordensPagasFiltradas]);

  // Movimentações combinadas para o extrato geral
  type Movimentacao =
    | {
        tipo: 'entrada';
        id: string;
        data: string;
        descricao: string;
        subtitulo: string;
        forma: string;
        valor: number;
        ordemOriginal: OrdemServico;
      }
    | {
        tipo: 'saida';
        id: string;
        data: string;
        descricao: string;
        subtitulo: string;
        forma: string;
        valor: number;
        categoria: CategoriaDespesa;
        despesaOriginal: DespesaFinanceira;
      };

  const todasMovimentacoes = useMemo<Movimentacao[]>(() => {
    const lista: Movimentacao[] = [];

    ordensPagasFiltradas.forEach((o) => {
      lista.push({
        tipo: 'entrada',
        id: `ent-${o.id}`,
        data: o.pagamento?.data || o.criado_em,
        descricao: `O.S. #${o.numero} - ${o.cliente_snapshot.nome_ou_razao}`,
        subtitulo: `${o.impressora.marca} ${o.impressora.modelo}`,
        forma: o.pagamento?.forma || 'À vista',
        valor: o.pagamento?.total_pago || o.orcamento?.total || 0,
        ordemOriginal: o,
      });
    });

    despesasFiltradas.forEach((d) => {
      lista.push({
        tipo: 'saida',
        id: `sai-${d.id}`,
        data: d.data,
        descricao: d.descricao,
        subtitulo: `Despesa: ${d.categoria.toUpperCase()}${
          d.observacao ? ` • ${d.observacao}` : ''
        }`,
        forma: d.forma_pagamento || '-',
        valor: d.valor,
        categoria: d.categoria,
        despesaOriginal: d,
      });
    });

    // Ordenar mais recentes primeiro
    return lista.sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  }, [ordensPagasFiltradas, despesasFiltradas]);

  // Filtro de busca na lista ativa
  const movimentacoesFiltradas = useMemo(() => {
    if (!busca.trim()) return todasMovimentacoes;
    const b = busca.toLowerCase();
    return todasMovimentacoes.filter(
      (m) =>
        m.descricao.toLowerCase().includes(b) ||
        m.subtitulo.toLowerCase().includes(b) ||
        m.forma.toLowerCase().includes(b)
    );
  }, [todasMovimentacoes, busca]);

  // Handler para salvar despesa
  const handleSalvarDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = parseFloat(valorDespesa.replace(',', '.'));
    if (!descDespesa.trim()) {
      setErroDespesa('Informe a descrição da despesa.');
      return;
    }
    if (isNaN(valorNum) || valorNum <= 0) {
      setErroDespesa('Informe um valor monetário válido maior que zero.');
      return;
    }

    try {
      await dataStore.saveDespesa({
        descricao: descDespesa.trim(),
        categoria: catDespesa,
        valor: valorNum,
        data: new Date(dataDespesa).toISOString(),
        forma_pagamento: formaDespesa,
        observacao: obsDespesa.trim() || undefined,
      });

      // Limpar formulário
      setDescDespesa('');
      setValorDespesa('');
      setObsDespesa('');
      setErroDespesa(null);
      setModalNovaDespesa(false);
      await recarregarDespesas();
    } catch (err) {
      setErroDespesa('Erro ao registrar despesa.');
    }
  };

  const handleExcluirDespesa = async (id: string) => {
    if (window.confirm('Deseja realmente remover esta despesa do fluxo financeiro?')) {
      await dataStore.deleteDespesa(id);
      await recarregarDespesas();
    }
  };

  const dispararImpressaoRelatorio = () => {
    onPrintRelatorio({
      periodoNome: nomePeriodo,
      resumo: totais,
      porForma,
      ordensPagas: ordensPagasFiltradas,
      despesas: despesasFiltradas,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* CABEÇALHO DO FLUXO FINANCEIRO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Fluxo Financeiro & Caixa
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle de receitas por O.S., contas a receber, despesas operacionais e saldo líquido
              </p>
            </div>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO SUPERIORES */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModalNovaDespesa(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Lançar Despesa</span>
          </button>

          <button
            type="button"
            onClick={dispararImpressaoRelatorio}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Fechamento de Caixa</span>
          </button>
        </div>
      </div>

      {/* SELETOR DE PERÍODO RÁPIDO */}
      <div className="bg-slate-100/80 p-1.5 rounded-xl flex items-center gap-1.5 overflow-x-auto border border-slate-200 text-xs font-semibold">
        <span className="text-slate-500 px-3 flex items-center gap-1 text-[11px] uppercase font-bold shrink-0">
          <Calendar className="w-3.5 h-3.5" />
          <span>Período:</span>
        </span>
        <button
          onClick={() => setPeriodo('hoje')}
          className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
            periodo === 'hoje'
              ? 'bg-white text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Hoje
        </button>
        <button
          onClick={() => setPeriodo('7dias')}
          className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
            periodo === '7dias'
              ? 'bg-white text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Últimos 7 dias
        </button>
        <button
          onClick={() => setPeriodo('30dias')}
          className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
            periodo === '30dias'
              ? 'bg-white text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Últimos 30 dias
        </button>
        <button
          onClick={() => setPeriodo('mes_atual')}
          className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
            periodo === 'mes_atual'
              ? 'bg-white text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Este Mês
        </button>
        <button
          onClick={() => setPeriodo('todos')}
          className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
            periodo === 'todos'
              ? 'bg-white text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todo o Período
        </button>
      </div>

      {/* CARDS DE INDICADORES PRINCIPAIS (KPIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL RECEBIDO (ENTRADAS DE O.S.) */}
        <div className="bg-white rounded-2xl p-5 border-2 border-emerald-500 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-emerald-800 tracking-wider">
              Receitas Efetivadas
            </span>
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <ArrowUpRight className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {formatarMoeda(totais.totalRecebido)}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{totais.qtdRecebidas} ordens finalizadas e pagas</span>
            </div>
          </div>
        </div>

        {/* DESPESAS / SAÍDAS */}
        <div className="bg-white rounded-2xl p-5 border-2 border-rose-400 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-rose-800 tracking-wider">
              Despesas & Saídas
            </span>
            <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <ArrowDownRight className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 font-mono tracking-tight">
              {formatarMoeda(totais.totalDespesas)}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-700 font-bold">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{despesasFiltradas.length} lançamentos operacionais</span>
            </div>
          </div>
        </div>

        {/* SALDO OPERACIONAL LÍQUIDO */}
        <div className="bg-white rounded-2xl p-5 border-2 border-indigo-500 shadow-sm relative overflow-hidden bg-gradient-to-br from-indigo-50/50 to-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-indigo-900 tracking-wider">
              Saldo Líquido em Caixa
            </span>
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Wallet className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                totais.saldoLiquido >= 0 ? 'text-indigo-900' : 'text-rose-600'
              }`}
            >
              {formatarMoeda(totais.saldoLiquido)}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-indigo-700 font-bold">
              <span>(Total Recebido - Despesas)</span>
            </div>
          </div>
        </div>

        {/* PREVISÃO A RECEBER (O.S. EM ANDAMENTO) */}
        <div className="bg-white rounded-2xl p-5 border-2 border-blue-400 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-blue-800 tracking-wider">
              Previsão a Receber
            </span>
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-blue-700 font-mono tracking-tight">
              {formatarMoeda(totais.totalAReceber)}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-800 font-bold">
              <span>{totais.qtdAReceber} O.S. aprovadas em reparo/prontas</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE COMPOSIÇÃO: MÃO DE OBRA, PEÇAS E TICKET MÉDIO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Mão de Obra (Serviços)
            </span>
            <p className="text-lg font-black text-slate-900 font-mono mt-0.5">
              {formatarMoeda(totais.totalMaoDeObra)}
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg">
            {totais.totalRecebido > 0
              ? `${Math.round((totais.totalMaoDeObra / totais.totalRecebido) * 100)}% da receita`
              : '0%'}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Peças & Insumos Trocados
            </span>
            <p className="text-lg font-black text-slate-900 font-mono mt-0.5">
              {formatarMoeda(totais.totalPecas)}
            </p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
            {totais.totalRecebido > 0
              ? `${Math.round((totais.totalPecas / totais.totalRecebido) * 100)}% da receita`
              : '0%'}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Ticket Médio por O.S.
            </span>
            <p className="text-lg font-black text-slate-900 font-mono mt-0.5">
              {formatarMoeda(totais.ticketMedio)}
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
            Média p/ Máquina
          </span>
        </div>
      </div>

      {/* DISTRIBUIÇÃO POR FORMA DE PAGAMENTO */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-600" />
          <span>Recebimentos por Forma de Pagamento</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {Object.entries(porForma).map(([forma, valor]) => {
            const perc =
              totais.totalRecebido > 0
                ? Math.round((valor / totais.totalRecebido) * 100)
                : 0;
            return (
              <div
                key={forma}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{forma}</span>
                  <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {perc}%
                  </span>
                </div>
                <div className="text-base font-black text-slate-900 font-mono">
                  {formatarMoeda(valor)}
                </div>
                {/* Mini barra de progresso */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${perc}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS DO EXTRATO E LISTAGEM */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* BARRA SUPERIOR COM ABAS E BUSCA */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* ABAS */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setAbaAtiva('todas')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer ${
                abaAtiva === 'todas'
                  ? 'bg-white text-indigo-700 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Extrato Geral ({todasMovimentacoes.length})
            </button>
            <button
              onClick={() => setAbaAtiva('recebidas')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer ${
                abaAtiva === 'recebidas'
                  ? 'bg-white text-emerald-700 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              O.S. Recebidas ({ordensPagasFiltradas.length})
            </button>
            <button
              onClick={() => setAbaAtiva('a_receber')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer ${
                abaAtiva === 'a_receber'
                  ? 'bg-white text-blue-700 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A Receber ({ordensAReceber.length})
            </button>
            <button
              onClick={() => setAbaAtiva('despesas')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer ${
                abaAtiva === 'despesas'
                  ? 'bg-white text-rose-700 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Despesas ({despesasFiltradas.length})
            </button>
          </div>

          {/* CAMPO DE BUSCA RÁPIDA */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por O.S., cliente, despesa..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="p-4 sm:p-5">
          {/* ABA 1: EXTRATO GERAL (ENTRADAS + SAÍDAS) */}
          {abaAtiva === 'todas' && (
            <div>
              {movimentacoesFiltradas.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <DollarSign className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-sm">Nenhuma movimentação registrada no período.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Finalize ordens de serviço ou lance despesas para alimentar o fluxo de caixa.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Data / Hora</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Descrição / Referência</th>
                        <th className="py-2.5 px-3">Forma Pgto</th>
                        <th className="py-2.5 px-3 text-right">Valor</th>
                        <th className="py-2.5 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {movimentacoesFiltradas.map((m) => (
                        <tr
                          key={m.id}
                          className="hover:bg-slate-50/80 transition group"
                        >
                          <td className="py-3 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                            {formatarDataHora(m.data)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {m.tipo === 'entrada' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <ArrowUpRight className="w-3 h-3" />
                                Entrada O.S.
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                <ArrowDownRight className="w-3 h-3" />
                                Despesa
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{m.descricao}</div>
                            <div className="text-[11px] text-slate-500">{m.subtitulo}</div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                            {m.forma}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-mono font-black text-sm whitespace-nowrap ${
                              m.tipo === 'entrada'
                                ? 'text-emerald-700'
                                : 'text-rose-600'
                            }`}
                          >
                            {m.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(m.valor)}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {m.tipo === 'entrada' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onPrintCupom(m.ordemOriginal)}
                                  title="Imprimir Cupom 80mm"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                                >
                                  <Receipt className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onPrintOS(m.ordemOriginal)}
                                  title="Imprimir Comprovante de O.S."
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleExcluirDespesa(m.despesaOriginal.id)}
                                title="Excluir Despesa"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABA 2: O.S. RECEBIDAS */}
          {abaAtiva === 'recebidas' && (
            <div>
              {ordensPagasFiltradas.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p className="font-bold text-sm">Nenhuma ordem de serviço com pagamento neste período.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">O.S. Nº</th>
                        <th className="py-2.5 px-3">Data Pgto</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">Impressora</th>
                        <th className="py-2.5 px-3">Forma</th>
                        <th className="py-2.5 px-3 text-right">Peças</th>
                        <th className="py-2.5 px-3 text-right">M. Obra</th>
                        <th className="py-2.5 px-3 text-right">Total Pago</th>
                        <th className="py-2.5 px-3 text-right">Comprovantes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ordensPagasFiltradas.map((ordem) => {
                        const pecas =
                          ordem.orcamento?.itens.reduce(
                            (acc, it) => acc + it.qtd * it.valor_unit,
                            0
                          ) || 0;
                        const mObra = ordem.orcamento?.mao_de_obra || 0;
                        const total =
                          ordem.pagamento?.total_pago || ordem.orcamento?.total || 0;

                        return (
                          <tr key={ordem.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-mono font-black text-indigo-700">
                              #{ordem.numero}
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                              {ordem.pagamento?.data
                                ? formatarDataHora(ordem.pagamento.data)
                                : formatarData(ordem.criado_em)}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900">
                              {ordem.cliente_snapshot.nome_ou_razao}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {ordem.impressora.marca} {ordem.impressora.modelo}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              {ordem.pagamento?.forma || 'À vista'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-600">
                              {formatarMoeda(pecas)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-600">
                              {formatarMoeda(mObra)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 text-sm">
                              {formatarMoeda(total)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onPrintCupom(ordem)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>Cupom</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onPrintOS(ordem)}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>O.S.</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABA 3: PREVISÃO / A RECEBER */}
          {abaAtiva === 'a_receber' && (
            <div>
              {ordensAReceber.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-sm">Nenhuma ordem de serviço com orçamento aprovado aguardando retirada.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">O.S. Nº</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">Equipamento</th>
                        <th className="py-2.5 px-3">Status Atual</th>
                        <th className="py-2.5 px-3 text-right">Mão de Obra</th>
                        <th className="py-2.5 px-3 text-right">Peças</th>
                        <th className="py-2.5 px-3 text-right">Previsão a Receber</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ordensAReceber.map((ordem) => {
                        const pecas =
                          ordem.orcamento?.itens.reduce(
                            (acc, it) => acc + it.qtd * it.valor_unit,
                            0
                          ) || 0;
                        const mObra = ordem.orcamento?.mao_de_obra || 0;
                        const total = ordem.orcamento?.total || 0;

                        return (
                          <tr key={ordem.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-mono font-black text-indigo-700">
                              #{ordem.numero}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900">
                              {ordem.cliente_snapshot.nome_ou_razao}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {ordem.impressora.marca} {ordem.impressora.modelo}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  ordem.status === 'pronto' ||
                                  ordem.status === 'aguardando_pagamento'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                }`}
                              >
                                {ordem.status === 'autorizado'
                                  ? 'Em Reparo'
                                  : ordem.status === 'pronto'
                                  ? 'Pronto p/ Entrega'
                                  : 'Aguardando Pagamento'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-600">
                              {formatarMoeda(mObra)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-600">
                              {formatarMoeda(pecas)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-black text-blue-700 text-sm">
                              {formatarMoeda(total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABA 4: DESPESAS OPERACIONAIS */}
          {abaAtiva === 'despesas' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-500">
                  Despesas registradas no caixa da oficina para dedução no resultado financeiro.
                </p>
                <button
                  type="button"
                  onClick={() => setModalNovaDespesa(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nova Despesa</span>
                </button>
              </div>

              {despesasFiltradas.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <TrendingDown className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-sm">Nenhuma despesa cadastrada no período selecionado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Data</th>
                        <th className="py-2.5 px-3">Descrição</th>
                        <th className="py-2.5 px-3">Categoria</th>
                        <th className="py-2.5 px-3">Forma Pgto</th>
                        <th className="py-2.5 px-3">Observação</th>
                        <th className="py-2.5 px-3 text-right">Valor</th>
                        <th className="py-2.5 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {despesasFiltradas.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                            {formatarData(d.data)}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {d.descricao}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                              {d.categoria}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700">
                            {d.forma_pagamento || '-'}
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-[11px]">
                            {d.observacao || '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-rose-600 text-sm">
                            - {formatarMoeda(d.valor)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleExcluirDespesa(d.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Excluir despesa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA LANÇAR NOVA DESPESA */}
      {modalNovaDespesa && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-sm">Lançar Despesa / Saída de Caixa</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNovaDespesa(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarDespesa} className="p-5 space-y-4">
              {erroDespesa && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erroDespesa}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição da Despesa *
                </label>
                <input
                  type="text"
                  required
                  value={descDespesa}
                  onChange={(e) => setDescDespesa(e.target.value)}
                  placeholder="Ex: Compra de rolete HP LaserJet M428"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={catDespesa}
                    onChange={(e) => setCatDespesa(e.target.value as CategoriaDespesa)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  >
                    {CATEGORIAS_DESPESA.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={valorDespesa}
                    onChange={(e) => setValorDespesa(e.target.value)}
                    placeholder="0,00"
                    className="w-full font-mono px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data da Saída
                  </label>
                  <input
                    type="date"
                    required
                    value={dataDespesa}
                    onChange={(e) => setDataDespesa(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={formaDespesa}
                    onChange={(e) => setFormaDespesa(e.target.value as FormaPagamento)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações (opcional)
                </label>
                <input
                  type="text"
                  value={obsDespesa}
                  onChange={(e) => setObsDespesa(e.target.value)}
                  placeholder="Nota fiscal, fornecedor, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalNovaDespesa(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
