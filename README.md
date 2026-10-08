# 🖨️ OS Impressoras - Gestão de Ordens de Serviço & Fluxo Financeiro

Sistema completo, moderno e enxuto de Gestão de Ordens de Serviço (O.S.) e Fluxo de Caixa desenvolvido sob medida para **assistências técnicas e oficinas especializadas em conserto de impressoras**.

---

## 🚀 Principais Funcionalidades

1. **Abertura Ágil de O.S. (Sem Trava de Cadastro Prévio)**
   - Permite registrar serviços e receber impressoras diretamente pelo balcão sem obrigar o pré-cadastro formal de cliente ou impressora.
   - Suporte completo tanto a Pessoa Física (CPF) quanto Jurídica (CNPJ).

2. **Múltiplas Impressoras para o Mesmo Cliente**
   - Reconhecimento automático de clientes já cadastrados no sistema.
   - Opção instantânea de registrar uma nova impressora ou serviço para um cliente recorrente sem sobrescrever seus dados.

3. **Fluxograma / Kanban com Status Destacados**
   - Visualização em colunas por estágio: `Aguardando Avaliação`, `Em Análise`, `Aguardando Aprovação`, `Aprovado`, `Em Manutenção`, `Pronto p/ Retirada` e `Entregue / Concluído`.
   - Badges e cores de alto contraste e realce visual para identificação rápida na bancada.
   - Busca instantânea por número da O.S., nome do cliente ou modelo da impressora.

4. **Fluxo Financeiro & Livro Caixa Completo**
   - Painel de Indicadores em tempo real:
     - **Receitas Efetivadas (Caixa):** Total recebido de serviços concluídos.
     - **Previsão a Receber:** Valores autorizados aguardando finalização.
     - **Despesas Operacionais:** Controle de compras de peças, insumos e tintas.
     - **Saldo Líquido:** Balanço direto do período.
     - **Ticket Médio** e divisão de Peças vs. Mão de Obra.
   - Distribuição por método de pagamento (PIX, Dinheiro, Cartão de Crédito, Débito, Boleto).
   - Extrato consolidado com filtros por período e modal para lançamento de despesas.
   - **Impressão de Fechamento de Caixa** formatada em A4 com demonstrativo e campo para assinatura.

5. **Impressão Térmica e A4**
   - Comprovante de Entrada da O.S.
   - Orçamento formal para aprovação do cliente.
   - Cupom não fiscal para entrega e garantia.
   - Termo de garantia configurável (30, 90 ou 180 dias) e aviso legal de retirada.

6. **Segurança e Persistência de Dados**
   - Armazenamento local rápido e persistente.
   - Backup completo dos dados (Exportação para arquivo JSON).
   - Restauração simplificada de backups (Importação JSON).

---

## 🛠️ Tecnologias Utilizadas

- **React 19**
- **TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **Lucide Icons**
- **GitHub Actions** (CI automatizado para lint e build)

---

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- Gerenciador de pacotes **npm** ou **yarn**

### Instalação e Execução

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git

# 2. Acesse a pasta do projeto
cd SEU_REPOSITORIO

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em: [http://localhost:3000](http://localhost:3000)

### Comandos Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor local de desenvolvimento na porta 3000 |
| `npm run build` | Compila o projeto para produção no diretório `dist` |
| `npm run lint` | Executa a verificação estática de tipos com TypeScript |
| `npm run preview` | Visualiza o build de produção localmente |

---

## 🐙 Como Configurar e Subir para o seu GitHub

Se você já criou ou deseja criar um repositório no seu perfil do GitHub, siga o passo a passo abaixo:

### Opção 1: Criando repositório pelo site do GitHub

1. Acesse [github.com/new](https://github.com/new) e crie um novo repositório (ex: `os-impressoras`).
2. **Não** inicialize com README ou .gitignore (eles já estão prontos aqui).
3. No terminal do projeto, execute os comandos:

```bash
# Adicione a URL do seu repositório remoto
git remote add origin https://github.com/SEU_USUARIO/os-impressoras.git

# Garanta que a branch padrão é 'main'
git branch -M main

# Envie os arquivos para o GitHub
git push -u origin main
```

### Opção 2: Utilizando o GitHub CLI (`gh`)

Se possuir o utilitário `gh` instalado:

```bash
gh repo create os-impressoras --public --source=. --remote=origin --push
```

---

## 📂 Estrutura de Pastas

```text
├── .github/
│   └── workflows/
│       └── ci.yml               # Pipeline de integração contínua
├── src/
│   ├── components/
│   │   ├── financeiro/          # Fluxo Financeiro, Métricas e Livro Caixa
│   │   ├── forms/               # Formulário de Nova O.S. e cadastro ágil
│   │   ├── impressao/           # Modelos de impressão térmica e A4
│   │   ├── kanban/              # Painel Kanban de estágios de atendimento
│   │   ├── layout/              # Cabeçalho, navegação desktop e mobile
│   │   └── settings/            # Configurações da oficina, dados fiscais e backup
│   ├── services/
│   │   └── storage.ts           # Camada de armazenamento e persistência
│   ├── types/
│   │   └── index.ts             # Tipagens de Ordens, Clientes, Financeiro e Status
│   ├── utils/
│   │   └── validation.ts        # Formatadores e máscaras (CPF, CNPJ, Moeda, Telefone)
│   ├── App.tsx                  # Ponto central da aplicação
│   └── main.tsx                 # Entrada React
├── .gitignore                   # Arquivos ignorados pelo Git
├── metadata.json                # Metadados da aplicação
├── package.json                 # Dependências e scripts
└── vite.config.ts               # Configuração do Vite
```

---

## 📄 Licença

Este projeto é de uso livre para gestão de oficinas e assistências técnicas.
