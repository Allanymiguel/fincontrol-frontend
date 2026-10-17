import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiProblem } from '../../../models/api-problem.model';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioResumo } from '../../../models/usuario-resumo.model';
import { UsuarioService } from '../../../services/usuario.service';
import { formatarDocumento } from '../../../utils/documento';
import { ConfirmacaoService } from '../../../services/confirmacao.service';

// Detalhe de um usuario para o admin, sem invadir os dados pessoais: perfil, assinaturas e
// apenas QUANTIDADES de transacoes/categorias/contatos (o conteudo nunca vem do back).
@Component({
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  selector: 'app-usuario-detalhe',
  styleUrl: './usuario-detalhe.css',
  templateUrl: './usuario-detalhe.html',
})
export class UsuarioDetalhe implements OnInit {
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly usuarioService = inject(UsuarioService);
  private readonly snack = inject(MatSnackBar);

  readonly resumo = signal<UsuarioResumo | null>(null);
  readonly alterando = signal(false);
  readonly colunasHistorico = ['data', 'plano', 'valor', 'forma', 'status'];
  readonly formatarDocumento = formatarDocumento;

  // ate duas iniciais do nome, para o avatar
  readonly iniciais = computed(() => {
    const partes = (this.resumo()?.usuario.nome ?? '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (partes[0][0] + ultima).toUpperCase();
  });

  ngOnInit(): void {
    this.resumo.set(this.activatedRoute.snapshot.data['resumo'] as UsuarioResumo);
  }

  async alternarAtivo(): Promise<void> {
    const resumo = this.resumo();
    if (!resumo) return;

    const usuario = resumo.usuario;
    const acao = usuario.ativo ? 'desativar' : 'ativar';
    if (!(await this.confirmacao.confirmar({
      titulo: usuario.ativo ? 'Desativar conta' : 'Ativar conta',
      mensagem: usuario.ativo
        ? `Deseja desativar a conta de ${usuario.nome}? A pessoa não conseguirá mais entrar.`
        : `Deseja ativar a conta de ${usuario.nome}?`,
      confirmar: usuario.ativo ? 'Desativar' : 'Ativar',
      perigo: usuario.ativo,
    }))) return;

    this.alterando.set(true);
    this.usuarioService.alternarAtivo(usuario.id).subscribe({
      next: (atualizado: Usuario) => {
        this.alterando.set(false);
        this.resumo.set({ ...resumo, usuario: atualizado });
        this.exibirMensagem(`${atualizado.nome} ${atualizado.ativo ? 'ativado' : 'desativado'}.`);
      },
      error: (error: HttpErrorResponse) => {
        this.alterando.set(false);
        // ex.: "Você não pode desativar a própria conta."
        const problem = error.error as ApiProblem | null;
        this.exibirMensagem(problem?.errors?.[0]?.message ?? problem?.detail ?? 'Erro ao alterar o usuário.');
        console.error('Erro ao ativar/desativar usuário:', error);
      },
    });
  }

  voltar(): void {
    this.location.back();
  }

  private exibirMensagem(mensagem: string): void {
    this.snack.open(mensagem, 'Ok', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
