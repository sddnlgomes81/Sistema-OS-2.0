import React from 'react';
import { PlusCircle, Kanban, DollarSign, Settings, Printer } from 'lucide-react';
import { Configuracoes } from '../../types';

export type TabType = 'nova-os' | 'fluxograma' | 'financeiro' | 'configuracoes';

interface Props {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  config: Configuracoes;
  osCountMap: {
    aguardando_orcamento: number;
    em_reparo: number;
    pronto: number;
    total_ativas: number;
  };
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  config,
  osCountMap,
}) => {
  return (
    <>
      {/* SIDEBAR DESKTOP / TABLET */}
      <aside className="no-print hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 shrink-0 min-h-screen">
        {/* LOGO E NOME */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          {config.logo_base64 ? (
            <img
              src={config.logo_base64}
              alt="Logo"
              className="w-10 h-10 object-contain rounded bg-white p-1"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Printer className="w-5 h-5" />
            </div>
          )}
          <div className="overflow-hidden">
            <h1 className="font-bold text-base leading-tight text-white truncate">
              {config.nome_fantasia || 'OS Impressoras'}
            </h1>
            <p className="text-xs text-slate-400 font-mono truncate">Assistência Técnica</p>
          </div>
        </div>

        {/* NAVEGAÇÃO PRINCIPAL */}
        <nav className="p-3 space-y-1.5 flex-1">
          <button
            onClick={() => setActiveTab('nova-os')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
              activeTab === 'nova-os'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <PlusCircle className="w-5 h-5 shrink-0" />
            <span className="flex-1">1. Nova O.S.</span>
            <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded uppercase font-bold">
              Entrada
            </span>
          </button>

          <button
            onClick={() => setActiveTab('fluxograma')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
              activeTab === 'fluxograma'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Kanban className="w-5 h-5 shrink-0" />
            <span className="flex-1">2. Fluxograma</span>
            {osCountMap.total_ativas > 0 && (
              <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                {osCountMap.total_ativas}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('financeiro')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
              activeTab === 'financeiro'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <DollarSign className="w-5 h-5 shrink-0 text-emerald-400" />
            <span className="flex-1">3. Fluxo Financeiro</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded uppercase font-bold border border-emerald-500/30">
              Caixa
            </span>
          </button>

          <button
            onClick={() => setActiveTab('configuracoes')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
              activeTab === 'configuracoes'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className="flex-1">4. Configurações</span>
          </button>
        </nav>

        {/* RESUMO DE ATIVIDADES NO RODAPÉ DO SIDEBAR COM CORES FORTES */}
        <div className="p-4 mx-3 mb-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
          <div className="text-slate-400 font-bold mb-2.5 uppercase text-[10px] tracking-wider flex items-center justify-between">
            <span>Status da Oficina</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="space-y-2 text-slate-300">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs shadow-amber-500/50" />
                <span>Orçamentos:</span>
              </span>
              <span className="font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 font-mono text-[11px]">
                {osCountMap.aguardando_orcamento}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs shadow-indigo-500/50" />
                <span>Em Reparo:</span>
              </span>
              <span className="font-black text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 font-mono text-[11px]">
                {osCountMap.em_reparo}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
                <span>Pronto p/ Entrega:</span>
              </span>
              <span className="font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 font-mono text-[11px]">
                {osCountMap.pronto}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* CABEÇALHO SUPERIOR MOBILE */}
      <header className="no-print md:hidden bg-slate-900 text-white p-3.5 px-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">
              {config.nome_fantasia || 'OS Impressoras'}
            </h1>
            <p className="text-[10px] text-slate-400">Ordem de Serviço Express</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {osCountMap.total_ativas > 0 && (
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
              {osCountMap.total_ativas} em aberto
            </span>
          )}
        </div>
      </header>

      {/* BARRA INFERIOR MOBILE (BOTTOM NAVIGATION) */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-30 flex justify-around p-1.5 shadow-lg">
        <button
          onClick={() => setActiveTab('nova-os')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${
            activeTab === 'nova-os'
              ? 'text-indigo-400 font-bold bg-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-5 h-5 mb-0.5" />
          <span>Nova O.S.</span>
        </button>

        <button
          onClick={() => setActiveTab('fluxograma')}
          className={`relative flex flex-col items-center py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${
            activeTab === 'fluxograma'
              ? 'text-indigo-400 font-bold bg-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Kanban className="w-5 h-5 mb-0.5" />
          <span>Fluxograma</span>
          {osCountMap.total_ativas > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('financeiro')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${
            activeTab === 'financeiro'
              ? 'text-indigo-400 font-bold bg-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-5 h-5 mb-0.5 text-emerald-400" />
          <span>Financeiro</span>
        </button>

        <button
          onClick={() => setActiveTab('configuracoes')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${
            activeTab === 'configuracoes'
              ? 'text-indigo-400 font-bold bg-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span>Configurações</span>
        </button>
      </nav>
    </>
  );
};
