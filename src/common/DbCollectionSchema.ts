import DbIndexSchema from "./DbIndexSchema";

export default interface DbCollectionSchema {
  name: string;
  keyPath?: string;
  autoIncrement?: boolean;
  indexes?: DbIndexSchema[] | null | undefined;
}
