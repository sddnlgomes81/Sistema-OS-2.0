import React from 'react';
import { Configuracoes, OrdemServico } from '../../types';
import {
  formatarCNPJ,
  formatarDataHora,
  formatarMoeda,
  formatarTelefone,
} from '../../utils/validation';

interface Props {
  ordem: OrdemServico;
  config: Configuracoes;
}

export const CupomNaoFiscalPrint: React.FC<Props> = ({ ordem, config }) => {
  const pag = ordem.pagamento;
  const orc = ordem.orcamento;
  const cliente = ordem.cliente_snapshot;

  return (
    <div className="print-receipt-80mm bg-white text-black max-w-[320px] mx-auto p-3 font-mono text-[11px] leading-tight border border-gray-300 print:border-none print:p-0 print:max-w-none">
      {/* CABEÇALHO */}
      <div className="text-center pb-2 border-b border-black">
        {config.logo_base64 && (
          <img
            src={config.logo_base64}
            alt="Logo"
            className="w-12 h-12 object-contain mx-auto mb-1 filter grayscale contrast-200"
          />
        )}
        <div className="font-bold text-xs uppercase tracking-tight">
          {config.nome_fantasia || config.razao_social}
        </div>
        <div className="text-[10px] text-gray-800">{config.razao_social}</div>
        <div className="text-[10px]">CNPJ: {formatarCNPJ(config.cnpj)}</div>
        <div className="text-[10px]">{config.endereco}</div>
        <div className="text-[10px]">Tel: {formatarTelefone(config.telefone)}</div>
      </div>

      {/* AVISO EM DESTAQUE OBRIGATÓRIO */}
      <div className="my-2 border-2 border-black py-1 px-2 text-center font-black text-xs uppercase tracking-wider">
        DOCUMENTO SEM VALOR FISCAL
      </div>

      {/* DADOS DA O.S. E CLIENTE */}
      <div className="py-1 border-b border-dashed border-black space-y-0.5 text-[10.5px]">
        <div className="flex justify-between font-bold">
          <span>O.S. Nº {ordem.numero}</span>
          <span>{formatarDataHora(pag?.data || new Date().toISOString())}</span>
        </div>
        <div>
          <span className="text-gray-700">Cliente: </span>
          <span className="font-semibold">{cliente.nome_ou_razao}</span>
        </div>
        <div>
          <span className="text-gray-700">Equipamento: </span>
          <span>{ordem.impressora.marca} {ordem.impressora.modelo}</span>
        </div>
        <div>
          <span className="text-gray-700">Série: </span>
          <span>{ordem.impressora.serie}</span>
        </div>
      </div>

      {/* DISCRIMINAÇÃO DOS SERVIÇOS E PEÇAS */}
      <div className="py-2 border-b border-dashed border-black">
        <div className="font-bold uppercase text-[10px] mb-1">Discriminação:</div>
        {orc && orc.itens.length > 0 && (
          <div className="space-y-1 mb-1">
            {orc.itens.map((it, idx) => (
              <div key={idx} className="flex justify-between text-[10px]">
                <span className="truncate pr-1">
                  {it.qtd}x {it.descricao}
                </span>
                <span className="shrink-0">{formatarMoeda(it.qtd * it.valor_unit)}</span>
              </div>
            ))}
          </div>
        )}

        {orc && orc.mao_de_obra > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>Serviço / Mão de Obra</span>
            <span className="shrink-0">{formatarMoeda(orc.mao_de_obra)}</span>
          </div>
        )}
      </div>

      {/* TOTAIS E PAGAMENTO */}
      <div className="py-2 border-b border-black space-y-1">
        <div className="flex justify-between font-black text-sm">
          <span>TOTAL A PAGAR:</span>
          <span>{formatarMoeda(pag?.total_pago || orc?.total || 0)}</span>
        </div>

        {pag && (
          <>
            <div className="flex justify-between pt-1 border-t border-dotted border-gray-400 text-[10.5px]">
              <span>Forma de Pagamento:</span>
              <span className="font-bold uppercase">{pag.forma}</span>
            </div>

            {pag.forma === 'Dinheiro' && (
              <>
                <div className="flex justify-between text-[10.5px]">
                  <span>Valor Recebido:</span>
                  <span>{formatarMoeda(pag.valor_recebido || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-[10.5px]">
                  <span>Troco:</span>
                  <span>{formatarMoeda(pag.troco || 0)}</span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* RESUMO DA GARANTIA */}
      <div className="py-2 text-center text-[9.5px] leading-tight space-y-1">
        <div className="font-bold uppercase">Garantia: {config.garantia_dias} dias</div>
        <div className="text-gray-700">
          Válida exclusivamente para os serviços e peças discriminados neste cupom. Guarde este comprovante.
        </div>
      </div>

      {/* RODAPÉ */}
      <div className="text-center pt-2 border-t border-dashed border-black text-[9px] text-gray-600">
        Obrigado pela preferência!
        <br />
        Emitido por OS Impressoras
      </div>
    </div>
  );
};
