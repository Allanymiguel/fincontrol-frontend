import { Estado } from './estado.model';

export interface Municipio {
  id: number;
  nome: string;
  codigoIbge: string;
  estado: Estado;
}
