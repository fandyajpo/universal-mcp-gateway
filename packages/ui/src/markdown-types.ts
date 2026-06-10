import type { ExtraProps } from "react-markdown";

export type { ExtraProps };

export type ElementChildren = {
  children?: React.ReactNode;
} & ExtraProps;
