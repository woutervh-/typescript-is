import * as ts from 'typescript';
import * as tsutils from 'tsutils/typeguard/3.0';
import { VisitorContext } from './visitor-context';
import * as VisitorUtils from './visitor-utils';
import * as VisitorKeyof from './visitor-keyof';
import * as VisitorIndexedAccess from './visitor-indexed-access';

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

function visitTupleObjectType(type: ts.TupleType, visitorContext: VisitorContext, mode: NameMode) {
    if (type.typeArguments === undefined) {
        return 'st_et';
    }
    const itemNames = type.typeArguments.map((type) => visitType(type, visitorContext, mode));
    return `st_${itemNames.join('_')}_et`;
}

function visitArrayObjectType(type: ts.ObjectType, visitorContext: VisitorContext, mode: NameMode) {
    const numberIndexType = visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number);
    if (numberIndexType === undefined) {
        throw new Error('Expected array ObjectType to have a number index type.');
    }
    const numberIndexName = visitType(numberIndexType, visitorContext, mode);
    return `sa_${numberIndexName}_ea`;
}

function visitRegularObjectType(type: ts.ObjectType) {
    const id: string = (type as unknown as { id: string }).id;
    return `_${id}`;
}

function visitTypeReference(type: ts.TypeReference, visitorContext: VisitorContext, mode: NameMode) {
    const mapping: Map<ts.Type, ts.Type> = VisitorUtils.getTypeReferenceMapping(type, visitorContext);
    const previousTypeReference = visitorContext.previousTypeReference;
    visitorContext.typeMapperStack.push(mapping);
    visitorContext.previousTypeReference = type;
    const result = visitType(type.target, visitorContext, mode);
    visitorContext.previousTypeReference = previousTypeReference;
    visitorContext.typeMapperStack.pop();
    return result;
}

function visitTypeParameter(type: ts.Type, visitorContext: VisitorContext, mode: NameMode) {
    const mappedType = VisitorUtils.getResolvedTypeParameter(type, visitorContext);
    if (mappedType === undefined) {
        throw new Error('Unbound type parameter, missing type node.');
    }
    return visitType(mappedType, visitorContext, mode);
}

function visitObjectType(type: ts.ObjectType, visitorContext: VisitorContext, mode: NameMode) {
    if (tsutils.isTupleType(type)) {
        return visitTupleObjectType(type, visitorContext, mode);
    } else if (visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number)) {
        return visitArrayObjectType(type, visitorContext, mode);
    } else {
        return visitRegularObjectType(type);
    }
}

function visitUnionOrIntersectionType(type: ts.UnionOrIntersectionType, visitorContext: VisitorContext, mode: NameMode) {
    const names = type.types.map((type) => visitType(type, visitorContext, mode));
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

export function visitType(type: ts.Type, visitorContext: VisitorContext, mode: NameMode): string {
    let name: string;
    const id: string = (type as unknown as { id: string }).id;
    if ((ts.TypeFlags.Any & type.flags) !== 0) {
        name = VisitorUtils.getAnyFunction(visitorContext);
    } else if ((ts.TypeFlags.Unknown & type.flags) !== 0) {
        name = VisitorUtils.getUnknownFunction(visitorContext);
    } else if ((ts.TypeFlags.Never & type.flags) !== 0) {
        name = VisitorUtils.getNeverFunction(visitorContext);
    } else if ((ts.TypeFlags.Null & type.flags) !== 0) {
        name = VisitorUtils.getNullFunction(visitorContext);
    } else if ((ts.TypeFlags.Undefined & type.flags) !== 0) {
        name = VisitorUtils.getUndefinedFunction(visitorContext);
    } else if ((ts.TypeFlags.Number & type.flags) !== 0) {
        name = VisitorUtils.getNumberFunction(visitorContext);
    } else if (VisitorUtils.isBigIntType(type)) {
        name = VisitorUtils.getBigintFunction(visitorContext);
    } else if ((ts.TypeFlags.Boolean & type.flags) !== 0) {
        name = VisitorUtils.getBooleanFunction(visitorContext);
    } else if ((ts.TypeFlags.String & type.flags) !== 0) {
        name = VisitorUtils.getStringFunction(visitorContext);
    } else if ((ts.TypeFlags.BooleanLiteral & type.flags) !== 0) {
        name = `_${id}`;
    } else if (tsutils.isTypeReference(type) && visitorContext.previousTypeReference !== type) {
        name = visitTypeReference(type, visitorContext, mode);
    } else if ((ts.TypeFlags.TypeParameter & type.flags) !== 0) {
        name = visitTypeParameter(type, visitorContext, mode);
    } else if (tsutils.isObjectType(type)) {
        name = visitObjectType(type, visitorContext, mode);
    } else if (tsutils.isLiteralType(type)) {
        name = `_${id}`;
    } else if (tsutils.isUnionOrIntersectionType(type)) {
        name = visitUnionOrIntersectionType(type, visitorContext, mode);
    } else if ((ts.TypeFlags.NonPrimitive & type.flags) !== 0) {
        name = `_${id}`;
    } else if ((ts.TypeFlags.Index & type.flags) !== 0) {
        name = visitIndexType(type, visitorContext);
    } else if (tsutils.isIndexedAccessType(type)) {
        name = visitIndexedAccessType(type, visitorContext);
    } else {
        throw new Error('Could not generate type-check; unsupported type with flags: ' + type.flags);
    }
    if (mode.type === 'keyof') {
        name += '_keyof';
    }
    if (mode.type === 'indexed-access') {
        const indexTypeName = visitType(mode.indexType, visitorContext, { type: 'type-check' });
        name += `_ia__${indexTypeName}`;
    }
    if (mode.type === 'type-check' && !!mode.superfluousPropertyCheck) {
        name += '_s';
    }
    if (tsutils.isTypeReference(type) && type.typeArguments !== undefined) {
        for (const typeArgument of type.typeArguments) {
            const resolvedType = VisitorUtils.getResolvedTypeParameter(typeArgument, visitorContext) || typeArgument;
            name += `_${(resolvedType as unknown as { id: string }).id}`;
        }
    }
    return name;
}
