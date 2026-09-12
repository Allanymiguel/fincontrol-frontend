import { Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { EstadoService } from '../../../services/estado.service';
import { ActivatedRoute, Router } from '@angular/router';
import {MatSelectModule} from '@angular/material/select';
import { Regiao } from '../../../models/regiao.model';
import { RegiaoService } from '../../../services/regiao.service';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';

@Component({
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, 
            MatInputModule, MatButtonModule, MatToolbarModule, 
            MatSelectModule, MatIconModule, MatSnackBarModule],
  selector: 'app-estado-form',
  styleUrl: './estado-form.css',
  templateUrl: './estado-form.html',
})
export class EstadoForm implements OnInit {

  readonly form: FormGroup;
  private readonly location = inject(Location);
  regioes: Regiao[] = [];

  constructor(
    private fb: FormBuilder,
    private estadoService: EstadoService,
    private regiaoService: RegiaoService,
    private activatedRoute: ActivatedRoute,
    private snack: MatSnackBar,
    private router: Router
  ) {
    this.form = this.fb.group({
      id: [null],
      nome: [''],
      sigla: [''],
      idRegiao: null
    });
  }
  ngOnInit(): void {

    const estado = this.activatedRoute.snapshot.data['estado'];

    if (estado) {
      this.form.patchValue(estado);
    }

    this.regiaoService.findAll().subscribe({
      next: (regioes) => {
        this.regioes = regioes;

        // Preencher o campo idRegiao com o valor correto do estado, se disponível
        if (estado) {
          this.form.patchValue({ idRegiao: estado.regiao.id });
        }

      },
      error: (error) => {
        console.error('Erro ao buscar regiões:', error);
      }
    });
  }

  salvar () {
      const estado = this.form.value;

      let resultado = (estado.id) ? 
        this.estadoService.update(estado.id, estado) : 
        this.estadoService.create(estado);

      resultado.subscribe({
        next: () => {
          this.exibirMensagem('Estado salvo com sucesso!');
          this.router.navigate(['/estados']);
        },
        error: (error) => {
          this.exibirMensagem('Erro ao salvar estado!');
          console.error('Erro ao salvar estado:', error);
        }
      });
  }

  excluir() {
    const estado = this.form.value;

    if (estado.id) {
      this.estadoService.delete(estado.id).subscribe({
        next: () => {
          this.exibirMensagem('Estado excluído com sucesso!');
          this.router.navigate(['/estados']);
        },
        error: (error) => {
          this.exibirMensagem('Erro ao excluir estado!');
          console.error('Erro ao excluir estado:', error);
        }
      });
    }
  }

  exibirMensagem(mensagem: string): void {
    this.snack.open(mensagem, 'Ok', {
      duration: 2500, // Duração em milissegundos
      horizontalPosition: 'center', // Posição horizontal (opcional)
      verticalPosition: 'top', // Posição vertical (opcional)
    });
  }

  voltar(): void {
    this.location.back();
  }
}
