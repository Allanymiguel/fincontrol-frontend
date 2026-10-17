import { Assinatura } from './assinatura.model';
import { Usuario } from './usuario.model';

// Visao do admin sobre um usuario (GET /admin/usuarios/{id}/resumo): perfil, assinaturas e
// so as QUANTIDADES dos registros pessoais. O conteudo deles nunca vem do back.
export interface UsuarioResumo {
  usuario: Usuario;
  // null se nao tiver assinatura ATIVA
  assinaturaAtual: Assinatura | null;
  // da mais recente para a mais antiga
  assinaturas: Assinatura[];
  contagens: {
    transacoes: number;
    categorias: number;
    contatos: number;
  };
  // "yyyy-MM-dd" da transacao mais recente; null se nao tiver nenhuma
  ultimaTransacaoEm: string | null;
}
