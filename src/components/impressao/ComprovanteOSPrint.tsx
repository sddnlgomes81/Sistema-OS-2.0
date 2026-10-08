import React from 'react';
import { Configuracoes, OrdemServico } from '../../types';
import {
  formatarCNPJ,
  formatarCPF,
  formatarDataHora,
  formatarTelefone,
} from '../../utils/validation';
import { Printer } from 'lucide-react';

interface Props {
  ordem: OrdemServico;
  config: Configuracoes;
}

export const ComprovanteOSPrint: React.FC<Props> = ({ ordem, config }) => {
  const cliente = ordem.cliente_snapshot;

  // Substitui marcador {DIAS} pelos valores configurados
  const textoGarantia = config.texto_garantia.replace(
    /\{DIAS\}/g,
    String(config.garantia_dias)
  );
  const textoRetirada = config.texto_retirada.replace(
    /\{DIAS\}/g,
    String(config.retirada_dias)
  );

  return (
    <div className="print-document-a4 bg-white text-black text-xs leading-relaxed max-w-3xl mx-auto p-4 sm:p-6 border border-gray-300 print:border-none print:p-0">
      {/* CABEÇALHO DA EMPRESA */}
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
            {config.email && <p className="text-[10px] text-gray-700">E-mail: {config.email}</p>}
          </div>
        </div>

        <div className="text-right border border-black p-2 rounded bg-gray-50 print:bg-transparent min-w-[140px]">
          <span className="block text-[10px] uppercase font-semibold text-gray-600">Comprovante de Entrada</span>
          <span className="block text-xl font-black tracking-wider">O.S. Nº {ordem.numero}</span>
          <span className="block text-[10px] font-medium mt-1">
            Entrada: {formatarDataHora(ordem.criado_em)}
          </span>
        </div>
      </div>

      {/* DADOS DO CLIENTE */}
      <div className="border border-black mb-3">
        <div className="bg-gray-200 border-b border-black px-2 py-0.5 font-bold uppercase text-[11px]">
          1. Identificação do Cliente
        </div>
        <div className="p-2.5 grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="col-span-2">
            <span className="font-semibold block text-[10px] text-gray-600 uppercase">
              {cliente.tipo === 'PF'
                ? 'Nome do Cliente'
                : cliente.tipo === 'PJ'
                ? 'Razão Social'
                : 'Cliente (Avulso / Balcão)'}
            </span>
            <span className="font-bold text-sm">{cliente.nome_ou_razao || 'Cliente Balcão'}</span>
          </div>

          <div>
            <span className="font-semibold block text-[10px] text-gray-600 uppercase">
              {cliente.tipo === 'PF' ? 'CPF' : cliente.tipo === 'PJ' ? 'CNPJ' : 'Documento'}
            </span>
            <span className="font-mono font-medium">
              {cliente.documento
                ? cliente.tipo === 'PF'
                  ? formatarCPF(cliente.documento)
                  : formatarCNPJ(cliente.documento)
                : 'Não informado (Balcão)'}
            </span>
          </div>

          <div>
            <span className="font-semibold block text-[10px] text-gray-600 uppercase">Telefone / WhatsApp</span>
            <span className="font-medium">
              {cliente.contato ? formatarTelefone(cliente.contato) : 'Não informado'}
            </span>
          </div>

          {cliente.tipo === 'PJ' && cliente.inscricao_estadual && (
            <div>
              <span className="font-semibold block text-[10px] text-gray-600 uppercase">Inscrição Estadual</span>
              <span>{cliente.inscricao_estadual}</span>
            </div>
          )}

          {cliente.endereco && (
            <div className="col-span-2 sm:col-span-3">
              <span className="font-semibold block text-[10px] text-gray-600 uppercase">Endereço</span>
              <span>{cliente.endereco}</span>
            </div>
          )}
        </div>
      </div>

      {/* DADOS DO EQUIPAMENTO E ACESSÓRIOS */}
      <div className="border border-black mb-3">
        <div className="bg-gray-200 border-b border-black px-2 py-0.5 font-bold uppercase text-[11px]">
          2. Dados do Equipamento e Itens Acompanhantes
        </div>
        <div className="p-2.5 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="font-semibold block text-[10px] text-gray-600 uppercase">Marca</span>
              <span className="font-bold">{ordem.impressora.marca}</span>
            </div>
            <div>
              <span className="font-semibold block text-[10px] text-gray-600 uppercase">Modelo</span>
              <span className="font-bold">{ordem.impressora.modelo}</span>
            </div>
            <div>
              <span className="font-semibold block text-[10px] text-gray-600 uppercase">Número de Série</span>
              <span className="font-mono font-bold">{ordem.impressora.serie}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-300">
            <span className="font-semibold block text-[10px] text-gray-600 uppercase mb-1">
              Acessórios e suprimentos deixados com o equipamento:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-2 text-[11px]">
              <div>
                <span className="font-mono">[{ordem.acessorios.toner ? 'X' : ' '}]</span> Toner
                {ordem.acessorios.toner && ordem.obs_toner && (
                  <span className="block text-[10px] text-gray-700 italic pl-4">({ordem.obs_toner})</span>
                )}
              </div>
              <div>
                <span className="font-mono">[{ordem.acessorios.cartucho_tinta ? 'X' : ' '}]</span> Cartucho de Tinta
                {ordem.acessorios.cartucho_tinta && ordem.obs_cartucho && (
                  <span className="block text-[10px] text-gray-700 italic pl-4">({ordem.obs_cartucho})</span>
                )}
              </div>
              <div>
                <span className="font-mono">[{ordem.acessorios.tinta ? 'X' : ' '}]</span> Tinta no Tanque
                {ordem.acessorios.tinta && ordem.obs_tinta && (
                  <span className="block text-[10px] text-gray-700 italic pl-4">({ordem.obs_tinta})</span>
                )}
              </div>
              <div>
                <span className="font-mono">[{ordem.acessorios.cabo_energia ? 'X' : ' '}]</span> Cabo de Energia
              </div>
              <div>
                <span className="font-mono">[{ordem.acessorios.cabo_dados ? 'X' : ' '}]</span> Cabo de Dados (USB/Rede)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DEFEITO RELATADO */}
      <div className="border border-black mb-3">
        <div className="bg-gray-200 border-b border-black px-2 py-0.5 font-bold uppercase text-[11px]">
          3. Defeito Relatado pelo Cliente
        </div>
        <div className="p-2.5 min-h-[48px] bg-white">
          <p className="font-medium whitespace-pre-line text-xs">{ordem.impressora.defeito}</p>
        </div>
      </div>

      {/* INFORMAÇÕES IMPORTANTES AO CLIENTE */}
      <div className="border border-black mb-4">
        <div className="bg-gray-200 border-b border-black px-2 py-0.5 font-bold uppercase text-[10px]">
          4. Informações Importantes e Termos de Serviço
        </div>
        <div className="p-2 space-y-1.5 text-[9.5px] leading-tight text-justify">
          <p>
            <strong>• Garantia:</strong> {textoGarantia}
          </p>
          <p>
            <strong>• Prazo de Retirada:</strong> {textoRetirada}
          </p>
          <p className="text-[9px] italic text-gray-600">
            * Este documento é apenas um comprovante de entrega para análise técnica e não possui valor fiscal ou garantia de aprovação prévia. Não contém valores cobrados nesta etapa.
          </p>
        </div>
      </div>

      {/* ASSINATURAS */}
      <div className="grid grid-cols-2 gap-8 pt-8 mt-4 border-t border-dashed border-gray-400">
        <div className="text-center">
          <div className="border-t border-black pt-1 mx-4">
            <span className="font-bold block text-[11px]">{cliente.nome_ou_razao}</span>
            <span className="text-[10px] text-gray-600">Assinatura do Cliente / Responsável</span>
          </div>
        </div>

        <div className="text-center">
          <div className="border-t border-black pt-1 mx-4">
            <span className="font-bold block text-[11px]">{config.nome_fantasia || config.razao_social}</span>
            <span className="text-[10px] text-gray-600">Responsável Técnico / Recepção</span>
          </div>
        </div>
      </div>
    </div>
  );
};
