import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Building2,
  Printer,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  PrinterIcon,
  RotateCcw,
  Sparkles,
  Zap,
  UserCheck,
  Search,
  History,
  RotateCw,
  Plus,
} from 'lucide-react';
import {
  Cliente,
  Configuracoes,
  OrdemServico,
  TipoCliente,
} from '../../types';
import { dataStore } from '../../services/storage';
import {
  apenasDigitos,
  formatarCNPJ,
  formatarCPF,
  formatarTelefone,
  validarCNPJ,
  validarCPF,
  validarContato,
} from '../../utils/validation';
import { BuscarClienteModal } from './BuscarClienteModal';

interface Props {
  config: Configuracoes;
  onOSCreated: (novaOrdem: OrdemServico) => void;
  onPrintOS: (ordem: OrdemServico) => void;
  clientePreSelecionado?: Cliente | null;
  onLimparClientePreSelecionado?: () => void;
  ordensExistentes?: OrdemServico[];
}

export const NovaOSWizard: React.FC<Props> = ({
  onOSCreated,
  onPrintOS,
  clientePreSelecionado,
  onLimparClientePreSelecionado,
  ordensExistentes = [],
}) => {
  // Controle de etapas (1: Cliente, 2: Impressora, 3: Resumo / Salvo)
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);

  // Lista de todos os clientes cadastrados para o modal de busca
  const [listaClientes, setListaClientes] = useState<Cliente[]>([]);
  const [modalBuscaClienteAberto, setModalBuscaClienteAberto] = useState(false);

  // ETAPA 1 - CLIENTE
  const [tipoCliente, setTipoCliente] = useState<TipoCliente | null>(null);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [nomeOuRazao, setNomeOuRazao] = useState('');
  const [documentoRaw, setDocumentoRaw] = useState(''); // apenas dígitos
  const [contatoRaw, setContatoRaw] = useState(''); // apenas dígitos
  const [endereco, setEndereco] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');

  // Opção: Não salvar cliente na base permanente
  const [naoSalvarClienteNoBanco, setNaoSalvarClienteNoBanco] = useState(false);

  // Cliente existente detectado automaticamente por documento
  const [clienteExistente, setClienteExistente] = useState<Cliente | null>(null);

  // ETAPA 2 - IMPRESSORA
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [serie, setSerie] = useState('');
  const [defeito, setDefeito] = useState('');

  // Opção: Dispensar número de série (Equipamento avulso / sem série)
  const [semNumeroSerie, setSemNumeroSerie] = useState(false);

  // Acessórios
  const [acessorios, setAcessorios] = useState({
    toner: false,
    cartucho_tinta: false,
    tinta: false,
    cabo_dados: false,
    cabo_energia: false,
  });
  const [obsToner, setObsToner] = useState('');
  const [obsCartucho, setObsCartucho] = useState('');
  const [obsTinta, setObsTinta] = useState('');

  // ETAPA 3 - ESTADO DE SALVAMENTO
  const [salvando, setSalvando] = useState(false);
  const [ordemCriada, setOrdemCriada] = useState<OrdemServico | null>(null);

  // Carrega lista de clientes cadastrados
  const carregarClientes = async () => {
    try {
      const cad = await dataStore.getClientes();
      setListaClientes(cad);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  // Se receber clientePreSelecionado (ex: clicou em "Nova O.S. para este cliente" no Fluxograma)
  useEffect(() => {
    if (clientePreSelecionado) {
      setTipoCliente(clientePreSelecionado.tipo);
      setClienteId(clientePreSelecionado.id);
      setNomeOuRazao(clientePreSelecionado.nome_ou_razao);
      setDocumentoRaw(clientePreSelecionado.documento || '');
      setContatoRaw(clientePreSelecionado.contato || '');
      setEndereco(clientePreSelecionado.endereco || '');
      setInscricaoEstadual(clientePreSelecionado.inscricao_estadual || '');
      setNaoSalvarClienteNoBanco(false);
      // Avança diretamente para a etapa 2 para informar a nova impressora!
      setEtapa(2);
    }
  }, [clientePreSelecionado]);

  // Histórico de impressoras anteriores do cliente atualmente selecionado
  const impressorasAnterioresDoCliente = useMemo(() => {
    if (!clienteId && !documentoRaw && !nomeOuRazao) return [];

    const limpoDoc = apenasDigitos(documentoRaw);
    const ordensDoCliente = ordensExistentes.filter((o) => {
      if (clienteId && o.cliente_id === clienteId) return true;
      if (limpoDoc && o.cliente_snapshot.documento && apenasDigitos(o.cliente_snapshot.documento) === limpoDoc) {
        return true;
      }
      if (
        nomeOuRazao.trim().length > 3 &&
        o.cliente_snapshot.nome_ou_razao.toLowerCase().trim() === nomeOuRazao.toLowerCase().trim()
      ) {
        return true;
      }
      return false;
    });

    const vistas = new Set<string>();
    const unicas: Array<{
      marca: string;
      modelo: string;
      serie: string;
      defeitoAnterior: string;
      data: string;
    }> = [];

    ordensDoCliente.forEach((o) => {
      const chave = `${o.impressora.marca}-${o.impressora.modelo}-${o.impressora.serie}`.toLowerCase();
      if (!vistas.has(chave)) {
        vistas.add(chave);
        unicas.push({
          marca: o.impressora.marca,
          modelo: o.impressora.modelo,
          serie: o.impressora.serie,
          defeitoAnterior: o.impressora.defeito,
          data: o.criado_em,
        });
      }
    });

    return unicas;
  }, [clienteId, documentoRaw, nomeOuRazao, ordensExistentes]);

  // Verifica existência de cliente pelo CPF ou CNPJ digitado
  useEffect(() => {
    let ativo = true;
    const buscarCliente = async () => {
      if (tipoCliente === 'AVULSO') {
        setClienteExistente(null);
        return;
      }

      const digitos = apenasDigitos(documentoRaw);
      const tamanhoEsperado = tipoCliente === 'PF' ? 11 : 14;

      if (digitos.length === tamanhoEsperado) {
        const achou = await dataStore.getClienteByDocumento(digitos);
        if (ativo && achou && (!clienteId || clienteId !== achou.id)) {
          setClienteExistente(achou);
        } else if (ativo) {
          setClienteExistente(null);
        }
      } else {
        if (ativo) setClienteExistente(null);
      }
    };

    if (documentoRaw) {
      buscarCliente();
    } else {
      setClienteExistente(null);
    }

    return () => {
      ativo = false;
    };
  }, [documentoRaw, tipoCliente, clienteId]);

  // Função para aplicar cliente existente selecionado (do modal ou do alerta)
  const aplicarClienteExistente = (c: Cliente) => {
    setTipoCliente(c.tipo);
    setClienteId(c.id);
    setNomeOuRazao(c.nome_ou_razao);
    setDocumentoRaw(c.documento || '');
    setContatoRaw(c.contato || '');
    setEndereco(c.endereco || '');
    setInscricaoEstadual(c.inscricao_estadual || '');
    setClienteExistente(null);
    setNaoSalvarClienteNoBanco(false);
  };

  // HANDLERS NUMÉRICOS
  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = apenasDigitos(e.target.value);
    const limite = tipoCliente === 'PF' ? 11 : 14;
    setDocumentoRaw(raw.slice(0, limite));
  };

  const handleContatoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = apenasDigitos(e.target.value);
    setContatoRaw(raw.slice(0, 11));
  };

  // VALIDAÇÕES DA ETAPA 1
  const getDocumentoError = (): string | null => {
    if (!tipoCliente || tipoCliente === 'AVULSO') return null;

    if (tipoCliente === 'PF') {
      if (!documentoRaw) return null;
      if (documentoRaw.length < 11) return `Faltam ${11 - documentoRaw.length} dígitos no CPF (total de 11).`;
      if (!validarCPF(documentoRaw)) return 'CPF inválido. Verifique os números digitados.';
    } else if (tipoCliente === 'PJ') {
      if (!documentoRaw) return 'CNPJ é obrigatório para Pessoa Jurídica.';
      if (documentoRaw.length < 14) return `Faltam ${14 - documentoRaw.length} dígitos no CNPJ (total de 14).`;
      if (!validarCNPJ(documentoRaw)) return 'CNPJ inválido. Verifique os números digitados.';
    }
    return null;
  };

  const getContatoError = (): string | null => {
    if (tipoCliente === 'AVULSO') {
      if (!contatoRaw) return null;
      if (contatoRaw.length < 10) return `Número incompleto. Mínimo 10 dígitos (DDD + número).`;
      if (!validarContato(contatoRaw)) return 'DDD ou número inválido.';
      return null;
    }

    if (!contatoRaw) return 'Contato é obrigatório.';
    if (contatoRaw.length < 10) return `Número incompleto. Mínimo 10 dígitos (DDD + número).`;
    if (!validarContato(contatoRaw)) return 'DDD ou número inválido.';
    return null;
  };

  const isEtapa1Valida = (): boolean => {
    if (!tipoCliente) return false;
    if (tipoCliente === 'AVULSO') {
      return nomeOuRazao.trim().length > 0 && getContatoError() === null;
    }
    if (!nomeOuRazao.trim()) return false;
    if (getDocumentoError() !== null) return false;
    if (getContatoError() !== null) return false;
    return true;
  };

  // VALIDAÇÕES DA ETAPA 2
  const isEtapa2Valida = (): boolean => {
    const temMarca = marca.trim().length > 0;
    const temModelo = modelo.trim().length > 0;
    const temSerie = semNumeroSerie || serie.trim().length > 0;
    const temDefeito = defeito.trim().length > 0;

    return temMarca && temModelo && temSerie && temDefeito;
  };

  // MARCAS E MODELOS RÁPIDOS
  const marcasSugeridas = ['Epson', 'HP', 'Brother', 'Canon', 'Samsung', 'Lexmark', 'Genérica'];
  const modelosSugeridos = ['EcoTank', 'LaserJet', 'DeskJet', 'Smart Tank', 'Multifuncional', 'Térmica 80mm'];
  const defeitosSugeridos = [
    'Não puxa papel / Atolamento',
    'Manchas ou falhas na impressão',
    'Luzes piscando / Erro geral',
    'Não liga / Fonte',
    'Revisão e limpeza geral',
  ];

  // ATALHO 1 CLIQUE: PREENCHIMENTO BALCÃO
  const handlePreencherModoBalcaoRapido = () => {
    setTipoCliente('AVULSO');
    setNomeOuRazao('Cliente Balcão');
    setDocumentoRaw('');
    setContatoRaw('');
    setEndereco('');
    setInscricaoEstadual('');
    setNaoSalvarClienteNoBanco(true);

    setMarca('Genérica');
    setModelo('Multifuncional');
    setSemNumeroSerie(true);
    setSerie('SEM SÉRIE');
    setDefeito('Revisão e manutenção geral');

    setEtapa(2);
  };

  // APLICAR IMPRESSORA ANTERIOR (SE O MESMO APARELHO RETORNOU)
  const handleUsarImpressoraAnterior = (imp: { marca: string; modelo: string; serie: string }) => {
    setMarca(imp.marca);
    setModelo(imp.modelo);
    if (imp.serie === 'SEM SÉRIE' || !imp.serie) {
      setSemNumeroSerie(true);
      setSerie('SEM SÉRIE');
    } else {
      setSemNumeroSerie(false);
      setSerie(imp.serie);
    }
    setDefeito(''); // Limpa o defeito para informar o novo problema
  };

  // LIMPAR CAMPOS PARA NOVA IMPRESSORA
  const handleLimparCamposImpressora = () => {
    setMarca('');
    setModelo('');
    setSerie('');
    setSemNumeroSerie(false);
    setDefeito('');
  };

  // SALVAR ORDEM DE SERVIÇO
  const handleSalvarOS = async () => {
    if (salvando) return;
    setSalvando(true);

    try {
      let finalClienteId: string | undefined = clienteId || undefined;

      // 1. Salva ou atualiza o cliente apenas se o usuário deseja manter no banco
      if (!naoSalvarClienteNoBanco && tipoCliente && tipoCliente !== 'AVULSO') {
        const clienteSalvo = await dataStore.saveCliente({
          id: clienteId || undefined,
          tipo: tipoCliente,
          nome_ou_razao: nomeOuRazao.trim(),
          documento: documentoRaw || undefined,
          contato: contatoRaw || undefined,
          endereco: endereco.trim() || undefined,
          inscricao_estadual: inscricaoEstadual.trim() || undefined,
        });
        finalClienteId = clienteSalvo.id;
      }

      // 2. Cria a nova Ordem de Serviço
      const novaOS = await dataStore.createOrdem({
        cliente_id: finalClienteId,
        cliente_avulso: tipoCliente === 'AVULSO' || naoSalvarClienteNoBanco,
        cliente_snapshot: {
          tipo: tipoCliente!,
          nome_ou_razao: nomeOuRazao.trim() || 'Cliente Balcão',
          documento: documentoRaw || undefined,
          contato: contatoRaw || undefined,
          endereco: endereco.trim() || undefined,
          inscricao_estadual: inscricaoEstadual.trim() || undefined,
        },
        impressora: {
          marca: marca.trim() || 'Genérica',
          modelo: modelo.trim() || 'Balcão',
          serie: semNumeroSerie ? 'SEM SÉRIE' : (serie.trim().toUpperCase() || 'SEM SÉRIE'),
          defeito: defeito.trim(),
        },
        acessorios: {
          toner: acessorios.toner,
          cartucho_tinta: acessorios.cartucho_tinta,
          tinta: acessorios.tinta,
          cabo_dados: acessorios.cabo_dados,
          cabo_energia: acessorios.cabo_energia,
        },
        obs_toner: acessorios.toner ? obsToner.trim() : undefined,
        obs_cartucho: acessorios.cartucho_tinta ? obsCartucho.trim() : undefined,
        obs_tinta: acessorios.tinta ? obsTinta.trim() : undefined,
        status: 'aguardando_orcamento',
      });

      setOrdemCriada(novaOS);
      onOSCreated(novaOS);
    } catch (err) {
      console.error('Erro ao salvar O.S.:', err);
    } finally {
      setSalvando(false);
    }
  };

  // REINICIAR FORMULÁRIO
  const handleReiniciarFormulario = () => {
    if (onLimparClientePreSelecionado) onLimparClientePreSelecionado();
    setEtapa(1);
    setTipoCliente(null);
    setClienteId(null);
    setNomeOuRazao('');
    setDocumentoRaw('');
    setContatoRaw('');
    setEndereco('');
    setInscricaoEstadual('');
    setClienteExistente(null);
    setNaoSalvarClienteNoBanco(false);

    setMarca('');
    setModelo('');
    setSerie('');
    setSemNumeroSerie(false);
    setDefeito('');
    setAcessorios({
      toner: false,
      cartucho_tinta: false,
      tinta: false,
      cabo_dados: false,
      cabo_energia: false,
    });
    setObsToner('');
    setObsCartucho('');
    setObsTinta('');
    setOrdemCriada(null);
    carregarClientes();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* BARRA SUPERIOR DE AÇÕES RÁPIDAS: BUSCAR CLIENTE OU MODO BALCÃO */}
      {etapa === 1 && !ordemCriada && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* BOTÃO 1: BUSCAR CLIENTE JÁ CADASTRADO */}
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-indigo-950">
                  Cliente já Cadastrado?
                </h3>
                <p className="text-[11px] text-indigo-700">
                  Selecione da base para registrar nova impressora.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                carregarClientes();
                setModalBuscaClienteAberto(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <span>Buscar Cliente</span>
              {listaClientes.length > 0 && (
                <span className="text-[10px] bg-indigo-800 px-1.5 py-0.2 rounded-full font-mono">
                  {listaClientes.length}
                </span>
              )}
            </button>
          </div>

          {/* BOTÃO 2: ATENDIMENTO BALCÃO 1 CLIQUE */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-amber-950">
                  Modo Balcão Expresso
                </h3>
                <p className="text-[11px] text-amber-700">
                  Sem cadastro prévio e sem número de série.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePreencherModoBalcaoRapido}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>1 Clique</span>
            </button>
          </div>
        </div>
      )}

      {/* INDICADOR DE ETAPAS */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between relative max-w-xl mx-auto">
          {/* Linha de progresso */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-0">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{
                width: etapa === 1 ? '16%' : etapa === 2 ? '50%' : '100%',
              }}
            />
          </div>

          {/* Etapa 1 */}
          <div className="flex flex-col items-center z-10 bg-slate-50 px-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                etapa >= 1
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              1
            </div>
            <span className="text-xs font-semibold mt-1 text-slate-700">Cliente</span>
          </div>

          {/* Etapa 2 */}
          <div className="flex flex-col items-center z-10 bg-slate-50 px-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                etapa >= 2
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              2
            </div>
            <span className="text-xs font-semibold mt-1 text-slate-700">Nova Impressora</span>
          </div>

          {/* Etapa 3 */}
          <div className="flex flex-col items-center z-10 bg-slate-50 px-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                etapa >= 3
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              3
            </div>
            <span className="text-xs font-semibold mt-1 text-slate-700">Resumo</span>
          </div>
        </div>
      </div>

      {/* ETAPA 1: CLIENTE */}
      {etapa === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Etapa 1: Identificação do Cliente</h2>
              <p className="text-sm text-slate-500">
                Escolha o formato de atendimento ou selecione um cliente já cadastrado na oficina.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                carregarClientes();
                setModalBuscaClienteAberto(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer self-start sm:self-auto"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar na Base de Clientes</span>
            </button>
          </div>

          {/* SE UM CLIENTE JÁ CADASTRADO FOI VINCULADO */}
          {clienteId && (
            <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded">
                    Cliente Cadastrado Vinculado
                  </span>
                  {impressorasAnterioresDoCliente.length > 0 && (
                    <span className="text-xs text-indigo-800 font-semibold flex items-center gap-1">
                      <History className="w-3.5 h-3.5" />
                      <span>{impressorasAnterioresDoCliente.length} impressora(s) anterior(es)</span>
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{nomeOuRazao}</h3>
                <p className="text-xs text-slate-600">
                  {documentoRaw && `Doc: ${formatarCPF(documentoRaw)} • `}
                  {contatoRaw && `Contato: ${formatarTelefone(contatoRaw)}`}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEtapa(2)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Avançar para Nova Impressora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setClienteId(null)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-medium transition cursor-pointer"
                >
                  Alterar
                </button>
              </div>
            </div>
          )}

          {/* TRÊS BOTÕES GRANDES DE ESCOLHA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {/* 1. Pessoa Física */}
            <button
              type="button"
              onClick={() => {
                setTipoCliente('PF');
                setNaoSalvarClienteNoBanco(false);
                if (nomeOuRazao === 'Cliente Balcão') setNomeOuRazao('');
                if (tipoCliente === 'PJ') {
                  setDocumentoRaw('');
                  setInscricaoEstadual('');
                }
              }}
              className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between transition-all ${
                tipoCliente === 'PF'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`p-2.5 rounded-lg ${
                    tipoCliente === 'PF' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <User className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-slate-900">Pessoa Física</span>
              </div>
              <span className="text-xs text-slate-500">
                Nome completo e CPF opcional com validação.
              </span>
            </button>

            {/* 2. Pessoa Jurídica */}
            <button
              type="button"
              onClick={() => {
                setTipoCliente('PJ');
                setNaoSalvarClienteNoBanco(false);
                if (nomeOuRazao === 'Cliente Balcão') setNomeOuRazao('');
                if (tipoCliente === 'PF' || tipoCliente === 'AVULSO') {
                  setDocumentoRaw('');
                }
              }}
              className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between transition-all ${
                tipoCliente === 'PJ'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`p-2.5 rounded-lg ${
                    tipoCliente === 'PJ' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-slate-900">Pessoa Jurídica</span>
              </div>
              <span className="text-xs text-slate-500">
                Razão Social e CNPJ obrigatório com validação.
              </span>
            </button>

            {/* 3. Cliente Avulso / Balcão */}
            <button
              type="button"
              onClick={() => {
                setTipoCliente('AVULSO');
                setNaoSalvarClienteNoBanco(true);
                if (!nomeOuRazao) setNomeOuRazao('Cliente Balcão');
              }}
              className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between transition-all ${
                tipoCliente === 'AVULSO'
                  ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`p-2.5 rounded-lg ${
                    tipoCliente === 'AVULSO' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 block">Cliente Avulso</span>
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Sem Cadastro</span>
                </div>
              </div>
              <span className="text-xs text-slate-500">
                Atendimento rápido de balcão sem CPF, CNPJ ou cadastro prévio.
              </span>
            </button>
          </div>

          {/* FORMULÁRIO CONDICIONAL */}
          {tipoCliente && (
            <div className="space-y-4 pt-2 border-t border-slate-100 animate-fadeIn">
              {/* Alerta de cliente existente encontrado ao digitar documento */}
              {clienteExistente && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-3 text-amber-900">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold">Cliente já cadastrado encontrado na base!</p>
                      <p className="text-amber-800">
                        {clienteExistente.nome_ou_razao} (Contato: {clienteExistente.contato ? formatarTelefone(clienteExistente.contato) : 'Sem telefone'})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => aplicarClienteExistente(clienteExistente)}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition shrink-0 shadow-sm cursor-pointer"
                  >
                    Reaproveitar dados deste cliente
                  </button>
                </div>
              )}

              {/* Nome ou Razão Social */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {tipoCliente === 'PF'
                    ? 'Nome do Cliente'
                    : tipoCliente === 'PJ'
                    ? 'Razão Social'
                    : 'Nome ou Identificação do Cliente'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nomeOuRazao}
                  onChange={(e) => setNomeOuRazao(e.target.value)}
                  placeholder={
                    tipoCliente === 'PF'
                      ? 'Ex: João da Silva Santos'
                      : tipoCliente === 'PJ'
                      ? 'Ex: Alpha Distribuidora de Suprimentos Ltda'
                      : 'Ex: Cliente Balcão, Carlos, Balcão 01...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                {!nomeOuRazao.trim() && (
                  <span className="text-[11px] text-slate-400 mt-1 block">Campo obrigatório.</span>
                )}
              </div>

              {/* Linha Documento e Contato */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Documento */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {tipoCliente === 'PF'
                      ? 'CPF (Opcional)'
                      : tipoCliente === 'PJ'
                      ? 'CNPJ'
                      : 'CPF / Documento (Opcional)'}{' '}
                    {tipoCliente === 'PJ' && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      tipoCliente === 'PF' || tipoCliente === 'AVULSO'
                        ? formatarCPF(documentoRaw)
                        : formatarCNPJ(documentoRaw)
                    }
                    onChange={handleDocumentoChange}
                    placeholder={
                      tipoCliente === 'PF' || tipoCliente === 'AVULSO'
                        ? '000.000.000-00'
                        : '00.000.000/0000-00'
                    }
                    className={`w-full font-mono px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition ${
                      getDocumentoError()
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500'
                        : 'border-slate-300 focus:ring-indigo-500'
                    }`}
                  />
                  {getDocumentoError() ? (
                    <span className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {getDocumentoError()}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {tipoCliente === 'AVULSO'
                        ? 'Dispensado no atendimento avulso.'
                        : tipoCliente === 'PF'
                        ? 'Apenas números (11 dígitos se informado).'
                        : 'Apenas números (14 dígitos obrigatórios).'}
                    </span>
                  )}
                </div>

                {/* Contato (Telefone/WhatsApp) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Contato (Telefone / WhatsApp){' '}
                    {tipoCliente !== 'AVULSO' && <span className="text-rose-500">*</span>}
                    {tipoCliente === 'AVULSO' && (
                      <span className="text-slate-400 font-normal lowercase"> (opcional)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatarTelefone(contatoRaw)}
                    onChange={handleContatoChange}
                    placeholder="(00) 00000-0000"
                    className={`w-full font-mono px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition ${
                      getContatoError()
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-500'
                        : 'border-slate-300 focus:ring-indigo-500'
                    }`}
                  />
                  {getContatoError() ? (
                    <span className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {getContatoError()}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {tipoCliente === 'AVULSO'
                        ? 'Opcional para cliente balcão.'
                        : 'Apenas números com DDD (10 ou 11 dígitos).'}
                    </span>
                  )}
                </div>
              </div>

              {/* Inscrição Estadual (Apenas PJ) */}
              {tipoCliente === 'PJ' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Inscrição Estadual (Opcional)
                  </label>
                  <input
                    type="text"
                    value={inscricaoEstadual}
                    onChange={(e) => setInscricaoEstadual(e.target.value)}
                    placeholder="Ex: 110.042.490.114 ou ISENTO"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Endereço (Opcional) */}
              {tipoCliente !== 'AVULSO' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Endereço Completo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, número, complemento, bairro, cidade - UF"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* CHECKBOX: NÃO SALVAR CLIENTE NO CADASTRO PERMANENTE */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={naoSalvarClienteNoBanco || tipoCliente === 'AVULSO'}
                    onChange={(e) => setNaoSalvarClienteNoBanco(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>
                    <strong>Não cadastrar este cliente na base permanente</strong> (utilizar apenas nesta O.S. sem salvar novo cliente no banco de dados).
                  </span>
                </label>
              </div>

              {/* Botão Avançar para Etapa 2 */}
              <div className="pt-6 flex justify-end">
                <button
                  type="button"
                  disabled={!isEtapa1Valida()}
                  onClick={() => setEtapa(2)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                    isEtapa1Valida()
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Avançar para Cadastrar Impressora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ETAPA 2: IMPRESSORA */}
      {etapa === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Etapa 2: Dados da Nova Impressora</h2>
              <p className="text-sm text-slate-500">
                Informe o equipamento que o cliente trouxe para esta ordem de serviço.
              </p>
            </div>
            <div className="text-left sm:text-right p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Cliente desta O.S.:</span>
              <span className="text-xs font-bold text-indigo-700">{nomeOuRazao}</span>
            </div>
          </div>

          {/* SE O CLIENTE JÁ TEM HISTÓRICO DE OUTRAS IMPRESSORAS */}
          {impressorasAnterioresDoCliente.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-900 uppercase">
                    Equipamentos Anteriores Deste Cliente ({impressorasAnterioresDoCliente.length})
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  O cliente trouxe uma nova impressora ou é o retorno de uma anterior?
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {impressorasAnterioresDoCliente.map((imp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white border border-indigo-100 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {imp.marca} {imp.modelo}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        S/N: {imp.serie || 'SEM SÉRIE'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUsarImpressoraAnterior(imp)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold text-[11px] transition cursor-pointer shrink-0 flex items-center gap-1"
                      title="Usar este equipamento se for o mesmo aparelho que retornou"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Reaproveitar</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-indigo-200/60 text-xs">
                <span className="text-slate-600 text-[11px]">
                  Para cadastrar um <strong>novo equipamento</strong> diferente, basta preencher os campos abaixo.
                </span>
                <button
                  type="button"
                  onClick={handleLimparCamposImpressora}
                  className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Limpar para Nova Impressora</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* Marca e Atalhos rápidos */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Marca do Equipamento <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {marcasSugeridas.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMarca(m)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition cursor-pointer ${
                      marca.toLowerCase() === m.toLowerCase()
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ex: Epson, HP, Canon, Brother, Genérica..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Modelo e Número de Série */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Modelo do Equipamento <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {modelosSugeridos.map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => setModelo(mod)}
                      className="text-[11px] px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      {mod}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ex: EcoTank L3250 / LaserJet M428fdw / Multifuncional"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Número de Série {!semNumeroSerie && <span className="text-rose-500">*</span>}
                  </label>
                  <label className="text-[11px] font-medium text-indigo-700 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={semNumeroSerie}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSemNumeroSerie(checked);
                        if (checked) {
                          setSerie('SEM SÉRIE');
                        } else {
                          setSerie('');
                        }
                      }}
                      className="w-3.5 h-3.5 rounded text-indigo-600"
                    />
                    <span>Dispensar nº de série</span>
                  </label>
                </div>

                <input
                  type="text"
                  disabled={semNumeroSerie}
                  value={semNumeroSerie ? 'SEM SÉRIE' : serie}
                  onChange={(e) => setSerie(e.target.value.toUpperCase())}
                  placeholder={semNumeroSerie ? 'SEM SÉRIE' : 'Ex: X9KZ019842'}
                  className={`w-full font-mono uppercase px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    semNumeroSerie
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                      : 'border-slate-300'
                  }`}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {semNumeroSerie
                    ? 'Número de série dispensado para este equipamento.'
                    : 'Localizado na etiqueta traseira ou inferior do equipamento.'}
                </span>
              </div>
            </div>

            {/* Checkboxes de Acessórios com regras condicionais */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                Itens e Acessórios que Acompanham este Equipamento:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Toner */}
                <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acessorios.toner}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAcessorios((prev) => ({ ...prev, toner: checked }));
                      if (!checked) setObsToner('');
                    }}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Toner</span>
                </label>

                {/* Cartucho de tinta */}
                <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acessorios.cartucho_tinta}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAcessorios((prev) => ({ ...prev, cartucho_tinta: checked }));
                      if (!checked) setObsCartucho('');
                    }}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Cartucho de tinta</span>
                </label>

                {/* Tinta */}
                <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acessorios.tinta}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAcessorios((prev) => ({ ...prev, tinta: checked }));
                      if (!checked) setObsTinta('');
                    }}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Tinta no tanque</span>
                </label>

                {/* Cabo de dados */}
                <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acessorios.cabo_dados}
                    onChange={(e) =>
                      setAcessorios((prev) => ({ ...prev, cabo_dados: e.target.checked }))
                    }
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Cabo de dados (USB/Rede)</span>
                </label>

                {/* Cabo de energia */}
                <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acessorios.cabo_energia}
                    onChange={(e) =>
                      setAcessorios((prev) => ({ ...prev, cabo_energia: e.target.checked }))
                    }
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Cabo de energia</span>
                </label>
              </div>

              {/* CAMPOS CONDICIONAIS DE OBSERVAÇÃO */}
              {(acessorios.toner || acessorios.cartucho_tinta || acessorios.tinta) && (
                <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                  {acessorios.toner && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Observação do Toner (modelo, marca ou número de série do toner):
                      </label>
                      <input
                        type="text"
                        value={obsToner}
                        onChange={(e) => setObsToner(e.target.value)}
                        placeholder="Ex: HP 58A original, toner remanufaturado, lacre intacto..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {acessorios.cartucho_tinta && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Observação do Cartucho (marca, modelo ou nível):
                      </label>
                      <input
                        type="text"
                        value={obsCartucho}
                        onChange={(e) => setObsCartucho(e.target.value)}
                        placeholder="Ex: Cartucho HP 667 Preto e Colorido instalados..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {acessorios.tinta && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Observação da Tinta (tipo, nível ou procedência):
                      </label>
                      <input
                        type="text"
                        value={obsTinta}
                        onChange={(e) => setObsTinta(e.target.value)}
                        placeholder="Ex: Tanques com ~70% de tinta original corante..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Defeito relatado pelo cliente */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Defeito Relatado pelo Cliente <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">Atalhos rápidos abaixo:</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {defeitosSugeridos.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDefeito(d)}
                    className="text-[11px] px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    {d}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={defeito}
                onChange={(e) => setDefeito(e.target.value)}
                placeholder="Descreva o problema relatado..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {!defeito.trim() && (
                <span className="text-[11px] text-slate-400 mt-1 block">
                  A descrição do defeito é necessária para a via de entrada.
                </span>
              )}
            </div>

            {/* Botões de navegação */}
            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setEtapa(1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Cliente</span>
              </button>

              <button
                type="button"
                disabled={!isEtapa2Valida()}
                onClick={() => setEtapa(3)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                  isEtapa2Valida()
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Revisar Resumo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 3: RESUMO E FINALIZAÇÃO */}
      {etapa === 3 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7">
          {!ordemCriada ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">Etapa 3: Resumo e Confirmação</h2>
                <p className="text-sm text-slate-500">
                  Revise todos os dados antes de gerar a Ordem de Serviço sequencial.
                </p>
              </div>

              {/* CARD RESUMO */}
              <div className="space-y-4 mb-6">
                {/* Cliente */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase">
                      <User className="w-4 h-4" />
                      <span>
                        Cliente (
                        {tipoCliente === 'PF'
                          ? 'Pessoa Física'
                          : tipoCliente === 'PJ'
                          ? 'Pessoa Jurídica'
                          : 'Avulso / Balcão'}
                        )
                      </span>
                    </div>

                    {clienteId && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Cliente Cadastrado
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Nome/Razão:</span>{' '}
                      <span className="font-bold text-slate-800">{nomeOuRazao || 'Cliente Balcão'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Documento:</span>{' '}
                      <span className="font-mono font-medium text-slate-800">
                        {documentoRaw
                          ? tipoCliente === 'PJ'
                            ? formatarCNPJ(documentoRaw)
                            : formatarCPF(documentoRaw)
                          : 'Não informado (Balcão)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Contato:</span>{' '}
                      <span className="font-medium text-slate-800">
                        {contatoRaw ? formatarTelefone(contatoRaw) : 'Não informado'}
                      </span>
                    </div>
                    {endereco && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-500">Endereço:</span>{' '}
                        <span className="text-slate-800">{endereco}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Impressora */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase mb-2">
                    <Printer className="w-4 h-4" />
                    <span>Equipamento e Suprimentos Registrados</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-slate-500">Marca:</span>{' '}
                      <span className="font-bold text-slate-800">{marca || 'Genérica'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Modelo:</span>{' '}
                      <span className="font-bold text-slate-800">{modelo || 'Balcão'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Nº de Série:</span>{' '}
                      <span className="font-mono font-bold text-slate-800">
                        {semNumeroSerie ? 'SEM SÉRIE' : serie || 'SEM SÉRIE'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-2 text-xs">
                    <span className="text-slate-500 block mb-1">Acessórios deixados:</span>
                    <div className="flex flex-wrap gap-2">
                      {acessorios.toner && (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 font-medium">
                          Toner {obsToner ? `(${obsToner})` : ''}
                        </span>
                      )}
                      {acessorios.cartucho_tinta && (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 font-medium">
                          Cartucho {obsCartucho ? `(${obsCartucho})` : ''}
                        </span>
                      )}
                      {acessorios.tinta && (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 font-medium">
                          Tinta {obsTinta ? `(${obsTinta})` : ''}
                        </span>
                      )}
                      {acessorios.cabo_energia && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                          Cabo de Energia
                        </span>
                      )}
                      {acessorios.cabo_dados && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                          Cabo de Dados
                        </span>
                      )}
                      {!Object.values(acessorios).some(Boolean) && (
                        <span className="text-slate-400 italic">Nenhum acessório acompanhante</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Defeito */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold uppercase text-slate-500 block mb-1">
                    Defeito Relatado
                  </span>
                  <p className="text-xs text-slate-800 whitespace-pre-line font-medium">{defeito}</p>
                </div>
              </div>

              {/* Botões Salvar */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setEtapa(2)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Editar Equipamento</span>
                </button>

                <button
                  type="button"
                  disabled={salvando}
                  onClick={handleSalvarOS}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{salvando ? 'Salvando O.S...' : 'Salvar e Gerar O.S.'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* TELA DE SUCESSO APÓS SALVAMENTO */
            <div className="text-center py-6 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block mb-1">
                Sucesso!
              </span>
              <h2 className="text-2xl font-black text-slate-900 mb-1">
                Ordem de Serviço Nº {ordemCriada.numero}
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
                A O.S. foi gerada com status inicial{' '}
                <strong className="text-slate-800">"Aguardando orçamento"</strong>. Imprima o comprovante para entrega ao cliente com as vias de assinatura.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onPrintOS(ordemCriada)}
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <PrinterIcon className="w-5 h-5" />
                  <span>Imprimir Comprovante de O.S.</span>
                </button>

                <button
                  type="button"
                  onClick={handleReiniciarFormulario}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Criar Nova O.S.</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE BUSCA DE CLIENTES CADASTRADOS */}
      <BuscarClienteModal
        isOpen={modalBuscaClienteAberto}
        onClose={() => setModalBuscaClienteAberto(false)}
        clientes={listaClientes}
        ordens={ordensExistentes}
        onSelecionarCliente={(cliente) => {
          aplicarClienteExistente(cliente);
          // Avança diretamente para a etapa 2 para informar a nova impressora!
          setEtapa(2);
        }}
      />
    </div>
  );
};
