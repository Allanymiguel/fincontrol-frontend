import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TransacaoService } from '../../../services/transacao.service';
import { Transacao } from '../../../models/transacao.model';
import { TIPO_TRANSACAO_LABELS, TipoTransacao } from '../../../models/tipo-transacao';
import { ESCOPO_TRANSACAO_LABELS, EscopoTransacao } from '../../../models/escopo-transacao';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  imports: [MatTableModule, MatInputModule, MatFormFieldModule,
            MatToolbarModule, MatButtonModule, MatIconModule, RouterLink,
            CurrencyPipe, DatePipe
            ],
  selector: 'app-transacao-list',
  styleUrl: './transacao-list.css',
  templateUrl: './transacao-list.html',
})
export class TransacaoList {

  displayedColumns: string[] = ['data', 'descricao', 'categoria', 'tipo', 'escopo', 'valor', 'acao'];
  dataSource = new MatTableDataSource<Transacao>();

  constructor(private transacaoService: TransacaoService) { }

  ngOnInit() {
    this.transacaoService.findAll().subscribe((transacoes: Transacao[]) => {
      this.dataSource.data = transacoes;
    });
  }

  tipoLabel(tipo: TipoTransacao): string {
    return TIPO_TRANSACAO_LABELS[tipo];
  }

  escopoLabel(escopo: EscopoTransacao): string {
    return ESCOPO_TRANSACAO_LABELS[escopo];
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
