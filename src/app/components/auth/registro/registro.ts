import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ApiProblem } from '../../../models/api-problem.model';
import { ATIVIDADES_MEI, AtividadeMei } from '../../../models/atividade-mei';
import { RegistroRequest } from '../../../models/auth.model';
import { PERFIS_FISCAIS, PerfilFiscal } from '../../../models/perfil-fiscal';
import { AuthService } from '../../../services/auth.service';
import { apenasDigitos, documentoValidator } from '../../../utils/documento';
import { aplicarErrosDaApi, limparErrosDaApi, mensagemDeErro } from '../../../utils/form-errors';

// ids do enum PerfilFiscal do back
const PERFIL_PF = 1;
const PERFIL_MEI = 2;

// "Confirmar senha" igual a "Senha"
const senhasIguais: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  const confirmar = grupo.get('confirmarSenha');
  if (!confirmar || !confirmar.value) return null;

  const diferentes = grupo.get('senha')?.value !== confirmar.value;
  const { senhasDiferentes, ...outros } = confirmar.errors ?? {};
  confirmar.setErrors(diferentes ? { ...outros, senhasDiferentes: true } : Object.keys(outros).length ? outros : null);
  return null;
};

// PF usa CPF (11 digitos); MEI e ME sao empresas e usam CNPJ (14)
const documentoDoPerfil: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  const documento = grupo.get('documento');
  const perfil = grupo.get('idPerfilFiscal')?.value as number | null;
  const digitos = apenasDigitos(documento?.value);
  if (!documento || !perfil || (digitos.length !== 11 && digitos.length !== 14)) return null;

  const esperado = perfil === PERFIL_PF ? 11 : 14;
  const { documentoDoPerfil: _, ...outros } = documento.errors ?? {};
  documento.setErrors(
    digitos.length !== esperado ? { ...outros, documentoDoPerfil: true } : Object.keys(outros).length ? outros : null,
  );
  return null;
};

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  readonly form: FormGroup;
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly perfis: PerfilFiscal[] = PERFIS_FISCAIS;
  readonly atividades: AtividadeMei[] = ATIVIDADES_MEI;
  readonly enviando = signal(false);
  readonly mostrarSenha = signal(false);
  readonly erro = signal<string | null>(null);
  readonly idPerfil;

  private readonly fieldMessages: Record<string, Record<string, string>> = {
    nome: {
      required: 'Nome é obrigatório.',
      minlength: 'Nome deve ter ao menos 2 caracteres.',
      maxlength: 'Nome deve ter no máximo 120 caracteres.',
    },
    email: {
      required: 'E-mail é obrigatório.',
      email: 'Informe um e-mail válido.',
      maxlength: 'E-mail deve ter no máximo 120 caracteres.',
    },
    senha: {
      required: 'Senha é obrigatória.',
      minlength: 'A senha deve ter ao menos 8 caracteres.',
      maxlength: 'A senha deve ter no máximo 64 caracteres.',
    },
    confirmarSenha: {
      required: 'Confirme a senha.',
      senhasDiferentes: 'As senhas não conferem.',
    },
    idPerfilFiscal: {
      required: 'Selecione o perfil fiscal.',
    },
    idAtividadeMei: {
      required: 'Selecione a atividade do MEI.',
    },
    documento: {
      required: 'Documento é obrigatório.',
      documentoTamanho: 'Informe 11 dígitos (CPF) ou 14 dígitos (CNPJ).',
      documentoInvalido: 'CPF/CNPJ inválido.',
      documentoDoPerfil: 'Pessoa física usa CPF; MEI e microempresa usam CNPJ.',
    },
    telefone: {
      pattern: 'Informe DDD + número (10 ou 11 dígitos).',
    },
  };

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group(
      {
        nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
        senha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
        confirmarSenha: ['', [Validators.required]],
        idPerfilFiscal: [null as number | null, [Validators.required]],
        idAtividadeMei: [null as number | null],
        documento: ['', [Validators.required, documentoValidator()]],
        telefone: ['', [Validators.pattern(/^\d{10,11}$/)]],
      },
      { validators: [senhasIguais, documentoDoPerfil] },
    );

    const perfilControl = this.form.get('idPerfilFiscal') as AbstractControl<number | null>;
    this.idPerfil = toSignal(perfilControl.valueChanges, { initialValue: perfilControl.value });

    // a atividade so e obrigatoria (e so aparece) para MEI
    perfilControl.valueChanges.subscribe((perfil) => {
      const atividade = this.form.get('idAtividadeMei');
      if (perfil === PERFIL_MEI) {
        atividade?.setValidators([Validators.required]);
      } else {
        atividade?.clearValidators();
        atividade?.setValue(null);
      }
      atividade?.updateValueAndValidity();
    });
  }

  isMei(): boolean {
    return this.idPerfil() === PERFIL_MEI;
  }

  rotuloDocumento(): string {
    const perfil = this.idPerfil();
    if (!perfil) return 'CPF / CNPJ';
    return perfil === PERFIL_PF ? 'CPF' : 'CNPJ';
  }

  // mantem so numeros no documento e no telefone
  somenteDigitos(campo: string): void {
    const control = this.form.get(campo);
    if (!control) return;

    const limpo = apenasDigitos(control.value);
    if (limpo !== control.value) {
      control.setValue(limpo);
    }
  }

  cadastrar(): void {
    limparErrosDaApi(this.form);
    this.erro.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    const payload = this.toRequest();

    this.authService.registrar(payload).subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigate(['/login'], { queryParams: { cadastrado: payload.email } });
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
    return mensagemDeErro(this.form.get(field), this.fieldMessages[field] ?? {});
  }

  private toRequest(): RegistroRequest {
    const value = this.form.getRawValue();
    const telefone = apenasDigitos(value.telefone);

    return {
      nome: String(value.nome).trim(),
      email: String(value.email).trim().toLowerCase(),
      senha: value.senha,
      documento: apenasDigitos(value.documento),
      telefone: telefone.length > 0 ? telefone : null,
      idPerfilFiscal: Number(value.idPerfilFiscal),
      idAtividadeMei: value.idAtividadeMei ? Number(value.idAtividadeMei) : null,
    };
  }
}
