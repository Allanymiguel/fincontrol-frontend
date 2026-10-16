import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../../services/auth.service';
import { aplicarErrosDaApi, limparErrosDaApi, mensagemDeErro } from '../../../utils/form-errors';

@Component({
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  readonly form: FormGroup;
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly entrando = signal(false);
  readonly mostrarSenha = signal(false);
  // mensagem geral do login (credenciais erradas, conta desativada, servidor fora do ar)
  readonly erro = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);

  private readonly fieldMessages: Record<string, Record<string, string>> = {
    email: {
      required: 'E-mail é obrigatório.',
      email: 'Informe um e-mail válido.',
    },
    senha: {
      required: 'Senha é obrigatória.',
    },
  };

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    const params = this.activatedRoute.snapshot.queryParamMap;

    if (params.get('expirada')) {
      this.aviso.set('Sua sessão expirou. Entre novamente.');
    } else if (params.get('cadastrado')) {
      this.aviso.set('Conta criada! Entre com seu e-mail e senha.');
      this.form.patchValue({ email: params.get('cadastrado') });
    }
  }

  entrar(): void {
    limparErrosDaApi(this.form);
    this.erro.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.entrando.set(true);
    const { email, senha } = this.form.getRawValue();

    this.authService.login({ email: String(email).trim(), senha }).subscribe({
      next: () => {
        this.entrando.set(false);
        // volta para a tela que pediu login (ex.: sessao expirada), ou para o inicio
        const returnUrl = this.activatedRoute.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') && returnUrl !== '/login' ? returnUrl : '/');
      },
      error: (error: HttpErrorResponse) => {
        this.entrando.set(false);
        this.erro.set(aplicarErrosDaApi(this.form, error, 'Não foi possível entrar.'));
      },
    });
  }

  alternarSenha(): void {
    this.mostrarSenha.update((v) => !v);
  }

  getErrorMessage(field: string): string | null {
    return mensagemDeErro(this.form.get(field), this.fieldMessages[field] ?? {});
  }
}
