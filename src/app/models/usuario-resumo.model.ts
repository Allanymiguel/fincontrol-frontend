import { Assinatura } from './assinatura.model';
import { Pagamento } from './pagamento.model';
import { Usuario } from './usuario.model';

// Visao do admin sobre um usuario (GET /admin/usuarios/{id}/resumo): perfil, assinatura, pagamentos e
// so as QUANTIDADES dos registros pessoais. O conteudo deles nunca vem do back.
export interface UsuarioResumo {
  usuario: Usuario;
  // null se o usuario nao tiver assinatura (o admin, por exemplo)
  assinatura: Assinatura | null;
  // cobrancas, da mais recente para a mais antiga
  pagamentos: Pagamento[];
  contagens: {
    transacoes: number;
    categorias: number;
    contatos: number;
  };
  // "yyyy-MM-dd" da transacao mais recente; null se nao tiver nenhuma
  ultimaTransacaoEm: string | null;
}
