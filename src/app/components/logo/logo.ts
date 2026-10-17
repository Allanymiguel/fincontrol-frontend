import { Component } from '@angular/core';

// Simbolo do FinControl: tres fatias em degrau (grafico de rosa). A maior fica na cor de destaque;
// as outras duas usam a cor do texto do pai (branco na barra lateral e no painel do login).
// O tamanho vem do CSS de quem usa.
@Component({
  selector: 'app-logo',
  styleUrl: './logo.css',
  templateUrl: './logo.html',
})
export class Logo {}
