# 03d. Pipedrive (opcional)

**Quando usar:** seu time comercial trabalha no Pipedrive e você quer que os negócios dos leads abordados pela Leaderei apareçam, avancem e tenham o histórico registrado no seu funil — ou que leads criados no Pipedrive entrem sozinhos numa cadência.
**Pré-requisitos:** conta Pipedrive com permissão para gerar **API token** (para a Entrada, também permissão para criar **Automações**).

## O que é

A integração tem três abas dentro do mesmo card:

- **Envio de negócios (automático):** quando a Leaderei aborda um lead, cria Pessoa, Organização e Negócio no Pipedrive, avança a etapa e registra as atividades.
- **Entrada (Inbound):** negócios criados numa etapa escolhida do Pipedrive viram leads na Leaderei e entram direto numa cadência.
- **Importar contatos (manual):** traz as pessoas do Pipedrive para a sua lista de Leads, só quando você clica no botão.

**Não é obrigatório.** Se você não usa Pipedrive, pule este passo.

## Passo 0 — Conectar o token (obrigatório antes de tudo)

Enquanto o token não estiver conectado, **as três abas ficam ocultas**.

1. No Pipedrive, clique na **sua foto/inicial** → **Preferências pessoais → API** e copie o **API token**.
2. Na Leaderei: **Configurações → Integrações → Pipedrive → Configurar**, cole o token e clique **Conectar**.
3. Com o status **Conectado**, as abas são liberadas.

## 1. Envio de negócios

1. Ligue **Enviar negócios automaticamente**.
2. Escolha o **Funil** e, se quiser, o **Dono do negócio**.
3. Escolha as etapas:
   - **Ao abordar o lead** (obrigatória) — onde o negócio nasce.
   - **Quando o lead responde** — primeira resposta por WhatsApp ou e-mail.
   - **Quando agenda reunião**.
   - **No atendimento humano**.
   Etapa em "Não mover" é ignorada.
4. Opcional: no **De/para**, escolha onde guardar cargo, site, origem, score etc.
5. Clique **Salvar**.

### O que aparece no cartão do negócio

- **Atividades concluídas** por canal, agrupadas para não lotar a linha do tempo — ex.: "WhatsApp: 2 mensagens enviadas pela Leaderei", "E-mail: resposta do lead", com trecho da última mensagem.
- **Reunião agendada** entra como atividade **pendente** na agenda do dono do negócio, no dia e horário marcados.
- **Nota fixada "Resumo Leaderei"** quando o lead chega em reunião ou atendimento humano: quantidade de mensagens de WhatsApp e e-mail enviadas e recebidas, tempo até a primeira resposta, resumo da conversa e link para a conversa completa na Leaderei.

O canal aparece sempre como **WhatsApp** ou **E-mail**.

## 2. Entrada (Inbound)

1. Na aba **Entrada (Inbound)**, ligue **Receber leads do Pipedrive**.
2. Escolha a **Cadência de destino**.
3. Copie o **Endereço para a automação** e clique **Salvar**. (O botão de gerar novo endereço invalida o anterior.)
4. No Pipedrive: **Automações → + Automação**
   - Gatilho: **Negócio criado** (ou **Negócio atualizado**, se os negócios são movidos de outra etapa).
   - Condições: **Funil** = seu funil e **Etapa** = a etapa de entrada.
   - Ação: **Webhook**, método **POST**, colando o endereço copiado, com o conteúdo `{"deal_id": [ID do negócio]}` (use o seletor de campos para inserir o ID).
   - Salve e ative.

Ao receber o aviso, a Leaderei busca o negócio, cria (ou reaproveita) o lead, vincula ao **mesmo cartão** — assim as atividades e o resumo depois caem nele — e inscreve na cadência. Organizações em "Não prospectar" são bloqueadas. Um negócio já vinculado não gera lead duplicado.

## 3. Importar contatos (quando quiser)

Na aba **Importar contatos**, clique **Importar contatos agora**.

## Regras importantes

- **O negócio só avança, nunca volta.**
- **Sem duplicar:** pessoa já existente (mesmo e-mail ou telefone) é reaproveitada; só campos vazios são preenchidos.
- **Organizações em "Não prospectar"** nunca são enviadas nem recebidas.
- **Nada é apagado** no Pipedrive. Mudanças de etapa feitas no Pipedrive não voltam para a Leaderei.
- O negócio é criado quando qualquer mensagem da cadência sai com sucesso (WhatsApp ou e-mail), normalmente em até 2 minutos.

## Acompanhamento

No fim da aba aparecem: negócios enviados, itens na fila, falhas e o último aviso. Se o Pipedrive ficar instável, a Leaderei tenta de novo sozinha (até 5 vezes). O botão **Tentar falhas novamente** recoloca na fila o que falhou ou foi pulado.
