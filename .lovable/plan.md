

## Integração do Google Analytics

### Resumo
Adicionar o código de rastreamento do Google Analytics (gtag.js) ao site Badesul de forma segura e sem impacto no funcionamento atual.

### Por que é seguro?

1. **Carregamento assíncrono**: O atributo `async` no script garante que o código carrega em paralelo, sem bloquear a renderização da página
2. **Não interfere no React**: O gtag.js opera independentemente do código React/Vite
3. **Prática padrão**: Milhões de sites usam essa mesma abordagem sem problemas

### Implementação

Será necessário apenas uma alteração no arquivo `index.html`:

```text
┌─────────────────────────────────────────┐
│  index.html                             │
├─────────────────────────────────────────┤
│  <!doctype html>                        │
│  <html lang="en">                       │
│    <head>                               │
│      <!-- Google Analytics (gtag.js) -->│  ← ADICIONAR AQUI
│      <script async src="..."></script>  │
│      <script>gtag config...</script>    │
│                                         │
│      <meta charset="UTF-8" />           │
│      ... resto do head ...              │
│    </head>                              │
└─────────────────────────────────────────┘
```

### Detalhes Técnicos

**Arquivo a modificar:** `index.html`

**Código a inserir** (logo após `<head>`):
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-J6TV1DXVF5"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-J6TV1DXVF5');
</script>
```

### Checklist de Implementação

| # | Item | Descrição |
|---|------|-----------|
| 1 | Inserir scripts GA | Adicionar código gtag.js no `<head>` do index.html |
| 2 | Verificar funcionamento | Confirmar que o site carrega normalmente |
| 3 | Testar no GA | Validar que eventos estão sendo capturados no painel do Google Analytics |

### Observação

Como este é um Single Page Application (SPA) React, o Google Analytics capturará automaticamente o pageview inicial. Se futuramente você quiser rastrear navegações internas entre rotas (ex: quando o usuário abre um dashboard), podemos implementar tracking adicional usando `react-router-dom`.

