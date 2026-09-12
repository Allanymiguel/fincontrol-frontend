import { Routes } from '@angular/router';
import { EstadoList } from './components/estados/estado-list/estado-list';
import { EstadoForm } from './components/estados/estado-form/estado-form';
import { estadoResolver } from './resolvers/estado-resolver';

export const routes: Routes = [
    {path: '', redirectTo: 'estados', pathMatch: 'full'},
    {path: 'estados', component: EstadoList, title: 'Lista de Estados',},
    {path: 'estados/new', component: EstadoForm, title: 'Novo Estado',},
    {path: 'estados/edit/:id', component: EstadoForm, title: 'Editar Estado', 
        resolve: { estado: estadoResolver }},

];
