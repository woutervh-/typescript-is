import * as ts from 'typescript';
import * as tsutils from 'tsutils/typeguard/3.0';
import { VisitorContext } from './visitor-context';
import * as VisitorUtils from './visitor-utils';
import { setIntersection, setUnion } from './utils';

function visitRegularObjectType(type: ts.Type, visitorContext: VisitorContext) {
    const stringIndexType = visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.String);
    if (stringIndexType) {
        return true;
    }
    const properties = visitorContext.checker.getPropertiesOfType(type);
    const propertiesInfo = properties.map((property) => VisitorUtils.getPropertyInfo(property, visitorContext));
    const propertiesName = propertiesInfo.map((propertyInfo) => propertyInfo.name);
    return new Set(propertiesName);
}

function visitTupleObjectType() {
    return false;
}

function visitArrayObjectType() {
    return false;
}

function visitObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    if (tsutils.isTupleType(type)) {
        // Tuple with finite length.
        return visitTupleObjectType();
    } else if (visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number)) {
        // Index type is number -> array type.
        return visitArrayObjectType();
    } else {
        // Index type is string -> regular object type.
        return visitRegularObjectType(type, visitorContext);
    }
}

function visitUnionOrIntersectionType(type: ts.UnionOrIntersectionType, visitorContext: VisitorContext) {
    const stringTypes = type.types.map((type) => visitType(type, visitorContext));

    if (tsutils.isUnionType(type)) {
        // keyof (T | U) = (keyof T) & (keyof U)
        if (stringTypes.some((stringType) => stringType === false)) {
            // If keyof T or keyof U is not assignable to string then keyof T & keyof U is not assignable to string.
            return false;
        }
        if (stringTypes.some((stringType) => stringType !== true)) {
            // Some keyof T or keyof U is a union of specific string literals.
            const stringSets = stringTypes.filter((stringType) => stringType !== true) as Set<string>[];
            let strings = stringSets[0];
            for (let i = 1; i < stringSets.length; i++) {
                strings = setIntersection(strings, stringSets[i]);
            }
            return strings;
        } else {
            // Both keyof T and keyof U are the string type.
            return true;
        }
    } else {
        // keyof (T & U) = (keyof T) | (keyof U)
        if (stringTypes.some((stringType) => stringType === true)) {
            // If keyof T or keyof U is the string type then keyof T | keyof U is assignable to the string type.
            return true;
        }
        if (stringTypes.some((stringType) => stringType !== false)) {
            const stringSets = stringTypes.filter((stringType) => stringType !== false) as Set<string>[];
            let strings = stringSets[0];
            for (let i = 1; i < stringSets.length; i++) {
                strings = setUnion(strings, stringSets[i]);
            }
            return strings;
        } else {
            // Both keyof T and keyof U are not assignable to the string type.
            return false;
        }
    }
}

function visitIndexType(): boolean {
    // TODO: implement a visitor that checks if the index type is an object, then this can be a string.
    throw new Error('Not yet implemented.');
}

function visitNonPrimitiveType() {
    return false;
}

function visitLiteralType(type: ts.LiteralType) {
    if (typeof type.value === 'string') {
        return false;
    } else if (typeof type.value === 'number') {
        return false;
    } else {
        throw new Error('Type value is expected to be a string or number.');
    }
}

function visitTypeReference(type: ts.TypeReference, visitorContext: VisitorContext) {
    const mapping: Map<ts.Type, ts.Type> = VisitorUtils.getTypeReferenceMapping(type, visitorContext);
    const previousTypeReference = visitorContext.previousTypeReference;
    visitorContext.typeMapperStack.push(mapping);
    visitorContext.previousTypeReference = type;
    const result = visitType(type.target, visitorContext);
    visitorContext.previousTypeReference = previousTypeReference;
    visitorContext.typeMapperStack.pop();
    return result;
}

function visitTypeParameter(type: ts.Type, visitorContext: VisitorContext) {
    const mappedType = VisitorUtils.getResolvedTypeParameter(type, visitorContext);
    if (mappedType === undefined) {
        throw new Error('Unbound type parameter, missing type node.');
    }
    return visitType(mappedType, visitorContext);
}

function visitBigInt() {
    return false;
}

function visitBoolean() {
    // keyof boolean
    return false;
}

function visitString() {
    // keyof string
    return false;
}

function visitBooleanLiteral() {
    // keyof true/keyof false
    return false;
}

function visitNumber() {
    // keyof number
    return false;
}

function visitUndefined() {
    // keyof undefined
    return false;
}

function visitNull() {
    // keyof null
    return false;
}

function visitNever() {
    // keyof never
    return false;
}

function visitUnknown() {
    // keyof unknown
    return false;
}

function visitAny() {
    // keyof any
    return true;
}

export function visitType(type: ts.Type, visitorContext: VisitorContext): Set<string> | boolean {
    if ((ts.TypeFlags.Any & type.flags) !== 0) {
        // Any
        return visitAny();
    } else if ((ts.TypeFlags.Unknown & type.flags) !== 0) {
        // Unknown
        return visitUnknown();
    } else if ((ts.TypeFlags.Never & type.flags) !== 0) {
        // Never
        return visitNever();
    } else if ((ts.TypeFlags.Null & type.flags) !== 0) {
        // Null
        return visitNull();
    } else if ((ts.TypeFlags.Undefined & type.flags) !== 0) {
        // Undefined
        return visitUndefined();
    } else if ((ts.TypeFlags.Number & type.flags) !== 0) {
        // Number
        return visitNumber();
    } else if (VisitorUtils.isBigIntType(type)) {
        // BigInt
        return visitBigInt();
    } else if ((ts.TypeFlags.Boolean & type.flags) !== 0) {
        // Boolean
        return visitBoolean();
    } else if ((ts.TypeFlags.String & type.flags) !== 0) {
        // String
        return visitString();
    } else if ((ts.TypeFlags.BooleanLiteral & type.flags) !== 0) {
        // Boolean literal (true/false)
        return visitBooleanLiteral();
    } else if (tsutils.isTypeReference(type) && visitorContext.previousTypeReference !== type) {
        // Type references.
        return visitTypeReference(type, visitorContext);
    } else if ((ts.TypeFlags.TypeParameter & type.flags) !== 0) {
        // Type parameter
        return visitTypeParameter(type, visitorContext);
    } else if (tsutils.isObjectType(type)) {
        // Object type (including interfaces, arrays, tuples)
        return visitObjectType(type, visitorContext);
    } else if (tsutils.isLiteralType(type)) {
        // Literal string/number types ('foo')
        return visitLiteralType(type);
    } else if (tsutils.isUnionOrIntersectionType(type)) {
        // Union or intersection type (| or &)
        return visitUnionOrIntersectionType(type, visitorContext);
    } else if ((ts.TypeFlags.NonPrimitive & type.flags) !== 0) {
        // Non-primitive such as object
        return visitNonPrimitiveType();
    } else if ((ts.TypeFlags.Index & type.flags) !== 0) {
        // Index type: keyof T
        return visitIndexType();
    } else if (tsutils.isIndexedAccessType(type)) {
        // Indexed access type: T[U]
        // return visitIndexedAccessType(type, visitorContext);
        // TODO:
        throw new Error('Not yet implemented.');
    } else {
        throw new Error('Could not generate type-check; unsupported type with flags: ' + type.flags);
    }
}
