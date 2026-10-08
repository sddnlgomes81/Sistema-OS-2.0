import React from 'react';
import { Configuracoes, DespesaFinanceira, OrdemServico } from '../../types';
import {
  formatarCNPJ,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  formatarTelefone,
} from '../../utils/validation';
import { DollarSign } from 'lucide-react';

interface Props {
  config: Configuracoes;
  periodoNome: string;
  resumo: {
    totalRecebido: number;
    totalAReceber: number;
    totalDespesas: number;
    saldoLiquido: number;
    ticketMedio: number;
    totalMaoDeObra: number;
    totalPecas: number;
    qtdRecebidas: number;
  };
  porForma: Record<string, number>;
  ordensPagas: OrdemServico[];
  despesas: DespesaFinanceira[];
}

export const RelatorioFinanceiroPrint: React.FC<Props> = ({
  config,
  periodoNome,
  resumo,
  porForma,
  ordensPagas,
  despesas,
}) => {
  return (
    <div className="bg-white text-black p-8 max-w-[210mm] mx-auto text-xs font-sans print:p-0 print:m-0 print:w-full">
      {/* CABEÇALHO DA EMPRESA */}
      <div className="border-b-2 border-black pb-4 mb-4 flex items-start justify-between">
        <div className="flex items-center gap-4">
          {config.logo_base64 ? (
            <img
              src={config.logo_base64}
              alt="Logo"
              className="w-16 h-16 object-contain border border-black/20 p-1"
            />
          ) : (
            <div className="w-14 h-14 border border-black flex items-center justify-center font-bold text-center p-1 text-[11px] leading-tight">
              {config.nome_fantasia ? config.nome_fantasia.slice(0, 12) : 'OS'}
            </div>
          )}

          <div>
            <h1 className="text-base font-black tracking-tight uppercase">
              {config.nome_fantasia || config.razao_social}
            </h1>
            <p className="text-[11px] font-semibold">{config.razao_social}</p>
            <p className="text-[10px] mt-0.5">
              CNPJ: {formatarCNPJ(config.cnpj)} | Tel:{' '}
              {formatarTelefone(config.telefone)}
            </p>
            <p className="text-[10px] text-gray-700">{config.endereco}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="border border-black px-3 py-1 font-mono font-bold text-xs uppercase bg-gray-100">
            RELATÓRIO FINANCEIRO
          </div>
          <p className="text-[10px] mt-2 text-gray-700">
            Emissão: {formatarDataHora(new Date().toISOString())}
          </p>
          <p className="text-[10px] font-bold text-black mt-0.5">
            Período: {periodoNome}
          </p>
        </div>
      </div>

      {/* QUADRO DE RESUMO GERAL */}
      <div className="mb-5">
        <h2 className="font-bold text-xs uppercase tracking-wider mb-2 border-b border-black pb-1">
          1. Demonstrativo Financeiro Consolidado
        </h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="border border-black p-2 bg-gray-50">
            <span className="block text-[10px] font-bold text-gray-700 uppercase">
              Total Recebido (O.S.)
            </span>
            <span className="block font-black text-sm text-black font-mono mt-0.5">
              {formatarMoeda(resumo.totalRecebido)}
            </span>
            <span className="text-[9px] text-gray-600">
              {resumo.qtdRecebidas} ordens pagas
            </span>
          </div>

          <div className="border border-black p-2 bg-gray-50">
            <span className="block text-[10px] font-bold text-gray-700 uppercase">
              Despesas / Saídas
            </span>
            <span className="block font-black text-sm text-black font-mono mt-0.5">
              {formatarMoeda(resumo.totalDespesas)}
            </span>
            <span className="text-[9px] text-gray-600">
              {despesas.length} lançamentos
            </span>
          </div>

          <div className="border-2 border-black p-2 bg-gray-100">
            <span className="block text-[10px] font-bold text-black uppercase">
              Saldo Líquido Caixa
            </span>
            <span className="block font-black text-sm text-black font-mono mt-0.5">
              {formatarMoeda(resumo.saldoLiquido)}
            </span>
            <span className="text-[9px] text-gray-700 font-semibold">
              (Receitas - Despesas)
            </span>
          </div>

          <div className="border border-black p-2 bg-gray-50">
            <span className="block text-[10px] font-bold text-gray-700 uppercase">
              Previsão a Receber
            </span>
            <span className="block font-black text-sm text-black font-mono mt-0.5">
              {formatarMoeda(resumo.totalAReceber)}
            </span>
            <span className="text-[9px] text-gray-600">
              O.S. em andamento
            </span>
          </div>
        </div>

        {/* DETALHAMENTO DE PRODUTIVIDADE */}
        <div className="grid grid-cols-3 gap-2 mt-2 text-center text-[10px]">
          <div className="border border-black p-1.5">
            <span className="text-gray-700">Ticket Médio por O.S.: </span>
            <strong className="font-mono">{formatarMoeda(resumo.ticketMedio)}</strong>
          </div>
          <div className="border border-black p-1.5">
            <span className="text-gray-700">Mão de Obra (Serviços): </span>
            <strong className="font-mono">{formatarMoeda(resumo.totalMaoDeObra)}</strong>
          </div>
          <div className="border border-black p-1.5">
            <span className="text-gray-700">Peças e Insumos: </span>
            <strong className="font-mono">{formatarMoeda(resumo.totalPecas)}</strong>
          </div>
        </div>
      </div>

      {/* FORMAS DE PAGAMENTO */}
      <div className="mb-5">
        <h2 className="font-bold text-xs uppercase tracking-wider mb-2 border-b border-black pb-1">
          2. Recebimentos por Forma de Pagamento
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(porForma).map(([forma, valor]) => (
            <div key={forma} className="border border-black p-2 text-center">
              <span className="block text-[10px] font-bold text-gray-700">
                {forma}
              </span>
              <span className="block font-black text-xs font-mono mt-0.5">
                {formatarMoeda(valor)}
              </span>
              <span className="text-[9px] text-gray-600">
                {resumo.totalRecebido > 0
                  ? `${Math.round((valor / resumo.totalRecebido) * 100)}%`
                  : '0%'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* LISTA DE ENTRADAS (ORDENS DE SERVIÇO PAGAS) */}
      <div className="mb-5">
        <h2 className="font-bold text-xs uppercase tracking-wider mb-2 border-b border-black pb-1">
          3. Discriminação das Entradas (Ordens de Serviço Finalizadas)
        </h2>
        {ordensPagas.length === 0 ? (
          <p className="text-gray-600 italic text-[11px] p-2 border border-black text-center">
            Nenhuma ordem de serviço com pagamento recebido no período selecionado.
          </p>
        ) : (
          <table className="w-full text-left border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-gray-100 border-b border-black font-bold">
                <th className="p-1.5 border-r border-black">Data/Hora</th>
                <th className="p-1.5 border-r border-black">O.S. Nº</th>
                <th className="p-1.5 border-r border-black">Cliente</th>
                <th className="p-1.5 border-r border-black">Equipamento</th>
                <th className="p-1.5 border-r border-black">Forma</th>
                <th className="p-1.5 border-r border-black text-right">Peças</th>
                <th className="p-1.5 border-r border-black text-right">M. Obra</th>
                <th className="p-1.5 text-right font-black">Total Pago</th>
              </tr>
            </thead>
            <tbody>
              {ordensPagas.map((ordem) => {
                const pecas =
                  ordem.orcamento?.itens.reduce(
                    (acc, it) => acc + it.qtd * it.valor_unit,
                    0
                  ) || 0;
                const mObra = ordem.orcamento?.mao_de_obra || 0;
                return (
                  <tr key={ordem.id} className="border-b border-gray-300">
                    <td className="p-1.5 border-r border-black font-mono">
                      {ordem.pagamento?.data
                        ? formatarDataHora(ordem.pagamento.data)
                        : formatarData(ordem.criado_em)}
                    </td>
                    <td className="p-1.5 border-r border-black font-mono font-bold">
                      #{ordem.numero}
                    </td>
                    <td className="p-1.5 border-r border-black max-w-[120px] truncate">
                      {ordem.cliente_snapshot.nome_ou_razao}
                    </td>
                    <td className="p-1.5 border-r border-black max-w-[120px] truncate">
                      {ordem.impressora.marca} {ordem.impressora.modelo}
                    </td>
                    <td className="p-1.5 border-r border-black font-bold">
                      {ordem.pagamento?.forma || 'À vista'}
                    </td>
                    <td className="p-1.5 border-r border-black text-right font-mono">
                      {formatarMoeda(pecas)}
                    </td>
                    <td className="p-1.5 border-r border-black text-right font-mono">
                      {formatarMoeda(mObra)}
                    </td>
                    <td className="p-1.5 text-right font-mono font-bold">
                      {formatarMoeda(ordem.pagamento?.total_pago || ordem.orcamento?.total || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* LISTA DE DESPESAS */}
      {despesas.length > 0 && (
        <div className="mb-5">
          <h2 className="font-bold text-xs uppercase tracking-wider mb-2 border-b border-black pb-1">
            4. Despesas Operacionais Lançadas
          </h2>
          <table className="w-full text-left border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-gray-100 border-b border-black font-bold">
                <th className="p-1.5 border-r border-black">Data</th>
                <th className="p-1.5 border-r border-black">Descrição</th>
                <th className="p-1.5 border-r border-black">Categoria</th>
                <th className="p-1.5 border-r border-black">Forma</th>
                <th className="p-1.5 text-right font-black">Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              {despesas.map((d) => (
                <tr key={d.id} className="border-b border-gray-300">
                  <td className="p-1.5 border-r border-black font-mono">
                    {formatarData(d.data)}
                  </td>
                  <td className="p-1.5 border-r border-black">{d.descricao}</td>
                  <td className="p-1.5 border-r border-black uppercase text-[9px] font-semibold">
                    {d.categoria}
                  </td>
                  <td className="p-1.5 border-r border-black">
                    {d.forma_pagamento || '-'}
                  </td>
                  <td className="p-1.5 text-right font-mono font-bold">
                    {formatarMoeda(d.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TERMO DE FECHAMENTO E ASSINATURA */}
      <div className="mt-8 pt-4 border-t border-black text-[10px]">
        <div className="grid grid-cols-2 gap-12 text-center mt-6">
          <div>
            <div className="border-b border-black mb-1 mx-6" />
            <p className="font-bold">Responsável Financeiro / Caixa</p>
            <p className="text-gray-600 text-[9px]">Conferido e arquivado</p>
          </div>
          <div>
            <div className="border-b border-black mb-1 mx-6" />
            <p className="font-bold">{config.razao_social}</p>
            <p className="text-gray-600 text-[9px]">Diretoria / Gestão Técnica</p>
          </div>
        </div>
      </div>
    </div>
  );
};
