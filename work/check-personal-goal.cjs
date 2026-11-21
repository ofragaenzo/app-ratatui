const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const project = path.resolve(__dirname, '..', 'apps', 'mobile');
const ts = require(path.join(project, 'node_modules', 'typescript'));
const source = fs.readFileSync(path.join(project, 'src', 'personalGoal.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const memory = new Map();
let rejectWrite = false;
const storage = {
  getItem: async key => memory.get(key) ?? null,
  setItem: async (key, value) => {
    await new Promise(resolve => setTimeout(resolve, 4));
    if (rejectWrite) { rejectWrite = false; throw new Error('Simulated storage failure'); }
    memory.set(key, value);
  },
};
const moduleStub = { exports: {} };
vm.runInNewContext(compiled, {
  module: moduleStub, exports: moduleStub.exports,
  require: name => name === 'react' ? {} : name === '@react-native-async-storage/async-storage' ? { default: storage } : require(name),
}, { filename: 'personalGoal.ts' });
const model = moduleStub.exports;

(async () => {
  const draft = model.createGoalDraft();
  assert.equal(Object.keys(model.validateGoalDraft(draft)).length, 0);
  assert.equal(model.validGoalDate('2026-02-29'), false);
  assert.equal(model.validGoalDate('2024-02-29'), true);
  assert.equal(model.validGoalDate('2026-04-31'), false);
  for (const value of ['0', '8', '2.5', '-1']) assert.ok(model.validateGoalDraft({ ...draft, weeklyFrequency: value }).weeklyFrequency);
  for (const value of ['0', '-2', '1e6', 'NaN', '1,2.3']) assert.ok(model.validateGoalDraft({ ...draft, proteinG: value }).proteinG);
  const parsed = model.goalFromDraft({ ...draft, currentWeightKg: '75,5', proteinG: '90.25' });
  assert.equal(parsed.currentWeightKg, 75.5);
  assert.equal(parsed.proteinG, 90.25);
  assert.equal(parsed.targetWeightKg, null);
  assert.equal(parsed.caloriesKcal, null);
  const first = await model.savePersonalGoal(draft);
  const loaded = await model.loadPersonalGoal();
  assert.equal(loaded.title, draft.title);
  assert.equal(loaded.createdAt, first.createdAt);
  const later = await model.savePersonalGoal({ ...draft, title: 'Meta revisada' }, first);
  assert.equal(later.createdAt, first.createdAt);
  const one = model.savePersonalGoal({ ...draft, title: 'Versão anterior' }, later);
  const two = model.savePersonalGoal({ ...draft, title: 'Versão mais recente' }, later);
  await Promise.all([one, two]);
  assert.equal((await model.loadPersonalGoal()).title, 'Versão mais recente');
  rejectWrite = true;
  await assert.rejects(model.savePersonalGoal(draft));
  await model.savePersonalGoal({ ...draft, title: 'Recuperação de gravação' });
  assert.equal((await model.loadPersonalGoal()).title, 'Recuperação de gravação');
  memory.set(model.PERSONAL_GOAL_KEY, '{invalid JSON');
  await assert.rejects(model.loadPersonalGoal());
  memory.set(model.PERSONAL_GOAL_KEY, JSON.stringify({ ...first, weeklyFrequency: 20 }));
  await assert.rejects(model.loadPersonalGoal());
  console.log('Personal goal: validation, optional fields, persistence, write ordering and recovery passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
