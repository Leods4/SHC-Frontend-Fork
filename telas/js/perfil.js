// js/perfil.js

document.addEventListener('DOMContentLoaded', () => {
    // =======================================================
    // 1. SEGURANÇA E CARREGAMENTO DE DADOS
    // =======================================================
    const userDataString = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');

    if (!userDataString || !authToken) {
        window.location.href = 'index.html';
        return;
    }

    let userData = JSON.parse(userDataString);

    // Helper para formatar data (YYYY-MM-DD -> DD/MM/YYYY)
    function formatDate(dateString) {
        if (!dateString) return '--';
        const parts = dateString.split('-'); // Assume formato da API Y-m-d
        if (parts.length !== 3) return dateString;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // Helper para formatar o Tipo de Usuário (Ex: ADMINISTRADOR -> Administrador)
    function formatUserType(type) {
        if (!type) return '--';
        // Capitaliza apenas a primeira letra e mantém o resto minúsculo, ou retorna como está
        const map = {
            'ALUNO': 'Aluno',
            'COORDENADOR': 'Coordenador',
            'SECRETARIA': 'Secretaria',
            'ADMINISTRADOR': 'Administrador'
        };
        return map[type] || type;
    }

    // =======================================================
    // 2. PREENCHIMENTO DOS DADOS DO USUÁRIO NA PÁGINA
    // =======================================================
    function populateUserData() {
        // Dados Básicos Comuns
        const nameElement = document.getElementById('profile-name');
        const emailElement = document.getElementById('profile-email');
        const avatarImg = document.getElementById('profile-avatar');
        
        // Novos Campos Comuns
        const typeElement = document.getElementById('profile-type');
        const dobElement = document.getElementById('profile-dob'); // Data de nascimento

        if (nameElement) nameElement.textContent = userData.nome || 'Nome não encontrado';
        if (emailElement) emailElement.textContent = userData.email || 'Email não encontrado';
        
        // Preencher Tipo de Usuário (Todos os perfis)
        if (typeElement) typeElement.textContent = formatUserType(userData.tipo);

        // Preencher Data de Nascimento (Todos exceto Administrador)
        // A verificação também ocorre no HTML (o elemento não existe no admin), mas garantimos aqui via lógica
        if (dobElement && userData.tipo !== 'ADMINISTRADOR') {
            dobElement.textContent = formatDate(userData.data_nascimento);
        }

        // Carregar Avatar Salvo
        if (avatarImg && userData.avatar_url) {
            avatarImg.src = userData.avatar_url;
            const avatarWrapper = document.querySelector('.profile-avatar-wrapper');
            if (avatarWrapper) avatarWrapper.classList.add('has-photo');
            
            const removeBtn = document.getElementById('remove-btn');
            if (removeBtn) removeBtn.classList.remove('hidden');
        }

        const userType = userData.tipo;
        const displayId = userData.cpf || userData.id || '--';

        // Dados Específicos por Tipo de Usuário
        if (userType === 'ALUNO') {
            const elMatricula = document.getElementById('aluno-matricula');
            const elCurso = document.getElementById('aluno-curso');
            const elFase = document.getElementById('aluno-fase');

            if (elMatricula) elMatricula.textContent = displayId;
            if (elCurso) elCurso.textContent = userData.curso?.nome || 'Não informado';
            if (elFase) elFase.textContent = userData.fase ? `${userData.fase}ª` : '--';
            
            fetchAndDisplayProgress(userData.id, authToken);
        }
        else if (userType === 'COORDENADOR') {
            const elCoordCurso = document.getElementById('coord-curso');
            const elCoordId = document.getElementById('coord-id');

            if (elCoordCurso) {
                const nomeCurso = userData.curso_coordenado?.nome || userData.curso?.nome || 'Não informado';
                elCoordCurso.textContent = nomeCurso;
            }
            if (elCoordId) elCoordId.textContent = displayId;
        }
        else if (userType === 'SECRETARIA') {
            const elSecId = document.getElementById('secretaria-id');
            if (elSecId) elSecId.textContent = displayId;
        }
        else if (userType === 'ADMINISTRADOR') {
            const elAdminId = document.getElementById('admin-id');
            if (elAdminId) elAdminId.textContent = displayId;
        }
    }

    async function fetchAndDisplayProgress(userId, token) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/${userId}/progresso`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Falha ao buscar progresso.');
            
            const progressData = await response.json();
            
            const totalRequired = progressData.horas_necessarias || 200;
            const totalCompleted = progressData.total_horas_aprovadas || 0;
            
            let percentage = (totalCompleted / totalRequired) * 100;
            if (percentage > 100) percentage = 100;

            const progressBarFill = document.querySelector('.progress-bar-fill');
            if (progressBarFill) {
                progressBarFill.style.width = `${percentage}%`;
            }
            
            const progressLabel = document.querySelector('.progress-label');
            if (progressLabel) {
                progressLabel.textContent = `${totalCompleted} / ${totalRequired} Horas`;
            }

        } catch (error) {
            console.error("Erro ao carregar progresso:", error);
            const progressLabel = document.querySelector('.progress-label');
            if (progressLabel) {
                progressLabel.textContent = "Dados indisponíveis";
            }
        }
    }

    // =======================================================
    // 3. LÓGICA DA INTERFACE (AVATAR, SENHA, LOGOUT)
    // =======================================================
    
    // Logout Logic
    const logoutBtn = document.querySelector('.logout-btn[href="index.html"]');
     if (logoutBtn) {
        logoutBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
            } catch (e) {
                console.warn('Logout offline ou falha na API');
            }
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            window.location.href = 'index.html';
        });
    }

    // Avatar Logic
    const avatarWrapper = document.querySelector('.profile-avatar-wrapper');
    if (avatarWrapper) {
      const avatarInput = document.getElementById('avatar-input');
      const profileAvatarImg = document.getElementById('profile-avatar');
      const avatarMenu = document.getElementById('avatar-menu');
      const uploadBtn = document.getElementById('upload-btn');
      const removeBtn = document.getElementById('remove-btn');
      
      let userHasPhoto = !!(userData.avatar_url);

      function setAvatarState(hasPhoto, url = "") {
        userHasPhoto = hasPhoto;
        avatarWrapper.classList.toggle('has-photo', hasPhoto);
        if (removeBtn) removeBtn.classList.toggle('hidden', !hasPhoto);
        
        if (hasPhoto && url) {
            profileAvatarImg.src = url;
        } else if (!hasPhoto) {
            profileAvatarImg.src = ""; 
        }
      }

      avatarWrapper.addEventListener('click', (e) => {
        if (!e.target.closest('#avatar-menu') && !e.target.closest('#avatar-input')) {
          avatarMenu.style.display = avatarMenu.style.display === 'block' ? 'none' : 'block';
        }
      });

      document.addEventListener('click', (e) => {
        if (!avatarWrapper.contains(e.target)) avatarMenu.style.display = 'none';
      });

      if (uploadBtn) uploadBtn.addEventListener('click', () => avatarInput.click());
      
      if (removeBtn) {
          removeBtn.addEventListener('click', () => {
              setAvatarState(false);
              showToast('Foto removida (visualização).', 'info');
          });
      }

      if (avatarInput) {
        avatarInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                profileAvatarImg.src = e.target.result;
            };
            reader.readAsDataURL(file);

            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const response = await fetch(`${API_BASE_URL}/api/usuarios/avatar`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Accept': 'application/json',
                    },
                    body: formData
                });

                if (!response.ok) throw new Error('Falha ao enviar a imagem.');
                
                const result = await response.json();
                
                if (result.avatar_url) {
                    userData.avatar_url = result.avatar_url;
                    localStorage.setItem('userData', JSON.stringify(userData));
                    setAvatarState(true, result.avatar_url);
                } else {
                    setAvatarState(true);
                }

                showToast('Foto de perfil atualizada com sucesso!');
                avatarMenu.style.display = 'none';

            } catch (error) {
                console.error('Erro no upload do avatar:', error);
                showToast('Erro ao salvar a foto no servidor.', 'error');
                if (userData.avatar_url) {
                    profileAvatarImg.src = userData.avatar_url;
                } else {
                    setAvatarState(false);
                }
            }
        });
      }
    }

    // Alteração de Senha
    const passwordModal = document.getElementById('password-modal');
    if (passwordModal) {
      const changePasswordBtn = document.getElementById('change-password-btn');
      const closeModalBtn = passwordModal.querySelector('.close-btn');
      const cancelBtn = passwordModal.querySelector('#cancel-btn');

      if (changePasswordBtn) {
          changePasswordBtn.addEventListener('click', () => passwordModal.showModal());
      }
      
      if (closeModalBtn) closeModalBtn.addEventListener('click', () => passwordModal.close());
      if (cancelBtn) cancelBtn.addEventListener('click', () => passwordModal.close());
      
      passwordModal.addEventListener('click', (e) => {
        if (e.target === passwordModal) passwordModal.close();
      });

      const passwordForm = document.getElementById('password-form');
      if (passwordForm) {
          passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                showToast('A nova senha e a confirmação não correspondem.', 'error');
                return;
            }
            if (newPassword.length < 8) {
                showToast('A nova senha deve ter no mínimo 8 caracteres.', 'error');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
                    method: 'POST', 
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        current_password: currentPassword,
                        password: newPassword,
                        password_confirmation: confirmPassword
                    })
                });

                // 1. Se for 204 (Sucesso sem conteúdo), não tenta ler JSON
                if (response.status === 204) {
                    showToast('Senha alterada com sucesso!');
                    passwordModal.close();
                    passwordForm.reset();
                    return; // Sai da função, tudo certo
                }

                // 2. Se chegou aqui, tem conteúdo (provavelmente erro), então lemos o JSON
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Não foi possível alterar a senha.');
                }
                
                // Caso o backend mude no futuro e retorne 200 OK com JSON de sucesso
                showToast('Senha alterada com sucesso!');
                passwordModal.close();
                passwordForm.reset();

                // --- FIM DA CORREÇÃO ---

            } catch (error) {
                console.error('Erro ao alterar senha:', error);
                // Exibe a mensagem de erro vinda da API (ex: "A senha atual está incorreta")
                showToast(`Erro: ${error.message || 'Erro desconhecido'}`, 'error');
            }
          });
      }
    }

    populateUserData();

    // =======================================================
    // 4. CARREGAMENTO DOS SUMÁRIOS (Dashboard Stats)
    // =======================================================
    async function loadProfileSummary() {
        const userType = userData.tipo;

        // LÓGICA PARA COORDENADOR
        if (userType === 'COORDENADOR') {
            const elHoras = document.getElementById('summary-horas');
            const elPendencias = document.getElementById('summary-pendencias');

            if (!elHoras && !elPendencias) return; // Não estamos na página de coordenador

            try {
                // 1. Buscar Certificados Pendentes (Status: ENTREGUE)
                // Nota: A API permite filtrar por status via GET parameters 
                const respPendencias = await fetch(`${API_BASE_URL}/api/certificados?status=ENTREGUE`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const pendenciasData = await respPendencias.json();
                
                // Se a API retornar um array direto, usamos .length. 
                // Se for paginado (ex: data.data), ajuste para pendenciasData.data.length
                const countPendencias = Array.isArray(pendenciasData) ? pendenciasData.length : (pendenciasData.data ? pendenciasData.data.length : 0);
                
                if (elPendencias) elPendencias.textContent = countPendencias;

                // 2. Buscar Certificados Aprovados para somar Horas
                const respAprovados = await fetch(`${API_BASE_URL}/api/certificados?status=APROVADO`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const aprovadosData = await respAprovados.json();
                const listaAprovados = Array.isArray(aprovadosData) ? aprovadosData : (aprovadosData.data || []);

                // Somar o campo 'horas_validadas' 
                const totalHoras = listaAprovados.reduce((acc, cert) => acc + (Number(cert.horas_validadas) || 0), 0);
                
                if (elHoras) elHoras.textContent = totalHoras;

            } catch (error) {
                console.error("Erro ao carregar sumário do coordenador:", error);
            }
        }

        // LÓGICA PARA SECRETARIA
        else if (userType === 'SECRETARIA') {
            const elTotalAlunos = document.getElementById('summary-alunos');
            const elTotalCoords = document.getElementById('summary-coords');

            if (!elTotalAlunos && !elTotalCoords) return; // Não estamos na página de secretaria

            try {
                // A rota /usuarios lista todos os usuários 
                const response = await fetch(`${API_BASE_URL}/api/usuarios`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                
                if (!response.ok) throw new Error('Falha ao buscar usuários');
                
                const usersData = await response.json();
                const usersList = Array.isArray(usersData) ? usersData : (usersData.data || []);

                // Filtragem no Front-end (Cliente)
                // Contar Alunos
                const countAlunos = usersList.filter(u => u.tipo === 'ALUNO').length;
                
                // Contar Coordenadores
                const countCoords = usersList.filter(u => u.tipo === 'COORDENADOR').length;

                if (elTotalAlunos) elTotalAlunos.textContent = countAlunos;
                if (elTotalCoords) elTotalCoords.textContent = countCoords;

            } catch (error) {
                console.error("Erro ao carregar sumário da secretaria:", error);
            }
        }
    }

    // Chama a função ao final do carregamento
    loadProfileSummary();
});