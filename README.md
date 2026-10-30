# FinControl — front-end

Interface do FinControl (Tópicos II, UNITINS): Angular 22 com Angular Material.

## Requisitos

| O quê | Versão |
|---|---|
| Node.js | **22.22.3 ou mais novo** (exigência do Angular CLI 22) |
| Back-end | rodando em `http://localhost:8080` (veja o README do `fincontrol-backend`) |
| Keycloak | rodando em `http://localhost:8180` (`docker compose up -d` no back-end) |

## Como subir

```bash
npm ci
npx ng serve
```

Abra <http://localhost:4200> e entre com `admin@fincontrol.com` / `admin12345`. O admin cai no **Painel**.

## Área administrativa (menu "Admin")

| Tela | O que faz |
|---|---|
| Painel | MRR, receita do mês, receita em risco, novos cadastros e conversão; receita, assinantes e evolução por plano (com a fórmula de cada indicador) |
| Usuários | filtros (situação, cadastro incompleto, troca ou cancelamento agendado), exportar CSV, resumo com linha do tempo, encerrar sessões, simular recusa da cobrança, estornar pagamento |
| Cobranças | "a cobrança de ontem rodou?", dias sem a automática, histórico com falhas e recusas em destaque, rodar agora ("cobrar até" uma data) |
| Pagamentos | todos os pagamentos com filtros (período, plano, forma, situação, nome ou e-mail), totais por situação e estorno com motivo |
| Planos, Cupons, Categorias Padrão, Parâmetros Fiscais, Faixas IRPF | cadastros do FinControl |
| Base de CEPs | revisão, verificação, revalidação com o ViaCEP, importação CSV, interruptor da consulta externa e log de consultas |
| Auditoria | quem fez o quê e quando, com o "antes e depois" (somente leitura) |

O endereço do **cadastro completo de cliente** (Criar conta e formulário do admin) usa o componente
`endereco-cliente`, ligado à base própria de CEPs. O formulário de **contatos** continua com o `CepService`.

## Testes e build

```bash
npx ng test --watch=false
npx ng build
```
