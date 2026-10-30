import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, WritableSignal, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription, debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';
import { Endereco } from '../../../models/contato.model';
import { EnderecoClienteResponse } from '../../../models/endereco-cliente.model';
import { Municipio } from '../../../models/municipio.model';
import { EnderecoClienteService } from '../../../services/endereco-cliente.service';
import { MENSAGENS_CADASTRO } from '../../../utils/cadastro';
import { apenasDigitos } from '../../../utils/documento';
import { limparErrosDaApi, mensagemDeErro, setErroDaApi } from '../../../utils/form-errors';

// buscando: consultando o CEP; encontrado: veio da base ou do ViaCEP (campos travados);
// nao-encontrado: oferece o modo manual; manual: municipio da lista do IBGE e o resto digitado
type EstadoEndereco = 'inicial' | 'buscando' | 'encontrado' | 'nao-encontrado' | 'manual';

// Endereco do CLIENTE (cadastro completo do auto-registro e do admin) com a base propria de CEPs.
// O travamento e so visual (readonly, para os valores irem no envio): o back usa os dados da base.
// Os contatos tem o proprio formulario de endereco e nao usam este componente.
@Component({
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  selector: 'app-endereco-cliente',
  styleUrl: './endereco-cliente.css',
  templateUrl: './endereco-cliente.html',
})
export class EnderecoCliente implements OnInit, OnDestroy {
  private readonly service = inject(EnderecoClienteService);

  readonly form = input.required<FormGroup>();
  // endereco ja salvo (edicao)
  readonly endereco = input<Endereco | null>(null);

  @ViewChild('numeroInput') numeroInput?: ElementRef<HTMLInputElement>;
  @ViewChild('logradouroInput') logradouroInput?: ElementRef<HTMLInputElement>;

  readonly estado = signal<EstadoEndereco>('inicial');
  readonly resposta = signal<EnderecoClienteResponse | null>(null);
  readonly logradouroTravado = signal(false);
  readonly bairroTravado = signal(false);
  readonly cidadeUf = signal('');
  readonly uf = signal('');
  readonly municipios = signal<Municipio[]>([]);
  readonly sugestoesBairro = signal<string[]>([]);
  readonly sugestoesLogradouro = signal<string[]>([]);

  // texto digitado no campo de municipio (o que vai no envio e o idMunicipio escolhido na lista)
  readonly municipioTexto = new FormControl<string>('', { nonNullable: true });

  private ultimoCepBuscado = '';
  private readonly inscricoes = new Subscription();

  ngOnInit(): void {
    // municipio: so vale o escolhido na lista; digitar outra coisa desfaz a escolha
    this.inscricoes.add(this.municipioTexto.valueChanges.pipe(
      debounceTime(250),
      filter(() => this.estado() === 'manual'),
      switchMap((texto) => {
        if (this.cidadeUf() && texto !== this.nomeEscolhido()) this.escolherMunicipio(null);
        return this.service.municipios(this.uf(), texto);
      }),
    ).subscribe({ next: (lista) => this.municipios.set(lista), error: () => this.municipios.set([]) }));

    this.inscricoes.add(this.sugerir('bairro', this.sugestoesBairro));
    this.inscricoes.add(this.sugerir('logradouro', this.sugestoesLogradouro));

    // edicao: busca o CEP salvo para saber o que travar, sem apagar o que a pessoa ja tem
    const salvo = this.endereco();
    if (salvo?.cep && salvo.municipio) {
      this.cidadeUf.set(`${salvo.municipio.nome} - ${salvo.municipio.estado.sigla}`);
      this.buscarCep(true);
    }
  }

  ngOnDestroy(): void {
    this.inscricoes.unsubscribe();
  }

  // so numeros no CEP; com 8 digitos novos, consulta na hora
  onCepInput(): void {
    const control = this.form().get('cep')!;
    const limpo = apenasDigitos(control.value);
    if (limpo !== control.value) control.setValue(limpo, { emitEvent: false });
    if (limpo !== this.ultimoCepBuscado && this.estado() !== 'inicial' && this.estado() !== 'buscando') this.reiniciar();
    if (limpo.length === 8 && limpo !== this.ultimoCepBuscado) this.buscarCep();
  }

  buscarCep(edicao = false): void {
    const cepControl = this.form().get('cep')!;
    const cep = apenasDigitos(cepControl.value);
    cepControl.markAsTouched();
    if (cep.length !== 8) return;
    limparErrosDaApi(cepControl);
    this.estado.set('buscando');
    this.ultimoCepBuscado = cep;

    this.service.consultar(cep).subscribe({
      next: (resposta) => {
        this.resposta.set(resposta);
        this.uf.set(resposta.uf);
        if (resposta.encontrado) this.aplicarEncontrado(resposta, edicao);
        else if (edicao) this.abrirManual(true);
        else {
          this.estado.set('nao-encontrado');
          this.escolherMunicipio(null);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.estado.set('inicial');
        this.ultimoCepBuscado = '';
        const mensagem = error.error?.errors?.[0]?.message ?? 'Não foi possível consultar o CEP.';
        setErroDaApi(cepControl, mensagem);
      },
    });
  }

  // modo manual: UF da faixa do CEP, municipio da lista do IBGE, bairro e logradouro digitados
  abrirManual(edicao = false): void {
    this.estado.set('manual');
    this.logradouroTravado.set(false);
    this.bairroTravado.set(false);
    if (!edicao) {
      this.escolherMunicipio(null);
      this.municipioTexto.setValue('');
    } else {
      this.municipioTexto.setValue(this.endereco()?.municipio?.nome ?? '', { emitEvent: false });
    }
    this.service.municipios(this.uf(), '').subscribe({ next: (lista) => this.municipios.set(lista) });
  }

  onMunicipioEscolhido(evento: MatAutocompleteSelectedEvent): void {
    this.escolherMunicipio(evento.option.value as Municipio);
  }

  exibirMunicipio = (municipio: Municipio | string | null): string =>
    typeof municipio === 'string' ? municipio : municipio?.nome ?? '';

  getErrorMessage(campo: string): string | null {
    return mensagemDeErro(this.form().get(campo), MENSAGENS_CADASTRO[campo] ?? {});
  }

  // erro do municipio: aparece depois que o CEP foi mexido ou o envio foi tentado
  erroMunicipio(): string | null {
    const municipio = this.form().get('idMunicipio');
    if (!municipio || municipio.disabled || !municipio.errors) return null;
    // CEP nao encontrado: o aviso com o botao "Preencher manualmente" ja diz o que fazer
    if (this.estado() === 'nao-encontrado') return null;
    if (!municipio.touched && !this.form().get('cep')?.touched) return null;
    if (typeof municipio.errors['api'] === 'string') return municipio.errors['api'];
    return this.estado() === 'manual' ? 'Selecione o município na lista.' : MENSAGENS_CADASTRO['idMunicipio']['required'];
  }

  private aplicarEncontrado(resposta: EnderecoClienteResponse, edicao: boolean): void {
    const form = this.form();
    this.estado.set('encontrado');
    this.logradouroTravado.set(resposta.logradouroBloqueado);
    this.bairroTravado.set(resposta.bairroBloqueado);
    form.patchValue({
      // CEP geral de cidade: o que veio vazio fica para a pessoa preencher
      logradouro: resposta.logradouroBloqueado ? resposta.logradouro : (edicao ? form.get('logradouro')?.value : ''),
      bairro: resposta.bairroBloqueado ? resposta.bairro : (edicao ? form.get('bairro')?.value : ''),
    });
    this.escolherMunicipio(resposta.municipio);
    // foco no primeiro campo que a pessoa precisa preencher
    const proximo = resposta.logradouroBloqueado ? this.numeroInput : this.logradouroInput;
    if (!edicao) setTimeout(() => proximo?.nativeElement.focus());
  }

  private escolherMunicipio(municipio: Municipio | null): void {
    const control = this.form().get('idMunicipio')!;
    control.setValue(municipio?.id ?? null);
    limparErrosDaApi(control);
    this.cidadeUf.set(municipio ? `${municipio.nome} - ${municipio.estado.sigla}` : '');
    if (municipio && this.estado() === 'manual') {
      this.municipioTexto.setValue(municipio.nome, { emitEvent: false });
      control.markAsTouched();
    }
  }

  private nomeEscolhido(): string {
    return this.cidadeUf().split(' - ')[0];
  }

  // CEP trocado depois de uma busca: o endereco anterior deixa de valer
  private reiniciar(): void {
    this.estado.set('inicial');
    this.resposta.set(null);
    this.logradouroTravado.set(false);
    this.bairroTravado.set(false);
    this.escolherMunicipio(null);
    this.ultimoCepBuscado = '';
  }

  // autocompletar de bairro/logradouro no modo manual, com os valores ja usados no municipio
  private sugerir(campo: 'bairro' | 'logradouro', destino: WritableSignal<string[]>): Subscription {
    return this.form().get(campo)!.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      filter(() => this.estado() === 'manual' && !!this.form().get('idMunicipio')?.value),
      switchMap((texto: string) => this.service.sugestoes(this.form().get('idMunicipio')!.value, campo, texto ?? '')),
    ).subscribe({ next: (lista) => destino.set(lista), error: () => destino.set([]) });
  }
}
