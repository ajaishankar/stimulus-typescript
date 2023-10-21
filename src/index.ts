import { Context, Controller } from "@hotwired/stimulus";

class Wrapped<T extends object> {
  // @ts-ignore
  private _ = undefined;
}

/**
 * Strongly type Object values
 * ```ts
 * const values = {
 *  address: Object_<{ street: string }>
 * }
 * ```
 */
export const Object_ = Wrapped;
export const ObjectAs = Object_;
/**
 * Strongly type custom targets
 * ```ts
 * const targets = {
 *  select: Target<CustomSelect>
 * }
 * ```
 */
export const Target = Wrapped;

/**
 * Identifier to camel case (admin--user-status to adminUserStatus)
 */
type CamelCase<K extends string> = K extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<CamelCase<Tail>>}`
  : K;

type ElementType<C> = C extends Controller<infer E> ? E : never;

type Singular<T, Suffix extends string> = {
  [K in keyof T as `${CamelCase<K & string>}${Suffix}`]: T[K];
};

type Existential<T, Suffix extends string> = {
  readonly [K in keyof T as `has${Capitalize<CamelCase<K & string>>}${Suffix}`]: boolean;
};

type Plural<T, Suffix extends string> = {
  readonly [K in keyof T as `${CamelCase<K & string>}${Suffix}s`]: T[K][];
};

type Elemental<T, Suffix extends string> = {
  readonly [K in keyof T as `${CamelCase<K & string>}${Suffix}Element`]: ElementType<T[K]>;
} & {
  readonly [K in keyof T as `${CamelCase<K & string>}${Suffix}Elements`]: ElementType<T[K]>[];
};

type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

type MagicProperties<T, Kind extends string> = Singular<T, Kind> &
  Existential<T, Kind> &
  (Kind extends "Target" | "Outlet" ? Plural<T, Kind> : unknown) &
  (Kind extends "Outlet" ? Elemental<T, Kind> : unknown);

type Constructor<T = {}> = new (...args: any[]) => T;

type TypeFromConstructor<C> = C extends StringConstructor
  ? string
  : C extends NumberConstructor
  ? number
  : C extends BooleanConstructor
  ? boolean
  : C extends Constructor<infer T>
  ? T extends Wrapped<infer O>
    ? O
    : Object extends T
    ? unknown
    : T
  : never;

/**
 * Map `{ [key:string]: Constructor<T> } to { [key:string]: T }`
 */
type TransformType<T extends {}> = {
  [K in keyof T]: TypeFromConstructor<T[K]>;
};

/**
 * Transform `{ [key:string]: ValueTypeConstant | ValueTypeObject }`
 */
type TransformValueDefinition<T extends {}> = TransformType<{
  [K in keyof T]: T[K] extends { type: infer U } ? U : T[K];
}>;

// tweak stimulus value definition map to support typed array and object
type ValueDefinitionMap = {
  [token: string]: ValueTypeDefinition;
};

type ValueTypeConstant =
  | typeof Array<any>
  | typeof Boolean
  | typeof Number
  | typeof Object
  | typeof String
  | typeof Object_;

type ValueTypeDefault = Array<any> | boolean | number | Object | typeof Object_ | string;

type ValueTypeObject = Partial<{
  type: ValueTypeConstant;
  default: ValueTypeDefault;
}>;

type ValueTypeDefinition = ValueTypeConstant | ValueTypeObject;

type TargetDefinitionMap = {
  [token: string]: typeof Element | typeof Target;
};

type OutletDefinitionMap = {
  [token: string]: Constructor<Controller>;
};

type Statics<
  Values extends ValueDefinitionMap,
  Targets extends TargetDefinitionMap,
  Outlets extends OutletDefinitionMap,
> = {
  values?: Values;
  targets?: Targets;
  outlets?: Outlets;
};

type StimulusProperties<
  Values extends ValueDefinitionMap,
  Targets extends TargetDefinitionMap,
  Outlets extends OutletDefinitionMap,
> = Simplify<
  MagicProperties<TransformValueDefinition<Values>, "Value"> &
    MagicProperties<TransformType<Targets>, "Target"> &
    MagicProperties<TransformType<Outlets>, "Outlet">
>;

/**
 * Convert typed Object_ to ObjectConstructor before passing values to Stimulus
 */
function patchValueTypeDefinitionMap(values: ValueDefinitionMap) {
  const patchObject = (def: ValueTypeDefinition) => {
    if ("type" in def) {
      return {
        type: def.type === ObjectAs ? Object : def.type,
        default: def.default,
      };
    } else {
      return def === ObjectAs ? Object : def;
    }
  };
  return Object.entries(values).reduce((result, [key, def]) => {
    result[key] = patchObject(def);
    return result;
  }, {} as ValueDefinitionMap);
}

/**
 * Strongly typed Controller!
 * ```ts
 * const values = {
 *  name: String,
 *  alias: Array<string>,
 *  address: Object_<{ street: string }>
 * }
 * const targets = { form: HTMLFormElement }
 * const outlets = { "user-status": UserStatusController, "customSelect": Target<CustomSelect> }
 *
 * class MyController extends Typed(Controller, { values, targets, outlets }) {
 *  // Look Ma, no "declare ..."
 *  this.nameValue.split(' ')
 *  this.aliasValue.map(alias => alias.toUpperCase())
 *  this.addressValue.street
 *  this.formTarget.submit()
 *  this.customSelectTarget.search();
 *  this.userStatusOutlets.forEach(status => status.markAsSelected(event))
 * }
 * ```
 */
export function Typed<
  Values extends ValueDefinitionMap,
  Targets extends TargetDefinitionMap,
  Outlets extends OutletDefinitionMap,
  Base extends Constructor<Controller>,
>(Base: Base, statics: Statics<Values, Targets, Outlets>) {
  const { values, targets, outlets } = statics;

  const derived = class extends Base {
    static values = patchValueTypeDefinitionMap(values ?? {});
    static targets = Object.getOwnPropertyNames(targets ?? {});
    static outlets = Object.getOwnPropertyNames(outlets ?? {});
  };

  return derived as unknown as {
    new (context: Context): InstanceType<Base> & StimulusProperties<Values, Targets, Outlets>;
  };
}
