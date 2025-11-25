export interface Invoice {
  id: string;
  accessKey: string;
  responsible: string;
  issuer: string;
  totalValue: number;
  createdAt: string;
}

export interface InvoiceFormData {
  accessKey: string;
  responsible: string;
  issuer: string;
  totalValue: string; // Keep as string for input handling, convert on save
}

export enum AppView {
  LIST = 'LIST',
  FORM = 'FORM',
  SCANNER = 'SCANNER'
}