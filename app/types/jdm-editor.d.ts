// These used to be imported from the jdm editor itself, but that caused build problems

export type SchemaSelectProps = {
  field: string;
  name?: string;
  items?: SchemaSelectProps[];
};

export type PanelType = {
  id: string;
  icon: default_2.ReactNode;
  title: string;
  renderPanel?: default_2.FC;
  hideHeader?: boolean;
  onClick?: () => void;
};
