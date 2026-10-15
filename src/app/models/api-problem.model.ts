export interface ApiFieldError {
  field: string;
  message: string;
}

// Formato de erro devolvido pelo back (RFC 7807 / ProblemDetail)
export interface ApiProblem {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  timestamp: string;
  traceId?: string | null;
  errors?: ApiFieldError[];
}
