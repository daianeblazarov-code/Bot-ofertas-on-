# Bot de Ofertas Esportivas — WhatsApp

Bot automatizado que busca ofertas de produtos esportivos no Pelando.com.br e gera posts prontos para grupos de WhatsApp, com links de afiliado do Mercado Livre e Shopee.

---

## Índice

- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Como usar](#como-usar)
- [Comandos disponíveis](#comandos-disponíveis)
- [Histórico de ofertas](#histórico-de-ofertas)
- [Pilares de busca](#pilares-de-busca)
- [Plataformas suportadas](#plataformas-suportadas)

---

## Requisitos

- **Node.js** versão 18 ou superior — baixe em [nodejs.org](https://nodejs.org) (versão LTS)
- Conta no **Mercado Livre Afiliados** e/ou **Shopee Afiliados**

---

## Instalação

```bash
git clone <repo>
cd Bot-ofertas-on-
npm install
```

---

## Configuração

Crie (ou edite) o arquivo `.env` na raiz do projeto:

```env
# Mercado Livre — obrigatório para processar ofertas do ML
MERCADOLIVRE_TAG=seu_tag_aqui

# Shopee — obrigatório para processar ofertas da Shopee
SHOPEE_AFFILIATE_TOKEN=seu_token_aqui
SHOPEE_AFFILIATE_ID=seu_id_aqui

# Agendador — horários de execução no padrão cron (padrão: 8h, 12h e 18h)
BOT_HORARIOS=0 8,12,18 * * *
```

### Onde encontrar cada credencial?

**Mercado Livre**
1. Acesse [afiliados.mercadolivre.com.br](https://afiliados.mercadolivre.com.br)
2. Sua **tag** (ex: `seunome-20`) aparece no seu perfil de afiliado
3. Cole o valor em `MERCADOLIVRE_TAG`

**Shopee**
1. Acesse o painel de afiliados da Shopee
2. Vá em **API Keys** e copie o token e o ID
3. Cole em `SHOPEE_AFFILIATE_TOKEN` e `SHOPEE_AFFILIATE_ID`

> Amazon e Netshoes não são suportadas (sem API pública de link curto).

---

## Como usar

### Execução manual

```bash
npm start
```

O bot vai:
1. Buscar ofertas no Pelando.com.br (feed de mais quentes + 34 termos específicos)
2. Filtrar por palavras-chave esportivas, plataforma configurada e desconto ≥ 10%
3. Classificar por pilar e ordenar por maior desconto
4. Gerar links de afiliado
5. Exibir os posts formatados no terminal
6. Salvar `posts_whatsapp.txt` (por pilar) e `ofertas.json`
7. Perguntar se deseja marcar as ofertas como Enviado na planilha

Ao final você verá:
```
❓ Marcar todos como Enviado? (s/n):
```
- `s` → registra como **Enviado** no `historico.xlsx`
- `n` → mantém como **Pendente** e reaparece na próxima execução

### Modo agendado

```bash
npm run agendar
```

Executa o bot imediatamente e depois nos horários definidos em `BOT_HORARIOS` (padrão: 8h, 12h e 18h, fuso de Brasília). Para encerrar: `Ctrl+C`.

---

## Comandos disponíveis

| Comando | O que faz |
|---------|-----------|
| `npm start` | Busca ofertas e gera posts (execução única) |
| `npm run agendar` | Modo agendado — executa nos horários configurados |
| `npm run historico` | Mostra resumo da planilha (enviadas, pendentes, ignoradas) |
| `npm run resetar` | Recria `historico.xlsx` vazio para começar do zero |
| `npm run debug` | Igual ao `start`, mas exibe stack trace completo em erros |

---

## Histórico de ofertas

Cada oferta passa por um ciclo de vida controlado pela planilha `historico.xlsx`:

| Status | Cor | Comportamento |
|--------|-----|---------------|
| **Pendente** | Amarelo | Gerado, ainda não postado. Reaparece na próxima execução. |
| **Enviado** | Verde | Confirmado como postado. Não reaparece por 30 dias. |
| **Ignorado** | Vermelho | Nunca é exibido novamente. Defina manualmente na planilha. |

### Colunas da planilha

| Coluna | Descrição |
|--------|-----------|
| Data/Hora | Quando a oferta foi processada |
| Pilar | Corrida, Academia & Fitness ou Complementos |
| Nome do Produto | Título completo |
| Preço | Preço promocional |
| % Desconto | Percentual de desconto |
| Link | Link de afiliado gerado |
| Status | Pendente / Enviado / Ignorado |

---

## Pilares de busca

As ofertas são classificadas em 3 pilares e ordenadas por **maior desconto** dentro de cada um:

### 🏃 Pilar 1 — Corrida
Tênis de corrida, trail, meias, cintos de hidratação, viseiras, relógios GPS

### 🏋️ Pilar 2 — Academia & Fitness
Whey protein, creatina, leggings, tops fitness, shorts, camisetas dry-fit, smartbands

### 🏋️ Pilar 3 — Complementos
Pré-treino, BCAA, tapetes de yoga/pilates, shakers, coqueteleiras

### Estrutura dos posts gerados

```
🏃 *Nome do Produto*
SLOGAN AUTOMÁTICO POR CATEGORIA ✨

💸 De: R$ 199,99
⚡ Por: R$ 149,99 (25% OFF)

🔗 👇 Link para Comprar 👇
https://link-de-afiliado
```

---

## Plataformas suportadas

| Plataforma | Suporte | Configuração necessária |
|------------|---------|------------------------|
| Mercado Livre | ✅ Link de rastreamento com tag | `MERCADOLIVRE_TAG` |
| Shopee | ✅ Link curto via API (`shope.ee`) | `SHOPEE_AFFILIATE_TOKEN` + `SHOPEE_AFFILIATE_ID` |
| Amazon | ⛔ Sem API pública — sempre ignorada | — |
| Netshoes | ⛔ Sem link curto oficial — sempre ignorada | — |

---

## Estrutura do projeto

```
index.js        — orquestrador principal e CLI
scraper.js      — busca ofertas na API do Pelando
filtro.js       — filtra por esporte, plataforma e desconto; classifica por pilar
formatador.js   — formata posts com slogans por categoria
afiliados.js    — gera links de afiliado (ML e Shopee)
historico.js    — controle de histórico via planilha Excel (ExcelJS)
agendador.js    — agendamento automático com node-cron
auth.js         — fluxo OAuth do Mercado Livre (uso avançado)
```
