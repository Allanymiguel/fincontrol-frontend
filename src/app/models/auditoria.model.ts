// Auditoria das acoes do admin (GET /admin/auditoria). Somente leitura.
export interface ItemEnum {
  id: number;
  nome: string;
}

// oculto = documento ou telefone: so se sabe que mudou (antes e depois vem nulos)
export interface AlteracaoAuditoria {
  campo: string;
  antes: string | null;
  depois: string | null;
  oculto: boolean;
}

export interface EventoAuditoria {
  id: number;
  // "yyyy-MM-ddTHH:mm:ss"
  dataHora: string;
  adminNome: string;
  adminEmail: string | null;
  acao: ItemEnum;
  tipoAlvo: ItemEnum;
  idAlvo: number | null;
  descricaoAlvo: string | null;
  alteracoes: AlteracaoAuditoria[];
}

export interface AdminAuditoria {
  keycloakId: string;
  nome: string;
  email: string | null;
}

export interface FiltrosAuditoria {
  acoes: ItemEnum[];
  tiposAlvo: ItemEnum[];
  admins: AdminAuditoria[];
}

// filtros da consulta; datas em "yyyy-MM-dd"
export interface FiltroAuditoria {
  idAdmin?: string | null;
  idAcao?: number | null;
  idTipoAlvo?: number | null;
  idAlvo?: number | null;
  busca?: string | null;
  inicio?: string | null;
  fim?: string | null;
}
