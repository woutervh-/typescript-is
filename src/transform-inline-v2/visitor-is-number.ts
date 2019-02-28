import * as ts from 'typescript';
import * as tsutils from 'tsutils';
import { VisitorContext } from './visitor-context';
import * as VisitorUtils from './visitor-utils';

function visitRegularObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    // In keyof mode we check if the object is equal to one of the property names.
    const name = VisitorUtils.getFullTypeName(type, visitorContext, 'keyof');
    if (!visitorContext.functionMap.has(name)) {
        const properties = visitorContext.checker.getPropertiesOfType(type);
        const names = properties.map((property) => property.name);
        const condition = VisitorUtils.createBinaries(
            names.map((name) => ts.createStrictEquality(objectIdentifier, ts.createStringLiteral(name))),
            ts.SyntaxKind.BarBarToken
        );
        visitorContext.functionMap.set(
            name,
            VisitorUtils.createAssertionFunction(
                ts.createLogicalNot(condition),
                `expected ${names.map((name) => `'${name}'`).join('|')}`,
                name
            )
        );
    }
    return visitorContext.functionMap.get(name)!;
}

function visitTupleObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    type Foo = [number, string];
    type Bar = Foo[2];
    return VisitorUtils.getNumberFunction(visitorContext);
}

function visitArrayObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
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

function visitUnionOrIntersectionType(type: ts.UnionOrIntersectionType, visitorContext: VisitorContext, indexType: ts.Type) {
    const name = VisitorUtils.getFullTypeName(type, visitorContext, 'keyof');
    if (!visitorContext.functionMap.has(name)) {
        const functionDeclarations = type.types.map((type) => visitType(type, visitorContext, indexType));

        if (tsutils.isUnionType(type)) {
            visitorContext.functionMap.set(
                name,
                VisitorUtils.createConjunctionFunction(functionDeclarations, name)
            );
        } else {
            visitorContext.functionMap.set(
                name,
                VisitorUtils.createDisjunctionFunction(functionDeclarations, name)
            );
        }
    }
    return visitorContext.functionMap.get(name)!;
}

function visitIndexType(): ts.FunctionDeclaration {
    throw new Error('Index types cannot be used as indexed types.');
}

function visitNonPrimitiveType(): ts.FunctionDeclaration {
    throw new Error('Non-primitive object cannot be used as an indexed type.');
}

function visitLiteralType(): ts.FunctionDeclaration {
    throw new Error('Literal strings/numbers cannot be used as an indexed type.');
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

function visitBigInt(): ts.FunctionDeclaration {
    throw new Error('BigInt cannot be used as an indexed type.');
}

function visitBoolean(): ts.FunctionDeclaration {
    throw new Error('Boolean cannot be used as an indexed type.');
}

function visitString(): ts.FunctionDeclaration {
    throw new Error('String cannot be used as an indexed type.');
}

function visitBooleanLiteral(): ts.FunctionDeclaration {
    throw new Error('True/false cannot be used as an indexed type.');
}

function visitNumber(): ts.FunctionDeclaration {
    throw new Error('Number cannot be used as an indexed type.');
}

function visitUndefined(): ts.FunctionDeclaration {
    throw new Error('Undefined cannot be used as an indexed type.');
}

function visitNull(): ts.FunctionDeclaration {
    throw new Error('Null cannot be used as an indexed type.');
}

function visitNever(visitorContext: VisitorContext) {
    return VisitorUtils.getNeverFunction(visitorContext);
}

function visitUnknown(visitorContext: VisitorContext) {
    return VisitorUtils.getUnknownFunction(visitorContext);
}

function visitAny(visitorContext: VisitorContext) {
    return VisitorUtils.getAnyFunction(visitorContext);
}

export function visitType(type: ts.Type, visitorContext: VisitorContext): boolean {
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
        return visitNull();
    } else if ((ts.TypeFlags.Undefined & type.flags) !== 0) {
        // Undefined
        return visitUndefined();
    } else if ((ts.TypeFlags.Number & type.flags) !== 0) {
        // Number
        return visitNumber();
    } else if ((ts.TypeFlags.BigInt & type.flags) !== 0) {
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
        if ((ts.ObjectFlags.Class & type.objectFlags) !== 0) {
            throw new Error('Classes cannot be validated. Please check the README.');
        } else {
            return visitObjectType(type, visitorContext, indexType);
        }
    } else if (tsutils.isLiteralType(type)) {
        // Literal string/number types ('foo')
        return visitLiteralType();
    } else if (tsutils.isUnionOrIntersectionType(type)) {
        // Union or intersection type (| or &)
        return visitUnionOrIntersectionType(type, visitorContext, indexType);
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
