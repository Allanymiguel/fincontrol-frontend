import { AssinaturaResumo } from './assinatura.model';
import { AtividadeMei } from './atividade-mei';
import { Endereco } from './contato.model';
import { Papel } from './papel';
import { PerfilFiscal } from './perfil-fiscal';

// Usuario visto pelo admin. Cadastro simples tem so nome, e-mail (e a senha no Keycloak);
// o completo tambem tem documento, perfil fiscal e endereco.
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  documento: string | null;
  telefone: string | null;
  // null no cadastro simples
  perfilFiscal: PerfilFiscal | null;
  // so para MEI
  atividadeMei: AtividadeMei | null;
  papel: Papel;
  ativo: boolean;
  // null no cadastro simples
  endereco: Endereco | null;
  // documento, perfil fiscal e endereco preenchidos
  cadastroCompleto: boolean;
  // so nas respostas do admin; null se o usuario nao tiver assinatura (o proprio admin)
  assinatura?: AssinaturaResumo | null;
}
