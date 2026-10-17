import { DATE_PIPE_DEFAULT_OPTIONS, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { routes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';
import { FORMATO_DATA } from './utils/data';
import { DataBrAdapter, FORMATOS_DATA_BR } from './utils/data-br-adapter';

registerLocaleData(localePt);

function getPtBrPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();

  paginatorIntl.itemsPerPageLabel = 'Itens por página:';
  paginatorIntl.nextPageLabel = 'Próxima página';
  paginatorIntl.previousPageLabel = 'Página anterior';
  paginatorIntl.firstPageLabel = 'Primeira página';
  paginatorIntl.lastPageLabel = 'Última página';
  paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return `0 de ${length}`;
    }

    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, length);

    if (startIndex + 1 === endIndex) {
      return `${startIndex + 1} de ${length}`;
    }

    return `${startIndex + 1} - ${endIndex} de ${length}`;
  };

  return paginatorIntl;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: MatPaginatorIntl, useFactory: getPtBrPaginatorIntl },
    // pipes number/date no formato brasileiro (R$ 1.500,00)
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    // "| date" sem formato ja mostra dd/MM/yyyy em todo o front
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { dateFormat: FORMATO_DATA } },
    // campos de data (mat-datepicker) em dd/MM/aaaa e calendario em portugues
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: DateAdapter, useClass: DataBrAdapter },
    { provide: MAT_DATE_FORMATS, useValue: FORMATOS_DATA_BR },
    // <mat-icon> usa a fonte Material Symbols (carregada no index.html) em vez da Material Icons
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    }),
  ],
};
