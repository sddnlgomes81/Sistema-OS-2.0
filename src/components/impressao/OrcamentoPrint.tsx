import React from 'react';
import { Configuracoes, OrdemServico } from '../../types';
import {
  formatarCNPJ,
  formatarCPF,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  formatarTelefone,
} from '../../utils/validation';
import { Printer } from 'lucide-react';

interface Props {
  ordem: OrdemServico;
  config: Configuracoes;
}

export const OrcamentoPrint: React.FC<Props> = ({ ordem, config }) => {
  const orc = ordem.orcamento;
  const cliente = ordem.cliente_snapshot;

  if (!orc) return null;

  return (
    <div className="print-document-a4 bg-white text-black text-xs leading-relaxed max-w-3xl mx-auto p-4 sm:p-6 border border-gray-300 print:border-none print:p-0">
      {/* CABEÇALHO */}
      <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-4">
        <div className="flex items-center gap-3">
          {config.logo_base64 ? (
            <img
              src={config.logo_base64}
              alt="Logo"
              className="w-16 h-16 object-contain"
            />
          ) : (
            <div className="w-14 h-14 border border-black flex items-center justify-center font-bold text-lg bg-gray-100">
              <Printer className="w-8 h-8 text-black" />
            </div>
          )}
          <div>
            <h1 className="text-base font-bold uppercase tracking-tight">
              {config.nome_fantasia || config.razao_social}
            </h1>
            <p className="text-[11px] font-medium">{config.razao_social}</p>
            <p className="text-[10px] text-gray-700">
              CNPJ: {formatarCNPJ(config.cnpj)} | Tel: {formatarTelefone(config.telefone)}
            </p>
            <p className="text-[10px] text-gray-700">{config.endereco}</p>
          </div>
        </div>

        <div className="text-right border border-black p-2 rounded bg-gray-50 print:bg-transparent min-w-[150px]">
          <span className="block text-[10px] uppercase font-semibold text-gray-600">Orçamento Técnico</span>
          <span className="block text-xl font-black">O.S. Nº {ordem.numero}</span>
          <span className="block text-[10px] text-gray-700 mt-1">
            Data: {orc.criado_em ? formatarData(orc.criado_em) : formatarDataHora(new Date().toISOString())}
          </span>
        </div>
      </div>

      {/* DADOS BÁSICOS */}
      <div className="border border-black mb-4 grid grid-cols-2 p-2.5 gap-2 text-[11px]">
        <div>
          <span className="font-semibold block text-[10px] text-gray-600 uppercase">Cliente</span>
          <span className="font-bold text-xs">{cliente.nome_ou_razao || 'Cliente Balcão'}</span>
          <span className="block text-[10px] text-gray-700">
            Doc:{' '}
            {cliente.documento
              ? cliente.tipo === 'PF'
                ? formatarCPF(cliente.documento)
                : formatarCNPJ(cliente.documento)
              : 'Não informado (Balcão)'}
          </span>
          <span className="block text-[10px] text-gray-700">
            Tel: {cliente.contato ? formatarTelefone(cliente.contato) : 'Não informado'}
          </span>
        </div>
        <div>
          <span className="font-semibold block text-[10px] text-gray-600 uppercase">Equipamento</span>
          <span className="font-bold text-xs">
            {ordem.impressora.marca} {ordem.impressora.modelo}
          </span>
          <span className="block text-[10px] text-gray-700">Série: {ordem.impressora.serie}</span>
          <span className="block text-[10px] text-gray-700 truncate">Defeito: {ordem.impressora.defeito}</span>
        </div>
      </div>

      {/* TABELA DE PEÇAS E PRODUTOS */}
      <div className="border border-black mb-4">
        <div className="bg-gray-200 border-b border-black px-2 py-1 font-bold uppercase text-[11px]">
          Peças e Materiais Necessários
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black bg-gray-50 text-[10px] uppercase font-semibold">
              <th className="p-1.5 w-10 text-center">Item</th>
              <th className="p-1.5">Descrição</th>
              <th className="p-1.5 w-16 text-center">Qtd</th>
              <th className="p-1.5 w-24 text-right">Valor Unit.</th>
              <th className="p-1.5 w-28 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {orc.itens.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-2 text-center text-gray-500 italic">
                  Nenhuma peça adicional (apenas mão de obra e serviços técnicos).
                </td>
              </tr>
            ) : (
              orc.itens.map((it, idx) => (
                <tr key={it.id || idx} className="border-b border-gray-300 text-[11px]">
                  <td className="p-1.5 text-center font-mono">{idx + 1}</td>
                  <td className="p-1.5 font-medium">{it.descricao}</td>
                  <td className="p-1.5 text-center font-mono">{it.qtd}</td>
                  <td className="p-1.5 text-right font-mono">{formatarMoeda(it.valor_unit)}</td>
                  <td className="p-1.5 text-right font-mono font-semibold">
                    {formatarMoeda(it.qtd * it.valor_unit)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* TOTAIS E MÃO DE OBRA */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-black p-2.5">
          <span className="font-semibold block text-[10px] uppercase text-gray-600 mb-1">
            Condições e Observações Técnicas
          </span>
          {orc.prazo && (
            <p className="text-[11px] mb-1">
              <strong>Prazo Estimado de Reparo:</strong> {orc.prazo}
            </p>
          )}
          {orc.obs ? (
            <p className="text-[10px] text-gray-800 whitespace-pre-line">{orc.obs}</p>
          ) : (
            <p className="text-[10px] text-gray-500 italic">Sem observações complementares.</p>
          )}
          <p className="text-[9px] text-gray-600 mt-2">
            * Orçamento válido por 10 dias corridos a partir desta emissão.
          </p>
        </div>

        <div className="border border-black p-2.5 flex flex-col justify-between bg-gray-50">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between py-0.5 border-b border-gray-300">
              <span className="text-gray-700">Subtotal de Peças:</span>
              <span className="font-mono">
                {formatarMoeda(orc.itens.reduce((acc, i) => acc + i.qtd * i.valor_unit, 0))}
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-gray-300">
              <span className="text-gray-700">Mão de Obra Técnica:</span>
              <span className="font-mono">{formatarMoeda(orc.mao_de_obra)}</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t-2 border-black flex justify-between items-baseline">
            <span className="font-bold text-sm uppercase">Valor Total:</span>
            <span className="font-black text-xl font-mono">{formatarMoeda(orc.total)}</span>
          </div>
        </div>
      </div>

      <div className="border border-dashed border-gray-400 p-2 text-center text-[10px] text-gray-600">
        Para aprovação deste orçamento, entre em contato pelo telefone/WhatsApp{' '}
        <strong>{formatarTelefone(config.telefone)}</strong> informando o número da O.S. ({ordem.numero}).
      </div>
    </div>
  );
};
