import React, { useState } from 'react';
import {
  Building2,
  Upload,
  CheckCircle2,
  Printer,
  Trash2,
  Download,
  Database,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { Configuracoes } from '../../types';
import {
  apenasDigitos,
  formatarCNPJ,
  formatarTelefone,
  validarCNPJ,
  validarContato,
} from '../../utils/validation';

interface Props {
  config: Configuracoes;
  onSalvarConfig: (novasConfig: Configuracoes) => Promise<void>;
  onExportarBackup: () => Promise<void>;
  onImportarBackup: (json: string) => Promise<void>;
  onResetarDados: () => Promise<void>;
}

export const ConfiguracoesView: React.FC<Props> = ({
  config,
  onSalvarConfig,
  onExportarBackup,
  onImportarBackup,
  onResetarDados,
}) => {
  const [razaoSocial, setRazaoSocial] = useState(config.razao_social);
  const [nomeFantasia, setNomeFantasia] = useState(config.nome_fantasia);
  const [cnpjRaw, setCnpjRaw] = useState(apenasDigitos(config.cnpj));
  const [endereco, setEndereco] = useState(config.endereco);
  const [telefoneRaw, setTelefoneRaw] = useState(apenasDigitos(config.telefone));
  const [email, setEmail] = useState(config.email);
  const [logoBase64, setLogoBase64] = useState<string | undefined>(config.logo_base64);

  const [garantiaDias, setGarantiaDias] = useState<number>(config.garantia_dias);
  const [textoGarantia, setTextoGarantia] = useState(config.texto_garantia);

  const [retiradaDias, setRetiradaDias] = useState<number>(config.retirada_dias);
  const [textoRetirada, setTextoRetirada] = useState(config.texto_retirada);

  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);

  // Upload e conversão da logo para Base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setLogoBase64(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoverLogo = () => {
    setLogoBase64(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;

    setSalvando(true);
    try {
      const atualizado: Configuracoes = {
        razao_social: razaoSocial.trim(),
        nome_fantasia: nomeFantasia.trim(),
        cnpj: cnpjRaw,
        endereco: endereco.trim(),
        telefone: telefoneRaw,
        email: email.trim(),
        logo_base64: logoBase64,
        garantia_dias: garantiaDias,
        texto_garantia: textoGarantia.trim(),
        retirada_dias: retiradaDias,
        texto_retirada: textoRetirada.trim(),
      };

      await onSalvarConfig(atualizado);
      setMensagemSucesso(true);
      setTimeout(() => setMensagemSucesso(false), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  // Importação de arquivo JSON de backup
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        await onImportarBackup(text);
        alert('Backup importado com sucesso!');
      } catch (err) {
        alert('Falha ao restaurar backup. Verifique se o arquivo JSON é válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>Configurações da Empresa</span>
          </h2>
          <p className="text-sm text-slate-500">
            Estes dados alimentam o cabeçalho, termos e dados do Comprovante de O.S., Orçamento e Cupom Não Fiscal.
          </p>
        </div>

        {mensagemSucesso && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BLOCO 1: IDENTIFICAÇÃO E LOGO */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-2xs space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Logotipo e Identidade da Oficina</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Visualização da Logo */}
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-center">
              {logoBase64 ? (
                <div className="space-y-2">
                  <img
                    src={logoBase64}
                    alt="Logo da empresa"
                    className="max-h-24 max-w-full object-contain mx-auto"
                  />
                  <button
                    type="button"
                    onClick={handleRemoverLogo}
                    className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1 mx-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover logo</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto text-slate-500">
                    <Printer className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-slate-400 block">Sem logotipo cadastrado</span>
                </div>
              )}
            </div>

            {/* Input de Upload da Logo */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Fazer upload da Logotipo (PNG, JPG, SVG)
              </label>
              <p className="text-xs text-slate-500">
                A imagem é convertida em base64 e impressa no Comprovante de O.S. e no Cupom Não Fiscal.
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer transition shadow-2xs">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Escolher arquivo de imagem</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* DADOS CADASTRAIS DA EMPRESA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nome Fantasia <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                placeholder="Ex: MasterPrint Assistência Técnica"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Razão Social <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                placeholder="Ex: MasterPrint Soluções e Informática Ltda"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                CNPJ da Empresa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                inputMode="numeric"
                value={formatarCNPJ(cnpjRaw)}
                onChange={(e) => setCnpjRaw(apenasDigitos(e.target.value).slice(0, 14))}
                placeholder="00.000.000/0000-00"
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {cnpjRaw && !validarCNPJ(cnpjRaw) && (
                <span className="text-[11px] text-rose-500 mt-1 block">CNPJ incompleto ou inválido.</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Telefone / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                inputMode="numeric"
                value={formatarTelefone(telefoneRaw)}
                onChange={(e) => setTelefoneRaw(apenasDigitos(e.target.value).slice(0, 11))}
                placeholder="(00) 00000-0000"
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Endereço Completo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, sala, bairro, cidade - UF, CEP"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                E-mail de Contato
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@suaempresa.com.br"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* BLOCO 2: PRAZOS E TEXTOS DE TERMOS E GARANTIA */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-2xs space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Prazos e Textos Legais do Comprovante</span>
          </h3>

          {/* GARANTIA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Prazo de Garantia (em dias corridos)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={garantiaDias}
                  onChange={(e) => setGarantiaDias(parseInt(e.target.value, 10) || 90)}
                  className="w-20 text-center font-bold font-mono text-xs px-2 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-500 font-semibold">dias</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Texto de Garantia (use o marcador <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{'{DIAS}'}</code> para substituição automática):
              </label>
              <textarea
                rows={3}
                value={textoGarantia}
                onChange={(e) => setTextoGarantia(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
              <p className="text-[11px] text-slate-500 italic mt-0.5">
                Exibição no documento:{' '}
                {textoGarantia.replace(/\{DIAS\}/g, String(garantiaDias))}
              </p>
            </div>
          </div>

          {/* PRAZO DE RETIRADA */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Prazo Limite para Retirada (em dias)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={retiradaDias}
                  onChange={(e) => setRetiradaDias(parseInt(e.target.value, 10) || 30)}
                  className="w-20 text-center font-bold font-mono text-xs px-2 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-500 font-semibold">dias</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Texto de Retirada (use o marcador <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{'{DIAS}'}</code>):
              </label>
              <textarea
                rows={3}
                value={textoRetirada}
                onChange={(e) => setTextoRetirada(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
              <p className="text-[11px] text-slate-500 italic mt-0.5">
                Exibição no documento:{' '}
                {textoRetirada.replace(/\{DIAS\}/g, String(retiradaDias))}
              </p>
            </div>
          </div>
        </div>

        {/* BOTÃO SALVAR CONFIGURAÇÕES */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={salvando}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{salvando ? 'Salvando...' : 'Salvar Configurações da Empresa'}</span>
          </button>
        </div>
      </form>

      {/* BLOCO 3: BACKUP, RESTAURAÇÃO E BANCO DE DADOS */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-2xs space-y-5">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          <span>Gestão de Dados e Camada de Armazenamento</span>
        </h3>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
          <p className="font-bold text-slate-900">
            Arquitetura de Dados Isolada (LocalStorage & Firestore Ready)
          </p>
          <p>
            O aplicativo opera atualmente com uma camada de repositório isolada (<code>dataStore</code>) que salva clientes, ordens e configurações com persistência imediata local. Toda a interface já está desacoplada para conexão com as coleções <code>clientes</code>, <code>ordens</code> e <code>configuracoes</code> do Firebase Firestore.
          </p>
          <p className="text-slate-600 border-t border-slate-200 pt-2">
            <strong>Atendimentos Rápidos / Balcão:</strong> O sistema suporta criar Ordens de Serviço sem obrigatoriedade de cadastrar previamente o cliente ou a empresa na base de dados, permitindo também dispensar o número de série de impressoras avulsas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Download Backup */}
          <button
            type="button"
            onClick={onExportarBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Exportar Backup Completo (JSON)</span>
          </button>

          {/* Importar Backup */}
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-2xs cursor-pointer">
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Importar Backup (JSON)</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          {/* Resetar Amostras */}
          <button
            type="button"
            onClick={async () => {
              if (
                window.confirm(
                  'Deseja restaurar as configurações padrão e ordens de serviço de demonstração?'
                )
              ) {
                await onResetarDados();
                window.location.reload();
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition cursor-pointer ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Dados de Exemplo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
