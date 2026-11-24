// ==========================================
// ACHAÍ - SCRIPT PRINCIPAL
// ==========================================

// CHAVES DO ARMAZENAMENTO LOCAL
const CHAVE_OBJETOS = "achai_objetos";
const CHAVE_SOLICITACOES = "achai_solicitacoes";
const CHAVE_TEMA = "achai_tema";
const CHAVE_CONFIG = "achai_config";

// Copia os dados salvos com o nome antigo (FINDIT) para o novo (ACHAÍ),
// para que nada que já foi cadastrado seja perdido.
function migrarChavesAntigas() {
    [
        ["findit_objetos", CHAVE_OBJETOS],
        ["findit_solicitacoes", CHAVE_SOLICITACOES],
        ["findit_tema", CHAVE_TEMA]
    ].forEach(([antiga, nova]) => {
        const valorAntigo = localStorage.getItem(antiga);

        if (valorAntigo !== null && localStorage.getItem(nova) === null) {
            localStorage.setItem(nova, valorAntigo);
        }

        localStorage.removeItem(antiga);
    });
}

migrarChavesAntigas();

// DADOS SALVOS
let objetos = carregarDados(CHAVE_OBJETOS);
let solicitacoes = carregarDados(CHAVE_SOLICITACOES);

let telaAtual = "home";
let filtroLost = "all";
let filtroFound = "all";
let objetoSelecionado = null;
let statusCadastro = "found";
let podeEditarObjeto = false;

// ==========================================
// FUNÇÕES INICIAIS
// ==========================================

function carregarDados(chave) {
    try {
        const dados = JSON.parse(localStorage.getItem(chave));
        return Array.isArray(dados) ? dados : [];
    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        return [];
    }
}

function salvarObjetos() {
    localStorage.setItem(CHAVE_OBJETOS, JSON.stringify(objetos));
}

function salvarSolicitacoes() {
    localStorage.setItem(CHAVE_SOLICITACOES, JSON.stringify(solicitacoes));
}

function gerarId() {
    return Date.now().toString() + Math.random().toString(36).substring(2, 8);
}

function escaparHTML(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}

function escolherEmoji(categoria) {
    const categoriaNormalizada = String(categoria || "").toLowerCase();

    if (categoriaNormalizada.includes("mochila") || categoriaNormalizada.includes("bolsa")) return "🎒";
    if (categoriaNormalizada.includes("celular") || categoriaNormalizada.includes("eletrônico")) return "📱";
    if (categoriaNormalizada.includes("fone")) return "🎧";
    if (categoriaNormalizada.includes("chave")) return "🔑";
    if (categoriaNormalizada.includes("documento")) return "📄";
    if (categoriaNormalizada.includes("roupa")) return "👕";
    if (categoriaNormalizada.includes("carteira")) return "👛";
    if (categoriaNormalizada.includes("óculos")) return "👓";
    if (categoriaNormalizada.includes("acessório")) return "⌚";

    return "📦";
}

function textoStatus(status) {
    return status === "lost" ? "Perdido" : "Encontrado";
}

objetos = objetos.map(objeto => ({
    ...objeto,
    id: objeto.id || gerarId(),
    status: objeto.status || "found"
}));

salvarObjetos();

// ==========================================
// CONFIGURAÇÕES DO USUÁRIO
// ==========================================

const configPadrao = {
    nome: "Usuário ACHAÍ",
    email: "",
    notifSolicitacoes: true,
    notifMensagens: true
};

function carregarConfig() {
    try {
        const dados = JSON.parse(localStorage.getItem(CHAVE_CONFIG));

        if (dados && typeof dados === "object" && !Array.isArray(dados)) {
            return { ...configPadrao, ...dados };
        }

        return { ...configPadrao };
    } catch (erro) {
        console.error("Erro ao carregar configurações:", erro);
        return { ...configPadrao };
    }
}

let config = carregarConfig();

function salvarConfig() {
    localStorage.setItem(CHAVE_CONFIG, JSON.stringify(config));
}

// Mostra o nome e a inicial do usuário no menu lateral
function aplicarPerfil() {
    const nomeEl = document.getElementById("profileName");
    const avatarEl = document.getElementById("profileAvatar");
    const nome = String(config.nome || "").trim() || configPadrao.nome;

    if (nomeEl) nomeEl.textContent = nome;
    if (avatarEl) avatarEl.textContent = (nome.charAt(0) || "U").toUpperCase();
}

// ==========================================
// ELEMENTOS DAS TELAS
// ==========================================

const choiceView = document.getElementById("choiceView");
const lostView = document.getElementById("lostView");
const foundView = document.getElementById("foundView");
const requestsView = document.getElementById("requestsView");
const messagesView = document.getElementById("messagesView");
const settingsView = document.getElementById("settingsView");

const topbarTitle = document.getElementById("topbarTitle");
const topbarSubtitle = document.getElementById("topbarSubtitle");

const lostObjectsGrid = document.getElementById("lostObjectsGrid");
const foundObjectsGrid = document.getElementById("foundObjectsGrid");

const lostSearchInput = document.getElementById("lostSearchInput");
const foundSearchInput = document.getElementById("foundSearchInput");

const objectModal = document.getElementById("objectModal");
const detailsModal = document.getElementById("detailsModal");
const objectForm = document.getElementById("objectForm");

const menuLateral = document.getElementById("sidebar");
const menuOverlay = document.getElementById("menuOverlay");

// ==========================================
// NAVEGAÇÃO
// ==========================================

function atualizarMenu(tela) {
    const mapa = {
        home: "navHome",
        lost: "navLost",
        found: "navFound",
        requests: "navRequests",
        messages: "navMessages",
        settings: "navSettings"
    };

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
    });

    const ativo = document.getElementById(mapa[tela]);

    if (ativo) ativo.classList.add("active");
}

function mostrarTela(tela) {
    telaAtual = tela;

    const telas = {
        home: choiceView,
        lost: lostView,
        found: foundView,
        requests: requestsView,
        messages: messagesView,
        settings: settingsView
    };

    Object.entries(telas).forEach(([nome, elemento]) => {
        if (!elemento) return;

        elemento.hidden = nome !== tela;
        elemento.style.display = nome === tela ? "block" : "none";
        elemento.classList.toggle("active", nome === tela);
    });

    const titulos = {
        home: ["Bem-vindo ao ACHAÍ!", "Sua plataforma de achados e perdidos."],
        lost: ["Perdi um objeto", "Cadastre o que perdeu e veja o que foi encontrado."],
        found: ["Encontrei um objeto", "Cadastre objetos encontrados."],
        requests: ["Minhas solicitações", "Acompanhe suas solicitações."],
        messages: ["Mensagens", "Converse sobre objetos encontrados e perdidos."],
        settings: ["Configurações", "Personalize sua conta e a aparência."]
    };

    if (titulos[tela]) {
        if (topbarTitle) topbarTitle.textContent = titulos[tela][0];
        if (topbarSubtitle) topbarSubtitle.textContent = titulos[tela][1];
    }

    atualizarMenu(tela);
    fecharMenuMobile();

    if (tela === "lost") renderizarObjetosPerdidos();
    if (tela === "found") renderizarObjetosEncontrados();
    if (tela === "requests") renderizarSolicitacoes();
    if (tela === "settings") renderizarConfiguracoes();
}

function abrirAreaPerdidos() {
    mostrarTela("lost");
}

function abrirAreaEncontrados() {
    mostrarTela("found");
}

function abrirSolicitacoes() {
    mostrarTela("requests");
}

// TELA INICIAL

document.getElementById("chooseLostArea")?.addEventListener("click", abrirAreaPerdidos);
document.getElementById("chooseFoundArea")?.addEventListener("click", abrirAreaEncontrados);

// ALTERNÂNCIA ENTRE ÁREAS

["switchLost", "switchLostFromFound"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", abrirAreaPerdidos);
});

["switchFound", "switchFoundFromLost"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", abrirAreaEncontrados);
});

// MENU LATERAL

document.getElementById("navHome")?.addEventListener("click", evento => {
    evento.preventDefault();
    mostrarTela("home");
});

document.getElementById("navLost")?.addEventListener("click", evento => {
    evento.preventDefault();
    abrirAreaPerdidos();
});

document.getElementById("navFound")?.addEventListener("click", evento => {
    evento.preventDefault();
    abrirAreaEncontrados();
});

document.getElementById("navRequests")?.addEventListener("click", evento => {
    evento.preventDefault();
    abrirSolicitacoes();
});

document.getElementById("navMessages")?.addEventListener("click", evento => {
    evento.preventDefault();
    mostrarTela("messages");
});

document.getElementById("navSettings")?.addEventListener("click", evento => {
    evento.preventDefault();
    mostrarTela("settings");
});

document.getElementById("backToExplore")?.addEventListener("click", abrirAreaPerdidos);

// ==========================================
// MENU LATERAL (COMPUTADOR E CELULAR)
// ==========================================

const LARGURA_MENU_MOBILE = 750;

function ehTelaPequena() {
    return window.innerWidth <= LARGURA_MENU_MOBILE;
}

function abrirMenuMobile() {
    menuLateral?.classList.add("open");
    menuOverlay?.classList.add("show");
    document.body.classList.add("menu-open");
}

function fecharMenuMobile() {
    menuLateral?.classList.remove("open");
    menuOverlay?.classList.remove("show");
    document.body.classList.remove("menu-open");
}

document.getElementById("menuToggle")?.addEventListener("click", () => {
    // No celular, o menu abre e fecha como uma gaveta
    if (ehTelaPequena()) {
        if (menuLateral?.classList.contains("open")) {
            fecharMenuMobile();
        } else {
            abrirMenuMobile();
        }

        return;
    }

    // No computador, o menu apenas encolhe
    menuLateral?.classList.toggle("collapsed");
    document.querySelector(".main-content")?.classList.toggle("expanded");
});

menuOverlay?.addEventListener("click", fecharMenuMobile);

window.addEventListener("resize", () => {
    if (!ehTelaPequena()) fecharMenuMobile();
});

// ==========================================
// TEMA
// ==========================================

function aplicarTema(claro) {
    document.body.classList.toggle("light-theme", claro);

    localStorage.setItem(CHAVE_TEMA, claro ? "claro" : "escuro");

    document.querySelectorAll("[data-theme-choice]").forEach(botao => {
        const botaoEhClaro = botao.dataset.themeChoice === "claro";
        botao.classList.toggle("active", botaoEhClaro === claro);
    });
}

document.getElementById("themeToggle")?.addEventListener("click", () => {
    aplicarTema(!document.body.classList.contains("light-theme"));
});

document.querySelectorAll("[data-theme-choice]").forEach(botao => {
    botao.addEventListener("click", () => {
        aplicarTema(botao.dataset.themeChoice === "claro");
    });
});

aplicarTema(localStorage.getItem(CHAVE_TEMA) === "claro");

// ==========================================
// TELA DE CONFIGURAÇÕES
// ==========================================

function renderizarConfiguracoes() {
    const nome = document.getElementById("settingsName");
    const email = document.getElementById("settingsEmail");
    const notifSolicitacoes = document.getElementById("notifRequests");
    const notifMensagens = document.getElementById("notifMessages");
    const resumo = document.getElementById("dataSummary");
    const feedback = document.getElementById("settingsFeedback");

    if (nome) nome.value = config.nome;
    if (email) email.value = config.email;
    if (notifSolicitacoes) notifSolicitacoes.checked = Boolean(config.notifSolicitacoes);
    if (notifMensagens) notifMensagens.checked = Boolean(config.notifMensagens);

    if (resumo) {
        resumo.textContent =
            `${objetos.length} objeto(s) e ${solicitacoes.length} solicitação(ões) salvos neste navegador.`;
    }

    if (feedback) feedback.textContent = "";
}

document.getElementById("settingsForm")?.addEventListener("submit", evento => {
    evento.preventDefault();

    const nome = document.getElementById("settingsName")?.value.trim();
    const email = document.getElementById("settingsEmail")?.value.trim();

    if (!nome) {
        alert("Informe um nome de exibição.");
        return;
    }

    config.nome = nome;
    config.email = email || "";

    salvarConfig();
    aplicarPerfil();

    const feedback = document.getElementById("settingsFeedback");

    if (feedback) {
        feedback.textContent = "Perfil salvo com sucesso!";

        setTimeout(() => {
            feedback.textContent = "";
        }, 3000);
    }
});

document.getElementById("notifRequests")?.addEventListener("change", evento => {
    config.notifSolicitacoes = evento.target.checked;
    salvarConfig();
});

document.getElementById("notifMessages")?.addEventListener("change", evento => {
    config.notifMensagens = evento.target.checked;
    salvarConfig();
});

document.getElementById("clearDataButton")?.addEventListener("click", () => {
    const confirmar = confirm(
        "Isso apaga todos os objetos e solicitações salvos neste navegador. Deseja continuar?"
    );

    if (!confirmar) return;

    objetos = [];
    solicitacoes = [];

    salvarObjetos();
    salvarSolicitacoes();

    renderizarObjetosPerdidos();
    renderizarObjetosEncontrados();
    renderizarSolicitacoes();
    renderizarConfiguracoes();

    alert("Dados apagados com sucesso!");
});

// ==========================================
// CADASTRAR OBJETO (ENCONTRADO OU PERDIDO)
// ==========================================

function abrirModalCadastro(status = "found", objeto = null) {
    statusCadastro = status;
    objetoSelecionado = objeto;

    if (!objectModal || !objectForm) return;

    objectForm.reset();

    const modalTitle = document.getElementById("modalTitle");
    const objectName = document.getElementById("objectName");
    const objectCategory = document.getElementById("objectCategory");
    const objectLocation = document.getElementById("objectLocation");
    const objectDescription = document.getElementById("objectDescription");
    const saveObjectButton = document.getElementById("saveObjectButton");

    if (objeto) {
        if (modalTitle) modalTitle.textContent = "Editar objeto";
        if (objectName) objectName.value = objeto.name || objeto.nome || "";
        if (objectCategory) objectCategory.value = objeto.category || objeto.categoria || "";
        if (objectLocation) objectLocation.value = objeto.location || objeto.local || "";
        if (objectDescription) objectDescription.value = objeto.description || objeto.descricao || "";
        if (saveObjectButton) saveObjectButton.textContent = "Salvar alterações";
    } else {
        if (modalTitle) {
            modalTitle.textContent = status === "lost"
                ? "Cadastrar objeto perdido"
                : "Cadastrar objeto encontrado";
        }

        if (saveObjectButton) {
            saveObjectButton.textContent = status === "lost"
                ? "Cadastrar objeto perdido"
                : "Cadastrar objeto";
        }
    }

    objectModal.classList.add("active");
    objectModal.style.display = "flex";
}

document.getElementById("registerFound")?.addEventListener("click", () => {
    abrirModalCadastro("found");
});

document.getElementById("registerLost")?.addEventListener("click", () => {
    abrirModalCadastro("lost");
});

document.getElementById("closeModal")?.addEventListener("click", fecharModalCadastro);

function fecharModalCadastro() {
    if (!objectModal) return;

    objectModal.classList.remove("active");
    objectModal.style.display = "none";
}

objectForm?.addEventListener("submit", evento => {
    evento.preventDefault();

    const nome = document.getElementById("objectName")?.value.trim();
    const categoria = document.getElementById("objectCategory")?.value.trim();
    const local = document.getElementById("objectLocation")?.value.trim();
    const descricao = document.getElementById("objectDescription")?.value.trim();

    if (!nome || !categoria || !local) {
        alert("Preencha o nome, a categoria e o local do objeto.");
        return;
    }

    const estavaEditando = Boolean(objetoSelecionado);
    const statusSalvo = statusCadastro;

    if (objetoSelecionado) {
        const indice = objetos.findIndex(objeto =>
            String(objeto.id) === String(objetoSelecionado.id)
        );

        if (indice !== -1) {
            objetos[indice] = {
                ...objetos[indice],
                name: nome,
                category: categoria,
                location: local,
                description: descricao,
                emoji: escolherEmoji(categoria)
            };
        }
    } else {
        objetos.push({
            id: gerarId(),
            name: nome,
            category: categoria,
            location: local,
            description: descricao,
            status: statusSalvo,
            date: new Date().toLocaleDateString("pt-BR"),
            emoji: escolherEmoji(categoria)
        });
    }

    salvarObjetos();
    fecharModalCadastro();

    objetoSelecionado = null;

    renderizarObjetosPerdidos();
    renderizarObjetosEncontrados();

    if (estavaEditando) {
        alert("Objeto atualizado com sucesso!");
    } else if (statusSalvo === "lost") {
        alert("Objeto perdido cadastrado com sucesso!");
    } else {
        alert("Objeto cadastrado com sucesso!");
    }

    mostrarTela(statusSalvo === "lost" ? "lost" : "found");
});

// ==========================================
// EXIBIÇÃO DOS OBJETOS
// ==========================================

function obterNome(objeto) {
    return objeto.name || objeto.nome || "Objeto sem nome";
}

function obterCategoria(objeto) {
    return objeto.category || objeto.categoria || "Outros";
}

function obterLocal(objeto) {
    return objeto.location || objeto.local || "Local não informado";
}

function obterDescricao(objeto) {
    return objeto.description || objeto.descricao || "Nenhuma descrição informada.";
}

function obterEmoji(objeto) {
    return objeto.emoji || escolherEmoji(obterCategoria(objeto));
}

function criarCardObjeto(objeto, permitirEdicao = false) {
    const card = document.createElement("div");

    card.className = "object-card";
    card.dataset.id = objeto.id;

    card.innerHTML = `
        <div class="object-card-icon">
            <span class="status ${escaparHTML(objeto.status)}">${escaparHTML(textoStatus(objeto.status))}</span>
            ${escaparHTML(obterEmoji(objeto))}
        </div>
        <div class="object-card-content">
            <span class="object-category">${escaparHTML(obterCategoria(objeto))}</span>
            <h3>${escaparHTML(obterNome(objeto))}</h3>
            <p>📍 ${escaparHTML(obterLocal(objeto))}</p>
            <p class="object-description">${escaparHTML(obterDescricao(objeto))}</p>
            <span class="object-date">${escaparHTML(objeto.date || objeto.data || "")}</span>
            ${permitirEdicao ? '<span class="edit-hint">Clique para gerenciar este cadastro</span>' : ""}
        </div>
    `;

    card.addEventListener("click", () => abrirDetalhes(objeto.id, permitirEdicao));

    return card;
}

function objetoCorrespondePesquisa(objeto, pesquisa) {
    const texto = [
        obterNome(objeto),
        obterCategoria(objeto),
        obterLocal(objeto),
        obterDescricao(objeto)
    ].join(" ").toLowerCase();

    return texto.includes(pesquisa);
}

// Tela "Perdi um objeto": mostra objetos perdidos e encontrados
function renderizarObjetosPerdidos() {
    if (!lostObjectsGrid) return;

    lostObjectsGrid.innerHTML = "";

    const pesquisa = (lostSearchInput?.value || "").toLowerCase().trim();

    const lista = objetos.filter(objeto =>
        objetoCorrespondePesquisa(objeto, pesquisa) &&
        (filtroLost === "all" || objeto.status === filtroLost)
    );

    lista.forEach(objeto => {
        // Objetos perdidos são do próprio usuário, então podem ser gerenciados
        lostObjectsGrid.appendChild(criarCardObjeto(objeto, objeto.status === "lost"));
    });

    const contador = document.getElementById("lostResultsCount");
    if (contador) contador.textContent = `${lista.length} objeto(s)`;

    const vazio = document.getElementById("lostEmptyMessage");
    if (vazio) vazio.hidden = lista.length > 0;
}

// Tela "Encontrei um objeto": mostra só os objetos encontrados cadastrados
function renderizarObjetosEncontrados() {
    if (!foundObjectsGrid) return;

    foundObjectsGrid.innerHTML = "";

    const pesquisa = (foundSearchInput?.value || "").toLowerCase().trim();

    const lista = objetos.filter(objeto =>
        objeto.status === "found" &&
        objetoCorrespondePesquisa(objeto, pesquisa) &&
        (filtroFound === "all" || objeto.status === filtroFound)
    );

    lista.forEach(objeto => {
        foundObjectsGrid.appendChild(criarCardObjeto(objeto, true));
    });

    const contador = document.getElementById("foundResultsCount");
    if (contador) contador.textContent = `${lista.length} objeto(s) cadastrado(s)`;

    const vazio = document.getElementById("foundEmptyMessage");
    if (vazio) vazio.hidden = lista.length > 0;
}

// PESQUISA

lostSearchInput?.addEventListener("input", renderizarObjetosPerdidos);
foundSearchInput?.addEventListener("input", renderizarObjetosEncontrados);

document.getElementById("lostSearchButton")?.addEventListener("click", renderizarObjetosPerdidos);
document.getElementById("foundSearchButton")?.addEventListener("click", renderizarObjetosEncontrados);

// FILTROS

document.querySelectorAll('button[data-scope="lost"][data-filter]').forEach(botao => {
    botao.addEventListener("click", () => {
        filtroLost = botao.dataset.filter;

        document.querySelectorAll('button[data-scope="lost"][data-filter]').forEach(item => {
            item.classList.remove("active");
        });

        botao.classList.add("active");
        renderizarObjetosPerdidos();
    });
});

document.querySelectorAll('button[data-scope="found"][data-filter]').forEach(botao => {
    botao.addEventListener("click", () => {
        filtroFound = botao.dataset.filter;

        document.querySelectorAll('button[data-scope="found"][data-filter]').forEach(item => {
            item.classList.remove("active");
        });

        botao.classList.add("active");
        renderizarObjetosEncontrados();
    });
});

// ==========================================
// DETALHES DO OBJETO
// ==========================================

function abrirDetalhes(id, permitirEdicao) {
    const objeto = objetos.find(item => String(item.id) === String(id));

    if (!objeto || !detailsModal) return;

    objetoSelecionado = objeto;
    podeEditarObjeto = permitirEdicao;

    const statusEl = document.getElementById("detailsStatus");

    document.getElementById("detailsEmoji").textContent = obterEmoji(objeto);
    document.getElementById("detailsCategory").textContent = obterCategoria(objeto);
    document.getElementById("detailsName").textContent = obterNome(objeto);
    document.getElementById("detailsLocation").textContent = obterLocal(objeto);
    document.getElementById("detailsDate").textContent = objeto.date || objeto.data || "Não informada";
    document.getElementById("detailsDescription").textContent = obterDescricao(objeto);

    if (statusEl) {
        statusEl.textContent = textoStatus(objeto.status);
        statusEl.className = `status details-status ${objeto.status}`;
    }

    const interesse = document.getElementById("interestButton");
    const editar = document.getElementById("editObjectButton");
    const excluir = document.getElementById("deleteObjectButton");
    const mensagem = document.getElementById("interestMessage");

    const jaSolicitou = solicitacoes.some(solicitacao =>
        String(solicitacao.objectId || solicitacao.objetoId || solicitacao.idObjeto) === String(objeto.id) &&
        solicitacao.status !== "rejected" &&
        solicitacao.status !== "cancelled"
    );

    if (interesse) {
        interesse.style.display = permitirEdicao ? "none" : "inline-flex";
        interesse.disabled = jaSolicitou;
        interesse.textContent = jaSolicitou ? "Solicitação enviada" : "Tenho interesse";
    }

    if (editar) editar.style.display = permitirEdicao ? "inline-flex" : "none";
    if (excluir) excluir.style.display = permitirEdicao ? "inline-flex" : "none";

    if (mensagem) {
        mensagem.textContent = jaSolicitou
            ? "Você já enviou uma solicitação para este objeto."
            : "";
    }

    detailsModal.classList.add("active");
    detailsModal.style.display = "flex";
}

function fecharDetalhes() {
    if (!detailsModal) return;

    detailsModal.classList.remove("active");
    detailsModal.style.display = "none";
    objetoSelecionado = null;
}

document.getElementById("closeDetails")?.addEventListener("click", fecharDetalhes);

// EDITAR

document.getElementById("editObjectButton")?.addEventListener("click", () => {
    if (!objetoSelecionado || !podeEditarObjeto) return;

    const objeto = objetoSelecionado;

    fecharDetalhes();
    abrirModalCadastro(objeto.status, objeto);
});

// EXCLUIR

document.getElementById("deleteObjectButton")?.addEventListener("click", () => {
    if (!objetoSelecionado || !podeEditarObjeto) return;

    const confirmar = confirm("Tem certeza de que deseja excluir este objeto?");

    if (!confirmar) return;

    const id = objetoSelecionado.id;

    objetos = objetos.filter(objeto => String(objeto.id) !== String(id));

    solicitacoes = solicitacoes.filter(solicitacao =>
        String(solicitacao.objectId || solicitacao.objetoId || solicitacao.idObjeto) !== String(id)
    );

    salvarObjetos();
    salvarSolicitacoes();

    fecharDetalhes();

    renderizarObjetosPerdidos();
    renderizarObjetosEncontrados();
    renderizarSolicitacoes();

    alert("Objeto excluído com sucesso!");
});

// ==========================================
// SOLICITAÇÕES
// ==========================================

document.getElementById("interestButton")?.addEventListener("click", () => {
    if (!objetoSelecionado) return;

    const jaSolicitou = solicitacoes.some(solicitacao =>
        String(solicitacao.objectId || solicitacao.objetoId || solicitacao.idObjeto) === String(objetoSelecionado.id) &&
        solicitacao.status !== "rejected" &&
        solicitacao.status !== "cancelled"
    );

    if (jaSolicitou) {
        alert("Você já enviou uma solicitação para este objeto.");
        return;
    }

    solicitacoes.push({
        id: gerarId(),
        objectId: objetoSelecionado.id,
        objectName: obterNome(objetoSelecionado),
        objectLocation: obterLocal(objetoSelecionado),
        status: "pending",
        date: new Date().toLocaleDateString("pt-BR")
    });

    salvarSolicitacoes();

    alert("Sua solicitação foi enviada!");

    fecharDetalhes();
    abrirSolicitacoes();
});

// ==========================================
// MINHAS SOLICITAÇÕES
// ==========================================

function renderizarSolicitacoes() {
    const lista = document.getElementById("requestsList");
    const vazio = document.getElementById("emptyRequests");

    if (!lista) return;

    lista.innerHTML = "";

    const pendentes = solicitacoes.filter(item => item.status === "pending").length;
    const aceitas = solicitacoes.filter(item => item.status === "accepted").length;
    const recusadas = solicitacoes.filter(item => item.status === "rejected").length;

    const pendingCount = document.getElementById("pendingCount");
    const acceptedCount = document.getElementById("acceptedCount");
    const rejectedCount = document.getElementById("rejectedCount");

    if (pendingCount) pendingCount.textContent = pendentes;
    if (acceptedCount) acceptedCount.textContent = aceitas;
    if (rejectedCount) rejectedCount.textContent = recusadas;

    if (vazio) vazio.style.display = solicitacoes.length ? "none" : "block";

    solicitacoes.forEach(solicitacao => {
        const nomeObjeto = solicitacao.objectName ||
            solicitacao.nomeObjeto ||
            solicitacao.nome ||
            "Objeto solicitado";

        const localObjeto = solicitacao.objectLocation ||
            solicitacao.local ||
            "Local não informado";

        const status = solicitacao.status || "pending";

        const statusTexto = {
            pending: "Pendente",
            accepted: "Aceita",
            rejected: "Recusada",
            cancelled: "Cancelada"
        }[status] || status;

        const card = document.createElement("div");
        card.className = "request-card";

        card.innerHTML = `
            <div class="request-info">
                <h3>${escaparHTML(nomeObjeto)}</h3>
                <p>📍 ${escaparHTML(localObjeto)}</p>
                <p>Data: ${escaparHTML(solicitacao.date || solicitacao.data || "Não informada")}</p>
                <span class="request-status ${escaparHTML(status)}">${escaparHTML(statusTexto)}</span>
            </div>
            <div class="request-actions">
                ${
                    status === "pending"
                        ? `<button type="button" class="cancel-request" data-id="${escaparHTML(solicitacao.id)}">Cancelar solicitação</button>`
                        : ""
                }
                ${
                    status === "pending"
                        ? `<button type="button" class="simulate-accept" data-id="${escaparHTML(solicitacao.id)}">Simular aceite</button>
                           <button type="button" class="simulate-reject" data-id="${escaparHTML(solicitacao.id)}">Simular recusa</button>`
                        : ""
                }
            </div>
        `;

        lista.appendChild(card);
    });
}

document.getElementById("requestsList")?.addEventListener("click", evento => {
    const botao = evento.target.closest("button");

    if (!botao) return;

    const id = botao.dataset.id;
    const solicitacao = solicitacoes.find(item => String(item.id) === String(id));

    if (!solicitacao) return;

    if (botao.classList.contains("cancel-request")) {
        solicitacao.status = "cancelled";
    } else if (botao.classList.contains("simulate-accept")) {
        solicitacao.status = "accepted";
    } else if (botao.classList.contains("simulate-reject")) {
        solicitacao.status = "rejected";
    }

    salvarSolicitacoes();
    renderizarSolicitacoes();
});

// ==========================================
// CHAT DEMONSTRATIVO
// ==========================================

const conversasDemo = {
    maria: {
        nome: "Maria Oliveira",
        inicial: "M",
        avatar: "avatar-maria",
        objeto: "Mochila azul",
        local: "Encontrada na Biblioteca",
        horario: "14:30",
        naoLidas: 2,
        mensagens: [
            {
                tipo: "received",
                texto: "Olá! Encontrei uma mochila azul na biblioteca.",
                horario: "14:25"
            },
            {
                tipo: "sent",
                texto: "Olá! Acredito que seja minha. Poderia me confirmar alguns detalhes?",
                horario: "14:28"
            },
            {
                tipo: "received",
                texto: "Claro! Podemos conversar para confirmar se é sua.",
                horario: "14:30"
            }
        ]
    },

    joao: {
        nome: "João Santos",
        inicial: "J",
        avatar: "avatar-joao",
        objeto: "Chaveiro encontrado",
        local: "Encontrado no corredor",
        horario: "Ontem",
        naoLidas: 0,
        mensagens: [
            {
                tipo: "received",
                texto: "Olá! Vi sua solicitação sobre o objeto encontrado.",
                horario: "Ontem"
            },
            {
                tipo: "sent",
                texto: "Obrigado pelo contato! Gostaria de confirmar alguns detalhes.",
                horario: "Ontem"
            },
            {
                tipo: "received",
                texto: "Obrigado pelo contato!",
                horario: "Ontem"
            }
        ]
    }
};

let conversaAtual = "maria";
let filtroConversas = "all";

function horarioAtual() {
    return new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function atualizarInformacoesChat() {
    const conversa = conversasDemo[conversaAtual];

    if (!conversa) return;

    const nome = document.getElementById("chatPersonName");
    const detalhesNome = document.getElementById("chatDetailsName");
    const objeto = document.getElementById("chatObjectName");
    const local = document.getElementById("chatObjectLocation");
    const detalhesObjeto = document.getElementById("chatDetailsObjectName");
    const detalhesLocal = document.getElementById("chatDetailsObjectLocation");

    if (nome) nome.textContent = conversa.nome;
    if (detalhesNome) detalhesNome.textContent = conversa.nome;
    if (objeto) objeto.textContent = conversa.objeto;
    if (local) local.textContent = conversa.local;
    if (detalhesObjeto) detalhesObjeto.textContent = conversa.objeto;
    if (detalhesLocal) detalhesLocal.textContent = conversa.local.replace("Encontrada na ", "").replace("Encontrado no ", "");

    const avatares = document.querySelectorAll(
        ".chat-person .chat-avatar, .chat-details-person .chat-avatar"
    );

    avatares.forEach(avatar => {
        avatar.className = `chat-avatar ${conversa.avatar}`;
        avatar.textContent = conversa.inicial;
    });

    const lista = document.getElementById("chatContactList");

    if (!lista) return;

    lista.querySelectorAll(".chat-contact").forEach(botao => {
        const selecionado = botao.dataset.chatId === conversaAtual;
        botao.classList.toggle("active", selecionado);
    });
}

function renderizarMensagensChat() {
    const area = document.getElementById("chatMessages");
    const conversa = conversasDemo[conversaAtual];

    if (!area || !conversa) return;

    area.innerHTML = `
        <div class="chat-date-divider">
            <span>Conversa demonstrativa</span>
        </div>
    `;

    conversa.mensagens.forEach(mensagem => {
        const linha = document.createElement("div");
        linha.className = `chat-message-row ${mensagem.tipo}`;

        if (mensagem.tipo === "received") {
            linha.innerHTML = `
                <span class="message-avatar">${escaparHTML(conversa.inicial)}</span>
                <div class="chat-message-content">
                    <span class="message-author">${escaparHTML(conversa.nome)}</span>
                    <div class="chat-bubble">${escaparHTML(mensagem.texto)}</div>
                    <time>${escaparHTML(mensagem.horario)}</time>
                </div>
            `;
        } else {
            linha.innerHTML = `
                <div class="chat-message-content">
                    <div class="chat-bubble">${escaparHTML(mensagem.texto)}</div>
                    <time>${escaparHTML(mensagem.horario)} <span class="message-check">✓✓</span></time>
                </div>
            `;
        }

        area.appendChild(linha);
    });

    area.scrollTop = area.scrollHeight;
}

function selecionarConversa(id) {
    if (!conversasDemo[id]) return;

    conversaAtual = id;

    // A conversa demonstrativa deixa de aparecer como não lida
    conversasDemo[id].naoLidas = 0;

    atualizarInformacoesChat();
    renderizarMensagensChat();
    renderizarListaConversas();
}

function renderizarListaConversas() {
    const lista = document.getElementById("chatContactList");
    const pesquisa = document.getElementById("chatSearchInput");
    const semResultado = document.getElementById("chatNoResults");

    if (!lista) return;

    lista.querySelectorAll(".chat-contact").forEach(botao => {
        const id = botao.dataset.chatId;
        const conversa = conversasDemo[id];

        if (!conversa) return;

        const correspondePesquisa = conversa.nome.toLowerCase().includes(
            (pesquisa?.value || "").toLowerCase().trim()
        );

        const correspondeFiltro =
            filtroConversas === "all" || conversa.naoLidas > 0;

        botao.hidden = !(correspondePesquisa && correspondeFiltro);

        const pequenaMensagem = botao.querySelector(".chat-contact-copy small");
        const horario = botao.querySelector(".chat-contact-meta time");
        const contador = botao.querySelector(".unread-count");

        if (pequenaMensagem) {
            const ultima = conversa.mensagens[conversa.mensagens.length - 1];
            pequenaMensagem.textContent = ultima?.texto || "";
        }

        if (horario) horario.textContent = conversa.horario;

        if (contador) {
            contador.textContent = conversa.naoLidas;
            contador.style.display = conversa.naoLidas > 0 ? "flex" : "none";
        }

        botao.classList.toggle("active", id === conversaAtual);
    });

    const visiveis = [...lista.querySelectorAll(".chat-contact")]
        .some(botao => !botao.hidden);

    if (semResultado) semResultado.hidden = visiveis;
}

// CLIQUE NAS CONVERSAS

document.getElementById("chatContactList")?.addEventListener("click", evento => {
    const botao = evento.target.closest(".chat-contact");

    if (!botao) return;

    selecionarConversa(botao.dataset.chatId);
});

// PESQUISA

document.getElementById("chatSearchInput")?.addEventListener("input", renderizarListaConversas);

// FILTROS DE CONVERSA

document.querySelectorAll("[data-chat-filter]").forEach(botao => {
    botao.addEventListener("click", () => {
        filtroConversas = botao.dataset.chatFilter;

        document.querySelectorAll("[data-chat-filter]").forEach(item => {
            item.classList.remove("active");
        });

        botao.classList.add("active");
        renderizarListaConversas();
    });
});

// ENVIAR MENSAGEM DEMONSTRATIVA

document.getElementById("chatForm")?.addEventListener("submit", evento => {
    evento.preventDefault();

    const input = document.getElementById("chatInput");
    const texto = input?.value.trim();

    if (!texto) return;

    conversasDemo[conversaAtual].mensagens.push({
        tipo: "sent",
        texto: texto,
        horario: horarioAtual()
    });

    conversasDemo[conversaAtual].horario = horarioAtual();

    input.value = "";

    renderizarMensagensChat();
    renderizarListaConversas();
});

// ANEXOS E EMOJI

document.getElementById("chatAttachButton")?.addEventListener("click", () => {
    alert("O envio de arquivos será implementado futuramente.");
});

document.getElementById("chatEmojiButton")?.addEventListener("click", () => {
    const input = document.getElementById("chatInput");

    if (!input) return;

    input.value += " 😊";
    input.focus();
});

// PAINEL DE DETALHES

document.getElementById("chatDetailsToggle")?.addEventListener("click", () => {
    const painel = document.getElementById("chatDetailsPanel");

    if (!painel) return;

    painel.style.display = painel.style.display === "none" ? "block" : "none";
});

document.getElementById("chatCloseDetails")?.addEventListener("click", () => {
    const painel = document.getElementById("chatDetailsPanel");

    if (painel) painel.style.display = "none";
});

// NOVA CONVERSA

document.getElementById("newChatButton")?.addEventListener("click", () => {
    alert("As novas conversas serão criadas quando o sistema de usuários e o banco de dados forem implementados.");
});

// INICIALIZAÇÃO DO CHAT

atualizarInformacoesChat();
renderizarMensagensChat();
renderizarListaConversas();

// ==========================================
// NOTIFICAÇÕES
// ==========================================

document.getElementById("notificationButton")?.addEventListener("click", () => {
    if (!config.notifSolicitacoes && !config.notifMensagens) {
        alert("As notificações estão desativadas. Você pode ativá-las em Configurações.");
        return;
    }

    alert("Você está em dia! Não há novas notificações.");
});

// ==========================================
// FECHAR MODAIS
// ==========================================

[objectModal, detailsModal].forEach(modal => {
    modal?.addEventListener("click", evento => {
        if (evento.target === modal) {
            modal.classList.remove("active");
            modal.style.display = "none";
        }
    });
});

document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") {
        fecharModalCadastro();
        fecharDetalhes();
        fecharMenuMobile();
    }
});

// ==========================================
// INICIALIZAÇÃO DO ACHAÍ
// ==========================================

aplicarPerfil();
renderizarObjetosPerdidos();
renderizarObjetosEncontrados();
renderizarSolicitacoes();
mostrarTela("home");

console.log("ACHAÍ iniciado com sucesso!");