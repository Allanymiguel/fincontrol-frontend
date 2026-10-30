import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, switchMap } from 'rxjs';
import { ApiProblem } from '../../../models/api-problem.model';
import { CepLocal, formatarCep } from '../../../models/endereco-cliente.model';
import { Municipio } from '../../../models/municipio.model';
import { CepAdminService } from '../../../services/cep-admin.service';
import { EnderecoClienteService } from '../../../services/endereco-cliente.service';

export interface DadosRevisaoCep {
  cep: CepLocal;
  apiLigada: boolean;
}

// Revisao de um CEP da base pelo admin: confere, corrige (municipio so da UF do CEP, da lista do IBGE)
// e marca como verificado. Se a revalidacao achou diferenca, mostra base x ViaCEP lado a lado.
@Component({
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  selector: 'app-cep-revisao-dialog',
  styleUrl: './cep-revisao-dialog.css',
  templateUrl: './cep-revisao-dialog.html',
})
export class CepRevisaoDialog implements OnInit {
  readonly dados = inject<DadosRevisaoCep>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<CepRevisaoDialog, CepLocal>);
  private readonly cepService = inject(CepAdminService);
  private readonly enderecoService = inject(EnderecoClienteService);
  private readonly fb = inject(FormBuilder);

  readonly cep = this.dados.cep;
  readonly formatarCep = formatarCep;
  readonly uf = this.cep.municipio.estado.sigla;
  readonly municipios = signal<Municipio[]>([]);
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly form = this.fb.group({
    logradouro: [this.cep.logradouro ?? '', [Validators.maxLength(120)]],
    bairro: [this.cep.bairro ?? '', [Validators.maxLength(60)]],
    idMunicipio: [this.cep.municipio.id as number | null, [Validators.required]],
  });
  readonly municipioTexto = new FormControl<string>(this.cep.municipio.nome, { nonNullable: true });

  ngOnInit(): void {
    this.municipioTexto.valueChanges.pipe(
      debounceTime(250),
      switchMap((texto) => {
        // so vale o municipio escolhido na lista
        this.form.patchValue({ idMunicipio: null });
        return this.enderecoService.municipios(this.uf, texto);
      }),
    ).subscribe({ next: (lista) => this.municipios.set(lista) });
  }

  onMunicipioEscolhido(evento: MatAutocompleteSelectedEvent): void {
    const municipio = evento.option.value as Municipio;
    this.form.patchValue({ idMunicipio: municipio.id });
    this.municipioTexto.setValue(municipio.nome, { emitEvent: false });
  }

  exibirMunicipio = (municipio: Municipio | string | null): string =>
    typeof municipio === 'string' ? municipio : municipio?.nome ?? '';

  // copia logradouro e bairro que o ViaCEP devolveu na revalidacao
  usarViaCep(): void {
    const divergencia = this.cep.divergencia;
    if (!divergencia) return;
    this.form.patchValue({ logradouro: divergencia.logradouro ?? '', bairro: divergencia.bairro ?? '' });
  }

  salvar(verificar: boolean): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erro.set(this.form.get('idMunicipio')?.invalid ? 'Escolha o município na lista.' : 'Confira os campos.');
      return;
    }
    const valores = this.form.getRawValue();
    this.salvando.set(true);
    this.erro.set(null);
    this.cepService.corrigir(this.cep.id, {
      logradouro: valores.logradouro || null,
      bairro: valores.bairro || null,
      idMunicipio: valores.idMunicipio!,
      verificar,
    }).subscribe({
      next: (salvo) => this.ref.close(salvo),
      error: (error: HttpErrorResponse) => {
        this.salvando.set(false);
        const problem = error.error as ApiProblem | null;
        this.erro.set(problem?.errors?.[0]?.message ?? problem?.detail ?? 'Não foi possível salvar o CEP.');
      },
    });
  }
}
