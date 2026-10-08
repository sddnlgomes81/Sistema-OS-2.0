/**
 * Utilitários de validação e formatação com código próprio
 */

// Extrai apenas os dígitos numéricos de uma string
export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

// Validação do algoritmo oficial do CPF (módulo 11)
export function validarCPF(cpf: string): boolean {
  const digitos = apenasDigitos(cpf);
  if (digitos.length !== 11) return false;

  // Rejeita sequências repetidas como 111.111.111-11
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digitos.charAt(i), 10) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  const digito1 = resto >= 10 ? 0 : resto;
  if (digito1 !== parseInt(digitos.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digitos.charAt(i), 10) * (11 - i);
  }
  resto = 11 - (soma % 11);
  const digito2 = resto >= 10 ? 0 : resto;
  return digito2 === parseInt(digitos.charAt(10), 10);
}

// Validação do algoritmo oficial do CNPJ (módulo 11)
export function validarCNPJ(cnpj: string): boolean {
  const digitos = apenasDigitos(cnpj);
  if (digitos.length !== 14) return false;

  // Rejeita sequências repetidas
  if (/^(\d)\1{13}$/.test(digitos)) return false;

  let tamanho = 12;
  let numeros = digitos.substring(0, tamanho);
  const digitosVerificadores = digitos.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitosVerificadores.charAt(0), 10)) return false;

  tamanho = 13;
  numeros = digitos.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitosVerificadores.charAt(1), 10);
}

// Valida contato brasileiro (10 dígitos para fixo ou 11 para celular)
export function validarContato(contato: string): boolean {
  const digitos = apenasDigitos(contato);
  if (digitos.length < 10 || digitos.length > 11) return false;
  // DDD não pode começar com zero
  if (digitos.charAt(0) === '0' || digitos.charAt(1) === '0') return false;
  return true;
}

// Aplica máscara de CPF: 000.000.000-00 (máximo 11 dígitos)
export function formatarCPF(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 11);
  if (!digitos) return '';
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

// Aplica máscara de CNPJ: 00.000.000/0000-00 (máximo 14 dígitos)
export function formatarCNPJ(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 14);
  if (!digitos) return '';
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 5) return `${digitos.slice(0, 2)}.${digitos.slice(2)}`;
  if (digitos.length <= 8) return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5)}`;
  if (digitos.length <= 12) return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`;
  return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
}

// Aplica máscara de telefone: (00) 0000-0000 ou (00) 00000-0000 (máximo 11 dígitos)
export function formatarTelefone(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 11);
  if (!digitos) return '';
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

// Formatação monetária BRL
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0);
}

// Formatação de data e hora para pt-BR
export function formatarDataHora(dataIso: string): string {
  try {
    const data = new Date(dataIso);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(data);
  } catch {
    return dataIso;
  }
}

// Formatação de data simples (DD/MM/AAAA)
export function formatarData(dataIso: string): string {
  try {
    const data = new Date(dataIso);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(data);
  } catch {
    return dataIso;
  }
}

// Tempo decorrido em aberto de forma amigável
export function tempoDecorrido(dataIso: string): string {
  try {
    const agora = new Date().getTime();
    const data = new Date(dataIso).getTime();
    const diffMs = Math.max(0, agora - data);
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutos < 5) return 'Agora mesmo';
    if (diffMinutos < 60) return `Há ${diffMinutos} min`;
    if (diffHoras < 24) return `Há ${diffHoras}h`;
    if (diffDias === 1) return 'Há 1 dia';
    return `Há ${diffDias} dias`;
  } catch {
    return 'Recente';
  }
}
