export type ComboBoxItem<T> = {
  label: string;
  value: string;
  item: T;
};

export type TelegramError = {
  code: number;
  errorMessage: string;
};
