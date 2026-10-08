import React, { useState } from 'react';
import { Plus, Trash2, X, Calculator, Calendar, FileText } from 'lucide-react';
import { OrcamentoItem } from '../../types';
import { formatarMoeda } from '../../utils/validation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (orcamento: {
    itens: OrcamentoItem[];
    mao_de_obra: number;
    total: number;
    prazo?: string;
    obs?: string;
  }) => Promise<void>;
  osNumero: string;
  orcamentoExistente?: {
    itens: OrcamentoItem[];
    mao_de_obra: number;
    total: number;
    prazo?: string;
    obs?: string;
  };
}

export const OrcamentoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSalvar,
  osNumero,
  orcamentoExistente,
}) => {
  const [itens, setItens] = useState<OrcamentoItem[]>(
    orcamentoExistente?.itens || [
      { id: 'item-1', descricao: '', qtd: 1, valor_unit: 0 },
    ]
  );
  const [maoDeObra, setMaoDeObra] = useState<number>(
    orcamentoExistente?.mao_de_obra ?? 0
  );
  const [prazo, setPrazo] = useState<string>(orcamentoExistente?.prazo || '2 dias úteis');
  const [obs, setObs] = useState<string>(orcamentoExistente?.obs || '');
  const [salvando, setSalvando] = useState(false);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItens((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        descricao: '',
        qtd: 1,
        valor_unit: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItens((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof OrcamentoItem,
    val: string | number
  ) => {
    setItens((prev) => {
      const novos = [...prev];
      novos[index] = { ...novos[index], [field]: val };
      return novos;
    });
  };

  // Cálculo automático do total
  const subtotalPecas = itens.reduce((acc, it) => acc + (it.qtd || 0) * (it.valor_unit || 0), 0);
  const totalGeral = subtotalPecas + (maoDeObra || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;

    // Filtra itens vazios
    const itensValidos = itens.filter((it) => it.descricao.trim().length > 0);

    setSalvando(true);
    try {
      await onSalvar({
        itens: itensValidos,
        mao_de_obra: maoDeObra,
        total: totalGeral,
        prazo: prazo.trim() || undefined,
        obs: obs.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
        {/* CABEÇALHO DO MODAL */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base sm:text-lg">Lançar Orçamento Técnico</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              O.S. Nº {osNumero} • Informe as peças, mão de obra e prazos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO DO FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* LISTA DE PEÇAS E MATERIAIS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Peças e Produtos
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 py-1 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Linha</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {itens.map((it, idx) => (
                <div
                  key={it.id || idx}
                  className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Descrição da peça ou insumo (ex: Rolo fusor, cabeça de impressão...)"
                      value={it.descricao}
                      onChange={(e) => handleItemChange(idx, 'descricao', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="w-16">
                    <input
                      type="number"
                      min={1}
                      title="Quantidade"
                      placeholder="Qtd"
                      value={it.qtd}
                      onChange={(e) =>
                        handleItemChange(idx, 'qtd', Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                      className="w-full text-center text-xs px-1.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      title="Valor Unitário"
                      placeholder="Valor Unit."
                      value={it.valor_unit || ''}
                      onChange={(e) =>
                        handleItemChange(idx, 'valor_unit', parseFloat(e.target.value) || 0)
                      }
                      className="w-full text-right text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div className="w-24 text-right font-mono text-xs font-semibold text-slate-700 hidden sm:block">
                    {formatarMoeda((it.qtd || 0) * (it.valor_unit || 0))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    title="Remover linha"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* MÃO DE OBRA E TOTALIZADORES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Valor da Mão de Obra (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={maoDeObra || ''}
                onChange={(e) => setMaoDeObra(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 flex flex-col justify-between">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal Peças:</span>
                <span className="font-mono">{formatarMoeda(subtotalPecas)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>Mão de Obra:</span>
                <span className="font-mono">{formatarMoeda(maoDeObra)}</span>
              </div>
              <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-indigo-200">
                <span className="text-xs font-bold uppercase text-indigo-900">Total Geral:</span>
                <span className="text-lg font-black font-mono text-indigo-700">
                  {formatarMoeda(totalGeral)}
                </span>
              </div>
            </div>
          </div>

          {/* PRAZO E OBSERVAÇÕES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Prazo Estimado (Opcional)</span>
              </label>
              <input
                type="text"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                placeholder="Ex: 24 horas, 2 dias úteis..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Observações Técnicas (Opcional)</span>
              </label>
              <textarea
                rows={2}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Condições, orientações ou detalhes da peça..."
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* RODAPÉ DO MODAL */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              {salvando ? 'Salvando...' : 'Salvar Orçamento e Atualizar Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
