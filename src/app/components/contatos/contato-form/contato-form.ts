import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiProblem } from '../../../models/api-problem.model';
import { CepResponse } from '../../../models/cep.model';
import { Contato, ContatoRequest } from '../../../models/contato.model';
import { TIPOS_CONTATO, TipoContato } from '../../../models/tipo-contato';
import { CepService } from '../../../services/cep.service';
import { ContatoService } from '../../../services/contato.service';
import { apenasDigitos, documentoValidator } from '../../../utils/documento';

type CepState = 'idle' | 'buscando' | 'encontrado' | 'erro';

@Component({
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  selector: 'app-contato-form',
  styleUrl: './contato-form.css',
  templateUrl: './contato-form.html',
})
export class ContatoForm implements OnInit {
  readonly form: FormGroup;
  private readonly location = inject(Location);

  @ViewChild('numeroInput') numeroInput?: ElementRef<HTMLInputElement>;

  tipos: TipoContato[] = TIPOS_CONTATO;
  cepState: CepState = 'idle';
  // texto "Cidade - UF" exibido no form; o que vai para o back e so o idMunicipio
  cidadeUf = '';
  // ultimo CEP consultado com sucesso: evita buscar de novo o mesmo CEP
  private ultimoCepBuscado = '';

  private readonly fieldMessages: Record<string, Record<string, string>> = {
    nome: {
      required: 'Nome é obrigatório.',
      minlength: 'Nome deve ter ao menos 2 caracteres.',
      maxlength: 'Nome deve ter no máximo 120 caracteres.',
    },
    idTipo: {
      required: 'Selecione o tipo de contato.',
    },
    documento: {
      required: 'CPF/CNPJ é obrigatório.',
      documentoTamanho: 'Informe 11 dígitos (CPF) ou 14 dígitos (CNPJ).',
      documentoInvalido: 'CPF/CNPJ inválido.',
    },
    email: {
      email: 'Informe um e-mail válido.',
      maxlength: 'E-mail deve ter no máximo 120 caracteres.',
    },
    telefone: {
      pattern: 'Informe DDD + número (10 ou 11 dígitos).',
    },
    cep: {
      required: 'CEP é obrigatório.',
      pattern: 'CEP deve conter 8 dígitos.',
    },
    logradouro: {
      required: 'Logradouro é obrigatório.',
      maxlength: 'Logradouro deve ter no máximo 120 caracteres.',
    },
    numero: {
      required: 'Número é obrigatório (use "s/n" se não houver).',
      maxlength: 'Número deve ter no máximo 10 caracteres.',
    },
    complemento: {
      maxlength: 'Complemento deve ter no máximo 60 caracteres.',
    },
    bairro: {
      required: 'Bairro é obrigatório.',
      maxlength: 'Bairro deve ter no máximo 60 caracteres.',
    },
    idMunicipio: {
      required: 'Consulte o CEP para preencher cidade e UF.',
    },
  };

  constructor(
    private fb: FormBuilder,
    private contatoService: ContatoService,
    private cepService: CepService,
    private activatedRoute: ActivatedRoute,
    private snack: MatSnackBar,
    private router: Router,
  ) {
    this.form = this.fb.group({
      id: [null],
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
      idTipo: [null, [Validators.required]],
      documento: ['', [Validators.required, documentoValidator()]],
      email: ['', [Validators.email, Validators.maxLength(120)]],
      telefone: ['', [Validators.pattern(/^\d{10,11}$/)]],
      cep: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      logradouro: ['', [Validators.required, Validators.maxLength(120)]],
      numero: ['', [Validators.required, Validators.maxLength(10)]],
      complemento: ['', [Validators.maxLength(60)]],
      bairro: ['', [Validators.required, Validators.maxLength(60)]],
      idMunicipio: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    const contato = this.activatedRoute.snapshot.data['contato'] as Contato | undefined;

    if (contato) {
      this.preencherFormulario(contato);
    }
  }

  // Mantem so numeros nos campos de documento, telefone e CEP
  somenteDigitos(campo: string): void {
    const control = this.form.get(campo);
    if (!control) return;

    const limpo = apenasDigitos(control.value);
    if (limpo !== control.value) {
      control.setValue(limpo, { emitEvent: false });
    }

    if (campo === 'cep') {
      this.onCepAlterado(limpo);
    }
  }

  // Se o CEP mudou depois de uma consulta, cidade/UF deixam de valer.
  // Ao completar 8 digitos, busca automaticamente.
  private onCepAlterado(cep: string): void {
    if (cep !== this.ultimoCepBuscado && this.form.get('idMunicipio')?.value) {
      this.limparMunicipio();
    }

    if (cep.length === 8 && cep !== this.ultimoCepBuscado) {
      this.buscarCep();
    }
  }

  buscarCep(): void {
    const cepControl = this.form.get('cep');
    if (!cepControl) return;

    const cep = apenasDigitos(cepControl.value);
    cepControl.markAsTouched();

    if (cepControl.invalid || cep.length !== 8) {
      return;
    }

    this.clearApiErrors(cepControl);
    this.cepState = 'buscando';

    this.cepService.buscar(cep).subscribe({
      next: (endereco: CepResponse) => {
        this.cepState = 'encontrado';
        this.ultimoCepBuscado = cep;
        this.aplicarEndereco(endereco);
        // o ViaCEP nao traz o numero: joga o foco nele
        setTimeout(() => this.numeroInput?.nativeElement.focus());
      },
      error: (error: HttpErrorResponse) => {
        this.cepState = 'erro';
        this.ultimoCepBuscado = '';
        this.limparMunicipio();

        if (error.status === 404) {
          this.setApiError(cepControl, 'CEP não encontrado.');
          return;
        }

        if (error.status === 0) {
          this.exibirMensagem('Sem conexão com o servidor.');
          return;
        }

        this.handleApiError(error, 'Erro ao consultar o CEP.');
      },
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.clearApiErrors();
      this.form.markAllAsTouched();
      this.exibirMensagem('Corrija os campos destacados antes de salvar.');
      return;
    }

    this.clearApiErrors();

    const id = this.form.get('id')?.value as number | null;
    const payload = this.toRequest();

    const resultado: Observable<unknown> = id
      ? this.contatoService.update(id, payload)
      : this.contatoService.create(payload);

    resultado.subscribe({
      next: () => {
        this.exibirMensagem('Contato salvo com sucesso!');
        this.router.navigate(['/contatos']);
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error, 'Erro ao salvar contato.');
      },
    });
  }

  excluir(): void {
    const id = this.form.get('id')?.value as number | null;
    if (!id) return;

    if (!confirm('Deseja realmente excluir este contato?')) return;

    this.contatoService.delete(id).subscribe({
      next: () => {
        this.exibirMensagem('Contato excluído com sucesso!');
        this.router.navigate(['/contatos']);
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error, 'Erro ao excluir contato.');
      },
    });
  }

  voltar(): void {
    this.location.back();
  }

  getErrorMessage(field: string): string | null {
    return this.resolveErrorMessage(this.form.get(field), this.fieldMessages[field] ?? {});
  }

  // Erro do municipio aparece embaixo do campo Cidade/UF quando o usuario ja mexeu no CEP
  getMunicipioErrorMessage(): string | null {
    const municipio = this.form.get('idMunicipio');
    const cep = this.form.get('cep');
    if (!municipio || !municipio.errors) return null;
    if (!municipio.touched && !cep?.touched) return null;

    if (typeof municipio.errors['api'] === 'string') return municipio.errors['api'];
    return this.fieldMessages['idMunicipio']['required'];
  }

  private aplicarEndereco(endereco: CepResponse): void {
    this.form.patchValue({
      // CEP "geral" de cidade pequena vem sem logradouro/bairro: mantem o que o usuario digitou
      logradouro: endereco.logradouro || this.form.get('logradouro')?.value,
      bairro: endereco.bairro || this.form.get('bairro')?.value,
      idMunicipio: endereco.municipio.id,
    });

    // o "complemento" do ViaCEP e faixa de numeracao ("de 612 a 1510 - lado par"),
    // nao o complemento do endereco da pessoa, entao nao e copiado para o form

    this.cidadeUf = `${endereco.municipio.nome} - ${endereco.municipio.estado.sigla}`;

    for (const campo of ['logradouro', 'bairro']) {
      this.form.get(campo)?.markAsTouched();
    }
  }

  private limparMunicipio(): void {
    this.form.patchValue({ idMunicipio: null });
    this.cidadeUf = '';
    if (this.cepState === 'encontrado') this.cepState = 'idle';
  }

  private preencherFormulario(contato: Contato): void {
    const endereco = contato.endereco;

    this.form.patchValue({
      id: contato.id,
      nome: contato.nome ?? '',
      idTipo: contato.tipo?.id ?? null,
      documento: contato.documento ?? '',
      email: contato.email ?? '',
      telefone: contato.telefone ?? '',
      cep: endereco?.cep ?? '',
      logradouro: endereco?.logradouro ?? '',
      numero: endereco?.numero ?? '',
      complemento: endereco?.complemento ?? '',
      bairro: endereco?.bairro ?? '',
      idMunicipio: endereco?.municipio?.id ?? null,
    });

    if (endereco?.municipio) {
      this.cidadeUf = `${endereco.municipio.nome} - ${endereco.municipio.estado.sigla}`;
      this.ultimoCepBuscado = endereco.cep;
      this.cepState = 'encontrado';
    }
  }

  private toRequest(): ContatoRequest {
    const value = this.form.getRawValue();

    return {
      nome: String(value.nome).trim(),
      idTipo: Number(value.idTipo),
      documento: apenasDigitos(value.documento),
      email: this.normalizeNullable(value.email),
      telefone: this.normalizeNullable(apenasDigitos(value.telefone)),
      cep: apenasDigitos(value.cep),
      logradouro: String(value.logradouro).trim(),
      numero: String(value.numero).trim(),
      complemento: this.normalizeNullable(value.complemento),
      bairro: String(value.bairro).trim(),
      idMunicipio: Number(value.idMunicipio),
    };
  }

  private normalizeNullable(value: unknown): string | null {
    const normalized = String(value ?? '').trim();
    return normalized.length > 0 ? normalized : null;
  }

  private resolveErrorMessage(
    control: AbstractControl | null,
    messages: Record<string, string>,
  ): string | null {
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (typeof control.errors['api'] === 'string') {
      return control.errors['api'];
    }

    for (const key of Object.keys(messages)) {
      if (control.hasError(key)) {
        return messages[key];
      }
    }

    return 'Campo inválido.';
  }

  // Erros de validacao do back (400 com lista "errors") vao para o campo correspondente
  private handleApiError(error: HttpErrorResponse, fallbackMessage: string): void {
    const problem = error.error as ApiProblem | null;

    if (problem?.errors?.length) {
      for (const fieldError of problem.errors) {
        const control = this.form.get(fieldError.field);
        if (control) this.setApiError(control, fieldError.message);
      }
    }

    this.exibirMensagem(problem?.detail || problem?.title || fallbackMessage);
    console.error(fallbackMessage, error);
  }

  private setApiError(control: AbstractControl, message: string): void {
    control.setErrors({ ...(control.errors ?? {}), api: message });
    control.markAsTouched();
  }

  private clearApiErrors(control: AbstractControl = this.form): void {
    if (control instanceof FormGroup) {
      for (const child of Object.values(control.controls)) {
        this.clearApiErrors(child);
      }
    }

    if (!control.errors?.['api']) {
      return;
    }

    const { api, ...rest } = control.errors;
    control.setErrors(Object.keys(rest).length > 0 ? rest : null);
  }

  private exibirMensagem(mensagem: string): void {
    this.snack.open(mensagem, 'Ok', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
