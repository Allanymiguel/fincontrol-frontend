import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function apenasDigitos(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '');
}

// Mesma regra do DocumentoUtil do back (digitos verificadores, modulo 11)
export function isCpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false;

  const digito = (tamanho: number) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

export function isCnpjValido(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1+$/.test(cnpj)) return false;

  const digito = (pesos: number[]) => {
    const soma = pesos.reduce((acc, peso, i) => acc + Number(cnpj[i]) * peso, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = digito([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digito([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

// Validator do Reactive Forms: aceita CPF (11) ou CNPJ (14) com digitos validos
export function documentoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = apenasDigitos(control.value);
    if (!valor) return null; // o "required" cuida do vazio

    if (valor.length !== 11 && valor.length !== 14) return { documentoTamanho: true };

    const valido = valor.length === 11 ? isCpfValido(valor) : isCnpjValido(valor);
    return valido ? null : { documentoInvalido: true };
  };
}

export function formatarDocumento(doc: string | null | undefined): string {
  const d = apenasDigitos(doc);
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return doc ?? '';
}

export function formatarCep(cep: string | null | undefined): string {
  const d = apenasDigitos(cep);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : (cep ?? '');
}
