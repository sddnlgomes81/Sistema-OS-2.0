import React, { useState } from 'react';
import { CreditCard, DollarSign, X, CheckCircle2, Receipt } from 'lucide-react';
import { FormaPagamento, OrdemServico, Pagamento } from '../../types';
import { formatarMoeda } from '../../utils/validation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ordem: OrdemServico;
  onConfirmarPagamento: (pagamento: Pagamento) => Promise<void>;
}

export const PagamentoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  ordem,
  onConfirmarPagamento,
}) => {
  const orc = ordem.orcamento;
  const total = orc?.total || 0;

  const [forma, setForma] = useState<FormaPagamento>('Pix');
  const [valorRecebido, setValorRecebido] = useState<number>(total);
  const [salvando, setSalvando] = useState(false);

  if (!isOpen) return null;

  const formas: FormaPagamento[] = [
    'Pix',
    'Dinheiro',
    'Cartão de Débito',
    'Cartão de Crédito',
  ];

  // Cálculo automático do troco
  const troco = forma === 'Dinheiro' ? Math.max(0, (valorRecebido || 0) - total) : 0;
  const valorInsuficiente = forma === 'Dinheiro' && (valorRecebido || 0) < total;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando || valorInsuficiente) return;

    setSalvando(true);
    try {
      const pag: Pagamento = {
        forma,
        total_pago: total,
        valor_recebido: forma === 'Dinheiro' ? valorRecebido : undefined,
        troco: forma === 'Dinheiro' ? troco : undefined,
        data: new Date().toISOString(),
      };
      await onConfirmarPagamento(pag);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6">
        {/* CABEÇALHO */}
        <div className="bg-emerald-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-base">Receber Pagamento e Finalizar O.S.</h3>
              <p className="text-xs text-emerald-200">
                O.S. Nº {ordem.numero} • {ordem.cliente_snapshot.nome_ou_razao}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* RESUMO DO ORÇAMENTO */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="font-bold uppercase text-slate-500 text-[10px] tracking-wider">
              Resumo dos Serviços e Peças
            </div>

            {orc?.itens && orc.itens.length > 0 && (
              <div className="space-y-1">
                {orc.itens.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span className="truncate pr-2">
                      {it.qtd}x {it.descricao}
                    </span>
                    <span className="font-mono">{formatarMoeda(it.qtd * it.valor_unit)}</span>
                  </div>
                ))}
              </div>
            )}

            {orc && orc.mao_de_obra > 0 && (
              <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200">
                <span>Mão de Obra Técnica:</span>
                <span className="font-mono">{formatarMoeda(orc.mao_de_obra)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-300 font-bold text-sm">
              <span className="uppercase text-slate-900">Total a Pagar:</span>
              <span className="font-mono text-xl text-emerald-700 font-black">
                {formatarMoeda(total)}
              </span>
            </div>
          </div>

          {/* FORMA DE PAGAMENTO */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {formas.map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => {
                    setForma(f);
                    if (f === 'Dinheiro' && (!valorRecebido || valorRecebido < total)) {
                      setValorRecebido(total);
                    }
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    forma === f
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f === 'Dinheiro' ? (
                    <DollarSign className="w-4 h-4" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  <span>{f}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CAMPOS ESPECÍFICOS DE DINHEIRO (VALOR RECEBIDO E TROCO) */}
          {forma === 'Dinheiro' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                  Valor em Dinheiro Entregue pelo Cliente (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={valorRecebido || ''}
                  onChange={(e) => setValorRecebido(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full text-base font-mono font-bold px-3 py-2 rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {valorInsuficiente && (
                <span className="text-xs text-rose-600 font-bold block">
                  Valor recebido é menor que o total ({formatarMoeda(total)}).
                </span>
              )}

              <div className="flex justify-between items-baseline pt-2 border-t border-amber-200">
                <span className="text-xs font-bold uppercase text-amber-900">Troco a Devolver:</span>
                <span className="text-lg font-black font-mono text-amber-800">
                  {formatarMoeda(troco)}
                </span>
              </div>
            </div>
          )}

          {/* BOTÕES DE AÇÃO */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || valorInsuficiente}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-md cursor-pointer ${
                valorInsuficiente
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{salvando ? 'Processando...' : 'Confirmar Pagamento e Finalizar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
