export declare type InputOutputField = {
  id?: string;
  field: string;
  name?: string;
  description?: string;
  dataType?: string;
  validationCriteria?: string;
  validationType?: string;
  childFields?: InputOutputField[];
};
