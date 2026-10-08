import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  PackageCheck,
  DollarSign,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';
import { Cliente, OrdemServico, Pagamento, OrcamentoItem } from '../../types';
import {
  formatarCNPJ,
  formatarCPF,
  formatarDataHora,
  formatarMoeda,
  formatarTelefone,
  tempoDecorrido,
} from '../../utils/validation';
import { OrcamentoModal } from './OrcamentoModal';
import { PagamentoModal } from './PagamentoModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ordem: OrdemServico;
  onUpdateOrdem: (updates: Partial<OrdemServico>) => Promise<void>;
  onPrintOS: (ordem: OrdemServico) => void;
  onPrintOrcamento: (ordem: OrdemServico) => void;
  onPrintCupom: (ordem: OrdemServico) => void;
  onCriarNovaOSParaCliente?: (cliente: Cliente) => void;
}

export const DetalhesOSModal: React.FC<Props> = ({
  isOpen,
  onClose,
  ordem,
  onUpdateOrdem,
  onPrintOS,
  onPrintOrcamento,
  onPrintCupom,
  onCriarNovaOSParaCliente,
}) => {
  const [modalOrcamentoAberto, setModalOrcamentoAberto] = useState(false);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);

  // Estados para diálogos de confirmação
  const [confirmacaoReprovar, setConfirmacaoReprovar] = useState(false);
  const [motivoReprovacao, setMotivoReprovacao] = useState('');
  const [confirmacaoEntregaSemReparo, setConfirmacaoEntregaSemReparo] = useState(false);

  if (!isOpen) return null;

  const cliente = ordem.cliente_snapshot;
  const orc = ordem.orcamento;

  // NOMES E CORES DOS STATUS FORTALECIDOS
  const getStatusBadge = () => {
    switch (ordem.status) {
      case 'aguardando_orcamento':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-md shadow-amber-500/40 uppercase tracking-wide">
            <Clock className="w-4 h-4" />
            <span>1. Aguardando Orçamento</span>
          </span>
        );
      case 'orcamento_enviado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-blue-600 text-white shadow-md shadow-blue-600/40 uppercase tracking-wide">
            <FileText className="w-4 h-4" />
            <span>2. Orçamento Enviado</span>
          </span>
        );
      case 'autorizado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-indigo-600 text-white shadow-md shadow-indigo-600/40 uppercase tracking-wide">
            <Wrench className="w-4 h-4" />
            <span>3. Autorizado (Em Reparo)</span>
          </span>
        );
      case 'reprovado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-md shadow-rose-600/40 uppercase tracking-wide">
            <XCircle className="w-4 h-4" />
            <span>4. Reprovado (Sem Reparo)</span>
          </span>
        );
      case 'pronto':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-600 text-white shadow-md shadow-emerald-600/40 uppercase tracking-wide">
            <PackageCheck className="w-4 h-4" />
            <span>5. Pronto para Entrega</span>
          </span>
        );
      case 'aguardando_pagamento':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-purple-600 text-white shadow-md shadow-purple-600/40 uppercase tracking-wide">
            <DollarSign className="w-4 h-4" />
            <span>6. Aguardando Pagamento</span>
          </span>
        );
      case 'entregue':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-slate-800 text-white shadow-md shadow-slate-800/40 uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4" />
            <span>7. Entregue / Finalizado</span>
          </span>
        );
    }
  };

  // AÇÕES DO FLUXO CONTEXTUAIS
  const handleSalvarOrcamento = async (dadosOrc: {
    itens: OrcamentoItem[];
    mao_de_obra: number;
    total: number;
    prazo?: string;
    obs?: string;
  }) => {
    await onUpdateOrdem({
      orcamento: {
        ...dadosOrc,
        criado_em: new Date().toISOString(),
      },
      status: 'orcamento_enviado',
    });
    setModalOrcamentoAberto(false);
  };

  const handleAutorizarReparo = async () => {
    await onUpdateOrdem({
      status: 'autorizado',
      autorizacao: {
        decisao: 'autorizado',
        data: new Date().toISOString(),
      },
    });
  };

  const handleReprovarReparo = async () => {
    await onUpdateOrdem({
      status: 'reprovado',
      autorizacao: {
        decisao: 'reprovado',
        data: new Date().toISOString(),
        motivo: motivoReprovacao.trim() || 'Cliente optou por não realizar o serviço.',
      },
    });
    setConfirmacaoReprovar(false);
    setMotivoReprovacao('');
  };

  const handleMarcarComoPronto = async () => {
    await onUpdateOrdem({
      status: 'pronto',
    });
  };

  const handleLiberarRetiradaSemReparo = async () => {
    await onUpdateOrdem({
      status: 'pronto',
    });
  };

  const handleReceberPagamentoClique = () => {
    setModalPagamentoAberto(true);
  };

  const handleConfirmarPagamento = async (pagamento: Pagamento) => {
    await onUpdateOrdem({
      pagamento,
      status: 'entregue',
    });
    // Automaticamente imprime o cupom
    onPrintCupom({
      ...ordem,
      pagamento,
      status: 'entregue',
    });
  };

  const handleConfirmarEntregaSemReparo = async () => {
    await onUpdateOrdem({
      status: 'entregue',
    });
    setConfirmacaoEntregaSemReparo(false);
  };

  const isReprovadoSemServico =
    ordem.status === 'reprovado' ||
    (ordem.status === 'pronto' && ordem.autorizacao?.decisao === 'reprovado');

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-4">
          {/* TOPO COM NÚMERO E STATUS */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-600 text-white">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black tracking-wide">O.S. Nº {ordem.numero}</h2>
                  <span className="text-xs text-slate-400 font-medium">
                    (Aberta {tempoDecorrido(ordem.criado_em)})
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Entrada: {formatarDataHora(ordem.criado_em)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CONTEÚDO COM ROLAGEM */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {/* BARRA DE AÇÕES RÁPIDAS / IMPRESSÃO */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-600 uppercase mr-1">
                Documentos:
              </span>
              <button
                type="button"
                onClick={() => onPrintOS(ordem)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Comprovante de Entrada</span>
              </button>

              {orc && (
                <button
                  type="button"
                  onClick={() => onPrintOrcamento(ordem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition shadow-xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Orçamento Técnico</span>
                </button>
              )}

              {ordem.pagamento && (
                <button
                  type="button"
                  onClick={() => onPrintCupom(ordem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition shadow-xs cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Cupom Não Fiscal (80mm)</span>
                </button>
              )}

              {onCriarNovaOSParaCliente && (
                <button
                  type="button"
                  onClick={() => {
                    const c: Cliente = {
                      id: ordem.cliente_id || `cli-${Date.now()}`,
                      tipo: cliente.tipo,
                      nome_ou_razao: cliente.nome_ou_razao,
                      documento: cliente.documento || '',
                      contato: cliente.contato || '',
                      endereco: cliente.endereco,
                      inscricao_estadual: cliente.inscricao_estadual,
                      criado_em: new Date().toISOString(),
                    };
                    onCriarNovaOSParaCliente(c);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer sm:ml-auto"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Nova O.S. para este Cliente</span>
                </button>
              )}
            </div>

            {/* SEÇÃO PRINCIPAL: CLIENTE + EQUIPAMENTO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cliente */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs font-bold uppercase text-slate-500 block mb-2">
                  Dados do Cliente
                </span>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500">Nome:</span>{' '}
                    <span className="font-bold text-slate-900 text-sm">
                      {cliente.nome_ou_razao || 'Cliente Balcão'}
                    </span>
                    {cliente.tipo === 'AVULSO' && (
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        Atendimento Avulso (Balcão)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500">
                      {cliente.tipo === 'PF' ? 'CPF:' : cliente.tipo === 'PJ' ? 'CNPJ:' : 'Documento:'}
                    </span>{' '}
                    <span className="font-mono font-medium text-slate-800">
                      {cliente.documento
                        ? cliente.tipo === 'PF'
                          ? formatarCPF(cliente.documento) || 'Não informado'
                          : formatarCNPJ(cliente.documento)
                        : 'Não informado (Sem cadastro)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Contato:</span>{' '}
                    <span className="font-medium text-slate-900">
                      {cliente.contato ? formatarTelefone(cliente.contato) : 'Não informado'}
                    </span>
                  </div>
                  {cliente.endereco && (
                    <div>
                      <span className="text-slate-500">Endereço:</span>{' '}
                      <span className="text-slate-700">{cliente.endereco}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Impressora */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs font-bold uppercase text-slate-500 block mb-2">
                  Equipamento
                </span>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500">Marca/Modelo:</span>{' '}
                    <span className="font-bold text-slate-900 text-sm">
                      {ordem.impressora.marca} {ordem.impressora.modelo}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Número de Série:</span>{' '}
                    <span className="font-mono font-bold text-slate-800">
                      {ordem.impressora.serie}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Itens deixados:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {ordem.acessorios.toner && (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                          Toner {ordem.obs_toner ? `(${ordem.obs_toner})` : ''}
                        </span>
                      )}
                      {ordem.acessorios.cartucho_tinta && (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                          Cartucho {ordem.obs_cartucho ? `(${ordem.obs_cartucho})` : ''}
                        </span>
                      )}
                      {ordem.acessorios.tinta && (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                          Tinta {ordem.obs_tinta ? `(${ordem.obs_tinta})` : ''}
                        </span>
                      )}
                      {ordem.acessorios.cabo_energia && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Cabo Energia
                        </span>
                      )}
                      {ordem.acessorios.cabo_dados && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Cabo Dados
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DEFEITO RELATADO */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold uppercase text-slate-500 block mb-1">
                Defeito Relatado pelo Cliente
              </span>
              <p className="text-xs text-slate-800 whitespace-pre-line font-medium">
                {ordem.impressora.defeito}
              </p>
            </div>

            {/* SE HOUVER ORÇAMENTO */}
            {orc && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Orçamento Registrado</span>
                  </span>
                  <span className="text-base font-black font-mono text-indigo-700">
                    Total: {formatarMoeda(orc.total)}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  {orc.itens.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between py-1 border-b border-slate-100 text-slate-700"
                    >
                      <span>
                        {it.qtd}x {it.descricao}
                      </span>
                      <span className="font-mono">{formatarMoeda(it.qtd * it.valor_unit)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Mão de Obra Técnica:</span>
                    <span className="font-mono">{formatarMoeda(orc.mao_de_obra)}</span>
                  </div>
                </div>

                {orc.prazo && (
                  <p className="text-xs text-slate-600">
                    <strong>Prazo Estimado:</strong> {orc.prazo}
                  </p>
                )}
                {orc.obs && (
                  <p className="text-xs text-slate-600 italic">
                    <strong>Obs:</strong> {orc.obs}
                  </p>
                )}
              </div>
            )}

            {/* SE HOUVER PAGAMENTO REGISTRADO */}
            {ordem.pagamento && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-700" />
                    <span>Pagamento Concluído</span>
                  </span>
                  <span className="text-base font-black font-mono text-emerald-800">
                    {formatarMoeda(ordem.pagamento.total_pago)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60">
                  <div>
                    <span className="text-emerald-700">Forma:</span>{' '}
                    <span className="font-bold">{ordem.pagamento.forma}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700">Data/Hora:</span>{' '}
                    <span>{formatarDataHora(ordem.pagamento.data)}</span>
                  </div>
                  {ordem.pagamento.valor_recebido !== undefined && (
                    <>
                      <div>
                        <span className="text-emerald-700">Recebido:</span>{' '}
                        <span className="font-mono">
                          {formatarMoeda(ordem.pagamento.valor_recebido)}
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-700">Troco:</span>{' '}
                        <span className="font-mono font-bold">
                          {formatarMoeda(ordem.pagamento.troco || 0)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* HISTÓRICO DE MUDANÇAS DE STATUS */}
            <div>
              <span className="text-xs font-bold uppercase text-slate-500 block mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Histórico de Andamento da O.S.</span>
              </span>

              <div className="relative pl-6 border-l-2 border-slate-200 space-y-4 text-xs">
                {ordem.historico.map((h, idx) => {
                  const getStatusDotColor = (status: string) => {
                    switch (status) {
                      case 'aguardando_orcamento':
                        return 'bg-amber-500 ring-4 ring-amber-100';
                      case 'orcamento_enviado':
                        return 'bg-blue-600 ring-4 ring-blue-100';
                      case 'autorizado':
                        return 'bg-indigo-600 ring-4 ring-indigo-100';
                      case 'reprovado':
                        return 'bg-rose-600 ring-4 ring-rose-100';
                      case 'pronto':
                        return 'bg-emerald-600 ring-4 ring-emerald-100';
                      case 'aguardando_pagamento':
                        return 'bg-purple-600 ring-4 ring-purple-100';
                      case 'entregue':
                        return 'bg-slate-800 ring-4 ring-slate-200';
                      default:
                        return 'bg-indigo-600 ring-4 ring-indigo-100';
                    }
                  };

                  return (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[31px] top-0 w-3 h-3 rounded-full ${getStatusDotColor(h.status)}`} />
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="uppercase tracking-wide">{h.status.replace(/_/g, ' ')}</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          ({formatarDataHora(h.data)})
                        </span>
                      </div>
                      {h.descricao && (
                        <p className="text-slate-600 mt-0.5">{h.descricao}</p>
                      )}
                      {h.motivo && (
                        <p className="text-rose-600 mt-0.5 font-medium">Motivo: {h.motivo}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RODAPÉ COM AÇÕES CONFORME O STATUS ATUAL */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 shrink-0">
            {/* 1. AGUARDANDO ORÇAMENTO */}
            {ordem.status === 'aguardando_orcamento' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-600">
                  Próximo passo: o técnico deve avaliar e cadastrar o orçamento.
                </span>
                <button
                  type="button"
                  onClick={() => setModalOrcamentoAberto(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Lançar Orçamento</span>
                </button>
              </div>
            )}

            {/* 2. ORÇAMENTO ENVIADO */}
            {ordem.status === 'orcamento_enviado' && (
              <div className="space-y-3">
                {confirmacaoReprovar ? (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Confirmar não autorização do serviço?</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Motivo da reprovação (opcional, ex: achou caro, comprou nova...)"
                      value={motivoReprovacao}
                      onChange={(e) => setMotivoReprovacao(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-rose-300 bg-white"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setConfirmacaoReprovar(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleReprovarReparo}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                      >
                        Sim, reprovar e devolver
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setModalOrcamentoAberto(true)}
                      className="text-xs text-indigo-600 hover:underline font-bold"
                    >
                      Editar Orçamento
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmacaoReprovar(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 font-bold text-xs hover:bg-rose-50 transition cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cliente NÃO autorizou</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAutorizarReparo}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Cliente AUTORIZOU</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. AUTORIZADO, EM REPARO */}
            {ordem.status === 'autorizado' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-600">
                  O reparo está em execução pela bancada técnica.
                </span>
                <button
                  type="button"
                  onClick={handleMarcarComoPronto}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Marcar como Pronto p/ Entrega</span>
                </button>
              </div>
            )}

            {/* 4. REPROVADO, DEVOLVER SEM REPARO */}
            {ordem.status === 'reprovado' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-rose-700 font-medium">
                  Reprovado pelo cliente. Nenhuma cobrança de reparo.
                </span>
                <button
                  type="button"
                  onClick={handleLiberarRetiradaSemReparo}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Liberar para Retirada</span>
                </button>
              </div>
            )}

            {/* 5. PRONTO PARA ENTREGA */}
            {ordem.status === 'pronto' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-600">
                  Equipamento na recepção pronto para ser retirado pelo cliente.
                </span>

                {isReprovadoSemServico ? (
                  confirmacaoEntregaSemReparo ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-700">Confirmar entrega?</span>
                      <button
                        type="button"
                        onClick={() => setConfirmacaoEntregaSemReparo(false)}
                        className="px-2.5 py-1.5 border rounded text-xs"
                      >
                        Não
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmarEntregaSemReparo}
                        className="px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-bold"
                      >
                        Sim, finalizar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmacaoEntregaSemReparo(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Entrega (Sem cobrança)</span>
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handleReceberPagamentoClique}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Receber Pagamento</span>
                  </button>
                )}
              </div>
            )}

            {/* 6. AGUARDANDO PAGAMENTO */}
            {ordem.status === 'aguardando_pagamento' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-purple-700 font-bold">
                  Aguardando liquidação do pagamento para liberar o cupom.
                </span>
                <button
                  type="button"
                  onClick={handleReceberPagamentoClique}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Receber Pagamento</span>
                </button>
              </div>
            )}

            {/* 7. ENTREGUE / FINALIZADO */}
            {ordem.status === 'entregue' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Esta O.S. está finalizada. Documentos disponíveis para reimpressão.</span>
                </span>
                {ordem.pagamento && (
                  <button
                    type="button"
                    onClick={() => onPrintCupom(ordem)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Reimprimir Cupom Não Fiscal</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SUB-MODAL DE LANÇAMENTO DE ORÇAMENTO */}
      <OrcamentoModal
        isOpen={modalOrcamentoAberto}
        onClose={() => setModalOrcamentoAberto(false)}
        onSalvar={handleSalvarOrcamento}
        osNumero={ordem.numero}
        orcamentoExistente={orc}
      />

      {/* SUB-MODAL DE PAGAMENTO */}
      <PagamentoModal
        isOpen={modalPagamentoAberto}
        onClose={() => setModalPagamentoAberto(false)}
        ordem={ordem}
        onConfirmarPagamento={handleConfirmarPagamento}
      />
    </>
  );
};
