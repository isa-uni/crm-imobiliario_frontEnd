export const historicoOptions = [
  { value: 'novo', label: 'Novo' },
  { value: 'reaquecido', label: 'Reaquecido' },
  { value: 'vencido', label: 'Vencido' },
];

export const historicoLabel = (value: string) => historicoOptions.find(o => o.value === value)?.label || value;
