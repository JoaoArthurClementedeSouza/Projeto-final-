# ⌕ ACHAÍ | Plataforma de Achados e Perdidos

> **Perdeu? Encontrou? ACHAÍ!**  
> Uma aplicação web moderna e responsiva para conectar pessoas e ajudar objetos perdidos a encontrarem seus donos.

---

## 📋 Sobre o Projeto

O **ACHAÍ** é uma plataforma front-end desenvolvida para centralizar o registro e a busca de objetos perdidos e encontrados. Com uma interface intuitiva e suporte a temas claro e escuro, o sistema permite que usuários utilizem a mesma conta tanto para procurar itens perdidos quanto para cadastrar objetos que encontraram, acompanhando solicitações de recuperação e simulando conversas para devolução.

---

## ✨ Funcionalidades Principais

* **🏠 Tela Inicial Intuitiva:** Escolha rápida entre as áreas *"Perdi um objeto"* e *"Encontrei um objeto"* utilizando uma única conta.
* **🔍 Gestão de Objetos (CRUD):**
  * Cadastro de objetos perdidos e encontrados com nome, categoria (Eletrônicos, Acessórios, Documentos, Roupas, Outros), localização e descrição.
  * Edição e exclusão de registros cadastrados pelo usuário.
  * Atribuição automática de ícones/emojis de acordo com a categoria selecionada.
* **🔎 Busca e Filtros Dinâmicos:** Pesquisa em tempo real por nome, localização, categoria ou descrição, combinada com filtros por status (`Todos`, `Encontrados`, `Perdidos`).
* **◷ Minhas Solicitações:**
  * Demonstração de interesse em objetos encontrados por outras pessoas.
  * Painel de acompanhamento com contadores de status (**Pendentes**, **Aceitas** e **Recusadas**).
  * Opções para cancelar pedidos ou simular o aceite/recusa do proprietário do cadastro.
* **✉ Central de Mensagens (Demonstrativa):**
  * Interface de chat completa para combinar detalhes da devolução sem expor dados sensíveis.
  * Filtro de conversas (*Todas* / *Não lidas*), busca de contatos, painel de detalhes do objeto vinculado e envio de mensagens em tempo real na sessão.
* **⚙ Configurações e Personalização:**
  * Edição de nome de exibição e e-mail de contato (refletidos dinamicamente no perfil lateral).
  * Alternância entre **Tema Escuro** (padrão) e **Tema Claro**.
  * Controle de preferências de notificações e opção para limpar todos os dados salvos no navegador.
* **💾 Persistência Local:** Todos os objetos, solicitações, tema e configurações do usuário são salvos automaticamente via `localStorage` (incluindo migração automática de chaves legadas `findit_*` para `achai_*`).
* **📱 Design Responsivo:** Layout adaptável para desktop, tablets e smartphones, contando com menu lateral retrátil no computador e menu tipo gaveta (*drawer*) em telas menores.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando tecnologias web nativas, sem necessidade de frameworks ou dependências externas:

* **HTML5:** Estruturação semântica das seções, formulários e modais.
* **CSS3:** Estilização moderna com variáveis CSS (`:root`), Flexbox, CSS Grid, animações suaves e suporte a temas (`light-theme`).
* **JavaScript (ES6+):** Manipulação do DOM, gerenciamento de estado, filtros de busca, segurança básica contra XSS (`escaparHTML`) e persistência com `localStorage`.

---

## 📁 Estrutura de Arquivos

```text
achai/
├── index.html   # Estrutura principal da aplicação, telas e modais
├── style.css    # Estilos globais, temas claro/escuro, layout do chat e responsividade
├── script.js    # Lógica de navegação, CRUD de objetos, solicitações e chat demonstrativo
└── README.md    # Documentação do projeto
```

---

## 🚀 Como Executar o Projeto

Por ser uma aplicação puramente front-end, não há necessidade de instalação de pacotes ou servidores complexos:

1. **Clone ou baixe** os arquivos deste repositório para o seu computador.
2. Certifique-se de que os arquivos `index.html`, `style.css` e `script.js` estejam na mesma pasta.
3. Abra o arquivo `index.html` diretamente em qualquer navegador moderno (Google Chrome, Firefox, Edge, Safari) **ou** utilize uma extensão como o *Live Server* no VS Code.

---

## 🔮 Melhorias Futuras (Roadmap)

* [ ] Integração com Back-end e Banco de Dados para persistência multiusuário real.
* [ ] Sistema de autenticação (Login e Cadastro de usuários).
* [ ] Upload de fotos reais dos objetos perdidos e encontrados.
* [ ] Chat em tempo real via WebSockets e suporte a envio de anexos.
* [ ] Notificações push/por e-mail quando um objeto semelhante ao perdido for cadastrado.

---

Desenvolvido com foco em usabilidade e organização para facilitar a devolução de objetos perdidos.