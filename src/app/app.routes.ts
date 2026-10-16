import { Routes } from '@angular/router';
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

export const routes: Routes = [
    {path: '', redirectTo: 'transacoes', pathMatch: 'full'},
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

    // TODO: canActivate com guard de role ADMIN (Keycloak)
    {path: 'planos', component: PlanoList, title: 'Lista de Planos'},
    {path: 'planos/new', component: PlanoForm, title: 'Novo Plano'},
    {path: 'planos/edit/:id', component: PlanoForm, title: 'Editar Plano',
        resolve: { plano: planoResolver }},
];
