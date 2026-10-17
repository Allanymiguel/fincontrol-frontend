import { DatePipe, DecimalPipe, Location, formatDate } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiProblem } from '../../../models/api-problem.model';
import {
  EFEITO_AGENDADO,
  EFEITO_DESFAZ_AGENDAMENTO,
  TrocaPlanoResultado,
} from '../../../models/assinatura.model';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioResumo } from '../../../models/usuario-resumo.model';
import { AssinaturaService } from '../../../services/assinatura.service';
import { UsuarioService } from '../../../services/usuario.service';
import { formatarDocumento } from '../../../utils/documento';
import { ConfirmacaoService } from '../../../services/confirmacao.service';
import { DadosTrocaPlano, TrocaPlanoDialog } from '../troca-plano-dialog/troca-plano-dialog';

// Detalhe de um usuario para o admin, sem invadir os dados pessoais: perfil, assinatura, pagamentos e
// apenas QUANTIDADES de transacoes/categorias/contatos (o conteudo nunca vem do back).
// Aqui o admin tambem gerencia a assinatura (RN16): trocar plano, cancelar o plano pago,
// desfazer a troca agendada e anotar observacoes.
@Component({
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
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
  private readonly dialog = inject(MatDialog);
  private readonly assinaturaService = inject(AssinaturaService);

  readonly resumo = signal<UsuarioResumo | null>(null);
  readonly alterando = signal(false);
  readonly colunasHistorico = ['data', 'plano', 'valor', 'forma', 'status'];
  readonly formatarDocumento = formatarDocumento;
  readonly observacao = new FormControl<string>('', { nonNullable: true });
  readonly salvandoObservacao = signal(false);

  // o Gratuito ja e o plano vigente ou ja esta agendado: nao ha plano pago a cancelar
  readonly podeCancelar = computed(() => {
    const assinatura = this.resumo()?.assinatura;
    if (!assinatura?.dataProximaCobranca) return false;
    return !assinatura.trocaAgendada || assinatura.trocaAgendada.valor > 0;
  });

  // ate duas iniciais do nome, para o avatar
  readonly iniciais = computed(() => {
    const partes = (this.resumo()?.usuario.nome ?? '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (partes[0][0] + ultima).toUpperCase();
  });

  ngOnInit(): void {
    this.definirResumo(this.activatedRoute.snapshot.data['resumo'] as UsuarioResumo);
  }

  trocarPlano(): void {
    const assinatura = this.resumo()?.assinatura;
    if (!assinatura) return;

    this.dialog
      .open<TrocaPlanoDialog, DadosTrocaPlano, TrocaPlanoResultado>(TrocaPlanoDialog, {
        data: { assinatura },
        width: '600px',
        maxWidth: 'calc(100vw - 32px)',
        autoFocus: 'dialog',
      })
      .afterClosed()
      .subscribe((resultado) => {
        if (!resultado) return;
        this.exibirMensagem(this.mensagemDaTroca(resultado));
        this.recarregar();
      });
  }

  async cancelarPlanoPago(): Promise<void> {
    const assinatura = this.resumo()?.assinatura;
    if (!assinatura?.dataProximaCobranca) return;

    const data = this.formatar(assinatura.dataProximaCobranca);
    const ok = await this.confirmacao.confirmar({
      titulo: 'Cancelar plano pago',
      mensagem: `${assinatura.nomeUsuario} continua no ${assinatura.nomePlano} até ${data} e depois volta ao `
        + 'plano Gratuito, sem nova cobrança. Continuar?',
      confirmar: 'Cancelar plano',
      perigo: true,
    });
    if (!ok) return;

    this.assinaturaService.cancelarPlanoPago(assinatura.idUsuario).subscribe({
      next: () => {
        this.exibirMensagem(`Cancelado: em ${data} ${assinatura.nomeUsuario} volta ao plano Gratuito.`);
        this.recarregar();
      },
      error: (error: HttpErrorResponse) => this.exibirErro(error, 'Erro ao cancelar o plano.'),
    });
  }

  desfazerTroca(): void {
    const assinatura = this.resumo()?.assinatura;
    if (!assinatura) return;

    this.assinaturaService.desfazerTroca(assinatura.idUsuario).subscribe({
      next: () => {
        this.exibirMensagem(`Troca desfeita: ${assinatura.nomeUsuario} continua no ${assinatura.nomePlano}.`);
        this.recarregar();
      },
      error: (error: HttpErrorResponse) => this.exibirErro(error, 'Erro ao desfazer a troca.'),
    });
  }

  salvarObservacao(): void {
    const assinatura = this.resumo()?.assinatura;
    if (!assinatura) return;

    this.salvandoObservacao.set(true);
    this.assinaturaService.salvarObservacao(assinatura.idUsuario, this.observacao.value).subscribe({
      next: () => {
        this.salvandoObservacao.set(false);
        this.exibirMensagem('Observação salva.');
        this.recarregar();
      },
      error: (error: HttpErrorResponse) => {
        this.salvandoObservacao.set(false);
        this.exibirErro(error, 'Erro ao salvar a observação.');
      },
    });
  }

  private mensagemDaTroca(resultado: TrocaPlanoResultado): string {
    const plano = resultado.assinatura.nomePlano;
    switch (resultado.efeito.id) {
      case EFEITO_AGENDADO:
        return `Troca para ${resultado.assinatura.trocaAgendada?.nomePlano} agendada para `
          + `${this.formatar(resultado.dataProximaCobranca)}.`;
      case EFEITO_DESFAZ_AGENDAMENTO:
        return `Troca desfeita: continua no ${plano}.`;
      default:
        return resultado.dataProximaCobranca
          ? `Plano trocado para ${plano}. Próxima cobrança em ${this.formatar(resultado.dataProximaCobranca)}.`
          : `Plano trocado para ${plano}.`;
    }
  }

  // busca de novo o resumo: a troca pode ter gerado pagamento e mudado a proxima cobranca
  private recarregar(): void {
    const id = this.resumo()?.usuario.id;
    if (id == null) return;

    this.usuarioService.buscarResumo(id).subscribe({
      next: (resumo) => this.definirResumo(resumo),
      error: (error: unknown) => console.error('Erro ao recarregar o resumo:', error),
    });
  }

  private definirResumo(resumo: UsuarioResumo): void {
    this.resumo.set(resumo);
    this.observacao.setValue(resumo.assinatura?.observacao ?? '');
    this.observacao.markAsPristine();
  }

  private formatar(data: string | null): string {
    return data ? formatDate(data, 'dd/MM/yyyy', 'pt-BR') : '';
  }

  private exibirErro(error: HttpErrorResponse, padrao: string): void {
    const problem = error.error as ApiProblem | null;
    this.exibirMensagem(problem?.errors?.[0]?.message ?? problem?.detail ?? padrao);
    console.error(padrao, error);
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
