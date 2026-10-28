# 11. Aprovações

**Quando usar:** para revisar mensagens geradas pela IA antes de sair — modo mais seguro no início.
**Pré-requisitos:** nenhum. Toda empresa nova já entra com aprovação humana **ativada por padrão**.

> **Padrão do sistema:** HITL (Human-in-the-Loop) vem **ligado** em todos os escopos — `first_message`, `sdr_reply`, `cadence_step` e `sensitive_action`. Enquanto estiver ligado, **nada é enviado pela IA** sem passar por esta tela. Para desligar (global ou por escopo), vá em **Configurações → Empresa → Aprovação humana**.

## O que é

Fila de mensagens que a IA gerou mas está segurando para revisão humana. Aparece um badge com contador no menu lateral. Cobre: primeira mensagem de cadência, respostas do SDR, passos seguintes de cadência e ações sensíveis (agendamento, cancelamento etc.).

## Passo a passo

1. Abra **Aprovações**. Cada card mostra: lead, canal, prévia da mensagem.
2. Você pode:
   - **Aprovar** → mensagem sai imediatamente.
   - **Editar e aprovar** → ajuste texto e libere.
   - **Rejeitar** → mensagem descartada, cadência pula para o próximo passo.
3. Existe também "Aprovar todas" para acelerar.

## Histórico de aprovações

A aba **Histórico** mostra só o que já foi processado (pendentes ficam apenas na fila).

- **Filtro de data:** De/Até ou atalhos Últimos 7 dias, Últimos 30 dias, Este mês e Todo o período.
- **Filtro de status:** Todos os processados, Aprovadas, Editadas e enviadas, Rejeitadas, Falhas de envio e Expiradas.
- **Páginas de 50 itens**, com o total exato. Nada é apagado — todo o histórico continua disponível.

## Dicas

- Nos **primeiros dias** aprove tudo manualmente para calibrar tom da IA.
- Se as mensagens estão consistentemente boas, mude a cadência para **Automático** com um limite diário (ex.: `auto_approve_max_per_day = 30`).
- Rejeições viram sinal para IA melhorar: sempre escreva uma anotação explicando por que rejeitou (opcional).
- Mensagens com o selo **Antiga** foram geradas há mais de 7 dias. Revise antes de aprovar, porque o contexto do lead pode ter mudado.
- Uma mensagem aprovada é sempre enviada, mesmo que o prazo da cadência já tenha passado. Se o envio não for possível, a aprovação aparece como **Falhou**, com o motivo.

**Próximo passo →** [12. Acompanhamento](./12-acompanhamento.md)
