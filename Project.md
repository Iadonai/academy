# Iadonai Academy — Documento de Definicao do Projeto

## 1. Visao Geral

**Nome:** Iadonai Academy  
**Tipo:** Plataforma de aprendizado online (similar ao Skool)  
**Objetivo:** Vender e entregar cursos em video com comunidade, gamificacao e pagamentos integrados.  
**Publico-alvo:** Pessoas nao-programadoras que gostam de tecnologia — linguagem simples, UX intuitiva.  
**Plataformas:** Web + Mobile (iOS e Android)  
**Status:** Inicio do desenvolvimento (do zero)

---

## 2. Problema que Resolve

Criadores de conteudo precisam de uma plataforma propria para vender cursos e engajar alunos, sem depender de marketplaces como Hotmart ou Udemy. A Iadonai Academy oferece controle total sobre o conteudo, comunidade e experiencia do aluno.

---

## 3. Funcionalidades

### 3.1 Autenticacao
- Cadastro com email e senha
- Login com Google (OAuth)
- Recuperacao de senha por email
- Perfil do aluno: foto, nome, bio, pontos, nivel

### 3.2 Cursos
- Estrutura: **Curso > Modulos > Aulas**
- Videos hospedados no YouTube (embed — aluno nao sai da plataforma)
- Thumbnail e descricao por curso
- Progresso por aula (assistida / nao assistida)
- Somente o admin publica e gerencia conteudo

### 3.3 Controle de Acesso
- **Compra avulsa:** acesso permanente a um curso especifico
- **Assinatura mensal:** acesso a todos os cursos da plataforma
- Acesso verificado sempre no backend

### 3.4 Pagamentos (Kiwify)
- Kiwify processa o pagamento (cartao, PIX, boleto)
- Apos confirmacao, Kiwify envia webhook para a plataforma
- Backend valida o webhook (assinatura secreta) e libera o acesso automaticamente
- Cancelamento de assinatura revoga o acesso

### 3.5 Gamificacao
| Elemento | Descricao |
|---|---|
| Pontos (XP) | Acumulados por acoes na plataforma |
| Niveis | Progressao baseada em XP total |
| Badges | Conquistas desbloqueadas por marcos |
| Ranking | Classificacao geral de todos os alunos |

**Acoes que geram pontos:**
- Assistir aula completa
- Completar modulo
- Completar curso
- Comentar em uma aula
- Login diario (uma vez por dia)

### 3.6 Painel Admin
- Gerenciar cursos, modulos e aulas
- Ver alunos e seus acessos
- Ver metricas: total de alunos, cursos mais assistidos, receita

---

## 4. Stack Tecnologica

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend Web | Next.js 14 (App Router) + TypeScript | Performance, SEO, fullstack |
| Estilizacao | Tailwind CSS + shadcn/ui | Rapido e consistente |
| Mobile | React Native + Expo | Compartilha logica com o web |
| Backend | Next.js API Routes | Integrado, sem servidor separado |
| Banco de dados | Supabase (PostgreSQL) | Gerenciado, auth e storage inclusos |
| ORM | Prisma | Type-safe, migrações simples |
| Autenticacao | Supabase Auth | Email/senha + Google OAuth nativo |
| Storage | Supabase Storage | Thumbnails e avatares |
| Pagamentos | Kiwify (webhooks) | Plataforma brasileira, PIX nativo |
| Videos | YouTube IFrame API | Hospedagem gratuita e confiavel |

---

## 5. Modelo de Dados (Resumo)

```
User
  - id, name, email, avatar_url
  - role: STUDENT | ADMIN
  - xp_total, level, created_at

Course
  - id, title, description, thumbnail_url, price
  - is_subscription_only

Module
  - id, course_id, title, order

Lesson
  - id, module_id, title, youtube_url, order

LessonProgress
  - user_id, lesson_id, completed_at

CourseAccess
  - user_id, course_id, type: PURCHASE | SUBSCRIPTION, expires_at

Subscription
  - user_id, kiwify_subscription_id, status, expires_at

GamificationLog
  - user_id, action, xp_earned, created_at

Badge
  - id, name, description, icon_url, condition

UserBadge
  - user_id, badge_id, earned_at
```

---

## 6. Fluxo de Pagamento

```
Aluno clica em "Comprar" 
  → Redirecionado para pagina de checkout da Kiwify
  → Kiwify processa o pagamento
  → Kiwify envia POST webhook para /api/webhooks/kiwify
  → Backend valida assinatura do webhook
  → Backend cria registro em CourseAccess ou Subscription
  → Aluno recebe acesso imediatamente
```

---

## 7. Regras de Negocio

1. Acesso a aulas e verificado no backend a cada requisicao — nunca so no frontend.
2. Webhooks da Kiwify sao validados por assinatura HMAC antes de processar.
3. Pontos de gamificacao sao concedidos no maximo uma vez por acao por dia.
4. Cancelamento de assinatura revoga acesso ao fim do periodo pago.
5. Videos nao podem ser baixados — apenas embed do YouTube.
6. Somente usuarios com role ADMIN podem criar/editar/excluir conteudo.

---

## 8. Estrutura de Pastas (Web)

```
iadonai-academy/
  src/
    app/
      (auth)/           # Login, cadastro, recuperacao de senha
      (dashboard)/      # Area do aluno logado
        cursos/         # Listagem e consumo de cursos
        perfil/         # Perfil e conquistas
        ranking/        # Ranking de alunos
      admin/            # Painel administrativo
      api/
        webhooks/       # Webhook da Kiwify
        cursos/         # CRUD de cursos
        progresso/      # Registro de progresso
        gamificacao/    # Concessao de pontos
    components/
      ui/               # Componentes shadcn/ui
      course/           # Componentes de curso
      gamification/     # Componentes de gamificacao
    lib/
      supabase/         # Cliente Supabase
      utils.ts          # Funcoes utilitarias
    services/
      kiwify.ts         # Validacao de webhooks
      youtube.ts        # Helpers do YouTube
    hooks/              # React hooks customizados
    types/              # Tipos TypeScript globais
  prisma/
    schema.prisma       # Schema do banco
  Project.md            # Este documento
  CLAUDE.md             # Diretrizes para o Claude Code
```

---

## 9. Proximos Passos

- [ ] Configurar projeto Next.js (feito)
- [ ] Configurar Supabase (criar projeto, obter chaves)
- [ ] Configurar Prisma com Supabase
- [ ] Implementar autenticacao (Supabase Auth)
- [ ] Criar schema do banco de dados
- [ ] Implementar CRUD de cursos (admin)
- [ ] Implementar player de video (YouTube embed)
- [ ] Implementar controle de acesso
- [ ] Implementar webhook da Kiwify
- [ ] Implementar gamificacao
- [ ] Implementar ranking
- [ ] Configurar projeto mobile (Expo)

---

## 10. O que NAO fazer

- Nao expor chaves de API ou secrets no frontend ou no repositorio
- Nao liberar acesso a conteudo sem validacao no backend
- Nao usar jargao tecnico na interface voltada ao aluno
- Nao redirecionar o aluno para o YouTube ao assistir aulas
- Nao processar webhook sem validar a assinatura da Kiwify
