import { Component, OnDestroy, OnInit, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { ATIVIDADES_MEI } from '../../../models/atividade-mei';
import { Endereco } from '../../../models/contato.model';
import { PERFIS_FISCAIS } from '../../../models/perfil-fiscal';
import { MENSAGENS_CADASTRO, PERFIL_MEI, PERFIL_PF, ligarRegraMei } from '../../../utils/cadastro';
import { apenasDigitos } from '../../../utils/documento';
import { mensagemDeErro } from '../../../utils/form-errors';
import { EnderecoCliente } from '../endereco-cliente/endereco-cliente';

// Campos do cadastro completo de usuario: dados fiscais e o endereco do cliente (EnderecoCliente,
// com a base propria de CEPs). Recebe o FormGroup da tela, que tem os controles de utils/cadastro.ts.
@Component({
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    EnderecoCliente,
  ],
  selector: 'app-dados-completos',
  styleUrl: './dados-completos.css',
  templateUrl: './dados-completos.html',
})
export class DadosCompletos implements OnInit, OnDestroy {
  readonly form = input.required<FormGroup>();
  // endereco ja salvo (edicao): repassado ao componente de endereco
  readonly endereco = input<Endereco | null>(null);

  readonly perfis = PERFIS_FISCAIS;
  readonly atividades = ATIVIDADES_MEI;

  private readonly inscricoes = new Subscription();

  // perfil escolhido: decide o rotulo do documento e se a atividade do MEI aparece
  readonly idPerfil = signal<number | null>(null);

  ngOnInit(): void {
    const form = this.form();
    const perfil = form.get('idPerfilFiscal')!;
    this.idPerfil.set(perfil.value);
    this.inscricoes.add(perfil.valueChanges.subscribe((valor) => this.idPerfil.set(valor)));
    this.inscricoes.add(ligarRegraMei(form));
  }

  ngOnDestroy(): void {
    this.inscricoes.unsubscribe();
  }

  isMei(): boolean {
    return this.idPerfil() === PERFIL_MEI;
  }

  rotuloDocumento(): string {
    const perfil = this.idPerfil();
    if (!perfil) return 'CPF / CNPJ';
    return perfil === PERFIL_PF ? 'CPF' : 'CNPJ';
  }

  // mantem so numeros no documento e no telefone (o CEP fica com o componente de endereco)
  somenteDigitos(campo: string): void {
    const control = this.form().get(campo);
    if (!control) return;
    const limpo = apenasDigitos(control.value);
    if (limpo !== control.value) control.setValue(limpo, { emitEvent: false });
  }

  getErrorMessage(field: string): string | null {
    return mensagemDeErro(this.form().get(field), MENSAGENS_CADASTRO[field] ?? {});
  }
}
