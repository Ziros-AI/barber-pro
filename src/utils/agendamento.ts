export const isHorarioAgendamentoValido = (dateValue: Date | string) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const hour = date.getHours();
  const minutes = date.getMinutes();

  if (hour < 8 || hour > 19) {
    return false;
  }

  if (hour === 19 && minutes > 0) {
    return false;
  }

  return true;
};

export const getHorarioAgendamentoMensagem = () =>
  'Escolha um horário entre 08:00 e 19:00. O último horário disponível é 19:00.';
