import { AssinaturaResumo } from './assinatura.model';
import { AtividadeMei } from './atividade-mei';
import { Endereco } from './contato.model';
import { Papel } from './papel';
import { PerfilFiscal } from './perfil-fiscal';

// Somente leitura no admin: o cadastro do usuario vira do Keycloak
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  documento: string | null;
  telefone: string | null;
  perfilFiscal: PerfilFiscal;
  // so para MEI
  atividadeMei: AtividadeMei | null;
  papel: Papel;
  ativo: boolean;
  // opcional no cadastro do usuario
  endereco: Endereco | null;
  // so nas respostas do admin; null se o usuario nao tiver assinatura (o proprio admin)
  assinatura?: AssinaturaResumo | null;
}
