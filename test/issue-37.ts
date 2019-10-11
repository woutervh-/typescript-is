import * as assert from 'assert';
import { is } from '../index';
/* https://github.com/woutervh-/typescript-is/issues/37 */

type CardPayload = Record<string, any>;
type Card = [string, CardPayload];

// Atoms
type Atom = [string, string, unknown];

// Markers
// [typeIdentifier, openMarkupsIndexes, numberOfClosedMarkups, text]
type TextMarker = [0, number[], number, string];
// [typeIdentifier, openMarkupsIndexes, numberOfClosedMarkups, atomIndex]
type AtomMarker = [1, number[], number, number];
type Marker = TextMarker | AtomMarker;

// Sections Tags enums / unions
type MarkupSectionTag = 'aside' | 'blockquote' | 'pull-quote' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
type ListSectionTag = 'ul' | 'ol';

// Section Identifiers
type MarkupIdentifer = 1;
type ImageIdentifer = 2;
type ListIdentifer = 3;
type CardIdentifer = 10;

// Sections
type MarkupSection = [MarkupIdentifer, MarkupSectionTag, Marker[]];
type ImageSection = [ImageIdentifer, string];
type ListSection = [ListIdentifer, ListSectionTag, Marker[][]];
type CardSection = [CardIdentifer, number];
type Section = MarkupSection | ImageSection | ListSection | CardSection;

// Markups
type MarkupTag = 'a' | 'b' | 'code' | 'em' | 'i' | 's' | 'strong' | 'sub' | 'sup' | 'u';

type Markup = [MarkupTag, string[] | undefined];

// Mobiledoc Interface
export interface Mobiledoc {
    atoms: Atom[];
    cards: Card[];
    markups: Markup[];
    sections: Section[];
}

describe('is', () => {
    describe('Does not throw on complex types', () => {
        it('Mobiledoc', () => {
            // really this is just a test that it compiles
            assert.doesNotThrow(() => is<Mobiledoc>('foo'));
        });
    });
});
