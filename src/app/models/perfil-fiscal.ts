export class PerfilFiscal {
  id!: number;
  nome!: string;
}

export const PERFIS_FISCAIS: PerfilFiscal[] = [
  { id: 1, nome: 'Pessoa Física' },
  { id: 2, nome: 'Microempreendedor Individual' },
  { id: 3, nome: 'Microempresa' },
];
