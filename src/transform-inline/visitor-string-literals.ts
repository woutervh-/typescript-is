import * as ts from 'typescript';
import * as tsutils from 'tsutils';
import { VisitorStringLiteralsContext } from './visitor-string-literals-context';

function visitStringLiteralsOfUnionOrIntersectionType(type: ts.Type, visitorContext: VisitorStringLiteralsContext) {
    let isUnion: boolean;
    if (tsutils.isUnionType(type)) {
        isUnion = true;
    } else if (tsutils.isIntersectionType(type)) {
        isUnion = false;
    } else {
        throw new Error('UnionOrIntersection type is expected to be a Union or Intersection type.');
    }
    return type.types
        .map((type) => visitStringLiteralsOfType(type, visitorContext))
        .reduce((collection, names) => {
            if (isUnion) {
                return collection.filter((name) => names.indexOf(name) >= 0);
            } else {
                return collection.concat(names);
            }
        });
}

function visitStringLiteralsOfRegularObjectType(type: ts.Type, visitorContext: VisitorStringLiteralsContext) {
    if (visitorContext.mode.type === 'property-names') {
        return visitorContext.checker.getPropertiesOfType(type).map((property) => property.name);
    } else {
        throw new Error('visitStringLiteralsOfRegularObjectType should only be called during property-names mode.');
    }
}

function visitStringLiteralsOfObjectType(type: ts.Type, visitorContext: VisitorStringLiteralsContext) {
    if (visitorContext.mode.type === 'property-names') {
        if (visitorContext.checker.getIndexTypeOfType(type, ts.IndexKind.Number)) {
            throw new Error('Collecting property names from arrays is not supported.');
        } else {
            return visitStringLiteralsOfRegularObjectType(type, visitorContext);
        }
    } else {
        throw new Error('visitStringLiteralsOfObjectType should only be called during property-names mode.');
    }
}

function visitStringLiteralsOfTypeParameter(type: ts.Type, visitorContext: VisitorStringLiteralsContext) {
    const typeMapper = visitorContext.typeMapperStack[visitorContext.typeMapperStack.length - 1];
    if (typeMapper === undefined) {
        throw new Error('Unbound type parameter, missing type mapper.');
    }
    const mappedType = typeMapper(type);
    if (mappedType === undefined) {
        throw new Error('Unbound type parameter, missing type node.');
    }
    return visitStringLiteralsOfType(mappedType, visitorContext);
}

function visitStringLiteralsOfLiteralType(type: ts.LiteralType, visitorContext: VisitorStringLiteralsContext) {
    if (visitorContext.mode.type === 'literal') {
        if (typeof type.value === 'string') {
            return [type.value];
        } else {
            throw new Error('Type value is expected to be a string.');
        }
    } else {
        throw new Error('visitStringLiteralsOfLiteralType should only be called during literal mode.');
    }
}

function visitStringLiteralsOfIndexType(type: ts.Type, visitorContext: VisitorStringLiteralsContext) {
    if (visitorContext.mode.type === 'literal') {
        // Using internal TypeScript API, hacky.
        const indexedType = (type as { type?: ts.Type }).type;
        if (indexedType === undefined) {
            throw new Error('Could not get indexed type of index type.');
        }
        return visitStringLiteralsOfType(indexedType, { ...visitorContext, mode: { type: 'property-names' } });
    } else {
        throw new Error('visitStringLiteralsOfIndexType should only be called during literal mode.');
    }
}

export function visitStringLiteralsOfType(type: ts.Type, visitorContext: VisitorStringLiteralsContext): string[] {
    if ((ts.TypeFlags.TypeParameter & type.flags) !== 0) {
        // Type parameter
        return visitStringLiteralsOfTypeParameter(type, visitorContext);
    } else if ((ts.TypeFlags.Index & type.flags) !== 0) {
        // Index type: keyof T
        return visitStringLiteralsOfIndexType(type, visitorContext);
    } else if (tsutils.isObjectType(type)) {
        // Object type (including arrays)
        return visitStringLiteralsOfObjectType(type, visitorContext);
    } else if (tsutils.isUnionOrIntersectionType(type)) {
        // Union or intersection type (| or &)
        return visitStringLiteralsOfUnionOrIntersectionType(type, visitorContext);
    } else if (tsutils.isLiteralType(type)) {
        // Literal string/number types ('foo')
        return visitStringLiteralsOfLiteralType(type, visitorContext);
    } else {
        throw new Error('Could not visit string literals; unsupported type with flags: ' + type.flags);
    }
}
