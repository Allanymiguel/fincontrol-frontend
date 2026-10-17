import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DadosCompletosRequest } from '../models/cadastro.model';
import { apenasDigitos, documentoValidator } from './documento';

// Regras compartilhadas pelas duas telas de cadastro de usuario (a publica "Criar conta" e a do
// admin): cadastro simples = so o acesso; completo = tambem dados fiscais e endereco.

// ids do enum PerfilFiscal do back
export const PERFIL_PF = 1;
export const PERFIL_MEI = 2;

// campos que so existem no cadastro completo
export const CAMPOS_COMPLETOS = [
  'idPerfilFiscal',
  'idAtividadeMei',
  'documento',
  'telefone',
  'cep',
  'logradouro',
  'numero',
  'complemento',
  'bairro',
  'idMunicipio',
] as const;

// configuracao dos controles do cadastro completo, para o FormBuilder
export function camposCompletos() {
  return {
    idPerfilFiscal: [null as number | null, [Validators.required]],
    idAtividadeMei: [null as number | null],
    documento: ['', [Validators.required, documentoValidator()]],
    telefone: ['', [Validators.pattern(/^\d{10,11}$/)]],
    cep: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    logradouro: ['', [Validators.required, Validators.maxLength(120)]],
    numero: ['', [Validators.required, Validators.maxLength(10)]],
    complemento: ['', [Validators.maxLength(60)]],
    bairro: ['', [Validators.required, Validators.maxLength(60)]],
    idMunicipio: [null as number | null, [Validators.required]],
  };
}

// Liga ou desliga os campos do completo. Desabilitados, eles nao sao validados (o cadastro simples
// salva mesmo com eles vazios).
export function definirCompleto(form: FormGroup, completo: boolean): void {
  for (const campo of CAMPOS_COMPLETOS) {
    const control = form.get(campo);
    if (!control) continue;
    if (completo) control.enable({ emitEvent: false });
    else control.disable({ emitEvent: false });
  }
  aplicarRegraMei(form);
  form.updateValueAndValidity();
}

// a atividade so e obrigatoria (e so aparece) para MEI; devolve a inscricao para o componente encerrar
export function ligarRegraMei(form: FormGroup): Subscription {
  return form.get('idPerfilFiscal')!.valueChanges.subscribe(() => aplicarRegraMei(form));
}

function aplicarRegraMei(form: FormGroup): void {
  const perfil = form.get('idPerfilFiscal');
  const atividade = form.get('idAtividadeMei');
  if (!perfil || !atividade) return;

  if (perfil.enabled && perfil.value === PERFIL_MEI) {
    atividade.setValidators([Validators.required]);
  } else {
    atividade.clearValidators();
    if (perfil.value !== PERFIL_MEI) atividade.setValue(null, { emitEvent: false });
  }
  atividade.updateValueAndValidity({ emitEvent: false });
}

// "Confirmar senha" igual a "Senha"
export const senhasIguais: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  const confirmar = grupo.get('confirmarSenha');
  if (!confirmar || confirmar.disabled || !confirmar.value) return null;

  const diferentes = grupo.get('senha')?.value !== confirmar.value;
  const { senhasDiferentes, ...outros } = confirmar.errors ?? {};
  confirmar.setErrors(diferentes ? { ...outros, senhasDiferentes: true } : Object.keys(outros).length ? outros : null);
  return null;
};

// PF usa CPF (11 digitos); MEI e ME sao empresas e usam CNPJ (14)
export const documentoDoPerfil: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  const documento = grupo.get('documento');
  const perfil = grupo.get('idPerfilFiscal')?.value as number | null;
  const digitos = apenasDigitos(documento?.value);
  if (!documento || documento.disabled || !perfil || (digitos.length !== 11 && digitos.length !== 14)) return null;

  const esperado = perfil === PERFIL_PF ? 11 : 14;
  const { documentoDoPerfil: _, ...outros } = documento.errors ?? {};
  documento.setErrors(
    digitos.length !== esperado ? { ...outros, documentoDoPerfil: true } : Object.keys(outros).length ? outros : null,
  );
  return null;
};

// parte do corpo da requisicao com os dados do cadastro completo
export function dadosCompletos(form: FormGroup): DadosCompletosRequest {
  const v = form.getRawValue();
  const telefone = apenasDigitos(v.telefone);
  const complemento = String(v.complemento ?? '').trim();

  return {
    documento: apenasDigitos(v.documento),
    telefone: telefone.length > 0 ? telefone : null,
    idPerfilFiscal: Number(v.idPerfilFiscal),
    idAtividadeMei: v.idAtividadeMei ? Number(v.idAtividadeMei) : null,
    cep: apenasDigitos(v.cep),
    logradouro: String(v.logradouro).trim(),
    numero: String(v.numero).trim(),
    complemento: complemento.length > 0 ? complemento : null,
    bairro: String(v.bairro).trim(),
    idMunicipio: Number(v.idMunicipio),
  };
}

// mensagens dos campos das telas de cadastro
export const MENSAGENS_CADASTRO: Record<string, Record<string, string>> = {
  nome: {
    required: 'Nome é obrigatório.',
    minlength: 'Nome deve ter ao menos 2 caracteres.',
    maxlength: 'Nome deve ter no máximo 120 caracteres.',
  },
  email: {
    required: 'E-mail é obrigatório.',
    email: 'Informe um e-mail válido.',
    maxlength: 'E-mail deve ter no máximo 120 caracteres.',
  },
  senha: {
    required: 'Senha é obrigatória.',
    minlength: 'A senha deve ter ao menos 8 caracteres.',
    maxlength: 'A senha deve ter no máximo 64 caracteres.',
  },
  confirmarSenha: {
    required: 'Confirme a senha.',
    senhasDiferentes: 'As senhas não conferem.',
  },
  idPapel: { required: 'Selecione o papel.' },
  idPerfilFiscal: { required: 'Selecione o perfil fiscal.' },
  idAtividadeMei: { required: 'Selecione a atividade do MEI.' },
  documento: {
    required: 'Documento é obrigatório.',
    documentoTamanho: 'Informe 11 dígitos (CPF) ou 14 dígitos (CNPJ).',
    documentoInvalido: 'CPF/CNPJ inválido.',
    documentoDoPerfil: 'Pessoa física usa CPF; MEI e microempresa usam CNPJ.',
  },
  telefone: { pattern: 'Informe DDD + número (10 ou 11 dígitos).' },
  cep: { required: 'CEP é obrigatório.', pattern: 'O CEP deve ter 8 dígitos.' },
  logradouro: { required: 'Logradouro é obrigatório.', maxlength: 'No máximo 120 caracteres.' },
  numero: { required: 'Número é obrigatório.', maxlength: 'No máximo 10 caracteres.' },
  complemento: { maxlength: 'No máximo 60 caracteres.' },
  bairro: { required: 'Bairro é obrigatório.', maxlength: 'No máximo 60 caracteres.' },
  idMunicipio: { required: 'Consulte o CEP para preencher cidade e UF.' },
};
