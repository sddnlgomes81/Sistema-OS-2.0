import React, { useState, useMemo } from 'react';
import { Search, User, Phone, FileText, ArrowRight, X, Printer, History } from 'lucide-react';
import { Cliente, OrdemServico } from '../../types';
import { formatarCNPJ, formatarCPF, formatarTelefone } from '../../utils/validation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  ordens: OrdemServico[];
  onSelecionarCliente: (cliente: Cliente) => void;
}

export const BuscarClienteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  clientes,
  ordens,
  onSelecionarCliente,
}) => {
  const [busca, setBusca] = useState('');

  // Agrupa impressoras anteriores por cliente
  const historicoPorCliente = useMemo(() => {
    const mapa: Record<string, { totalOrdens: number; impressoras: Array<{ marca: string; modelo: string; serie: string }> }> = {};

    clientes.forEach((c) => {
      const ordensDoCliente = ordens.filter(
        (o) => o.cliente_id === c.id || (o.cliente_snapshot.documento && o.cliente_snapshot.documento === c.documento)
      );

      const impressorasVistas = new Set<string>();
      const impressorasUnicas: Array<{ marca: string; modelo: string; serie: string }> = [];

      ordensDoCliente.forEach((o) => {
        const chave = `${o.impressora.marca}-${o.impressora.modelo}-${o.impressora.serie}`.toLowerCase();
        if (!impressorasVistas.has(chave)) {
          impressorasVistas.add(chave);
          impressorasUnicas.push({
            marca: o.impressora.marca,
            modelo: o.impressora.modelo,
            serie: o.impressora.serie,
          });
        }
      });

      mapa[c.id] = {
        totalOrdens: ordensDoCliente.length,
        impressoras: impressorasUnicas,
      };
    });

    return mapa;
  }, [clientes, ordens]);

  // Filtra clientes pelo termo pesquisado
  const clientesFiltrados = useMemo(() => {
    if (!busca.trim()) return clientes;
    const termo = busca.toLowerCase().trim();

    return clientes.filter((c) => {
      const bateNome = c.nome_ou_razao.toLowerCase().includes(termo);
      const bateDoc = c.documento ? c.documento.includes(termo) : false;
      const bateContato = c.contato ? c.contato.includes(termo) : false;
      const bateEndereco = c.endereco ? c.endereco.toLowerCase().includes(termo) : false;

      // Também busca se a impressora anterior do cliente bate com o termo
      const dadosHist = historicoPorCliente[c.id];
      const bateImpressora = dadosHist?.impressoras.some((imp) =>
        `${imp.marca} ${imp.modelo} ${imp.serie}`.toLowerCase().includes(termo)
      );

      return bateNome || bateDoc || bateContato || bateEndereco || bateImpressora;
    });
  }, [clientes, busca, historicoPorCliente]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-4">
        {/* TOPO */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base sm:text-lg">Clientes já Cadastrados</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Selecione o cliente para registrar uma nova impressora ou outro serviço.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CAMPO DE BUSCA */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, CPF/CNPJ, telefone ou modelo de impressora..."
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>
        </div>

        {/* LISTA DE CLIENTES */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {clientesFiltrados.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Nenhum cliente cadastrado encontrado com este termo.</p>
            </div>
          ) : (
            clientesFiltrados.map((cliente) => {
              const hist = historicoPorCliente[cliente.id] || { totalOrdens: 0, impressoras: [] };

              return (
                <div
                  key={cliente.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{cliente.nome_ou_razao}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-600">
                        {cliente.tipo}
                      </span>
                      {hist.totalOrdens > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                          <History className="w-3 h-3" />
                          <span>{hist.totalOrdens} serviço(s) anterior(es)</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 text-[11px]">
                      {cliente.documento && (
                        <span className="font-mono">
                          Doc:{' '}
                          {cliente.tipo === 'PF'
                            ? formatarCPF(cliente.documento)
                            : formatarCNPJ(cliente.documento)}
                        </span>
                      )}
                      {cliente.contato && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{formatarTelefone(cliente.contato)}</span>
                        </span>
                      )}
                      {cliente.endereco && (
                        <span className="text-slate-500 truncate max-w-xs">{cliente.endereco}</span>
                      )}
                    </div>

                    {/* Impressoras que o cliente já trouxe anteriormente */}
                    {hist.impressoras.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 text-[10.5px]">
                        <span className="text-slate-500 block mb-1 font-semibold flex items-center gap-1">
                          <Printer className="w-3 h-3 text-slate-400" />
                          <span>Equipamentos anteriores deste cliente:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {hist.impressoras.map((imp, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                            >
                              {imp.marca} {imp.modelo} {imp.serie ? `(S/N: ${imp.serie})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BOTÃO SELECIONAR CLIENTE */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelecionarCliente(cliente);
                      onClose();
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
                  >
                    <span>Selecionar e Registrar Nova Impressora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
