import { Injectable } from '@angular/core';
import { MAT_NATIVE_DATE_FORMATS, MatDateFormats, NativeDateAdapter } from '@angular/material/core';
import { FORMATO_DATA, deDataIso } from './data';

// Campos de data (mat-datepicker) em dia/mes/ano. O NativeDateAdapter so le datas digitadas no
// formato americano (MM/DD/AAAA); aqui a leitura e a escrita do campo sao dd/MM/aaaa. O calendario
// (nomes de meses e dias) continua vindo do adaptador nativo, no locale pt-BR.
@Injectable()
export class DataBrAdapter extends NativeDateAdapter {
  // aceita 31/12/2026, 1/2/2026 e 31122026 (so numeros)
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value !== 'string') return super.parse(value, parseFormat);

    const texto = value.trim();
    if (texto === '') return null;

    const partes = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto) ?? /^(\d{2})(\d{2})(\d{4})$/.exec(texto);
    if (!partes) return this.invalid();

    const [dia, mes, ano] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
    // data local (sem UTC); 31/02 "transbordaria" para marco, entao e recusada
    const data = new Date(ano, mes - 1, dia);
    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return this.invalid();

    return data;
  }

  // valor vindo da API ("yyyy-MM-dd"): data local. O nativo usaria meia-noite UTC, que no
  // Brasil (UTC-3) aparece como o dia anterior.
  override deserialize(value: unknown): Date | null {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return deDataIso(value);
    return super.deserialize(value);
  }

  override format(date: Date, displayFormat: object): string {
    if ((displayFormat as unknown) !== FORMATO_DATA) return super.format(date, displayFormat);

    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${date.getFullYear()}`;
  }
}

// o que aparece no campo (e e lido dele) e dd/MM/aaaa; o resto do calendario segue o nativo
export const FORMATOS_DATA_BR: MatDateFormats = {
  ...MAT_NATIVE_DATE_FORMATS,
  parse: { ...MAT_NATIVE_DATE_FORMATS.parse, dateInput: FORMATO_DATA },
  display: { ...MAT_NATIVE_DATE_FORMATS.display, dateInput: FORMATO_DATA },
};
