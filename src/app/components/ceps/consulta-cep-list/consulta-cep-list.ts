import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  ConsultaCep,
  FONTES_CONSULTA,
  RESULTADOS_CONSULTA,
  formatarCep,
} from '../../../models/endereco-cliente.model';
import { CepAdminService } from '../../../services/cep-admin.service';
import { paraDataIso } from '../../../utils/data';

// Log das buscas de CEP do cadastro de clientes (uma linha por fonte consultada). So leitura.
@Component({
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
  ],
  selector: 'app-consulta-cep-list',
  templateUrl: './consulta-cep-list.html',
  styleUrl: './consulta-cep-list.css',
})
export class ConsultaCepList implements OnInit {
  private readonly cepService = inject(CepAdminService);

  readonly fontes = FONTES_CONSULTA;
  readonly resultados = RESULTADOS_CONSULTA;
  readonly formatarCep = formatarCep;

  displayedColumns: string[] = ['dataHora', 'cep', 'fonte', 'resultado'];
  dataSource = new MatTableDataSource<ConsultaCep>();
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;

  cepFilter = '';
  idFonte: number | null = null;
  idResultado: number | null = null;
  inicio: Date | null = null;
  fim: Date | null = null;
  private readonly cepChanges = new Subject<string>();

  ngOnInit(): void {
    this.carregar();
    this.cepChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.filtrar());
  }

  carregar(): void {
    this.cepService.consultas(this.pageIndex, this.pageSize, {
      cep: this.cepFilter, idFonte: this.idFonte, idResultado: this.idResultado,
      inicio: paraDataIso(this.inicio), fim: paraDataIso(this.fim),
    }).subscribe({
      next: (response) => {
        this.dataSource.data = response.items;
        this.pageIndex = response.page;
        this.pageSize = response.pageSize;
        this.totalItems = response.totalItems;
      },
      error: (error: unknown) => console.error('Erro ao buscar o log de consultas de CEP:', error),
    });
  }

  filtrar(): void {
    this.pageIndex = 0;
    this.carregar();
  }

  onCepInput(valor: string): void {
    this.cepFilter = valor;
    this.cepChanges.next(valor);
  }

  onPeriodoChange(): void {
    if ((this.inicio && this.fim) || (!this.inicio && !this.fim)) this.filtrar();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.carregar();
  }

  // encontrado = verde; nao encontrado = amarelo; falha = vermelho
  tomResultado(consulta: ConsultaCep): string {
    return consulta.resultado.id === 1 ? 'tag tag-ok' : consulta.resultado.id === 2 ? 'tag tag-alerta' : 'tag tag-erro';
  }
}
