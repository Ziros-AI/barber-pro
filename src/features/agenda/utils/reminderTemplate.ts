const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const replaceTokenGlobal = (template: string, tokenLiteral: string, replacement: string): string => {
  const re = new RegExp(escapeRegExp(tokenLiteral), 'gi');
  return template.replace(re, () => replacement);
};

export function parseLembretesAtivos(value: unknown): boolean {
  if (value === false || value === 'false' || value === 0) {
    return false;
  }
  if (value === true || value === 'true' || value === 1) {
    return true;
  }
  if (value === null || value === undefined) {
    return true;
  }
  return Boolean(value);
}

export function applyReminderTemplate(
  template: string,
  vars: { nome: string; servico: string; hora: string; barbearia: string }
): string {
  let result = template;
  result = replaceTokenGlobal(result, '{nome}', vars.nome);
  result = replaceTokenGlobal(result, '{servico}', vars.servico);
  result = replaceTokenGlobal(result, '{hora}', vars.hora);
  result = replaceTokenGlobal(result, '{barbearia}', vars.barbearia);
  result = replaceTokenGlobal(result, '{nome_barbearia}', vars.barbearia);
  return result;
}
