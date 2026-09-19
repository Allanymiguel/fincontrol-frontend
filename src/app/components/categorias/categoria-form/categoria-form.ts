import { Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TIPOS_TRANSACAO, TipoTransacao } from '../../../models/tipo-transacao';
import { CategoriaService } from '../../../services/categoria.service';

@Component({
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatToolbarModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  selector: 'app-categoria-form',
  styleUrl: './categoria-form.css',
  templateUrl: './categoria-form.html',
})
export class CategoriaForm implements OnInit {
  readonly form: FormGroup;
  private readonly location = inject(Location);
  tipos: TipoTransacao[] = TIPOS_TRANSACAO;

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    private activatedRoute: ActivatedRoute,
    private snack: MatSnackBar,
    private router: Router,
  ) {
    this.form = this.fb.group({
      id: [null],
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      idTipo: [null, Validators.required],
      cor: [''],
      ativa: [true, Validators.required],
    });
  }

  ngOnInit(): void {
    const categoria = this.activatedRoute.snapshot.data['categoria'];

    if (categoria) {
      this.form.patchValue({
        ...categoria,
        idTipo: categoria.tipo?.id,
      });
    }
  }

  salvar() {
    const categoria = this.form.value;

    const resultado = categoria.id
      ? this.categoriaService.update(categoria.id, categoria)
      : this.categoriaService.create(categoria);

    resultado.subscribe({
      next: () => {
        this.exibirMensagem('Categoria salva com sucesso!');
        this.router.navigate(['/categorias']);
      },
      error: (error: unknown) => {
        this.exibirMensagem('Erro ao salvar categoria!');
        console.error('Erro ao salvar categoria:', error);
      },
    });
  }

  excluir() {
    const categoria = this.form.value;

    if (categoria.id) {
      this.categoriaService.delete(categoria.id).subscribe({
        next: () => {
          this.exibirMensagem('Categoria excluída com sucesso!');
          this.router.navigate(['/categorias']);
        },
        error: (error: unknown) => {
          this.exibirMensagem('Erro ao excluir categoria!');
          console.error('Erro ao excluir categoria:', error);
        },
      });
    }
  }

  exibirMensagem(mensagem: string): void {
    this.snack.open(mensagem, 'Ok', {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  voltar(): void {
    this.location.back();
  }
}
