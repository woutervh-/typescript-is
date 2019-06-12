import * as ts from 'typescript';
import * as tsutils from 'tsutils';
import { VisitorContext } from './visitor-context';
import * as VisitorUtils from './visitor-utils';
import * as VisitorKeyof from './visitor-keyof';
import * as VisitorIndexedAccess from './visitor-indexed-access';

function visitTupleObjectType(type: ts.TupleType, visitorContext: VisitorContext) {
    if (type.typeArguments === undefined) {
        throw new Error('Expected tuple type to have type arguments.');
    }
    const itemNames = type.typeArguments.map((type) => visitType(type, visitorContext));
    return `st_${itemNames.join('_')}_et`;
}

function visitArrayObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    const numberIndexType = visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number);
    if (numberIndexType === undefined) {
        throw new Error('Expected array ObjectType to have a number index type.');
    }
    const numberIndexName = visitType(numberIndexType, visitorContext);
    return `sa_${numberIndexName}_ea`;
}

function visitRegularObjectType(type: ts.ObjectType) {
    const id: string = (type as unknown as { id: string }).id;
    return `_${id}`;
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

function visitObjectType(type: ts.ObjectType, visitorContext: VisitorContext) {
    if (tsutils.isTupleType(type)) {
        return visitTupleObjectType(type, visitorContext);
    } else if (visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number)) {
        return visitArrayObjectType(type, visitorContext);
    } else {
        return visitRegularObjectType(type);
    }
}

function visitUnionOrIntersectionType(type: ts.UnionOrIntersectionType, visitorContext: VisitorContext) {
    const names = type.types.map((type) => visitType(type, visitorContext));
    if (tsutils.isIntersectionType(type)) {
        return `si_${names.join('_')}_ei`;
    } else {
        return `su_${names.join('_')}_eu`;
    }
}

function visitIndexType(type: ts.Type, visitorContext: VisitorContext) {
    const indexedType = (type as { type?: ts.Type }).type;
    if (indexedType === undefined) {
        throw new Error('Could not get indexed type of index type.');
    }
    return VisitorKeyof.visitType(indexedType, visitorContext);
}

function visitIndexedAccessType(type: ts.IndexedAccessType, visitorContext: VisitorContext) {
    return VisitorIndexedAccess.visitType(type.objectType, type.indexType, visitorContext);
}

export function visitType(type: ts.Type, visitorContext: VisitorContext): string {
    const id: string = (type as unknown as { id: string }).id;
    if ((ts.TypeFlags.Any & type.flags) !== 0) {
        return VisitorUtils.getAnyFunction(visitorContext);
    } else if ((ts.TypeFlags.Unknown & type.flags) !== 0) {
        return VisitorUtils.getUnknownFunction(visitorContext);
    } else if ((ts.TypeFlags.Never & type.flags) !== 0) {
        return VisitorUtils.getNeverFunction(visitorContext);
    } else if ((ts.TypeFlags.Null & type.flags) !== 0) {
        return VisitorUtils.getNullFunction(visitorContext);
    } else if ((ts.TypeFlags.Undefined & type.flags) !== 0) {
        return VisitorUtils.getUndefinedFunction(visitorContext);
    } else if ((ts.TypeFlags.Number & type.flags) !== 0) {
        return VisitorUtils.getNumberFunction(visitorContext);
    } else if ((ts.TypeFlags.BigInt & type.flags) !== 0) {
        return VisitorUtils.getBigintFunction(visitorContext);
    } else if ((ts.TypeFlags.Boolean & type.flags) !== 0) {
        return VisitorUtils.getBooleanFunction(visitorContext);
    } else if ((ts.TypeFlags.String & type.flags) !== 0) {
        return VisitorUtils.getStringFunction(visitorContext);
    } else if ((ts.TypeFlags.BooleanLiteral & type.flags) !== 0) {
        return `_${id}`;
    } else if (tsutils.isTypeReference(type) && visitorContext.previousTypeReference !== type) {
        return visitTypeReference(type, visitorContext);
    } else if ((ts.TypeFlags.TypeParameter & type.flags) !== 0) {
        return visitTypeParameter(type, visitorContext);
    } else if (tsutils.isObjectType(type)) {
        return visitObjectType(type, visitorContext);
    } else if (tsutils.isLiteralType(type)) {
        return `_${id}`;
    } else if (tsutils.isUnionOrIntersectionType(type)) {
        return visitUnionOrIntersectionType(type, visitorContext);
    } else if ((ts.TypeFlags.NonPrimitive & type.flags) !== 0) {
        return `_${id}`;
    } else if ((ts.TypeFlags.Index & type.flags) !== 0) {
        return visitIndexType(type, visitorContext);
    } else if (tsutils.isIndexedAccessType(type)) {
        return visitIndexedAccessType(type, visitorContext);
    } else {
        throw new Error('Could not generate type-check; unsupported type with flags: ' + type.flags);
    }
}

interface TypeCheckNameMode {
    type: 'type-check';
    superfluousPropertyCheck?: boolean;
}

interface KeyofNameMode {
    type: 'keyof';
}

interface IndexedAccessNameMode {
    type: 'indexed-access';
    indexType: ts.Type;
}

type NameMode = TypeCheckNameMode | KeyofNameMode | IndexedAccessNameMode;

export function getFullTypeName(type: ts.Type, visitorContext: VisitorContext, mode: NameMode) {
    let name = visitType(type, visitorContext);
    if (mode.type === 'keyof') {
        name += '_keyof';
    }
    if (mode.type === 'indexed-access') {
        const indexTypeName = getFullTypeName(mode.indexType, visitorContext, { type: 'type-check' });
        name += `_ia__${indexTypeName}`;
    }
    if (mode.type === 'type-check' && !!mode.superfluousPropertyCheck) {
        name += '_s';
    }
    if (tsutils.isTypeReference(type) && type.typeArguments !== undefined) {
        for (const typeArgument of type.typeArguments) {
            const resolvedType = VisitorUtils.getResolvedTypeParameter(typeArgument, visitorContext);
            name += `_${(resolvedType as unknown as { id: string }).id}`;
        }
    }
    return name;
}
