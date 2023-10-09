import { TelegramError } from '../types/common';

export const isTelegramError = (error: any): error is TelegramError => {
  return error.code !== undefined;
};
