import * as ts from 'typescript';
import * as tsutils from 'tsutils/typeguard/3.0';
import { VisitorContext } from './visitor-context';
import * as VisitorUtils from './visitor-utils';
import * as VisitorTypeName from './visitor-type-name';

function visitUnionOrIntersectionType(type: ts.UnionOrIntersectionType, visitorContext: VisitorContext) {
    const name = VisitorTypeName.visitType(type, visitorContext, { type: 'keyof' });
    return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
        const functionNames = type.types.map((type) => visitType(type, visitorContext));
        if (tsutils.isUnionType(type)) {
            // keyof (T | U) = (keyof T) & (keyof U)
            return VisitorUtils.createConjunctionFunction(functionNames, name);
        } else {
            // keyof (T & U) = (keyof T) | (keyof U)
            return VisitorUtils.createDisjunctionFunction(functionNames, name);
        }
    });
}

function visitIndexType(visitorContext: VisitorContext) {
    // keyof keyof T = never (actually it's the methods of string, but we'll ignore those since they're not serializable)
    return VisitorUtils.getNeverFunction(visitorContext);
}

function visitNonPrimitiveType(type: ts.Type, visitorContext: VisitorContext) {
    // Using internal TypeScript API, hacky.
    const intrinsicName: string | undefined = (type as { intrinsicName?: string }).intrinsicName;
    if (intrinsicName === 'object') {
        // keyof object = never
        return VisitorUtils.getNeverFunction(visitorContext);
    } else {
        throw new Error(`Unsupported non-primitive with intrinsic name: ${intrinsicName}.`);
    }
}

function visitLiteralType(visitorContext: VisitorContext) {
    // keyof 'string' = never and keyof 0xFF = never (actually they are the methods of string and number, but we'll ignore those since they're not serializable)
    return VisitorUtils.getNeverFunction(visitorContext);
}

function visitRegularObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    const stringIndexType = visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.String);
    if (stringIndexType) {
        // There is a string index type { [Key: string]: T }.
        // keyof { [Key: string]: U } = string
        return VisitorUtils.getStringFunction(visitorContext);
    } else {
        const name = VisitorTypeName.visitType(type, visitorContext, { type: 'keyof' });
        return VisitorUtils.setFunctionIfNotExists(name, visitorContext, () => {
            // In keyof mode we check if the object is equal to one of the property names.
            // keyof { x: T } = x
            const properties = visitorContext.checker.getPropertiesOfType(type);
            const names = properties.map((property) => property.name);
            const condition = VisitorUtils.createBinaries(
                names.map((name) => ts.createStrictInequality(VisitorUtils.objectIdentifier, ts.createStringLiteral(name))),
                ts.SyntaxKind.AmpersandAmpersandToken,
                ts.createTrue()
            );
            return VisitorUtils.createAssertionFunction(
                condition,
                `expected ${names.map((name) => `'${name}'`).join('|')}`,
                name
            );
        });
    }
}

function visitTupleObjectType(visitorContext: VisitorContext) {
    // keyof [U, T] = number
    // TODO: actually they're only specific numbers (0, 1, 2...)
    return VisitorUtils.getNumberFunction(visitorContext);
}

function visitArrayObjectType(visitorContext: VisitorContext) {
    // keyof [] = number
    return VisitorUtils.getNumberFunction(visitorContext);
}

function visitObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    if (tsutils.isTupleType(type)) {
        // Tuple with finite length.
        return visitTupleObjectType(visitorContext);
    } else if (visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number)) {
        // Index type is number -> array type.
        return visitArrayObjectType(visitorContext);
    } else {
        // Index type is string -> regular object type.
        return visitRegularObjectType(type, visitorContext);
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

function visitBoolean(visitorContext: VisitorContext) {
    // keyof boolean = never
    return VisitorUtils.getNeverFunction(visitorContext);
}

function visitString(visitorContext: VisitorContext) {
    // keyof string = never (actually it's all the methods of string, but we'll ignore those since they're not serializable)
    return VisitorUtils.getNeverFunction(visitorContext);
}

function visitBooleanLiteral(visitorContext: VisitorContext) {
    // keyof true = never and keyof false = never
    return VisitorUtils.getNeverFunction(visitorContext);
}

function visitBigInt(visitorContext: VisitorContext) {
    // keyof bigint = never
    return VisitorUtils.getNeverFunction(visitorContext);
}

function visitNumber(visitorContext: VisitorContext) {
    // keyof number = never
    return VisitorUtils.getNeverFunction(visitorContext);
}

function visitUndefined(visitorContext: VisitorContext) {
    // keyof undefined = never
    return VisitorUtils.getNeverFunction(visitorContext);
}

function visitNull(visitorContext: VisitorContext) {
    // keyof null = never
    return VisitorUtils.getNeverFunction(visitorContext);
}

function visitNever(visitorContext: VisitorContext) {
    // keyof never = never
    return VisitorUtils.getNeverFunction(visitorContext);
}

function visitUnknown(visitorContext: VisitorContext) {
    // keyof unknown = never
    return VisitorUtils.getNeverFunction(visitorContext);
}

function visitAny(visitorContext: VisitorContext) {
    // keyof any = string (or symbol or number but we'll ignore those since they're not serializable)
    return VisitorUtils.getStringFunction(visitorContext);
}

export function visitType(type: ts.Type, visitorContext: VisitorContext): string {
    if ((ts.TypeFlags.Any & type.flags) !== 0) {
        // Any
        return visitAny(visitorContext);
    } else if ((ts.TypeFlags.Unknown & type.flags) !== 0) {
        // Unknown
        return visitUnknown(visitorContext);
    } else if ((ts.TypeFlags.Never & type.flags) !== 0) {
        // Never
        return visitNever(visitorContext);
    } else if ((ts.TypeFlags.Null & type.flags) !== 0) {
        // Null
        return visitNull(visitorContext);
    } else if ((ts.TypeFlags.Undefined & type.flags) !== 0) {
        // Undefined
        return visitUndefined(visitorContext);
    } else if ((ts.TypeFlags.Number & type.flags) !== 0) {
        // Number
        return visitNumber(visitorContext);
    } else if (VisitorUtils.isBigIntType(type)) {
        // BigInt
        return visitBigInt(visitorContext);
    } else if ((ts.TypeFlags.Boolean & type.flags) !== 0) {
        // Boolean
        return visitBoolean(visitorContext);
    } else if ((ts.TypeFlags.String & type.flags) !== 0) {
        // String
        return visitString(visitorContext);
    } else if ((ts.TypeFlags.BooleanLiteral & type.flags) !== 0) {
        // Boolean literal (true/false)
        return visitBooleanLiteral(visitorContext);
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
        return visitLiteralType(visitorContext);
    } else if (tsutils.isUnionOrIntersectionType(type)) {
        // Union or intersection type (| or &)
        return visitUnionOrIntersectionType(type, visitorContext);
    } else if ((ts.TypeFlags.NonPrimitive & type.flags) !== 0) {
        // Non-primitive such as object
        return visitNonPrimitiveType(type, visitorContext);
    } else if ((ts.TypeFlags.Index & type.flags) !== 0) {
        // Index type: keyof T
        return visitIndexType(visitorContext);
    } else if (tsutils.isIndexedAccessType(type)) {
        // Indexed access type: T[U]
        // return visitIndexedAccessType(type, visitorContext);
        // TODO:
        throw new Error('Not yet implemented.');
    } else {
        throw new Error('Could not generate type-check; unsupported type with flags: ' + type.flags);
    }
}
