# 🚀 CurriculoPro - SaaS de Criação de Currículos com Analytics

![CurriculoPro](https://github.com/user-attachments/assets/84cfd0cf-f706-4e04-8e54-f406b5eb7715)

O CurriculoPro é uma aplicação web full-stack (micro-SaaS) que permite aos utilizadores criar, gerir, partilhar e analisar currículos de forma profissional.

---

## 1. 🎯 O Estudo de Caso (O "Porquê")

### O Problema
Eu identifiquei dois grandes problemas no mercado de busca de emprego.

1.  **A Dor do Usuário:** Para a maioria dos candidatos, criar um currículo é um processo frustrante e demorado. Ferramentas tradicionais são complexas e não oferecem orientação, resultando em documentos mal estruturados.
2.  **O Problema Técnico (ATS):** A maioria dos currículos feitos manualmente não é otimizada para os sistemas de triagem (ATS), fazendo com que bons candidatos sejam automaticamente descartados pelos "algoritmos".

### A Solução (Produto e Engenharia)
Para resolver isso, idealizei e construí o **CurriculoPro** como um micro-SaaS, atacando o problema em duas frentes:

1.  **Produto (A Experiência do Usuário):**
    Criei um editor de currículo dinâmico e intuitivo em **Vue.js** que guia o usuário por seções pré-estruturadas. A plataforma gera um link de compartilhamento público e fornece **analytics**, permitindo ao candidato saber *quantas vezes* seu currículo foi visualizado.

2.  **Engenharia (A Arquitetura):**
    Por trás da interface simples, construí uma API robusta em **Node.js** com Prisma. A arquitetura foi refatorada de um monolito para ser **100% modular (Rotas, Controladores, Middlewares)**, garantindo segurança (JWT), escalabilidade e um código de fácil manutenção.

### O Resultado
O resultado é uma aplicação Full-Stack 100% funcional. O pipeline de analytics coleta dados de visualização com sucesso, e a arquitetura modular prova a capacidade de construir sistemas escaláveis e prontos para o mercado.

---

## 2. 🏛️ Decisões Chave de Arquitetura

Esta seção detalha as decisões técnicas complexas tomadas durante o desenvolvimento.

* **Arquitetura de Back-end Modular:**
    O back-end foi intencionalmente refatorado de um único arquivo monolítico para uma arquitetura modular (separando Rotas, Controladores, Middlewares e Serviços). Esta abordagem demonstra o entendimento de **Separação de Responsabilidades (SoC)**, que é o pilar fundamental para criar sistemas escaláveis, testáveis e de fácil manutenção, aplicando os mesmos princípios de design de Microserviços.

* **Gestão de Estado Global (Pinia):**
    O projeto utiliza **Pinia** (o sucessor oficial do Vuex) para gestão de estado global. Os conceitos são 100% transferíveis para ecossistemas como Redux:
    1.  **State:** Gerencia o estado de autenticação (JWT, dados do usuário).
    2.  **Actions:** Lida com todas as mutações assíncronas (login, fetch de documentos, etc.).
    3.  **Getters:** Expõe dados computados (ex: `isAuthenticated`).
    Isso prova o domínio sobre gerenciamento de estado complexo e reatividade.

* **Pipeline de Analytics Assíncrono:**
    Foi implementado um pipeline de dados assíncrono para a funcionalidade de analytics. Quando a rota pública (`/api/public/resume/:publicId`) é acessada, ela **não espera** o banco de dados escrever o `ViewEvent`. O registro é disparado de forma assíncrona para garantir que o currículo seja entregue ao recrutador com a **menor latência possível**, enquanto o evento de análise é processado em segundo plano.

* **Produtividade (IA como Pair Programming):**
    Este projeto foi construído rapidamente atuando como Arquiteto de Soluções. Defini a estrutura de dados (Prisma), as rotas da API e a lógica de estado (Pinia). Utilizei ferramentas de IA (Gemini) como "parceiro de programação" para acelerar a escrita de código-base, permitindo-me focar no trabalho de nível sênior: **integração, debug e garantia da qualidade da arquitetura.**

---

## 3. ✨ Funcionalidades Principais

* **🔐 Autenticação Segura:** Registo e Login de utilizadores com tokens JWT.
* **📊 Dashboard Pessoal:** Interface centralizada para gerir todos os documentos.
* **✍️ Editor Avançado:**
    * Editor de currículo reativo com pré-visualização ao vivo.
    * Adicione, remova e reordene secções (Summary, Experience, etc.).
    * Salvamento automático (Debounce) ao digitar.
* **☁️ Gestão de Documentos na Cloud:** Documentos associados a cada utilizador (isolamento de dados).
* **📄 Exportação para PDF:** Geração de PDF de alta fidelidade (via `html2pdf.js`).
* **💰 Sistema de Planos (Monetização):**
    * Lógica de planos `FREE` vs. `PRO` (com `TRIAL_LIMIT`).
    * Páginas de Pricing e Upsell.
* **🔗 Partilha Pública e Analytics:**
    * Gere um link público único (`publicId` via `nanoid`).
    * Página de visualização pública que registra o `ViewEvent` no back-end.
    * Dashboard exibe o `totalViews` de cada currículo.

---

## 4. 🛠️ Stack de Tecnologia

* **Front-end (`/frontend`):**
    * **Framework:** Vue 3 (Composition API)
    * **Linguagem:** TypeScript
    * **Build Tool:** Vite
    * **Gestão de Estado:** Pinia
    * **Rotas:** Vue Router
    * **Estilização:** TailwindCSS

* **Back-end (`/backend`):**
    * **Plataforma:** Node.js
    * **Framework:** Express
    * **Autenticação:** JWT (com `jsonwebtoken` e `bcryptjs`)
    * **Libs:** `cors`, `nanoid`

* **Banco de Dados & ORM:**
    * **ORM:** Prisma
    * **Banco de Dados:** SQLite (dev) / PostgreSQL (produção)

---

## 5. 🚀 Como Executar Localmente

### Pré-requisitos
* Node.js (v18+)
* NPM / Yarn

### 1. Back-end (`/backend`)

1.  Navegue até a pasta:
    ```bash
    cd backend
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Crie seu arquivo de variáveis de ambiente `.env` (na raiz do `/backend`):
    ```ini
    # URL da Base de Dados (ex: SQLite)
    DATABASE_URL="file:./dev.db"

    # Chave secreta para os tokens JWT
    JWT_SECRET="SUA_CHAVE_SECRETA_MUITO_FORTE"
    ```
4.  Execute as migrações do Prisma para criar as tabelas:
    ```bash
    npx prisma migrate dev --name init
    ```
5.  Inicie o servidor de back-end:
    ```bash
    npm run dev
    ```
    *(O servidor estará rodando em `http://localhost:3001`)*

### 2. Front-end (`/frontend`)

1.  Em um novo terminal, navegue até a pasta:
    ```bash
    cd frontend
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Crie seu arquivo de variáveis de ambiente `.env` (na raiz do `/frontend`):
    ```ini
    # Aponta para a API do back-end
    VITE_API_URL="http://localhost:3001/api"
    ```
4.  Inicie o servidor de desenvolvimento (Vite):
    ```bash
    npm run dev
    ```
    *(A aplicação estará disponível em `http://localhost:5173`)*

---

## 6. 🛣️ Roadmap Futuro

O projeto está 100% funcional. Os próximos passos focam em polimento de UX e novas features:
* **[UX]** Substituir todos os `alert()` e `confirm()` por um `ConfirmModal.vue` reutilizável.
* **[IA]** Ligar o `generateAiSummary` a um serviço real (API Gemini/OpenAI).
* **[Feature]** Construir o `CoverLetterEditor.vue`.
* **[Pagamentos]** Integrar Stripe/MercadoPago para ativar o plano `PRO`.
