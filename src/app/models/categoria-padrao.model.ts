import { TipoTransacao } from './tipo-transacao';

export interface CategoriaPadrao {
  id: number;
  nome: string;
  tipo: TipoTransacao;
  cor: string | null;
  arquivada: boolean;
}

// Corpo enviado no POST/PUT (formato do CategoriaPadraoRequestDTO do back).
// "arquivada" nao vai aqui: muda so pelo PATCH /{id}/arquivar.
export interface CategoriaPadraoRequest {
  nome: string;
  idTipo: number;
  cor: string | null;
}
