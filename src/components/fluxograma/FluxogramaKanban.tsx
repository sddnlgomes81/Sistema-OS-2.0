import React, { useState, useMemo } from 'react';
import {
  Search,
  Clock,
  ChevronRight,
  Package,
} from 'lucide-react';
import { Cliente, OrdemServico, OSStatus } from '../../types';
import { tempoDecorrido, formatarData } from '../../utils/validation';
import { DetalhesOSModal } from './DetalhesOSModal';

interface Props {
  ordens: OrdemServico[];
  onUpdateOrdem: (id: string, updates: Partial<OrdemServico>) => Promise<void>;
  onPrintOS: (ordem: OrdemServico) => void;
  onPrintOrcamento: (ordem: OrdemServico) => void;
  onPrintCupom: (ordem: OrdemServico) => void;
  onCriarNovaOSParaCliente?: (cliente: Cliente) => void;
}

// Configuração das 7 colunas do Kanban com cores vibrantes e contrastantes reforçadas
const COLUNAS_STATUS: {
  id: OSStatus;
  numero: number;
  titulo: string;
  tituloCurto: string;
  subtitulo: string;
  corBordaTopo: string;
  corCardBorda: string;
  corHeaderBg: string;
  corIcone: string;
  corBadgeCount: string;
  corCardBadge: string;
  corFiltroAtivo: string;
  corFiltroInativo: string;
  corBordaHover: string;
}[] = [
  {
    id: 'aguardando_orcamento',
    numero: 1,
    titulo: 'Aguardando Orçamento',
    tituloCurto: 'Orçamento',
    subtitulo: 'Entrada inicial na oficina',
    corBordaTopo: 'border-t-amber-500',
    corCardBorda: 'border-l-[5px] border-l-amber-500',
    corHeaderBg: 'bg-gradient-to-b from-amber-50 via-amber-50/50 to-white border-b-amber-200',
    corIcone: 'bg-amber-500 text-white shadow-sm shadow-amber-500/40',
    corBadgeCount: 'bg-amber-500 text-white font-black shadow-xs shadow-amber-500/30',
    corCardBadge: 'bg-amber-500 text-white font-black',
    corFiltroAtivo: 'bg-amber-500 text-white shadow-md shadow-amber-500/40 ring-2 ring-amber-300',
    corFiltroInativo: 'text-amber-950 bg-amber-50 border border-amber-200 hover:bg-amber-100 font-semibold',
    corBordaHover: 'hover:border-amber-400 hover:shadow-amber-500/10',
  },
  {
    id: 'orcamento_enviado',
    numero: 2,
    titulo: 'Orçamento Enviado',
    tituloCurto: 'Enviado',
    subtitulo: 'Aguardando resposta do cliente',
    corBordaTopo: 'border-t-blue-500',
    corCardBorda: 'border-l-[5px] border-l-blue-500',
    corHeaderBg: 'bg-gradient-to-b from-blue-50 via-blue-50/50 to-white border-b-blue-200',
    corIcone: 'bg-blue-600 text-white shadow-sm shadow-blue-600/40',
    corBadgeCount: 'bg-blue-600 text-white font-black shadow-xs shadow-blue-600/30',
    corCardBadge: 'bg-blue-600 text-white font-black',
    corFiltroAtivo: 'bg-blue-600 text-white shadow-md shadow-blue-600/40 ring-2 ring-blue-300',
    corFiltroInativo: 'text-blue-950 bg-blue-50 border border-blue-200 hover:bg-blue-100 font-semibold',
    corBordaHover: 'hover:border-blue-400 hover:shadow-blue-500/10',
  },
  {
    id: 'autorizado',
    numero: 3,
    titulo: 'Autorizado (Em Reparo)',
    tituloCurto: 'Em Reparo',
    subtitulo: 'Na bancada técnica',
    corBordaTopo: 'border-t-indigo-600',
    corCardBorda: 'border-l-[5px] border-l-indigo-600',
    corHeaderBg: 'bg-gradient-to-b from-indigo-50 via-indigo-50/50 to-white border-b-indigo-200',
    corIcone: 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40',
    corBadgeCount: 'bg-indigo-600 text-white font-black shadow-xs shadow-indigo-600/30',
    corCardBadge: 'bg-indigo-600 text-white font-black',
    corFiltroAtivo: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-2 ring-indigo-300',
    corFiltroInativo: 'text-indigo-950 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 font-semibold',
    corBordaHover: 'hover:border-indigo-400 hover:shadow-indigo-500/10',
  },
  {
    id: 'reprovado',
    numero: 4,
    titulo: 'Reprovado',
    tituloCurto: 'Reprovado',
    subtitulo: 'Devolver sem reparo',
    corBordaTopo: 'border-t-rose-500',
    corCardBorda: 'border-l-[5px] border-l-rose-500',
    corHeaderBg: 'bg-gradient-to-b from-rose-50 via-rose-50/50 to-white border-b-rose-200',
    corIcone: 'bg-rose-600 text-white shadow-sm shadow-rose-600/40',
    corBadgeCount: 'bg-rose-600 text-white font-black shadow-xs shadow-rose-600/30',
    corCardBadge: 'bg-rose-600 text-white font-black',
    corFiltroAtivo: 'bg-rose-600 text-white shadow-md shadow-rose-600/40 ring-2 ring-rose-300',
    corFiltroInativo: 'text-rose-950 bg-rose-50 border border-rose-200 hover:bg-rose-100 font-semibold',
    corBordaHover: 'hover:border-rose-400 hover:shadow-rose-500/10',
  },
  {
    id: 'pronto',
    numero: 5,
    titulo: 'Pronto p/ Entrega',
    tituloCurto: 'Pronto',
    subtitulo: 'Aguardando retirada',
    corBordaTopo: 'border-t-emerald-500',
    corCardBorda: 'border-l-[5px] border-l-emerald-500',
    corHeaderBg: 'bg-gradient-to-b from-emerald-50 via-emerald-50/50 to-white border-b-emerald-200',
    corIcone: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/40',
    corBadgeCount: 'bg-emerald-600 text-white font-black shadow-xs shadow-emerald-600/30',
    corCardBadge: 'bg-emerald-600 text-white font-black',
    corFiltroAtivo: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40 ring-2 ring-emerald-300',
    corFiltroInativo: 'text-emerald-950 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 font-semibold',
    corBordaHover: 'hover:border-emerald-400 hover:shadow-emerald-500/10',
  },
  {
    id: 'aguardando_pagamento',
    numero: 6,
    titulo: 'Aguardando Pagamento',
    tituloCurto: 'Pagamento',
    subtitulo: 'Na recepção / caixa',
    corBordaTopo: 'border-t-purple-500',
    corCardBorda: 'border-l-[5px] border-l-purple-500',
    corHeaderBg: 'bg-gradient-to-b from-purple-50 via-purple-50/50 to-white border-b-purple-200',
    corIcone: 'bg-purple-600 text-white shadow-sm shadow-purple-600/40',
    corBadgeCount: 'bg-purple-600 text-white font-black shadow-xs shadow-purple-600/30',
    corCardBadge: 'bg-purple-600 text-white font-black',
    corFiltroAtivo: 'bg-purple-600 text-white shadow-md shadow-purple-600/40 ring-2 ring-purple-300',
    corFiltroInativo: 'text-purple-950 bg-purple-50 border border-purple-200 hover:bg-purple-100 font-semibold',
    corBordaHover: 'hover:border-purple-400 hover:shadow-purple-500/10',
  },
  {
    id: 'entregue',
    numero: 7,
    titulo: 'Entregue / Finalizado',
    tituloCurto: 'Entregue',
    subtitulo: 'Retirado pelo cliente',
    corBordaTopo: 'border-t-slate-700',
    corCardBorda: 'border-l-[5px] border-l-slate-700',
    corHeaderBg: 'bg-gradient-to-b from-slate-100 via-slate-50 to-white border-b-slate-200',
    corIcone: 'bg-slate-800 text-white shadow-sm shadow-slate-800/40',
    corBadgeCount: 'bg-slate-800 text-white font-black shadow-xs shadow-slate-800/30',
    corCardBadge: 'bg-slate-800 text-white font-black',
    corFiltroAtivo: 'bg-slate-800 text-white shadow-md shadow-slate-800/40 ring-2 ring-slate-400',
    corFiltroInativo: 'text-slate-900 bg-slate-100 border border-slate-300 hover:bg-slate-200 font-semibold',
    corBordaHover: 'hover:border-slate-500 hover:shadow-slate-500/10',
  },
];

export const FluxogramaKanban: React.FC<Props> = ({
  ordens,
  onUpdateOrdem,
  onPrintOS,
  onPrintOrcamento,
  onPrintCupom,
  onCriarNovaOSParaCliente,
}) => {
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<OSStatus | 'todas'>('todas');
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemServico | null>(null);

  // Filtragem em tempo real por texto e por status
  const ordensFiltradas = useMemo(() => {
    return ordens.filter((o) => {
      // Filtro por status
      if (statusFiltro !== 'todas' && o.status !== statusFiltro) {
        return false;
      }

      // Filtro de busca textual
      if (busca.trim()) {
        const termo = busca.toLowerCase().trim();
        const bateNome = o.cliente_snapshot.nome_ou_razao.toLowerCase().includes(termo);
        const bateNumero = o.numero.toLowerCase().includes(termo);
        const bateSerie = o.impressora.serie.toLowerCase().includes(termo);
        const bateModelo = `${o.impressora.marca} ${o.impressora.modelo}`.toLowerCase().includes(termo);
        return bateNome || bateNumero || bateSerie || bateModelo;
      }

      return true;
    });
  }, [ordens, busca, statusFiltro]);

  // Agrupamento por status para as colunas do Kanban
  const ordensPorColuna = useMemo(() => {
    const mapa: Record<OSStatus, OrdemServico[]> = {
      aguardando_orcamento: [],
      orcamento_enviado: [],
      autorizado: [],
      reprovado: [],
      pronto: [],
      aguardando_pagamento: [],
      entregue: [],
    };
    ordensFiltradas.forEach((o) => {
      if (mapa[o.status]) {
        mapa[o.status].push(o);
      }
    });
    return mapa;
  }, [ordensFiltradas]);

  return (
    <div className="p-4 sm:p-6 max-w-[1700px] mx-auto space-y-6">
      {/* CABEÇALHO DO FLUXOGRAMA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Fluxograma de Atendimento</span>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-900 text-white shadow-xs">
              {ordensFiltradas.length} ordens
            </span>
          </h2>
          <p className="text-sm text-slate-500">
            Acompanhe a esteira de serviço com destaque visual reforçado em cada etapa do fluxo.
          </p>
        </div>

        {/* CAMPO DE BUSCA RÁPIDA */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente, O.S., modelo, nº de série..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* DIAGRAMA VISUAL RESUMIDO DO FLUXO (PIPELINE COM SETAS E CORES REFORÇADAS) */}
      <div className="hidden lg:flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto text-xs">
        {COLUNAS_STATUS.map((col, idx) => {
          const isAtivo = statusFiltro === col.id;
          const qtd = ordensPorColuna[col.id]?.length || 0;

          return (
            <React.Fragment key={col.id}>
              <button
                type="button"
                onClick={() =>
                  setStatusFiltro((prev) => (prev === col.id ? 'todas' : col.id))
                }
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition text-left cursor-pointer ${
                  isAtivo ? col.corFiltroAtivo : col.corFiltroInativo
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 ${
                    isAtivo ? 'bg-white/20 text-white' : col.corIcone
                  }`}
                >
                  {col.numero}
                </span>
                <span className="truncate max-w-[130px] font-bold">{col.titulo}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isAtivo
                      ? 'bg-black/25 text-white'
                      : 'bg-white border border-slate-300 text-slate-800'
                  }`}
                >
                  {qtd}
                </span>
              </button>

              {idx < COLUNAS_STATUS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mx-0.5" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* FILTROS RÁPIDOS EM CHIPS (MOBILE / TABLET COM CORES DESTACADAS) */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFiltro('todas')}
          className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition ${
            statusFiltro === 'todas'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700'
          }`}
        >
          Todas ({ordens.length})
        </button>
        {COLUNAS_STATUS.map((col) => {
          const isAtivo = statusFiltro === col.id;
          const qtd = ordens.filter((o) => o.status === col.id).length;

          return (
            <button
              key={col.id}
              onClick={() => setStatusFiltro(col.id)}
              className={`px-3 py-1.5 rounded-lg font-bold shrink-0 flex items-center gap-1.5 transition ${
                isAtivo ? col.corFiltroAtivo : col.corFiltroInativo
              }`}
            >
              <span>{col.titulo}</span>
              <span className="text-[10px] opacity-80 font-black">
                ({qtd})
              </span>
            </button>
          );
        })}
      </div>

      {/* PAINEL KANBAN EM COLUNAS COM DESTIQUE VISUAL FORTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3.5 items-start">
        {COLUNAS_STATUS.map((col) => {
          const ordensDestaColuna = ordensPorColuna[col.id] || [];

          return (
            <div
              key={col.id}
              className={`rounded-2xl border-t-[6px] ${col.corBordaTopo} bg-white shadow-sm border-x border-b border-slate-200 flex flex-col min-h-[480px] overflow-hidden`}
            >
              {/* CABEÇALHO DA COLUNA REFORÇADO */}
              <div className={`p-3 border-b ${col.corHeaderBg} flex items-center justify-between`}>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full ${col.corIcone} text-[11px] font-black flex items-center justify-center shrink-0`}>
                      {col.numero}
                    </span>
                    <h3 className="font-black text-xs text-slate-900 leading-tight">
                      {col.titulo}
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    {col.subtitulo}
                  </span>
                </div>

                <span
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${col.corBadgeCount}`}
                >
                  {ordensDestaColuna.length}
                </span>
              </div>

              {/* LISTA DE CARDS COM CORES DE STATUS DESTACADAS */}
              <div className="p-2 space-y-2.5 flex-1 overflow-y-auto max-h-[700px] bg-slate-50/40">
                {ordensDestaColuna.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center p-3 text-slate-400">
                    <Package className="w-6 h-6 mb-1 opacity-30" />
                    <span className="text-[11px] font-medium">Nenhuma O.S. nesta etapa</span>
                  </div>
                ) : (
                  ordensDestaColuna.map((ordem) => (
                    <div
                      key={ordem.id}
                      onClick={() => setOrdemSelecionada(ordem)}
                      className={`p-3 rounded-xl bg-white border border-slate-200 ${col.corCardBorda} ${col.corBordaHover} hover:shadow-lg transition-all cursor-pointer group space-y-2 text-xs relative`}
                    >
                      {/* Topo do Card: Badge de Status + O.S. Nº + Tempo em aberto */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider shrink-0 ${col.corCardBadge}`}
                          >
                            {col.tituloCurto}
                          </span>
                          <span className="font-black text-slate-900 group-hover:text-indigo-600 text-xs truncate">
                            Nº {ordem.numero}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5 shrink-0">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{tempoDecorrido(ordem.criado_em)}</span>
                        </span>
                      </div>

                      {/* Nome do Cliente */}
                      <div>
                        <span className="block font-bold text-slate-900 text-xs truncate">
                          {ordem.cliente_snapshot.nome_ou_razao}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block">
                          Entrada: {formatarData(ordem.criado_em)}
                        </span>
                      </div>

                      {/* Dados do Equipamento */}
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="font-bold text-slate-800 block truncate">
                          {ordem.impressora.marca} {ordem.impressora.modelo}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          S/N: {ordem.impressora.serie}
                        </span>
                      </div>

                      {/* Defeito curto */}
                      <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                        "{ordem.impressora.defeito}"
                      </p>

                      {/* Badges de Acessórios ou Orçamento */}
                      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-medium">
                          {Object.values(ordem.acessorios).filter(Boolean).length} acessório(s)
                        </span>

                        {ordem.orcamento && (
                          <span className="font-black text-indigo-700 font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                            R$ {ordem.orcamento.total.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE DETALHES DA O.S. SELECIONADA */}
      {ordemSelecionada && (
        <DetalhesOSModal
          isOpen={!!ordemSelecionada}
          onClose={() => setOrdemSelecionada(null)}
          ordem={ordemSelecionada}
          onUpdateOrdem={async (updates) => {
            await onUpdateOrdem(ordemSelecionada.id, updates);
            // Atualiza o estado da ordem selecionada localmente
            setOrdemSelecionada((prev) => (prev ? { ...prev, ...updates } : null));
          }}
          onPrintOS={onPrintOS}
          onPrintOrcamento={onPrintOrcamento}
          onPrintCupom={onPrintCupom}
          onCriarNovaOSParaCliente={onCriarNovaOSParaCliente}
        />
      )}
    </div>
  );
};
