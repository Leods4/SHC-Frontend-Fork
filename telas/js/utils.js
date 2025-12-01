// js/utils.js

// =======================================================
// 1. CARREGAMENTO DO MOCK (Prioritário)
// =======================================================
// Verifica se estamos rodando localmente ou no servidor
// Se o script do mock ainda não existe, cria ele.
if (!document.querySelector('script[src="js/mock-api.js"]')) {
    const scriptMock = document.createElement('script');
    scriptMock.src = 'js/mock-api.js';
    scriptMock.async = false; // Importante: Força o navegador a esperar esse script
    document.head.prepend(scriptMock); // Coloca no topo do head
}

// =======================================================
// 2. VARIÁVEIS GLOBAIS
// =======================================================
// MUDANÇA: Usamos uma URL HTTPS falsa para evitar erro de "Mixed Content" no Render
const API_BASE_URL = 'https://api-ficticia.shc.com'; 

const authToken = localStorage.getItem('authToken');
const loggedInUser = JSON.parse(localStorage.getItem('userData') || '{}');

// =======================================================
// 3. FUNÇÕES UTILITÁRIAS
// =======================================================

function verificarAutenticacao() {
    // Não verifica na tela de login
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.href.endsWith('/')) {
        return;
    }
    if (!authToken) {
        window.location.href = 'index.html';
    }
}
// Pequeno delay para garantir que o Mock sobrescreva o fetch antes da verificação
setTimeout(verificarAutenticacao, 100);

function getStatusInfo(status) {
    switch (status) {
        case 'APROVADO': return { className: 'status-aprovado', text: 'Aprovado' };
        case 'REPROVADO': return { className: 'status-reprovado', text: 'Reprovado' };
        case 'APROVADO_COM_RESSALVAS': return { className: 'status-ressalva', text: 'Ressalvas' };
        default: return { className: 'status-entregue', text: 'Entregue' }; 
    }
}

function setupAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        // Remove clones antigos para evitar duplicação de eventos
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
        
        newHeader.addEventListener('click', () => {
            newHeader.classList.toggle('active');
            const content = newHeader.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });
}

function showToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-times-circle';
    toast.innerHTML = `<i class="fas ${iconClass} toast-icon"></i><span class="toast-message">${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function setupCustomSelect(wrapper) {
    const trigger = wrapper.querySelector('.custom-select-trigger');
    const optionsContainer = wrapper.querySelector('.custom-options');
    const hiddenSelect = wrapper.previousElementSibling;
    const triggerSpan = trigger.querySelector('span');
    const customOptions = optionsContainer.querySelectorAll('.custom-option');
    
    if (!trigger.dataset.hasListener) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            wrapper.classList.toggle('open');
        });
        trigger.dataset.hasListener = 'true';
    }

    customOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation(); 
            triggerSpan.textContent = option.textContent;
            hiddenSelect.value = option.dataset.value;
            wrapper.classList.remove('open');
            hiddenSelect.dispatchEvent(new Event('change'));
        });
    });
}

function setupFileInputs() {
    document.querySelectorAll('.file-upload-wrapper').forEach(wrapper => {
        const fileInput = wrapper.querySelector('input[type="file"]');
        const fileUploadText = wrapper.querySelector('.file-upload-text');
        const fileNameSpan = wrapper.querySelector('#file-name');

        if (!fileInput) return;

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                const fileName = fileInput.files[0].name;
                if(fileUploadText) fileUploadText.style.display = 'none';
                if(fileNameSpan) fileNameSpan.innerHTML = `<span class="label">Arquivo:</span> <span class="name">${fileName}</span>`;
            } else {
                if(fileUploadText) fileUploadText.style.display = 'block'; 
                if(fileNameSpan) fileNameSpan.innerHTML = '';
            }
        });
    });
}

document.addEventListener('click', (e) => {
    document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
        if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
    });
});

document.addEventListener('DOMContentLoaded', setupFileInputs);
