import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models.js';
export type * from './prismaNamespace.js';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: import("@prisma/client-runtime-utils").DbNullClass;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
export declare const ModelName: {
    readonly User: 'User';
    readonly Persona: 'Persona';
    readonly Scenario: 'Scenario';
    readonly Simulation: 'Simulation';
    readonly OtpVerification: 'OtpVerification';
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: 'ReadUncommitted';
    readonly ReadCommitted: 'ReadCommitted';
    readonly RepeatableRead: 'RepeatableRead';
    readonly Serializable: 'Serializable';
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const UserScalarFieldEnum: {
    readonly id: 'id';
    readonly name: 'name';
    readonly email: 'email';
    readonly password: 'password';
    readonly createdAt: 'createdAt';
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const PersonaScalarFieldEnum: {
    readonly id: 'id';
    readonly name: 'name';
    readonly age: 'age';
    readonly gender: 'gender';
    readonly education: 'education';
    readonly income: 'income';
    readonly savings: 'savings';
    readonly monthly_expenses: 'monthly_expenses';
    readonly wealth: 'wealth';
    readonly debt: 'debt';
    readonly risk_appetite: 'risk_appetite';
    readonly spending_behavior: 'spending_behavior';
    readonly saving_preference: 'saving_preference';
    readonly investment_preference: 'investment_preference';
    readonly createdAt: 'createdAt';
    readonly user_id: 'user_id';
};
export type PersonaScalarFieldEnum = (typeof PersonaScalarFieldEnum)[keyof typeof PersonaScalarFieldEnum];
export declare const ScenarioScalarFieldEnum: {
    readonly id: 'id';
    readonly scenario_name: 'scenario_name';
    readonly inflation_rate: 'inflation_rate';
    readonly interest_rate: 'interest_rate';
    readonly unemployment_rate: 'unemployment_rate';
    readonly market_volatility: 'market_volatility';
    readonly createdAt: 'createdAt';
    readonly user_id: 'user_id';
};
export type ScenarioScalarFieldEnum = (typeof ScenarioScalarFieldEnum)[keyof typeof ScenarioScalarFieldEnum];
export declare const SimulationScalarFieldEnum: {
    readonly id: 'id';
    readonly persona_name: 'persona_name';
    readonly scenario_name: 'scenario_name';
    readonly summary: 'summary';
    readonly decisions: 'decisions';
    readonly confidence: 'confidence';
    readonly behavioral_traits: 'behavioral_traits';
    readonly theory_alignment: 'theory_alignment';
    readonly reasoning: 'reasoning';
    readonly createdAt: 'createdAt';
    readonly user_id: 'user_id';
};
export type SimulationScalarFieldEnum = (typeof SimulationScalarFieldEnum)[keyof typeof SimulationScalarFieldEnum];
export declare const OtpVerificationScalarFieldEnum: {
    readonly id: 'id';
    readonly email: 'email';
    readonly otp: 'otp';
    readonly name: 'name';
    readonly password: 'password';
    readonly expiresAt: 'expiresAt';
    readonly createdAt: 'createdAt';
};
export type OtpVerificationScalarFieldEnum = (typeof OtpVerificationScalarFieldEnum)[keyof typeof OtpVerificationScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: 'asc';
    readonly desc: 'desc';
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const JsonNullValueInput: {
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
};
export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput];
export declare const QueryMode: {
    readonly default: 'default';
    readonly insensitive: 'insensitive';
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: 'first';
    readonly last: 'last';
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const JsonNullValueFilter: {
    readonly DbNull: import("@prisma/client-runtime-utils").DbNullClass;
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
    readonly AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
//# sourceMappingURL=prismaNamespaceBrowser.d.ts.map