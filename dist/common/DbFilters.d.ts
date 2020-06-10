/**
 * The standard database filter comparsion.
 * @author Rodrigo Portela
 */
export declare enum DbFilterComparison {
    EQUALS_TO = 0,
    NOT_EQUALS_TO = 1,
    GREATER_THAN = 2,
    GRATER_OR_EQUAL = 3,
    LOWER_THAN = 4,
    LOWER_OR_EQUAL = 5,
    IN = 6,
    NOT_IN = 7,
    LIKE = 8,
    NOT_LIKE = 9
}
/**
 * The filter join operation. Either an AND or an OR.
 */
export declare enum DbFilterOperation {
    AND = 0,
    OR = 1
}
/**
 * The type of filter that a filter class should have.
 */
export declare enum DbFilterType {
    TERM = 0,
    NODE = 1,
    EXPRESSION = 2
}
/**
 * An interface for a database query filter.
 */
export interface DbFilter {
    filterType(): DbFilterType;
    filterRecord(record: any): boolean;
}
/**
 * A database filter term.
 */
export declare class DbFilterTerm implements DbFilter {
    name: string;
    comparison: DbFilterComparison;
    value: any;
    constructor(name: string, comparison: DbFilterComparison, value: any);
    filterRecord(record: any): boolean;
    filterType(): DbFilterType;
}
/**
 * A database filter expression node.
 */
export declare class DbFilterNode implements DbFilter {
    filter: DbFilter;
    operation?: DbFilterOperation;
    next?: DbFilterNode;
    constructor(filter: DbFilter);
    filterRecord(record: any): boolean;
    filterType(): DbFilterType;
}
/**
 * A database filter expression.
 */
export declare class DbFilterExpression implements DbFilter {
    first: DbFilterNode;
    private last;
    constructor(filter: DbFilter);
    filterRecord(record: any): boolean;
    filterType(): DbFilterType;
    and(filter: DbFilter): DbFilterExpression;
    or(filter: DbFilter): DbFilterExpression;
}
