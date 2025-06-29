export enum SourceType {
  PLAID = 'PLAID',
  GOOGLE_SHEETS = 'GOOGLE_SHEETS',
  ACUITY = 'ACUITY',
  CSV = 'CSV',
}

export enum DataType {
  ACTUAL = 'ACTUAL',
  BUDGET = 'BUDGET',
  FORECAST = 'FORECAST',
}

export interface TransformedDataRow {
  id: string;
  name: string;
  date: string; // ISO string
  amount: number;
  source: SourceType;
  category_id: string;
  data_type: DataType;
  [key: string]: any;
}

export interface Category {
  id: string;
  name: string;
  parent_id?: string;
  business_type?: string;
  created_by?: string;
}

export interface TransformationRule {
  field: string;
  operation: 'normalize' | 'categorize' | 'calculate' | 'format';
  config: Record<string, any>;
} 