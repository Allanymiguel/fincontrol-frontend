import { Routes } from '@angular/router';
import { Login } from './components/auth/login/login';
import { TransacaoList } from './components/transacoes/transacao-list/transacao-list';
import { TransacaoForm } from './components/transacoes/transacao-form/transacao-form';
import { transacaoResolver } from './resolvers/transacao-resolver';
import { CategoriaList } from './components/categorias/categoria-list/categoria-list';
import { CategoriaForm } from './components/categorias/categoria-form/categoria-form';
import { categoriaResolver } from './resolvers/categoria-resolver';
import { ContatoList } from './components/contatos/contato-list/contato-list';
import { ContatoForm } from './components/contatos/contato-form/contato-form';
import { contatoResolver } from './resolvers/contato-resolver';
import { PlanoList } from './components/planos/plano-list/plano-list';
import { PlanoForm } from './components/planos/plano-form/plano-form';
import { planoResolver } from './resolvers/plano-resolver';
import { CupomList } from './components/cupons/cupom-list/cupom-list';
import { CupomForm } from './components/cupons/cupom-form/cupom-form';
import { cupomResolver } from './resolvers/cupom-resolver';
import { CategoriaPadraoList } from './components/categorias-padrao/categoria-padrao-list/categoria-padrao-list';
import { CategoriaPadraoForm } from './components/categorias-padrao/categoria-padrao-form/categoria-padrao-form';
import { categoriaPadraoResolver } from './resolvers/categoria-padrao-resolver';
import { ParametroFiscalList } from './components/parametros-fiscais/parametro-fiscal-list/parametro-fiscal-list';
import { ParametroFiscalForm } from './components/parametros-fiscais/parametro-fiscal-form/parametro-fiscal-form';
import { parametroFiscalResolver } from './resolvers/parametro-fiscal-resolver';
import { FaixaIrpfList } from './components/faixas-irpf/faixa-irpf-list/faixa-irpf-list';
import { FaixaIrpfForm } from './components/faixas-irpf/faixa-irpf-form/faixa-irpf-form';
import { faixaIrpfResolver } from './resolvers/faixa-irpf-resolver';
import { UsuarioList } from './components/usuarios/usuario-list/usuario-list';

export const routes: Routes = [
    {path: 'login', component: Login, title: 'Entrar'},
    {path: '', redirectTo: 'transacoes', pathMatch: 'full'},

    // ===== Operacional (futuro client) =====
    // TODO: canActivate com guard de usuario autenticado (Keycloak)
    {path: 'transacoes', component: TransacaoList, title: 'Lista de Transações'},
    {path: 'transacoes/new', component: TransacaoForm, title: 'Nova Transação'},
    {path: 'transacoes/edit/:id', component: TransacaoForm, title: 'Editar Transação',
        resolve: { transacao: transacaoResolver }},

    {path: 'categorias', component: CategoriaList, title: 'Lista de Categorias'},
    {path: 'categorias/new', component: CategoriaForm, title: 'Nova Categoria'},
    {path: 'categorias/edit/:id', component: CategoriaForm, title: 'Editar Categoria',
        resolve: { categoria: categoriaResolver }},

    {path: 'contatos', component: ContatoList, title: 'Lista de Contatos'},
    {path: 'contatos/new', component: ContatoForm, title: 'Novo Contato'},
    {path: 'contatos/edit/:id', component: ContatoForm, title: 'Editar Contato',
        resolve: { contato: contatoResolver }},

    // ===== Admin =====
    // TODO: canActivate com guard de role ADMIN (Keycloak) em todas as rotas abaixo
    {path: 'planos', component: PlanoList, title: 'Lista de Planos'},
    {path: 'planos/new', component: PlanoForm, title: 'Novo Plano'},
    {path: 'planos/edit/:id', component: PlanoForm, title: 'Editar Plano',
        resolve: { plano: planoResolver }},

    {path: 'cupons', component: CupomList, title: 'Lista de Cupons'},
    {path: 'cupons/new', component: CupomForm, title: 'Novo Cupom'},
    {path: 'cupons/edit/:id', component: CupomForm, title: 'Editar Cupom',
        resolve: { cupom: cupomResolver }},

    {path: 'categorias-padrao', component: CategoriaPadraoList, title: 'Lista de Categorias Padrão'},
    {path: 'categorias-padrao/new', component: CategoriaPadraoForm, title: 'Nova Categoria Padrão'},
    {path: 'categorias-padrao/edit/:id', component: CategoriaPadraoForm, title: 'Editar Categoria Padrão',
        resolve: { categoriaPadrao: categoriaPadraoResolver }},

    {path: 'parametros-fiscais', component: ParametroFiscalList, title: 'Lista de Parâmetros Fiscais'},
    {path: 'parametros-fiscais/new', component: ParametroFiscalForm, title: 'Novo Parâmetro Fiscal'},
    {path: 'parametros-fiscais/edit/:id', component: ParametroFiscalForm, title: 'Editar Parâmetro Fiscal',
        resolve: { parametroFiscal: parametroFiscalResolver }},

    {path: 'faixas-irpf', component: FaixaIrpfList, title: 'Lista de Faixas IRPF'},
    {path: 'faixas-irpf/new', component: FaixaIrpfForm, title: 'Nova Faixa IRPF'},
    {path: 'faixas-irpf/edit/:id', component: FaixaIrpfForm, title: 'Editar Faixa IRPF',
        resolve: { faixaIrpf: faixaIrpfResolver }},

    {path: 'usuarios', component: UsuarioList, title: 'Lista de Usuários'},
];
