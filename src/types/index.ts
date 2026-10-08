export type TipoCliente = 'PF' | 'PJ' | 'AVULSO';

export interface Cliente {
  id: string;
  tipo: TipoCliente;
  nome_ou_razao: string;
  documento?: string; // apenas dígitos (opcional para avulso)
  contato?: string; // apenas dígitos (opcional para avulso)
  endereco?: string;
  inscricao_estadual?: string;
  criado_em: string;
}

export type OSStatus =
  | 'aguardando_orcamento'
  | 'orcamento_enviado'
  | 'autorizado'
  | 'reprovado'
  | 'pronto'
  | 'aguardando_pagamento'
  | 'entregue';

export interface HistoricoItem {
  status: OSStatus;
  data: string; // ISO
  motivo?: string;
  descricao?: string;
}

export interface OrcamentoItem {
  id: string;
  descricao: string;
  qtd: number;
  valor_unit: number;
}

export interface Orcamento {
  itens: OrcamentoItem[];
  mao_de_obra: number;
  total: number;
  prazo?: string;
  obs?: string;
  criado_em?: string;
}

export interface Autorizacao {
  decisao: 'autorizado' | 'reprovado';
  data: string;
  motivo?: string;
}

export type FormaPagamento = 'Dinheiro' | 'Pix' | 'Cartão de Débito' | 'Cartão de Crédito';

export interface Pagamento {
  forma: FormaPagamento;
  total_pago: number;
  valor_recebido?: number;
  troco?: number;
  data: string;
}

export interface ImpressoraDados {
  marca: string;
  modelo: string;
  serie: string;
  defeito: string;
}

export interface Acessorios {
  toner: boolean;
  cartucho_tinta: boolean;
  tinta: boolean;
  cabo_dados: boolean;
  cabo_energia: boolean;
}

export interface OrdemServico {
  id: string;
  numero: string; // Ex: '0001'
  cliente_id?: string;
  cliente_avulso?: boolean;
  cliente_snapshot: {
    tipo: TipoCliente;
    nome_ou_razao: string;
    documento?: string;
    contato?: string;
    endereco?: string;
    inscricao_estadual?: string;
  };
  impressora: ImpressoraDados;
  acessorios: Acessorios;
  obs_toner?: string;
  obs_cartucho?: string;
  obs_tinta?: string;
  status: OSStatus;
  historico: HistoricoItem[];
  orcamento?: Orcamento;
  autorizacao?: Autorizacao;
  pagamento?: Pagamento;
  criado_em: string;
}

export interface Configuracoes {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  logo_base64?: string;
  garantia_dias: number;
  texto_garantia: string;
  retirada_dias: number;
  texto_retirada: string;
}

export type CategoriaDespesa =
  | 'pecas'
  | 'insumos'
  | 'ferramentas'
  | 'contas'
  | 'transporte'
  | 'outros';

export interface DespesaFinanceira {
  id: string;
  descricao: string;
  categoria: CategoriaDespesa;
  valor: number;
  data: string; // ISO
  forma_pagamento?: FormaPagamento;
  observacao?: string;
}

export interface EntradaFinanceiraOS {
  id: string;
  ordemId: string;
  numeroOS: string;
  clienteNome: string;
  equipamento: string;
  data: string; // ISO
  forma: FormaPagamento;
  valorTotal: number;
  valorPecas: number;
  valorMaoDeObra: number;
  troco?: number;
}

