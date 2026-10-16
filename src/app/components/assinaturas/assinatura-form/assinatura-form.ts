import { DecimalPipe, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { debounceTime, distinctUntilChanged, filter, of, switchMap } from 'rxjs';
import { ApiProblem } from '../../../models/api-problem.model';
import { AssinaturaRequest } from '../../../models/assinatura.model';
import { Cupom } from '../../../models/cupom.model';
import { FORMAS_PAGAMENTO, FormaPagamento } from '../../../models/forma-pagamento';
import { PERIODICIDADES, Periodicidade } from '../../../models/periodicidade';
import { Plano } from '../../../models/plano.model';
import { Usuario } from '../../../models/usuario.model';
import { AssinaturaService } from '../../../services/assinatura.service';
import { CupomService } from '../../../services/cupom.service';
import { PlanoService } from '../../../services/plano.service';
import { UsuarioService } from '../../../services/usuario.service';
import { hojeIso } from '../../../utils/data';
import { aplicarErrosDaApi, limparErrosDaApi, mensagemDeErro } from '../../../utils/form-errors';
import { calcularValorPago } from '../../../utils/valor-assinatura';

// id 2 = ANUAL (enum Periodicidade do back)
const PERIODICIDADE_ANUAL = 2;

// o campo de usuario guarda o texto digitado ate o admin escolher uma opcao da lista
function usuarioSelecionado(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  if (!valor || typeof valor === 'object') return null;
  return { usuarioNaoSelecionado: true };
}

// Criacao de assinatura: so cria (usuario, plano e cupom nao mudam depois).
// A edicao (status, data de fim, observacao) fica em AssinaturaEdit.
@Component({
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  selector: 'app-assinatura-form',
  styleUrl: './assinatura-form.css',
  templateUrl: './assinatura-form.html',
})
export class AssinaturaForm implements OnInit {
  readonly form: FormGroup;
  private readonly location = inject(Location);
  private readonly assinaturaService = inject(AssinaturaService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly planoService = inject(PlanoService);
  private readonly cupomService = inject(CupomService);

  readonly periodicidades: Periodicidade[] = PERIODICIDADES;
  readonly formasPagamento: FormaPagamento[] = FORMAS_PAGAMENTO;
  // so o que pode ser contratado: planos ativos e cupons ativos dentro da validade
  readonly planos = signal<Plano[]>([]);
  readonly cupons = signal<Cupom[]>([]);
  // resultado da busca de usuarios no back (autocomplete)
  readonly usuariosEncontrados = signal<Usuario[]>([]);

  private readonly valores;
  // preco, desconto e valor final mostrados enquanto o admin preenche
  readonly resumo;

  private readonly fieldMessages: Record<string, Record<string, string>> = {
    usuario: {
      required: 'Selecione o usuário.',
      usuarioNaoSelecionado: 'Escolha um usuário da lista.',
    },
    idPlano: { required: 'Selecione o plano.' },
    idPeriodicidade: { required: 'Selecione a periodicidade.' },
    idFormaPagamento: { required: 'Selecione a forma de pagamento.' },
    idCupom: {},
    observacao: { maxlength: 'A observação deve ter no máximo 255 caracteres.' },
  };

  constructor(
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private router: Router,
  ) {
    this.form = this.fb.group({
      usuario: [null as Usuario | string | null, [Validators.required, usuarioSelecionado]],
      idPlano: [null as number | null, [Validators.required]],
      idPeriodicidade: [1 as number | null, [Validators.required]],
      idCupom: [null as number | null],
      idFormaPagamento: [null as number | null, [Validators.required]],
      observacao: ['', [Validators.maxLength(255)]],
    });

    this.valores = toSignal(this.form.valueChanges, { initialValue: this.form.value });

    this.resumo = computed(() => {
      const valores = this.valores();
      const plano = this.planos().find((p) => p.id === valores.idPlano);
      if (!plano || !valores.idPeriodicidade) return null;

      const anual = valores.idPeriodicidade === PERIODICIDADE_ANUAL;
      const preco = anual ? plano.precoAnual : plano.precoMensal;
      const cupom = this.cupons().find((c) => c.id === valores.idCupom) ?? null;
      const valorPago = calcularValorPago(preco, cupom?.percentualDesconto ?? null);

      return { plano, anual, preco, cupom, desconto: preco - valorPago, valorPago };
    });
  }

  ngOnInit(): void {
    const hoje = hojeIso();

    // catalogos pequenos: carrega e filtra o que pode ser contratado
    this.planoService.findAll(0, 100).subscribe({
      next: (response) => this.planos.set(response.items.filter((p) => p.ativo)),
      error: (error: unknown) => console.error('Erro ao buscar planos:', error),
    });

    this.cupomService.findAll(0, 100).subscribe({
      next: (response) => this.cupons.set(response.items.filter((c) => c.ativo && c.validade >= hoje)),
      error: (error: unknown) => console.error('Erro ao buscar cupons:', error),
    });

    // usuarios podem ser muitos: a busca e feita no back conforme o admin digita
    this.form
      .get('usuario')!
      .valueChanges.pipe(
        filter((valor) => typeof valor === 'string' || valor === null),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((texto: string | null) =>
          texto && texto.trim().length >= 2 ? this.usuarioService.findAll(0, 10, texto) : of(null),
        ),
      )
      .subscribe({
        // conta desativada nao pode receber assinatura (o back tambem recusa)
        next: (response) => this.usuariosEncontrados.set(response ? response.items.filter((u) => u.ativo) : []),
        error: (error: unknown) => console.error('Erro ao buscar usuários:', error),
      });
  }

  exibirUsuario(usuario: Usuario | string | null): string {
    if (!usuario) return '';
    return typeof usuario === 'string' ? usuario : `${usuario.nome} (${usuario.email})`;
  }

  salvar(): void {
    limparErrosDaApi(this.form);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.exibirMensagem('Corrija os campos destacados antes de salvar.');
      return;
    }

    this.assinaturaService.create(this.toRequest()).subscribe({
      next: () => {
        this.exibirMensagem('Assinatura criada com sucesso!');
        this.router.navigate(['/assinaturas']);
      },
      error: (error: HttpErrorResponse) => {
        // no back o campo se chama idUsuario; aqui o controle e "usuario" (autocomplete)
        const problem = error.error as ApiProblem | null;
        problem?.errors?.forEach((e) => {
          if (e.field === 'idUsuario') e.field = 'usuario';
        });
        const temErroDeCampo = !!problem?.errors?.length;
        const mensagem = aplicarErrosDaApi(this.form, error, 'Erro ao criar assinatura.');
        this.exibirMensagem(temErroDeCampo ? 'Corrija os campos destacados.' : mensagem);
        console.error('Erro ao criar assinatura:', error);
      },
    });
  }

  voltar(): void {
    this.location.back();
  }

  getErrorMessage(field: string): string | null {
    return mensagemDeErro(this.form.get(field), this.fieldMessages[field] ?? {});
  }

  private toRequest(): AssinaturaRequest {
    const value = this.form.getRawValue();
    const observacao = String(value.observacao ?? '').trim();

    return {
      idUsuario: (value.usuario as Usuario).id,
      idPlano: Number(value.idPlano),
      idCupom: value.idCupom ? Number(value.idCupom) : null,
      idPeriodicidade: Number(value.idPeriodicidade),
      idFormaPagamento: Number(value.idFormaPagamento),
      observacao: observacao.length > 0 ? observacao : null,
    };
  }

  private exibirMensagem(mensagem: string): void {
    this.snack.open(mensagem, 'Ok', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
