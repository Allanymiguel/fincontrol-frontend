// Mesmo calculo do back (AssinaturaServiceImpl.calcularValorPago): preco menos o percentual
// do cupom, arredondado em centavos "meio para cima" (BigDecimal HALF_UP).
// A conta e feita em inteiros (centavos e centesimos de percentual) para nao sofrer com
// o arredondamento de ponto flutuante: 199,00 - 12,5% = 174,125 -> 174,13, igual ao back.
export function calcularValorPago(preco: number, percentualDesconto: number | null): number {
  const centavos = Math.round(preco * 100);
  if (!percentualDesconto) return centavos / 100;

  const percentualEmCentesimos = Math.round(percentualDesconto * 100); // 12,5% -> 1250
  return Math.round((centavos * (10000 - percentualEmCentesimos)) / 10000) / 100;
}
