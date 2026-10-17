import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { ApiProblem } from '../../../models/api-problem.model';
import { PAPEIS, Papel } from '../../../models/papel';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioService } from '../../../services/usuario.service';
import {
  MENSAGENS_CADASTRO,
  camposCompletos,
  dadosCompletos,
  definirCompleto,
  documentoDoPerfil,
  senhasIguais,
} from '../../../utils/cadastro';
import { aplicarErrosDaApi, limparErrosDaApi, mensagemDeErro } from '../../../utils/form-errors';
import { DadosCompletos } from '../../cadastro/dados-completos/dados-completos';

// Criacao e edicao de usuario pelo admin. Criar: papel (Cliente/Administrador) e a forma do
// cadastro (simples = so o acesso; completo = tambem dados fiscais e endereco). Editar: papel e
// senha nao mudam; um cadastro simples pode ser completado, um completo continua completo.
@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    DadosCompletos,
  ],
  selector: 'app-usuario-form',
  styleUrl: './usuario-form.css',
  templateUrl: './usuario-form.html',
})
export class UsuarioForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly usuarioService = inject(UsuarioService);
  private readonly snack = inject(MatSnackBar);

  readonly papeis: Papel[] = PAPEIS;
  // na edicao: o usuario como esta salvo
  readonly usuario = signal<Usuario | null>(null);
  readonly completo = signal(false);
  readonly enviando = signal(false);
  readonly mostrarSenha = signal(false);

  readonly form: FormGroup = this.fb.group(
    {
      // 1 = USER (cliente), 2 = ADMIN
      idPapel: [1 as number | null, [Validators.required]],
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      senha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
      confirmarSenha: ['', [Validators.required]],
      ...camposCompletos(),
    },
    { validators: [senhasIguais, documentoDoPerfil] },
  );

  ngOnInit(): void {
    const usuario = this.activatedRoute.snapshot.data['usuario'] as Usuario | undefined;

    if (usuario) {
      this.usuario.set(usuario);
      // papel e senha nao mudam na edicao
      for (const campo of ['idPapel', 'senha', 'confirmarSenha']) this.form.get(campo)?.disable();
      this.preencher(usuario);
    }

    this.escolherTipo(usuario?.cadastroCompleto ?? false);
  }

  isEdicao(): boolean {
    return this.usuario() !== null;
  }

  // cadastro completo ja salvo nao volta a ser simples (apagaria dados)
  podeEscolherTipo(): boolean {
    return !this.usuario()?.cadastroCompleto;
  }

  escolherTipo(completo: boolean): void {
    this.completo.set(completo);
    definirCompleto(this.form, completo);
  }

  salvar(): void {
    limparErrosDaApi(this.form);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.exibirMensagem('Corrija os campos destacados antes de salvar.');
      return;
    }

    const v = this.form.getRawValue();
    const acesso = { nome: String(v.nome).trim(), email: String(v.email).trim().toLowerCase() };
    const usuario = this.usuario();
    let requisicao: Observable<Usuario>;

    if (usuario) {
      requisicao = this.completo()
        ? this.usuarioService.editarCompleto(usuario.id, { ...acesso, ...dadosCompletos(this.form) })
        : this.usuarioService.editarSimples(usuario.id, acesso);
    } else {
      const novo = { ...acesso, senha: v.senha, idPapel: Number(v.idPapel) };
      requisicao = this.completo()
        ? this.usuarioService.cadastrarCompleto({ ...novo, ...dadosCompletos(this.form) })
        : this.usuarioService.cadastrarSimples(novo);
    }

    this.enviando.set(true);
    requisicao.subscribe({
      next: (salvo) => {
        this.enviando.set(false);
        this.exibirMensagem(usuario ? `${salvo.nome} atualizado.` : `${salvo.nome} cadastrado.`);
        this.router.navigate(['/usuarios', salvo.id]);
      },
      error: (error: HttpErrorResponse) => {
        this.enviando.set(false);
        const mensagem = aplicarErrosDaApi(this.form, error, 'Erro ao salvar o usuário.');
        const problem = error.error as ApiProblem | null;
        const erroDeCampo = problem?.errors?.some((e) => this.form.get(e.field));
        this.exibirMensagem(erroDeCampo ? 'Corrija os campos destacados.' : (problem?.errors?.[0]?.message ?? mensagem));
        console.error('Erro ao salvar usuário:', error);
      },
    });
  }

  alternarSenha(): void {
    this.mostrarSenha.update((v) => !v);
  }

  voltar(): void {
    this.location.back();
  }

  getErrorMessage(field: string): string | null {
    return mensagemDeErro(this.form.get(field), MENSAGENS_CADASTRO[field] ?? {});
  }

  private preencher(usuario: Usuario): void {
    const endereco = usuario.endereco;
    this.form.patchValue({
      idPapel: usuario.papel?.id ?? null,
      nome: usuario.nome,
      email: usuario.email,
      idPerfilFiscal: usuario.perfilFiscal?.id ?? null,
      idAtividadeMei: usuario.atividadeMei?.id ?? null,
      documento: usuario.documento ?? '',
      telefone: usuario.telefone ?? '',
      cep: endereco?.cep ?? '',
      logradouro: endereco?.logradouro ?? '',
      numero: endereco?.numero ?? '',
      complemento: endereco?.complemento ?? '',
      bairro: endereco?.bairro ?? '',
      idMunicipio: endereco?.municipio?.id ?? null,
    });
  }

  private exibirMensagem(mensagem: string): void {
    this.snack.open(mensagem, 'Ok', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }
}
