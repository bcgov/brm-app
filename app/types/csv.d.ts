export interface CSVRowData {
  filename: string;
  downloadFile: string | File;
  lastUpdated: number;
  updatedBy: string;
}

export interface CSVRow extends CSVRowData {
  key: string;
  actions: JSX.Element;
  runResult?: JSX.Element | null;
}
