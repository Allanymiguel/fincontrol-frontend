import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { ApiProblem } from '../../../models/api-problem.model';
import { Usuario } from '../../../models/usuario.model';
import { AuthService } from '../../../services/auth.service';
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
import { Logo } from '../../logo/logo';

// Cadastro publico (sempre papel USER) em duas formas: simples (so nome, e-mail e senha) ou
// completo (tambem dados fiscais e endereco). Depois a pessoa entra pela tela de login.
@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    DadosCompletos,
    Logo,
  ],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  readonly form: FormGroup;
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly completo = signal(false);
  readonly enviando = signal(false);
  readonly mostrarSenha = signal(false);
  readonly erro = signal<string | null>(null);

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group(
      {
        nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
        senha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
        confirmarSenha: ['', [Validators.required]],
        ...camposCompletos(),
      },
      { validators: [senhasIguais, documentoDoPerfil] },
    );
    definirCompleto(this.form, false);
  }

  escolherTipo(completo: boolean): void {
    this.completo.set(completo);
    definirCompleto(this.form, completo);
  }

  cadastrar(): void {
    limparErrosDaApi(this.form);
    this.erro.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    const v = this.form.getRawValue();
    const acesso = { nome: String(v.nome).trim(), email: String(v.email).trim().toLowerCase(), senha: v.senha };
    const requisicao: Observable<Usuario> = this.completo()
      ? this.authService.registrarCompleto({ ...acesso, ...dadosCompletos(this.form) })
      : this.authService.registrarSimples(acesso);

    requisicao.subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigate(['/login'], { queryParams: { cadastrado: acesso.email } });
      },
      error: (error: HttpErrorResponse) => {
        this.enviando.set(false);
        const mensagem = aplicarErrosDaApi(this.form, error, 'Não foi possível criar a conta.');
        // erro ligado a um campo (ex.: e-mail ja cadastrado) ja aparece embaixo dele
        const temErroDeCampo = !!(error.error as ApiProblem | null)?.errors?.length;
        this.erro.set(temErroDeCampo ? 'Corrija os campos destacados.' : mensagem);
      },
    });
  }

  alternarSenha(): void {
    this.mostrarSenha.update((v) => !v);
  }

  getErrorMessage(field: string): string | null {
    return mensagemDeErro(this.form.get(field), MENSAGENS_CADASTRO[field] ?? {});
  }
}
