import * as assert from 'assert';

describe('transformNonNullAssertions', () => {
    it('should be null', () => {
        const foo: { bar: number | null } = {bar: null}
        assert.throws(() => foo.bar!, {message: 'foo.bar was non-null asserted but is null'})
    })
    it('should be undefined', () => {
        const foo: { bar?: number } = {}
        assert.throws(() => foo.bar!, {message: 'foo.bar was non-null asserted but is undefined'})
    })
    it('should not throw', () => {
        const foo: { bar?: number } = {bar: 1}
        assert.equal(foo.bar!, 1)
    })
})
