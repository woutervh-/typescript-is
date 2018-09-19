function is() {
    throw new Error('This module should not be used in runtime. Instead, use a transformer during compilation.');
}

module.exports = { is, assertType: is };
