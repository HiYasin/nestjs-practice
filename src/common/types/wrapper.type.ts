// Wrapping a type in an alias makes emitDecoratorMetadata emit `Object` instead of
// a reference to the class, avoiding TDZ errors with circular imports under ESM.
export type WrapperType<T> = T;
