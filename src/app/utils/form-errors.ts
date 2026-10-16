import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ApiProblem } from '../models/api-problem.model';

// Funcoes compartilhadas pelos forms para exibir erros de validacao (do front e do back)

// Mensagem do primeiro erro do campo, so depois que o usuario mexeu nele.
// O erro "api" (vindo do back) tem prioridade sobre os do front.
export function mensagemDeErro(
  control: AbstractControl | null,
  messages: Record<string, string>,
): string | null {
  if (!control || !control.touched || !control.errors) {
    return null;
  }

  if (typeof control.errors['api'] === 'string') {
    return control.errors['api'];
  }

  for (const key of Object.keys(messages)) {
    if (control.hasError(key)) {
      return messages[key];
    }
  }

  return 'Campo inválido.';
}

// Erros de validacao do back (400 com lista "errors") vao para o campo correspondente.
// Devolve a mensagem geral do problema, para o form exibir no snackbar.
export function aplicarErrosDaApi(
  form: FormGroup,
  error: HttpErrorResponse,
  fallbackMessage: string,
): string {
  if (error.status === 0) {
    return 'Sem conexão com o servidor.';
  }

  const problem = error.error as ApiProblem | null;

  if (problem?.errors?.length) {
    for (const fieldError of problem.errors) {
      const control = form.get(fieldError.field);
      if (control) setErroDaApi(control, fieldError.message);
    }
  }

  return problem?.detail || problem?.title || fallbackMessage;
}

export function setErroDaApi(control: AbstractControl, message: string): void {
  control.setErrors({ ...(control.errors ?? {}), api: message });
  control.markAsTouched();
}

export function limparErrosDaApi(control: AbstractControl): void {
  if (control instanceof FormGroup) {
    for (const child of Object.values(control.controls)) {
      limparErrosDaApi(child);
    }
  }

  if (!control.errors?.['api']) {
    return;
  }

  const { api, ...rest } = control.errors;
  control.setErrors(Object.keys(rest).length > 0 ? rest : null);
}
