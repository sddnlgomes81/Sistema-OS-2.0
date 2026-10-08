import { Cliente, Configuracoes, DespesaFinanceira, OrdemServico, OSStatus } from '../types';

export interface IDataStore {
  getClientes(): Promise<Cliente[]>;
  getClienteByDocumento(documentoApenasDigitos: string): Promise<Cliente | null>;
  saveCliente(cliente: Omit<Cliente, 'id' | 'criado_em'> & { id?: string }): Promise<Cliente>;
  getOrdens(): Promise<OrdemServico[]>;
  getOrdemById(id: string): Promise<OrdemServico | null>;
  createOrdem(dados: Omit<OrdemServico, 'id' | 'numero' | 'criado_em' | 'historico'>): Promise<OrdemServico>;
  updateOrdem(id: string, updates: Partial<OrdemServico>): Promise<OrdemServico>;
  deleteOrdem(id: string): Promise<void>;
  getNextNumeroOS(): Promise<string>;
  getConfiguracoes(): Promise<Configuracoes>;
  saveConfiguracoes(config: Configuracoes): Promise<void>;
  getDespesas(): Promise<DespesaFinanceira[]>;
  saveDespesa(despesa: Omit<DespesaFinanceira, 'id'> & { id?: string }): Promise<DespesaFinanceira>;
  deleteDespesa(id: string): Promise<void>;
  exportData(): Promise<string>;
  importData(json: string): Promise<void>;
  resetToDefault(): Promise<void>;
}

// Configurações padrão com dados realistas de assistência técnica
const CONFIGURACOES_PADRAO: Configuracoes = {
  razao_social: 'MasterPrint Soluções e Assistência Técnica Ltda',
  nome_fantasia: 'MasterPrint Assistência',
  cnpj: '12345678000195',
  endereco: 'Av. Paulista, 1578, Sala 42 - Bela Vista, São Paulo - SP, 01310-200',
  telefone: '11987654321',
  email: 'contato@masterprint.com.br',
  garantia_dias: 90,
  texto_garantia:
    'Os serviços executados têm garantia de {DIAS} dias a contar da data de entrega do equipamento, cobrindo exclusivamente o serviço realizado e/ou as peças substituídas. A garantia não cobre mau uso, quedas, oxidação, violação do lacre ou novos defeitos não relacionados ao serviço.',
  retirada_dias: 30,
  texto_retirada:
    'Após a comunicação do orçamento, o cliente tem {DIAS} dias para autorizar o serviço e retirar o equipamento. Passado esse prazo, o equipamento poderá ser cobrado com taxa de armazenamento e/ou ter destinação conforme a legislação vigente.',
};

// Amostras iniciais para demonstração imediata do fluxo
const CLIENTES_INICIAIS: Cliente[] = [
  {
    id: 'cli-1',
    tipo: 'PF',
    nome_ou_razao: 'Carlos Eduardo Oliveira',
    documento: '52998224725',
    contato: '11998765432',
    endereco: 'Rua das Flores, 120, Apto 41 - São Paulo/SP',
    criado_em: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'cli-2',
    tipo: 'PJ',
    nome_ou_razao: 'Advocacia Silva & Associados',
    documento: '11222333000181',
    contato: '1132145678',
    endereco: 'Alameda Santos, 800, 10º andar - Cerqueira César, São Paulo/SP',
    inscricao_estadual: '112.334.556.778',
    criado_em: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'cli-3',
    tipo: 'PF',
    nome_ou_razao: 'Mariana Vasconcelos',
    documento: '87843818042',
    contato: '11971234567',
    endereco: 'Rua Bela Cintra, 450 - Consolação, São Paulo/SP',
    criado_em: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const ORDENS_INICIAIS: OrdemServico[] = [
  {
    id: 'os-1',
    numero: '0001',
    cliente_id: 'cli-1',
    cliente_snapshot: {
      tipo: 'PF',
      nome_ou_razao: 'Carlos Eduardo Oliveira',
      documento: '52998224725',
      contato: '11998765432',
      endereco: 'Rua das Flores, 120, Apto 41 - São Paulo/SP',
    },
    impressora: {
      marca: 'Epson',
      modelo: 'EcoTank L3250',
      serie: 'X9KZ019842',
      defeito: 'Não puxa o papel, luz de papel piscando e manchas pretas nas bordas da folha.',
    },
    acessorios: {
      toner: false,
      cartucho_tinta: false,
      tinta: true,
      cabo_dados: false,
      cabo_energia: true,
    },
    obs_tinta: 'Tanque com 60% de tinta original Epson',
    status: 'aguardando_orcamento',
    historico: [
      {
        status: 'aguardando_orcamento',
        data: new Date(Date.now() - 86400000 * 2).toISOString(),
        descricao: 'O.S. gerada na recepção. Equipamento recebido.',
      },
    ],
    criado_em: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'os-2',
    numero: '0002',
    cliente_id: 'cli-2',
    cliente_snapshot: {
      tipo: 'PJ',
      nome_ou_razao: 'Advocacia Silva & Associados',
      documento: '11222333000181',
      contato: '1132145678',
      endereco: 'Alameda Santos, 800, 10º andar - Cerqueira César, São Paulo/SP',
      inscricao_estadual: '112.334.556.778',
    },
    impressora: {
      marca: 'HP',
      modelo: 'LaserJet Pro MFP M428fdw',
      serie: 'VNB3M05189',
      defeito: 'Atolamento constante na unidade fusora. Barulho de engrenagem estalando.',
    },
    acessorios: {
      toner: true,
      cartucho_tinta: false,
      tinta: false,
      cabo_dados: false,
      cabo_energia: true,
    },
    obs_toner: 'Toner HP 58A original instalado',
    status: 'orcamento_enviado',
    orcamento: {
      itens: [
        { id: 'item-1', descricao: 'Rolo Fusor HP M428 original', qtd: 1, valor_unit: 180 },
        { id: 'item-2', descricao: 'Bucha de fixação e película metálica', qtd: 1, valor_unit: 85 },
      ],
      mao_de_obra: 150,
      total: 415,
      prazo: '2 dias úteis',
      obs: 'Necessária limpeza e lubrificação com graxa de alta temperatura.',
      criado_em: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    historico: [
      {
        status: 'aguardando_orcamento',
        data: new Date(Date.now() - 86400000 * 3).toISOString(),
        descricao: 'Equipamento recebido.',
      },
      {
        status: 'orcamento_enviado',
        data: new Date(Date.now() - 86400000 * 1).toISOString(),
        descricao: 'Orçamento elaborado e enviado via WhatsApp para a cliente.',
      },
    ],
    criado_em: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'os-3',
    numero: '0003',
    cliente_id: 'cli-3',
    cliente_snapshot: {
      tipo: 'PF',
      nome_ou_razao: 'Mariana Vasconcelos',
      documento: '87843818042',
      contato: '11971234567',
      endereco: 'Rua Bela Cintra, 450 - Consolação, São Paulo/SP',
    },
    impressora: {
      marca: 'Brother',
      modelo: 'DCP-L2540DW',
      serie: 'U63882M7N100234',
      defeito: 'Falha de comunicação e manchas horizontais na impressão.',
    },
    acessorios: {
      toner: true,
      cartucho_tinta: false,
      tinta: false,
      cabo_dados: true,
      cabo_energia: true,
    },
    obs_toner: 'Toner Brother TN-2370 compatível',
    status: 'autorizado',
    orcamento: {
      itens: [
        { id: 'it-1', descricao: 'Troca do cilindro ótico (Drum DR-2340)', qtd: 1, valor_unit: 140 },
        { id: 'it-2', descricao: 'Higienização e alinhamento ótico', qtd: 1, valor_unit: 60 },
      ],
      mao_de_obra: 120,
      total: 320,
      prazo: '1 dia',
      criado_em: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    autorizacao: {
      decisao: 'autorizado',
      data: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    historico: [
      {
        status: 'aguardando_orcamento',
        data: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        status: 'orcamento_enviado',
        data: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        status: 'autorizado',
        data: new Date(Date.now() - 3600000 * 4).toISOString(),
        descricao: 'Cliente aprovou via mensagem telefônica.',
      },
    ],
    criado_em: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'os-4',
    numero: '0004',
    cliente_id: 'cli-1',
    cliente_snapshot: {
      tipo: 'PF',
      nome_ou_razao: 'Carlos Eduardo Oliveira',
      documento: '52998224725',
      contato: '11998765432',
      endereco: 'Rua das Flores, 120, Apto 41 - São Paulo/SP',
    },
    impressora: {
      marca: 'Canon',
      modelo: 'Mega Tank G3110',
      serie: 'KDK921820',
      defeito: 'Cabeçote preto entupido e falha no tracionador de folhas.',
    },
    acessorios: {
      toner: false,
      cartucho_tinta: false,
      tinta: true,
      cabo_dados: false,
      cabo_energia: true,
    },
    obs_tinta: 'Frascos originais de fábrica',
    status: 'entregue',
    orcamento: {
      itens: [
        { id: 'it-41', descricao: 'Desobstrução química do cabeçote de impressão', qtd: 1, valor_unit: 90 },
        { id: 'it-42', descricao: 'Rolete pick-up roller e separador de papel', qtd: 1, valor_unit: 65 },
      ],
      mao_de_obra: 125,
      total: 280,
      prazo: '1 dia útil',
      obs: 'Serviço executado com testes de 50 cópias perfeitas.',
      criado_em: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    autorizacao: {
      decisao: 'autorizado',
      data: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    pagamento: {
      forma: 'Pix',
      total_pago: 280,
      data: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    historico: [
      {
        status: 'aguardando_orcamento',
        data: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        status: 'orcamento_enviado',
        data: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        status: 'autorizado',
        data: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        status: 'pronto',
        data: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        status: 'entregue',
        data: new Date(Date.now() - 86400000 * 2).toISOString(),
        descricao: 'Equipamento retirado pelo cliente. Pagamento confirmado via Pix.',
      },
    ],
    criado_em: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

const DESPESAS_INICIAIS: DespesaFinanceira[] = [
  {
    id: 'desp-1',
    descricao: 'Kit fluído desentupidor de cabeçote e álcool isopropílico 1L',
    categoria: 'insumos',
    valor: 75.0,
    data: new Date(Date.now() - 86400000 * 3).toISOString(),
    forma_pagamento: 'Pix',
    observacao: 'Compra para oficina',
  },
  {
    id: 'desp-2',
    descricao: 'Lote roletes de tração Epson e HP (5 unidades)',
    categoria: 'pecas',
    valor: 110.0,
    data: new Date(Date.now() - 86400000 * 2).toISOString(),
    forma_pagamento: 'Cartão de Crédito',
    observacao: 'Reposição de estoque de peças',
  },
];

const STORAGE_KEYS = {
  CLIENTES: 'os_impressoras_clientes',
  ORDENS: 'os_impressoras_ordens',
  CONFIGURACOES: 'os_impressoras_configuracoes',
  DESPESAS: 'os_impressoras_despesas',
};

type Listener = () => void;

class LocalStorageStore implements IDataStore {
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.initIfEmpty();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Erro no listener do store:', err);
      }
    });
  }

  private initIfEmpty() {
    if (!localStorage.getItem(STORAGE_KEYS.CONFIGURACOES)) {
      localStorage.setItem(STORAGE_KEYS.CONFIGURACOES, JSON.stringify(CONFIGURACOES_PADRAO));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTES)) {
      localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(CLIENTES_INICIAIS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDENS)) {
      localStorage.setItem(STORAGE_KEYS.ORDENS, JSON.stringify(ORDENS_INICIAIS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DESPESAS)) {
      localStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(DESPESAS_INICIAIS));
    }
  }

  async getClientes(): Promise<Cliente[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLIENTES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async getClienteByDocumento(docApenasDigitos: string): Promise<Cliente | null> {
    const clientes = await this.getClientes();
    const clean = docApenasDigitos.replace(/\D/g, '');
    return clientes.find((c) => c.documento === clean) || null;
  }

  async saveCliente(clienteData: Omit<Cliente, 'id' | 'criado_em'> & { id?: string }): Promise<Cliente> {
    const clientes = await this.getClientes();
    const cleanDoc = clienteData.documento ? clienteData.documento.replace(/\D/g, '') : '';
    const cleanContato = clienteData.contato ? clienteData.contato.replace(/\D/g, '') : '';

    const existingIndex = clienteData.id
      ? clientes.findIndex((c) => c.id === clienteData.id)
      : cleanDoc
      ? clientes.findIndex((c) => c.documento === cleanDoc)
      : -1;

    let salvo: Cliente;
    if (existingIndex >= 0) {
      salvo = {
        ...clientes[existingIndex],
        ...clienteData,
        documento: cleanDoc,
        contato: cleanContato,
      };
      clientes[existingIndex] = salvo;
    } else {
      salvo = {
        ...clienteData,
        id: clienteData.id || `cli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        documento: cleanDoc,
        contato: cleanContato,
        criado_em: new Date().toISOString(),
      };
      clientes.push(salvo);
    }

    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
    this.notify();
    return salvo;
  }

  async getOrdens(): Promise<OrdemServico[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDENS);
      const ordens: OrdemServico[] = data ? JSON.parse(data) : [];
      // Ordena por data decrescente
      return ordens.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
    } catch {
      return [];
    }
  }

  async getOrdemById(id: string): Promise<OrdemServico | null> {
    const ordens = await this.getOrdens();
    return ordens.find((o) => o.id === id) || null;
  }

  async getNextNumeroOS(): Promise<string> {
    const ordens = await this.getOrdens();
    if (ordens.length === 0) return '0001';

    let maxNum = 0;
    for (const o of ordens) {
      const parsed = parseInt(o.numero, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
    const next = maxNum + 1;
    return String(next).padStart(4, '0');
  }

  async createOrdem(dados: Omit<OrdemServico, 'id' | 'numero' | 'criado_em' | 'historico'>): Promise<OrdemServico> {
    const ordens = await this.getOrdens();
    const numero = await this.getNextNumeroOS();
    const agora = new Date().toISOString();

    const nova: OrdemServico = {
      ...dados,
      id: `os-${Date.now()}`,
      numero,
      criado_em: agora,
      historico: [
        {
          status: dados.status || 'aguardando_orcamento',
          data: agora,
          descricao: 'Ordem de Serviço criada no sistema.',
        },
      ],
    };

    ordens.unshift(nova);
    localStorage.setItem(STORAGE_KEYS.ORDENS, JSON.stringify(ordens));
    this.notify();
    return nova;
  }

  async updateOrdem(id: string, updates: Partial<OrdemServico>): Promise<OrdemServico> {
    const ordens = await this.getOrdens();
    const index = ordens.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error(`Ordem com ID ${id} não encontrada.`);
    }

    const anterior = ordens[index];
    const historico = [...anterior.historico];

    // Se o status mudou e não há entrada no histórico correspondente
    if (updates.status && updates.status !== anterior.status) {
      const novaEntrada = {
        status: updates.status,
        data: new Date().toISOString(),
        motivo: updates.autorizacao?.motivo,
        descricao:
          updates.status === 'entregue'
            ? 'Equipamento retirado pelo cliente. O.S. finalizada.'
            : updates.status === 'aguardando_pagamento'
            ? 'Aguardando confirmação do pagamento.'
            : updates.status === 'pronto'
            ? 'Reparo finalizado / Liberado para retirada.'
            : undefined,
      };
      historico.push(novaEntrada);
    }

    const atualizada: OrdemServico = {
      ...anterior,
      ...updates,
      historico: updates.historico || historico,
    };

    ordens[index] = atualizada;
    localStorage.setItem(STORAGE_KEYS.ORDENS, JSON.stringify(ordens));
    this.notify();
    return atualizada;
  }

  async deleteOrdem(id: string): Promise<void> {
    const ordens = await this.getOrdens();
    const filtradas = ordens.filter((o) => o.id !== id);
    localStorage.setItem(STORAGE_KEYS.ORDENS, JSON.stringify(filtradas));
    this.notify();
  }

  async getConfiguracoes(): Promise<Configuracoes> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIGURACOES);
      return data ? JSON.parse(data) : CONFIGURACOES_PADRAO;
    } catch {
      return CONFIGURACOES_PADRAO;
    }
  }

  async saveConfiguracoes(config: Configuracoes): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.CONFIGURACOES, JSON.stringify(config));
    this.notify();
  }

  async getDespesas(): Promise<DespesaFinanceira[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DESPESAS);
      const despesas: DespesaFinanceira[] = data ? JSON.parse(data) : [];
      return despesas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    } catch {
      return [];
    }
  }

  async saveDespesa(dados: Omit<DespesaFinanceira, 'id'> & { id?: string }): Promise<DespesaFinanceira> {
    const despesas = await this.getDespesas();
    let salva: DespesaFinanceira;

    if (dados.id) {
      const idx = despesas.findIndex((d) => d.id === dados.id);
      if (idx >= 0) {
        salva = { ...despesas[idx], ...dados, id: dados.id };
        despesas[idx] = salva;
      } else {
        salva = { ...dados, id: dados.id };
        despesas.unshift(salva);
      }
    } else {
      salva = {
        ...dados,
        id: `desp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      despesas.unshift(salva);
    }

    localStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(despesas));
    this.notify();
    return salva;
  }

  async deleteDespesa(id: string): Promise<void> {
    const despesas = await this.getDespesas();
    const filtradas = despesas.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(filtradas));
    this.notify();
  }

  async exportData(): Promise<string> {
    const clientes = await this.getClientes();
    const ordens = await this.getOrdens();
    const config = await this.getConfiguracoes();
    const despesas = await this.getDespesas();
    return JSON.stringify({ clientes, ordens, configuracoes: config, despesas }, null, 2);
  }

  async importData(json: string): Promise<void> {
    try {
      const parsed = JSON.parse(json);
      if (parsed.configuracoes) {
        localStorage.setItem(STORAGE_KEYS.CONFIGURACOES, JSON.stringify(parsed.configuracoes));
      }
      if (Array.isArray(parsed.clientes)) {
        localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(parsed.clientes));
      }
      if (Array.isArray(parsed.ordens)) {
        localStorage.setItem(STORAGE_KEYS.ORDENS, JSON.stringify(parsed.ordens));
      }
      if (Array.isArray(parsed.despesas)) {
        localStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(parsed.despesas));
      }
      this.notify();
    } catch (err) {
      throw new Error('Arquivo de backup inválido.');
    }
  }

  async resetToDefault(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.CONFIGURACOES, JSON.stringify(CONFIGURACOES_PADRAO));
    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(CLIENTES_INICIAIS));
    localStorage.setItem(STORAGE_KEYS.ORDENS, JSON.stringify(ORDENS_INICIAIS));
    localStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(DESPESAS_INICIAIS));
    this.notify();
  }
}

// Instância singleton para uso em toda a aplicação
export const dataStore = new LocalStorageStore();
