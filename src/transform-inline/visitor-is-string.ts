import * as ts from 'typescript';
import * as tsutils from 'tsutils/typeguard/3.0';
import { VisitorContext } from './visitor-context';
import * as VisitorUtils from './visitor-utils';
import * as VisitorIsStringKeyof from './visitor-is-string-keyof';
import { setUnion, setIntersection } from './utils';

function visitRegularObjectType() {
    return false;
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
        return visitRegularObjectType();
    }
}

function visitUnionOrIntersectionType(type: ts.UnionOrIntersectionType, visitorContext: VisitorContext) {
    const stringTypes = type.types.map((type) => visitType(type, visitorContext));

    if (tsutils.isUnionType(type)) {
        if (stringTypes.some((stringType) => stringType === true)) {
            // If T or U is the string type, then T | U is assignable to the string type.
            return true;
        }
        if (stringTypes.some((stringType) => stringType !== false)) {
            // Some T or U is a union of specific string literals.
            const stringSets = stringTypes.filter((stringType) => stringType !== false) as Set<string>[];
            let strings = stringSets[0];
            for (let i = 1; i < stringSets.length; i++) {
                strings = setUnion(strings, stringSets[i]);
            }
            return strings;
        } else {
            // Both T and U are not assignable to string.
            return false;
        }
    } else {
        if (stringTypes.some((stringType) => stringType === false)) {
            // If T or U is not assignable to stirng, then T & U is not assignable to string.
            return false;
        }
        if (stringTypes.some((stringType) => stringType !== true)) {
            // Some T or U is a union of specific string literals.
            const stringSets = stringTypes.filter((stringType) => stringType !== true) as Set<string>[];
            let strings = stringSets[0];
            for (let i = 1; i < stringSets.length; i++) {
                strings = setIntersection(strings, stringSets[i]);
            }
            return strings;
        } else {
            // Both T and U are assignable to string.
            return true;
        }
    }
}

function visitIndexType(type: ts.Type, visitorContext: VisitorContext) {
    const indexedType = (type as { type?: ts.Type }).type;
    if (indexedType === undefined) {
        throw new Error('Could not get indexed type of index type.');
    }
    return VisitorIsStringKeyof.visitType(indexedType, visitorContext);
}

function visitNonPrimitiveType() {
    return false;
}

function visitLiteralType(type: ts.LiteralType) {
    if (typeof type.value === 'string') {
        return new Set([type.value]);
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
    return false;
}

function visitString() {
    return true;
}

function visitBooleanLiteral() {
    return false;
}

function visitNumber() {
    return false;
}

function visitUndefined() {
    return false;
}

function visitNull() {
    return false;
}

function visitNever() {
    return false;
}

function visitUnknown() {
    return false;
}

function visitAny() {
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
        return visitIndexType(type, visitorContext);
    } else if (tsutils.isIndexedAccessType(type)) {
        // Indexed access type: T[U]
        // return visitIndexedAccessType(type, visitorContext);
        // TODO:
        throw new Error('Not yet implemented.');
    } else {
        throw new Error('Could not generate type-check; unsupported type with flags: ' + type.flags);
    }
}
