/**
 * CSV Export Utility
 * Helper functions for generating CSV files
 */

export const CSVExport = {
  /**
   * Escape CSV value (handle quotes and commas)
   */
  escapeCSV(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  },

  /**
   * Generate CSV from array of objects
   */
  generateCSV(data: any[], headers: { key: string; label: string }[]): string {
    const csvRows: string[] = [];

    // Add header row
    csvRows.push(headers.map(h => this.escapeCSV(h.label)).join(','));

    // Add data rows
    data.forEach(row => {
      const values = headers.map(h => this.escapeCSV(row[h.key]));
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  },

  /**
   * Generate CSV with summary statistics
   */
  generateCSVWithSummary(
    data: any[],
    headers: { key: string; label: string }[],
    summary: { label: string; value: any }[]
  ): string {
    const csvRows: string[] = [];

    // Add summary section
    summary.forEach(stat => {
      csvRows.push(`${this.escapeCSV(stat.label)},${this.escapeCSV(stat.value)}`);
    });
    csvRows.push(''); // Empty line

    // Add header row
    csvRows.push(headers.map(h => this.escapeCSV(h.label)).join(','));

    // Add data rows
    data.forEach(row => {
      const values = headers.map(h => this.escapeCSV(row[h.key]));
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  },
};
