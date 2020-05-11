import DbCollectionSchema from "./DbCollectionSchema";
export default interface DbSchema {
    version: number;
    name: string;
    collections: DbCollectionSchema[];
}
