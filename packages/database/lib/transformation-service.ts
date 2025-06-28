import { TransformedDataRow, TransformationRule, SourceType, DataType } from 'config/types/data-transformation';

export class TransformationService {
  /**
   * Applies a series of transformation rules to a dataset.
   */
  static async transform(
    data: any[],
    rules: TransformationRule[],
    source: SourceType
  ): Promise<TransformedDataRow[]> {
    // In a real implementation, we would fetch categories from the DB
    const categories = await this.getSystemCategories();

    const transformedData = data.map(row => 
      this.transformRow(row, rules, source, categories)
    );

    return transformedData;
  }

  /**
   * Transforms a single row of data.
   */
  private static transformRow(
    row: any,
    rules: TransformationRule[],
    source: SourceType,
    categories: any[]
  ): TransformedDataRow {
    // This is a placeholder for the full transformation logic.
    // It should apply rules for normalization, categorization, etc.

    const id = row.id || `${source.toLowerCase()}-${Date.now()}-${Math.random()}`;
    const name = this.findBestMatch(row, ['name', 'description', 'transaction', 'item']);
    const date = this.normalizeDate(this.findBestMatch(row, ['date', 'transaction_date', 'posted_date']));
    const amount = this.normalizeAmount(this.findBestMatch(row, ['amount', 'value', 'price']));
    
    const transformedRow: TransformedDataRow = {
      id,
      name,
      date,
      amount,
      source,
      data_type: DataType.ACTUAL, // Default, can be overridden by rules
      category_id: this.categorize(name, categories),
    };

    // Apply specific rules
    for (const rule of rules) {
      // Placeholder for rule application logic
    }

    return transformedRow;
  }

  /**
   * Normalizes a date string to ISO format.
   */
  private static normalizeDate(dateStr: string | Date | undefined): string {
    if (!dateStr) return new Date().toISOString();
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return new Date().toISOString();
      }
      return date.toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }

  /**
   * Normalizes an amount to a number.
   */
  private static normalizeAmount(amountStr: any): number {
    if (typeof amountStr === 'number') return amountStr;
    if (typeof amountStr === 'string') {
      const num = parseFloat(amountStr.replace(/[^0-9.-]+/g,""));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  /**
   * Simple categorization logic based on keywords.
   */
  private static categorize(description: string, categories: any[]): string {
    const desc = description.toLowerCase();
    
    // In a real implementation, this would be more sophisticated.
    if (desc.includes('salary') || desc.includes('payroll')) return 'salary';
    if (desc.includes('rent')) return 'rent';
    if (desc.includes('software') || desc.includes('saas')) return 'software';

    return 'uncategorized'; // Default category
  }

  /**
   * Finds the first non-empty value from a list of possible keys in an object.
   */
  private static findBestMatch(row: any, keys: string[]): any {
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      // Check for exact match first
      if (row[key]) return row[key];
      // Then check case-insensitively
      for (const rowKey in row) {
        if (rowKey.toLowerCase() === lowerKey) {
          return row[rowKey];
        }
      }
    }
    return '';
  }

  /**
   * Placeholder for fetching system-defined categories.
   */
  private static async getSystemCategories() {
    // This would fetch from the Category table in the database
    return [
      { id: 'salary', name: 'Salary' },
      { id: 'rent', name: 'Rent' },
      { id: 'software', name: 'Software' },
      { id: 'uncategorized', name: 'Uncategorized' },
    ];
  }
} 