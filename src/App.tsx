/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar, TabType } from './components/layout/Navbar';
import { NovaOSWizard } from './components/nova-os/NovaOSWizard';
import { FluxogramaKanban } from './components/fluxograma/FluxogramaKanban';
import { ConfiguracoesView } from './components/configuracoes/ConfiguracoesView';
import { ComprovanteOSPrint } from './components/impressao/ComprovanteOSPrint';
import { OrcamentoPrint } from './components/impressao/OrcamentoPrint';
import { CupomNaoFiscalPrint } from './components/impressao/CupomNaoFiscalPrint';
import { RelatorioFinanceiroPrint } from './components/impressao/RelatorioFinanceiroPrint';
import { FluxoFinanceiroView } from './components/financeiro/FluxoFinanceiroView';
import { dataStore } from './services/storage';
import { Configuracoes, OrdemServico, Cliente, DespesaFinanceira } from './types';
import { Printer, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('nova-os');
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Cliente pré-selecionado para registrar nova impressora
  const [clientePreSelecionado, setClientePreSelecionado] = useState<Cliente | null>(null);

  // Documento ativo para impressão e pré-visualização
  const [impressaoAtiva, setImpressaoAtiva] = useState<{
    tipo: 'comprovante_os' | 'orcamento' | 'cupom' | 'relatorio_financeiro';
    ordem?: OrdemServico;
    relatorioDados?: {
      periodoNome: string;
      resumo: any;
      porForma: Record<string, number>;
      ordensPagas: OrdemServico[];
      despesas: DespesaFinanceira[];
    };
  } | null>(null);

  // Carrega ordens e configurações da camada de dados
  const recarregarDados = useCallback(async () => {
    try {
      const [ordensData, configData] = await Promise.all([
        dataStore.getOrdens(),
        dataStore.getConfiguracoes(),
      ]);
      setOrdens(ordensData);
      setConfig(configData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Assina alterações no armazenamento
  useEffect(() => {
    recarregarDados();
    const unsub = dataStore.subscribe(() => {
      recarregarDados();
    });
    return unsub;
  }, [recarregarDados]);

  // Contadores para o painel de status
  const osCountMap = useMemo(() => {
    const aguardando_orcamento = ordens.filter(
      (o) => o.status === 'aguardando_orcamento'
    ).length;
    const em_reparo = ordens.filter((o) => o.status === 'autorizado').length;
    const pronto = ordens.filter(
      (o) => o.status === 'pronto' || o.status === 'aguardando_pagamento'
    ).length;
    const total_ativas = ordens.filter((o) => o.status !== 'entregue').length;

    return {
      aguardando_orcamento,
      em_reparo,
      pronto,
      total_ativas,
    };
  }, [ordens]);

  // Disparo de impressão
  const triggerPrint = (
    tipo: 'comprovante_os' | 'orcamento' | 'cupom',
    ordem: OrdemServico
  ) => {
    setImpressaoAtiva({ tipo, ordem });
    // Pequeno timeout para garantir renderização do componente no DOM
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintRelatorio = (dados: {
    periodoNome: string;
    resumo: any;
    porForma: Record<string, number>;
    ordensPagas: OrdemServico[];
    despesas: DespesaFinanceira[];
  }) => {
    setImpressaoAtiva({
      tipo: 'relatorio_financeiro',
      relatorioDados: dados,
    });
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Handlers
  const handleOSCreated = (novaOS: OrdemServico) => {
    setOrdens((prev) => [novaOS, ...prev]);
    setClientePreSelecionado(null);
  };

  const handleCriarNovaOSParaCliente = (cliente: Cliente) => {
    setClientePreSelecionado(cliente);
    setActiveTab('nova-os');
  };

  const handleUpdateOrdem = async (id: string, updates: Partial<OrdemServico>) => {
    const atualizada = await dataStore.updateOrdem(id, updates);
    setOrdens((prev) => prev.map((o) => (o.id === id ? atualizada : o)));
    if (impressaoAtiva?.ordem?.id === id) {
      setImpressaoAtiva((prev) => (prev ? { ...prev, ordem: atualizada } : null));
    }
  };

  const handleSalvarConfig = async (novasConfig: Configuracoes) => {
    await dataStore.saveConfiguracoes(novasConfig);
    setConfig(novasConfig);
  };

  const handleExportarBackup = async () => {
    const json = await dataStore.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-os-impressoras-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportarBackup = async (json: string) => {
    await dataStore.importData(json);
    await recarregarDados();
  };

  const handleResetarDados = async () => {
    await dataStore.resetToDefault();
    await recarregarDados();
  };

  if (carregando || !config) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold">Iniciando OS Impressoras...</h2>
        <p className="text-xs text-slate-400 mt-1">Carregando banco de dados local</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 pb-16 md:pb-0">
      {/* NAVEGAÇÃO RESPONSIVA */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        osCountMap={osCountMap}
      />

      {/* ÁREA DE CONTEÚDO PRINCIPAL (Telas 1, 2, 3) */}
      <main className="flex-1 overflow-x-hidden min-h-screen no-print">
        {activeTab === 'nova-os' && (
          <NovaOSWizard
            config={config}
            onOSCreated={handleOSCreated}
            onPrintOS={(ordem) => triggerPrint('comprovante_os', ordem)}
            clientePreSelecionado={clientePreSelecionado}
            onLimparClientePreSelecionado={() => setClientePreSelecionado(null)}
            ordensExistentes={ordens}
          />
        )}

        {activeTab === 'fluxograma' && (
          <FluxogramaKanban
            ordens={ordens}
            onUpdateOrdem={handleUpdateOrdem}
            onPrintOS={(ordem) => triggerPrint('comprovante_os', ordem)}
            onPrintOrcamento={(ordem) => triggerPrint('orcamento', ordem)}
            onPrintCupom={(ordem) => triggerPrint('cupom', ordem)}
            onCriarNovaOSParaCliente={handleCriarNovaOSParaCliente}
          />
        )}

        {activeTab === 'financeiro' && (
          <FluxoFinanceiroView
            ordens={ordens}
            config={config}
            onPrintOS={(ordem) => triggerPrint('comprovante_os', ordem)}
            onPrintCupom={(ordem) => triggerPrint('cupom', ordem)}
            onPrintRelatorio={handlePrintRelatorio}
          />
        )}

        {activeTab === 'configuracoes' && (
          <ConfiguracoesView
            config={config}
            onSalvarConfig={handleSalvarConfig}
            onExportarBackup={handleExportarBackup}
            onImportarBackup={handleImportarBackup}
            onResetarDados={handleResetarDados}
          />
        )}
      </main>

      {/* MODAL DE PRÉ-VISUALIZAÇÃO DE IMPRESSÃO EM TELA (NÃO IMPRESSO NO PAPEL) */}
      {impressaoAtiva && (
        <div className="no-print fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* BARRA SUPERIOR DO PREVIEW */}
          <div className="w-full max-w-3xl bg-slate-900 text-white rounded-t-2xl px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Printer className="w-4 h-4 text-indigo-400" />
              <span className="text-xs sm:text-sm font-bold">
                Pré-visualização para Impressão •{' '}
                {impressaoAtiva.tipo === 'comprovante_os'
                  ? 'Comprovante de O.S.'
                  : impressaoAtiva.tipo === 'orcamento'
                  ? 'Orçamento Técnico'
                  : impressaoAtiva.tipo === 'cupom'
                  ? 'Cupom Não Fiscal (80mm)'
                  : 'Relatório Financeiro & Caixa'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Agora</span>
              </button>

              <button
                type="button"
                onClick={() => setImpressaoAtiva(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* VISUALIZAÇÃO DO DOCUMENTO */}
          <div className="w-full max-w-3xl bg-slate-200 p-4 sm:p-6 rounded-b-2xl max-h-[85vh] overflow-y-auto">
            {impressaoAtiva.tipo === 'comprovante_os' && impressaoAtiva.ordem && (
              <ComprovanteOSPrint
                ordem={impressaoAtiva.ordem}
                config={config}
              />
            )}
            {impressaoAtiva.tipo === 'orcamento' && impressaoAtiva.ordem && (
              <OrcamentoPrint
                ordem={impressaoAtiva.ordem}
                config={config}
              />
            )}
            {impressaoAtiva.tipo === 'cupom' && impressaoAtiva.ordem && (
              <CupomNaoFiscalPrint
                ordem={impressaoAtiva.ordem}
                config={config}
              />
            )}
            {impressaoAtiva.tipo === 'relatorio_financeiro' && impressaoAtiva.relatorioDados && (
              <RelatorioFinanceiroPrint
                config={config}
                periodoNome={impressaoAtiva.relatorioDados.periodoNome}
                resumo={impressaoAtiva.relatorioDados.resumo}
                porForma={impressaoAtiva.relatorioDados.porForma}
                ordensPagas={impressaoAtiva.relatorioDados.ordensPagas}
                despesas={impressaoAtiva.relatorioDados.despesas}
              />
            )}
          </div>
        </div>
      )}

      {/* ÁREA EXCLUSIVA DE IMPRESSÃO (RENDERIZADA NO WINDOW.PRINT) */}
      <div className="print-area">
        {impressaoAtiva?.tipo === 'comprovante_os' && impressaoAtiva.ordem && (
          <ComprovanteOSPrint
            ordem={impressaoAtiva.ordem}
            config={config}
          />
        )}
        {impressaoAtiva?.tipo === 'orcamento' && impressaoAtiva.ordem && (
          <OrcamentoPrint
            ordem={impressaoAtiva.ordem}
            config={config}
          />
        )}
        {impressaoAtiva?.tipo === 'cupom' && impressaoAtiva.ordem && (
          <CupomNaoFiscalPrint
            ordem={impressaoAtiva.ordem}
            config={config}
          />
        )}
        {impressaoAtiva?.tipo === 'relatorio_financeiro' && impressaoAtiva.relatorioDados && (
          <RelatorioFinanceiroPrint
            config={config}
            periodoNome={impressaoAtiva.relatorioDados.periodoNome}
            resumo={impressaoAtiva.relatorioDados.resumo}
            porForma={impressaoAtiva.relatorioDados.porForma}
            ordensPagas={impressaoAtiva.relatorioDados.ordensPagas}
            despesas={impressaoAtiva.relatorioDados.despesas}
          />
        )}
      </div>
    </div>
  );
}
