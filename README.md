# Leaderei

Plataforma de prospecção B2B com IA: importa leads, executa cadências por WhatsApp e e-mail, responde com um SDR de IA, agenda reuniões e sincroniza negócios com CRMs.

## Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui.
- Backend: Lovable Cloud (banco, autenticação, funções e storage).
- IA: gateway compartilhado (`supabase/functions/_shared/ai-gateway.ts`) com contingência só em créditos esgotados (HTTP 402).

## Módulos principais

- **Leads e listas** — importação CSV, Apollo, MunicipIA e Entrada do Pipedrive; proteção "Não prospectar".
- **Cadências** — passos de WhatsApp (Hook7) e e-mail (Gmail OAuth / domínio próprio), aprovação humana opcional.
- **Conversas e SDR de IA** — respostas, leitura de e-mail recebido a cada 5 min, agendamento (Cal.com).
- **CRMs** — Bitrix24 e Pipedrive: envio de mão única via fila + worker, sem regressão de etapa; Pipedrive com atividades, resumo e Entrada (Inbound).

## Documentação

- `AGENTS.md` — decisões técnicas e de arquitetura.
- `docs/manual/` — manual do usuário, na ordem de uso (`docs/manual/README.md`).
- `docs/patch-logs/` — notas de versão diárias (índice em `docs/patch-logs/README.md`).
- Versão atual: `src/lib/version.ts` (sempre "beta 0.X").

## Testes

`bunx vitest run` — testes de regras de servidor ficam em `tests/`.
