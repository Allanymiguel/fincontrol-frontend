import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { ATIVIDADES_MEI } from '../../../models/atividade-mei';
import { CepResponse } from '../../../models/cep.model';
import { Endereco } from '../../../models/contato.model';
import { PERFIS_FISCAIS } from '../../../models/perfil-fiscal';
import { CepService } from '../../../services/cep.service';
import { MENSAGENS_CADASTRO, PERFIL_MEI, PERFIL_PF, ligarRegraMei } from '../../../utils/cadastro';
import { apenasDigitos } from '../../../utils/documento';
import { limparErrosDaApi, mensagemDeErro, setErroDaApi } from '../../../utils/form-errors';

type CepState = 'idle' | 'buscando' | 'encontrado' | 'erro';

// Campos do cadastro completo de usuario: dados fiscais e endereco com consulta do CEP (o back
// resolve o municipio). Recebe o FormGroup da tela, que tem os controles de utils/cadastro.ts.
@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  selector: 'app-dados-completos',
  styleUrl: './dados-completos.css',
  templateUrl: './dados-completos.html',
})
export class DadosCompletos implements OnInit, OnDestroy {
  readonly form = input.required<FormGroup>();
  // endereco ja salvo (edicao): mostra a cidade sem precisar consultar o CEP de novo
  readonly endereco = input<Endereco | null>(null);

  @ViewChild('numeroInput') numeroInput?: ElementRef<HTMLInputElement>;

  readonly perfis = PERFIS_FISCAIS;
  readonly atividades = ATIVIDADES_MEI;
  readonly cepState = signal<CepState>('idle');
  readonly cidadeUf = signal('');
  private ultimoCepBuscado = '';
  private readonly inscricoes = new Subscription();
  // perfil escolhido: decide o rotulo do documento e se a atividade do MEI aparece
  readonly idPerfil = signal<number | null>(null);

  constructor(private cepService: CepService) {}

  ngOnInit(): void {
    const form = this.form();
    const perfil = form.get('idPerfilFiscal')!;
    this.idPerfil.set(perfil.value);
    this.inscricoes.add(perfil.valueChanges.subscribe((valor) => this.idPerfil.set(valor)));
    this.inscricoes.add(ligarRegraMei(form));

    const endereco = this.endereco();
    if (endereco?.municipio) {
      this.cidadeUf.set(`${endereco.municipio.nome} - ${endereco.municipio.estado.sigla}`);
      this.ultimoCepBuscado = endereco.cep;
      this.cepState.set('encontrado');
    }
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

  // mantem so numeros no documento, telefone e CEP; o CEP com 8 digitos e consultado na hora
  somenteDigitos(campo: string): void {
    const control = this.form().get(campo);
    if (!control) return;

    const limpo = apenasDigitos(control.value);
    if (limpo !== control.value) control.setValue(limpo, { emitEvent: false });

    if (campo === 'cep') {
      // se o CEP mudou depois de uma consulta, cidade/UF deixam de valer
      if (limpo !== this.ultimoCepBuscado && this.form().get('idMunicipio')?.value) this.limparMunicipio();
      if (limpo.length === 8 && limpo !== this.ultimoCepBuscado) this.buscarCep();
    }
  }

  buscarCep(): void {
    const cepControl = this.form().get('cep');
    if (!cepControl) return;

    const cep = apenasDigitos(cepControl.value);
    cepControl.markAsTouched();
    if (cepControl.invalid && !cepControl.errors?.['api']) return;
    if (cep.length !== 8) return;

    limparErrosDaApi(cepControl);
    this.cepState.set('buscando');

    this.cepService.buscar(cep).subscribe({
      next: (endereco: CepResponse) => {
        this.cepState.set('encontrado');
        this.ultimoCepBuscado = cep;
        this.aplicarEndereco(endereco);
        // o ViaCEP nao traz o numero: joga o foco nele
        setTimeout(() => this.numeroInput?.nativeElement.focus());
      },
      error: (error: HttpErrorResponse) => {
        this.cepState.set('erro');
        this.ultimoCepBuscado = '';
        this.limparMunicipio();
        setErroDaApi(cepControl, error.status === 404 ? 'CEP não encontrado.' : 'Não foi possível consultar o CEP.');
      },
    });
  }

  getErrorMessage(field: string): string | null {
    return mensagemDeErro(this.form().get(field), MENSAGENS_CADASTRO[field] ?? {});
  }

  // erro do municipio aparece embaixo de Cidade/UF depois que o CEP foi mexido
  getMunicipioErrorMessage(): string | null {
    const municipio = this.form().get('idMunicipio');
    const cep = this.form().get('cep');
    if (!municipio || municipio.disabled || !municipio.errors) return null;
    if (!municipio.touched && !cep?.touched) return null;
    if (typeof municipio.errors['api'] === 'string') return municipio.errors['api'];
    return MENSAGENS_CADASTRO['idMunicipio']['required'];
  }

  private aplicarEndereco(endereco: CepResponse): void {
    const form = this.form();
    form.patchValue({
      // CEP "geral" de cidade pequena vem sem logradouro/bairro: mantem o que ja foi digitado
      logradouro: endereco.logradouro || form.get('logradouro')?.value,
      bairro: endereco.bairro || form.get('bairro')?.value,
      idMunicipio: endereco.municipio.id,
    });
    // o "complemento" do ViaCEP e faixa de numeracao, nao o complemento da pessoa: nao e copiado
    this.cidadeUf.set(`${endereco.municipio.nome} - ${endereco.municipio.estado.sigla}`);
  }

  private limparMunicipio(): void {
    this.form().patchValue({ idMunicipio: null });
    this.cidadeUf.set('');
    if (this.cepState() === 'encontrado') this.cepState.set('idle');
  }
}

