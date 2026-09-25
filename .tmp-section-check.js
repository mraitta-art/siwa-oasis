const fs = require('fs');
const ts = require('typescript');
const source = fs.readFileSync('./src/lib/section-registry.ts', 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const mod = { exports: {} };
new Function('require', 'module', 'exports', transpiled)(require, mod, mod.exports);
const { isSectionHidden, isSectionApprovedForMinisite } = mod.exports;

const legacyHiddenShape = { sec_1_identity: { hidden_sections: ['sec_2_ambience'], approval_status: 'draft' } };
console.log('legacy hidden', isSectionHidden('sec_2_ambience', legacyHiddenShape));
console.log('legacy approved', isSectionApprovedForMinisite('sec_2_ambience', legacyHiddenShape));

const visibleOverride = { basic: { visible_sections: ['sec_2_ambience'] } };
console.log('visible override', isSectionHidden('sec_2_ambience', visibleOverride));
