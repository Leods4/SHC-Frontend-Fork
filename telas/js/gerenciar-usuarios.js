// js/gerenciar-usuarios.js

document.addEventListener('DOMContentLoaded', () => {

    const usersTbody = document.getElementById('users-tbody');
    const userModal = document.getElementById('user-modal');
    const deleteModal = document.getElementById('delete-modal');
    const userForm = document.getElementById('user-form');
    let userIdToDelete = null;

    // Seletores
    const papelSelect = document.getElementById('papel');
    const cursoGroup = document.getElementById('curso-group');
    const faseGroup = document.getElementById('fase-group');
    const cursoSelect = document.getElementById('curso');
    const faseSelect = document.getElementById('fase');

    const nascimentoGroup = document.getElementById('nascimento-group');
    const passwordGroup = document.getElementById('password-group');

    // =======================================================
    // READ - LER E RENDERIZAR USUÁRIOS
    // =======================================================
    async function fetchAndRenderUsers() {
        usersTbody.innerHTML = '<tr><td colspan="5">Carregando usuários...</td></tr>';
        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios`, {
                headers: { 'Authorization': `Bearer ${authToken}`, 'Accept': 'application/json' }
            });
            
            // Tratamento de Erro 401/403
            if (response.status === 401 || response.status === 403) {
                window.location.href = 'index.html';
                return;
            }

            if (!response.ok) throw new Error('Falha ao carregar usuários.');

            const result = await response.json();
            const users = result.data || result;
            
            usersTbody.innerHTML = '';

            if (users.length === 0) {
                usersTbody.innerHTML = '<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>';
                return;
            }

            users.forEach(user => {
                const row = usersTbody.insertRow();
                row.innerHTML = `
                    <td data-label="Nome">${user.nome}<br><small style="color:#999">${user.cpf || 'Sem CPF'}</small></td>
                    <td data-label="Email">${user.email}</td>
                    <td data-label="ID">${user.matricula || '-'}</td>
                    <td data-label="Papel">${getRoleBadge(user.tipo)}</td>
                    <td class="action-cell">
                        <button class="action-btn btn-edit" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                        ${user.id !== loggedInUser.id ? '<button class="action-btn btn-delete" title="Remover"><i class="fas fa-trash"></i></button>' : ''}
                    </td>
                `;
                
                // Passa o objeto usuário completo para a função de edição
                row.querySelector('.btn-edit').addEventListener('click', () => openEditModal(user));
                
                const deleteBtn = row.querySelector('.btn-delete');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => openDeleteModal(user.id, user.nome));
                }
            });
        } catch (error) {
            usersTbody.innerHTML = `<tr><td colspan="5" style="color:var(--status-reprovado)">${error.message}</td></tr>`;
        }
    }
    
    // =======================================================
    // LÓGICA DE CAMPOS CONDICIONAIS (Curso e Fase)
    // =======================================================
    function toggleConditionalFields() {
        const papel = papelSelect.value;
        
        // Lógica: 
        // ALUNO: Precisa de Curso e Fase.
        // COORDENADOR: Precisa de Curso, mas NÃO de fase.
        // SECRETARIA/ADMIN: Não precisa de Curso nem Fase.
        
        const isAluno = papel === 'ALUNO';
        const isCoord = papel === 'COORDENADOR';
        
        // Exibir/Ocultar Grupos
        if(cursoGroup) cursoGroup.classList.toggle('hidden', !isAluno && !isCoord);
        if(faseGroup) faseGroup.classList.toggle('hidden', !isAluno);

        // Definir Obrigatoriedade (Required)
        // Isso impede que o formulário seja enviado sem curso se for Aluno/Coord
        if(cursoSelect) cursoSelect.required = (isAluno || isCoord);
        if(faseSelect) faseSelect.required = isAluno;

        // Limpar valores se ocultar (opcional, para não enviar lixo)
        if (!isAluno && !isCoord && cursoSelect) {
            cursoSelect.value = "";
            updateCustomSelectUI(cursoSelect, "");
        }
        if (!isAluno && faseSelect) {
            faseSelect.value = "";
            updateCustomSelectUI(faseSelect, "");
        }
    }

    if(papelSelect) papelSelect.addEventListener('change', toggleConditionalFields);

    // =======================================================
    // MODAL ACTIONS
    // =======================================================
    document.getElementById('add-user-btn').addEventListener('click', () => {
        userForm.reset();
        document.getElementById('user-id').value = '';
        document.getElementById('modal-title').textContent = 'Adicionar Novo Usuário';
        
        // Reset UI dos selects
        if(cursoSelect) updateCustomSelectUI(cursoSelect, "");
        if(faseSelect) updateCustomSelectUI(faseSelect, "");
        
        toggleConditionalFields(); // Aplica regras iniciais

        // Configuração de Criação: Data Nascimento Obrigatória (para senha)
        if (nascimentoGroup) nascimentoGroup.classList.remove('hidden');
        if (passwordGroup) passwordGroup.classList.add('hidden');
        
        document.getElementById('data_nascimento').required = true;
        document.getElementById('password').required = false;

        userModal.showModal();
    });

    function openEditModal(user) {
        userForm.reset();
        document.getElementById('modal-title').textContent = 'Editar Usuário';
        document.getElementById('user-id').value = user.id;
        
        // Preencher campos básicos
        document.getElementById('nome').value = user.nome;
        document.getElementById('email').value = user.email;
        document.getElementById('cpf').value = user.cpf || ''; // Importante: Carregar CPF
        document.getElementById('matricula').value = user.matricula || '';
        document.getElementById('papel').value = user.tipo;

        // Preencher selects condicionais
        if (cursoSelect) {
            cursoSelect.value = user.curso_id || '';
            updateCustomSelectUI(cursoSelect, user.curso_id);
        }

        if (faseSelect) {
            faseSelect.value = user.fase || '';
            updateCustomSelectUI(faseSelect, user.fase);
        }
        
        toggleConditionalFields(); // Atualiza visibilidade baseada no papel carregado

        // Configuração de Edição: Senha opcional, data nascimento escondida (geralmente não edita data para não resetar senha acidentalmente, ou pode deixar visível)
        if (nascimentoGroup) nascimentoGroup.classList.add('hidden'); 
        if (passwordGroup) passwordGroup.classList.remove('hidden');
        
        document.getElementById('data_nascimento').required = false;
        document.getElementById('password').required = false;

        userModal.showModal();
    }

    // =======================================================
    // SUBMIT (CREATE / UPDATE)
    // =======================================================
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('user-id').value;
        const isEditing = !!userId;

        // Construção do Payload conforme 
        const payload = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            cpf: document.getElementById('cpf').value, // Obrigatório na API
            matricula: document.getElementById('matricula').value,
            tipo: document.getElementById('papel').value,
            // Envia null se o campo estiver vazio ou oculto
            curso_id: (cursoSelect && cursoSelect.value) ? cursoSelect.value : null,
            fase: (faseSelect && faseSelect.value) ? faseSelect.value : null,
        };

        if (isEditing) {
            // Na edição, envia senha apenas se preenchida
            const password = document.getElementById('password').value;
            if (password && password.trim() !== '') {
                payload.password = password;
            }
        } else {
            // Na criação, usa data de nascimento
            const rawDate = document.getElementById('data_nascimento').value;
            if (rawDate) {
                payload.data_nascimento = rawDate; // YYYY-MM-DD
                // Opcional: A API diz que gera senha se não enviada.
                // Mas se quisermos garantir, podemos não enviar o campo 'password' e deixar o backend fazer.
                // O código anterior gerava manualmente. Vamos deixar o backend tratar conforme .
            }
        }

        const url = isEditing ? `${API_BASE_URL}/api/usuarios/${userId}` : `${API_BASE_URL}/api/usuarios`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 
                    'Authorization': `Bearer ${authToken}`, 
                    'Content-Type': 'application/json', 
                    'Accept': 'application/json' 
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                // Tratamento de erro de validação (ex: CPF já existe) [cite: 8]
                if (response.status === 422 && result.errors) {
                    let msg = "Erro de validação:\n";
                    for (const [key, msgs] of Object.entries(result.errors)) {
                        msg += `- ${msgs[0]}\n`;
                    }
                    throw new Error(msg);
                }
                throw new Error(result.message || 'Falha ao salvar usuário.');
            }
            
            showToast(`Usuário ${isEditing ? 'atualizado' : 'criado'} com sucesso!`, 'success');
            userModal.close();
            fetchAndRenderUsers();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    // =======================================================
    // DELETE E AUXILIARES (Mantidos conforme original)
    // =======================================================
    function openDeleteModal(id, name) {
        userIdToDelete = id;
        document.getElementById('delete-user-name').textContent = name;
        deleteModal.showModal();
    }

    document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
        if (!userIdToDelete) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/${userIdToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}`, 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error('Falha ao remover usuário.');

            showToast('Usuário removido com sucesso.', 'success');
            deleteModal.close();
            fetchAndRenderUsers();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    async function populateCourseSelects() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/cursos`, {
                headers: { 'Authorization': `Bearer ${authToken}`, 'Accept': 'application/json' }
            });
            if (!response.ok) return;

            const result = await response.json();
            const cursos = result.data || result; // Fallback para diferentes formatos de resposta

            if (!cursoSelect) return;

            // Limpa opções antigas (mantendo o placeholder)
            cursoSelect.innerHTML = '<option value="">Selecione um curso...</option>';
            
            // Popula selects normais
            cursos.forEach(curso => {
                cursoSelect.insertAdjacentHTML('beforeend', `<option value="${curso.id}">${curso.nome}</option>`);
            });

            // Se você usa o custom-select visual, precisa recriar as divs
            const optionsContainer = cursoSelect.nextElementSibling.querySelector('.custom-options');
            if(optionsContainer) {
                optionsContainer.innerHTML = '<div class="custom-option" data-value="">Selecione um curso...</div>';
                cursos.forEach(curso => {
                    optionsContainer.insertAdjacentHTML('beforeend', `<div class="custom-option" data-value="${curso.id}">${curso.nome}</div>`);
                });
            }

        } catch (error) { console.error("Erro ao popular cursos:", error); }
    }

    function getRoleBadge(role) {
        if (!role) return '';
        const roleLower = role.toLowerCase();
        // Mapeia ALUNO, COORDENADOR, SECRETARIA, ADMINISTRADOR
        const cssClass = `role-${roleLower.substring(0,6)}`; // Ex: role-aluno, role-coord
        return `<span class="role-badge ${cssClass}">${role}</span>`;
    }

    // Custom Select Logic (UI)
    function setupCustomSelect(wrapper) {
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const optionsContainer = wrapper.querySelector('.custom-options');
        const hiddenSelect = wrapper.previousElementSibling;
        const triggerSpan = trigger.querySelector('span');
        
        if (!hiddenSelect) return;

        // Sincroniza clique na opção customizada com o select escondido
        optionsContainer.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-option');
            if(option) {
                e.stopPropagation();
                const value = option.dataset.value;
                const text = option.textContent;
                
                triggerSpan.textContent = text;
                hiddenSelect.value = value;
                
                // Dispara evento 'change' para ativar toggleConditionalFields
                hiddenSelect.dispatchEvent(new Event('change')); 
                
                wrapper.classList.remove('open');
            }
        });

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Fecha outros abertos
            document.querySelectorAll('.custom-select-wrapper.open').forEach(el => {
                if(el !== wrapper) el.classList.remove('open');
            });
            wrapper.classList.toggle('open');
        });
    }

    function updateCustomSelectUI(selectElement, value) {
        if(!selectElement) return;
        const wrapper = selectElement.nextElementSibling;
        if(!wrapper || !wrapper.classList.contains('custom-select-wrapper')) return;

        const triggerSpan = wrapper.querySelector('.custom-select-trigger span');
        let text = 'Selecione...';
        
        // Tenta achar o texto correspondente ao valor
        if (value) {
            const option = selectElement.querySelector(`option[value="${value}"]`);
            if (option) text = option.textContent;
        }
        
        triggerSpan.textContent = text;
    }

    // Inicialização
    populateCourseSelects();
    fetchAndRenderUsers();
    
    // Configura selects visuais
    document.querySelectorAll('.custom-select-wrapper').forEach(setupCustomSelect);
    document.addEventListener('click', () => document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open')));
    document.querySelectorAll('.close-btn').forEach(btn => btn.addEventListener('click', () => btn.closest('dialog').close()));
});