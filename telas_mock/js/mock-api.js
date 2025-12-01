// js/mock-api.js

(function() {
    console.warn("⚠️ MOCK API ATIVADA: O sistema está rodando com dados fictícios.");

    // =========================================================================
    // 1. DADOS FICTÍCIOS (O "BANCO DE DADOS")
    // =========================================================================
    
    // --- CURSOS ---
    const DB_CURSOS = [
        { id: 10, nome: "Ciência da Computação" },
        { id: 11, nome: "Sistemas de Informação" },
        { id: 12, nome: "Engenharia de Software" },
        { id: 13, nome: "Direito" }
    ];

    // --- CATEGORIAS ---
    let DB_CATEGORIAS = [
        { id: 1, nome: "Cursos Extracurriculares" },
        { id: 2, nome: "Palestras e Eventos" },
        { id: 3, nome: "Estágio Não Obrigatório" },
        { id: 4, nome: "Pesquisa e Iniciação Científica" },
        { id: 5, nome: "Voluntariado" }
    ];

    // --- USUÁRIOS ---
    let DB_USUARIOS = [
        // 1. ALUNOS
        {
            id: 1,
            nome: "Aluno Exemplo da Silva",
            cpf: "123.456.789-00", 
            email: "aluno@teste.com",
            tipo: "ALUNO",
            matricula: "2023001",
            curso_id: 10,
            curso: DB_CURSOS[0],
            fase: 5,
            data_nascimento: "2000-01-01", 
            password_check: "01012000", // Senha = DDMMAAAA
            avatar_url: "https://i.pravatar.cc/150?u=1"
        },
        {
            id: 11,
            nome: "Maria Oliveira",
            cpf: "123.123.123-12", 
            email: "maria@teste.com",
            tipo: "ALUNO",
            matricula: "2023055",
            curso_id: 10,
            curso: DB_CURSOS[0],
            fase: 3,
            data_nascimento: "2001-05-12", 
            password_check: "12052001"
        },
        // 2. COORDENADORES
        {
            id: 2,
            nome: "Prof. Coordenador Souza",
            cpf: "111.111.111-11",
            email: "coord@teste.com",
            tipo: "COORDENADOR",
            matricula: "COORD99",
            curso_id: 10, 
            curso_coordenado: DB_CURSOS[0], 
            data_nascimento: "1980-05-20",
            password_check: "20051980",
            avatar_url: "https://i.pravatar.cc/150?u=2"
        },
        // 3. SECRETARIA
        {
            id: 3,
            nome: "Secretaria Geral",
            cpf: "222.222.222-22",
            email: "sec@teste.com",
            tipo: "SECRETARIA",
            matricula: "SEC001",
            data_nascimento: "1985-10-10",
            password_check: "10101985"
        },
        // 4. ADMIN
        {
            id: 4,
            nome: "Admin Sistema",
            cpf: "999.999.999-99",
            email: "admin@teste.com",
            tipo: "ADMINISTRADOR",
            matricula: "ADM001",
            password_check: "admin123"
        }
    ];

    // --- CERTIFICADOS ---
    let DB_CERTIFICADOS = [
        {
            id: 101,
            aluno_id: 1,
            aluno: DB_USUARIOS[0],
            categoria_id: 1,
            categoria: "Cursos Extracurriculares",
            nome_certificado: "Curso de Java Completo - Udemy",
            instituicao: "Udemy",
            carga_horaria_solicitada: 40,
            horas_validadas: 40,
            status: "APROVADO",
            observacao: "Certificado válido.",
            data_emissao: "2023-10-10",
            created_at: "2023-10-11T10:00:00",
            arquivo_url: "#"
        },
        {
            id: 102,
            aluno_id: 1,
            aluno: DB_USUARIOS[0],
            categoria_id: 2,
            categoria: "Palestras e Eventos",
            nome_certificado: "Semana Acadêmica 2023",
            instituicao: "Universidade",
            carga_horaria_solicitada: 20,
            horas_validadas: null,
            status: "ENTREGUE",
            observacao: null,
            data_emissao: "2023-11-05",
            created_at: "2023-11-06T14:30:00",
            arquivo_url: "#"
        }
    ];

    // --- CONFIGURAÇÕES ---
    let DB_CONFIG = {
        horas_minimas: 200,
        min_por_area: 20,
        max_por_area: 60,
        modo_manutencao: false
    };

    // =========================================================================
    // 2. INTERCEPTADOR DO FETCH
    // =========================================================================
    const originalFetch = window.fetch;

    window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input.url;
        const method = init?.method || 'GET';
        
        // Simula delay de rede
        await new Promise(r => setTimeout(r, 400));

        // Intercepta chamadas para a API (localhost:8000 ou /api/)
        if (url.includes('localhost:8000') || url.includes('/api/')) {
            console.log(`[MOCK API] ${method} ${url}`);
            
            try {
                // Parse do Body
                let reqBody = {};
                if (init && init.body) {
                    if (init.body instanceof FormData) {
                        // Converte FormData para objeto simples
                        init.body.forEach((value, key) => reqBody[key] = value);
                    } else if (typeof init.body === 'string') {
                        reqBody = JSON.parse(init.body);
                    }
                }

                const responseData = routeRequest(url, method, reqBody);
                
                return new Response(JSON.stringify(responseData), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            } catch (error) {
                console.error("Erro no Mock:", error);
                return new Response(JSON.stringify({ message: error.message || "Erro interno." }), {
                    status: error.status || 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        return originalFetch(input, init);
    };

    // =========================================================================
    // 3. ROTEAMENTO
    // =========================================================================
    function routeRequest(url, method, body) {
        // Separa o path da URL (ex: usuarios/1/progresso)
        const urlObj = new URL(url);
        const path = urlObj.pathname.replace('/api/', ''); 
        const params = urlObj.searchParams;

        // --- AUTH ---
        if (path === 'auth/login' && method === 'POST') {
            const user = DB_USUARIOS.find(u => u.cpf === body.cpf);
            if (user && body.password === user.password_check) {
                return { access_token: "mock-token", usuario: user };
            }
            throw { status: 401, message: "Credenciais inválidas." };
        }
        if (path === 'auth/logout') return { message: "Logout ok" };
        if (path === 'auth/change-password') return { message: "Senha alterada" };

        // --- CATEGORIAS ---
        if (path === 'categorias') {
            if (method === 'GET') return { data: DB_CATEGORIAS };
            if (method === 'POST') {
                const nova = { id: Date.now(), nome: body.nome };
                DB_CATEGORIAS.push(nova);
                return nova;
            }
        }
        // Delete Categoria
        if (path.match(/^categorias\/\d+$/) && method === 'DELETE') {
             const id = parseInt(path.split('/')[1]);
             DB_CATEGORIAS = DB_CATEGORIAS.filter(c => c.id !== id);
             return { message: "Deletado" };
        }

        // --- CURSOS ---
        if (path === 'cursos') return { data: DB_CURSOS };

        // --- CONFIGURAÇÕES ---
        if (path === 'configuracoes') {
            if (method === 'GET') return DB_CONFIG;
            if (method === 'PUT') {
                DB_CONFIG = { ...DB_CONFIG, ...body };
                return { ok: true };
            }
        }

        // --- CERTIFICADOS ---
        if (path === 'certificados') {
            // LISTAR
            if (method === 'GET') {
                let result = [...DB_CERTIFICADOS];
                if (params.get('aluno_id')) result = result.filter(c => c.aluno_id == params.get('aluno_id'));
                if (params.get('status')) result = result.filter(c => c.status === params.get('status'));
                return { data: result };
            }

            // CRIAR (Upload)
            if (method === 'POST') {
                const loggedUser = JSON.parse(localStorage.getItem('userData'));
                if (!loggedUser) throw { status: 401, message: "Sem usuário logado" };

                // Resolve o nome da categoria pelo ID enviado
                const catId = parseInt(body.categoria_id);
                const catObj = DB_CATEGORIAS.find(c => c.id === catId);
                
                const newCert = {
                    id: Date.now(),
                    aluno_id: loggedUser.id,
                    aluno: loggedUser,
                    categoria_id: catId,
                    categoria: catObj ? catObj.nome : "Outros", // Garante que o texto apareça no histórico
                    nome_certificado: body.nome_certificado,
                    instituicao: body.instituicao,
                    carga_horaria_solicitada: parseInt(body.carga_horaria_solicitada),
                    horas_validadas: null,
                    status: "ENTREGUE",
                    observacao: null,
                    data_emissao: body.data_emissao,
                    created_at: new Date().toISOString(),
                    arquivo_url: "#"
                };
                DB_CERTIFICADOS.push(newCert);
                return { message: "Sucesso", data: newCert };
            }
        }

        // --- AVALIAR CERTIFICADO ---
        const matchAvaliar = path.match(/^certificados\/(\d+)\/avaliar$/);
        if (matchAvaliar && method === 'PATCH') {
            const id = parseInt(matchAvaliar[1]);
            const cert = DB_CERTIFICADOS.find(c => c.id === id);
            if (!cert) throw { status: 404, message: "Não encontrado" };
            
            cert.status = body.status;
            cert.horas_validadas = body.horas_validadas;
            cert.observacao = body.observacao;
            return { message: "Avaliado", data: cert };
        }

        // --- USUÁRIOS ---
        if (path === 'usuarios') {
            if (method === 'GET') {
                let users = [...DB_USUARIOS];
                
                // Filtros
                if (params.get('tipo')) users = users.filter(u => u.tipo === params.get('tipo'));
                if (params.get('nome')) users = users.filter(u => u.nome.toLowerCase().includes(params.get('nome').toLowerCase()));
                if (params.get('matricula')) users = users.filter(u => u.matricula.includes(params.get('matricula')));
                if (params.get('curso_id')) users = users.filter(u => u.curso_id == params.get('curso_id'));
                if (params.get('fase')) users = users.filter(u => u.fase == params.get('fase'));

                // Adiciona contagem para Coordenador/Secretaria
                users = users.map(u => ({
                    ...u,
                    certificados_count: DB_CERTIFICADOS.filter(c => c.aluno_id === u.id).length
                }));
                
                return { data: users };
            }
            if (method === 'POST') {
                const newUser = { ...body, id: Date.now() };
                if (newUser.curso_id) newUser.curso = DB_CURSOS.find(c => c.id == newUser.curso_id);
                // Senha padrão se não vier
                if(!newUser.password_check && newUser.password) newUser.password_check = newUser.password;
                
                DB_USUARIOS.push(newUser);
                return newUser;
            }
        }

        // --- ROTA DE PROGRESSO (Onde as horas são somadas) ---
        const matchProgresso = path.match(/^usuarios\/(\d+)\/progresso$/);
        if (matchProgresso && method === 'GET') {
            const userId = parseInt(matchProgresso[1]);
            
            // Soma apenas aprovados
            const total = DB_CERTIFICADOS
                .filter(c => c.aluno_id === userId && ['APROVADO', 'APROVADO_COM_RESSALVAS'].includes(c.status))
                .reduce((acc, curr) => acc + (parseInt(curr.horas_validadas) || 0), 0);

            return {
                horas_necessarias: DB_CONFIG.horas_minimas,
                total_horas_aprovadas: total
            };
        }
        
        // --- AVATAR ---
        if (path === 'usuarios/avatar') return { avatar_url: `https://i.pravatar.cc/150?u=${Date.now()}` };

        // --- CRUD USUÁRIO ÚNICO (PUT/DELETE) ---
        const matchUser = path.match(/^usuarios\/(\d+)$/);
        if (matchUser) {
            const uid = parseInt(matchUser[1]);
            const idx = DB_USUARIOS.findIndex(u => u.id === uid);
            if (method === 'DELETE') {
                if(idx > -1) DB_USUARIOS.splice(idx, 1);
                return { message: "Deletado" };
            }
            if (method === 'PUT') {
                 if(idx > -1) {
                    DB_USUARIOS[idx] = { ...DB_USUARIOS[idx], ...body };
                    if (body.curso_id) DB_USUARIOS[idx].curso = DB_CURSOS.find(c => c.id == body.curso_id);
                    return DB_USUARIOS[idx];
                 }
            }
        }

        console.warn("Rota não encontrada no Mock:", path);
        return {};
    }
})();