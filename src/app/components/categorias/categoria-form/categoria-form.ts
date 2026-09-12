import { Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CategoriaService } from '../../../services/categoria.service';
import { TIPOS_TRANSACAO, TIPO_TRANSACAO_LABELS } from '../../../models/tipo-transacao';

@Component({
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule,
            MatInputModule, MatButtonModule, MatToolbarModule,
            MatSelectModule, MatIconModule, MatSnackBarModule, MatSlideToggleModule],
  selector: 'app-categoria-form',
  styleUrl: './categoria-form.css',
  templateUrl: './categoria-form.html',
})
export class CategoriaForm implements OnInit {

  readonly form: FormGroup;
  private readonly location = inject(Location);
  readonly tipos = TIPOS_TRANSACAO;
  readonly tipoLabels = TIPO_TRANSACAO_LABELS;

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    private activatedRoute: ActivatedRoute,
    private snack: MatSnackBar,
    private router: Router
  ) {
    this.form = this.fb.group({
      id: [null],
      nome: [''],
      tipo: [''],
      cor: ['#4F46E5'],
      ativa: [true]
    });
  }

  ngOnInit(): void {
    const categoria = this.activatedRoute.snapshot.data['categoria'];

    if (categoria) {
      this.form.patchValue(categoria);
    }
  }

  onColorPick(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.form.patchValue({ cor: value });
  }

  salvar() {
    const categoria = this.form.value;

    let resultado: Observable<unknown> = (categoria.id) ?
      this.categoriaService.update(categoria.id, categoria) :
      this.categoriaService.create(categoria);

    resultado.subscribe({
      next: () => {
        this.exibirMensagem('Categoria salva com sucesso!');
        this.router.navigate(['/categorias']);
      },
      error: (error) => {
        this.exibirMensagem('Erro ao salvar categoria!');
        console.error('Erro ao salvar categoria:', error);
      }
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
        error: (error) => {
          this.exibirMensagem('Erro ao excluir categoria!');
          console.error('Erro ao excluir categoria:', error);
        }
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
