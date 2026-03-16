import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 11;
}

export function getErrorMessage(error: unknown, fallback = 'Erro desconhecido'): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return fallback;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function mapClienteError(error: unknown): Error {
  if (typeof error === 'object' && error !== null) {
    const supabaseError = error as { code?: unknown; message?: unknown };

    if (
      supabaseError.code === '23505' &&
      typeof supabaseError.message === 'string' &&
      supabaseError.message.includes('clientes_email_key')
    ) {
      return new Error('Ja existe um cliente cadastrado com este e-mail.');
    }
  }

  return new Error(getErrorMessage(error, 'Nao foi possivel salvar o cliente.'));
}
