import test from 'node:test';
import assert from 'node:assert/strict';
import { periodKey, customPhase } from '../src/utils/schedule.js';
import { builtInTimers } from '../src/utils/worldTimers.js';

test('每日台灣 08:00 精確切換，不受訪客本地時區影響', () => {
  const config = { hour: 8, minute: 0 };
  assert.equal(periodKey(Date.parse('2026-10-03T00:00:00Z') - 1, config), '2026-10-02T00:00:00.000Z');
  assert.equal(periodKey(Date.parse('2026-10-03T00:00:00Z'), config), '2026-10-03T00:00:00.000Z');
});

test('每週一台灣 08:00 切換，修改重置時間後也能正確跨週', () => {
  const monday = Date.parse('2026-10-05T00:00:00Z');
  assert.equal(periodKey(monday - 1, { weekday: 1, hour: 8, minute: 0 }, true), '2026-09-28T00:00:00.000Z');
  assert.equal(periodKey(monday, { weekday: 1, hour: 8, minute: 0 }, true), '2026-10-05T00:00:00.000Z');
  assert.equal(periodKey(monday + 60 * 60000, { weekday: 1, hour: 9, minute: 0 }, true), '2026-10-05T01:00:00.000Z');
});

test('100 分鐘白天與 50 分鐘夜晚循環，非循環計時器結束', () => {
  const timer = { startAt: '2026-10-03T00:00:00Z', loop: true,
    phases: [{ label: '白天', minutes: 100 }, { label: '夜晚', minutes: 50 }] };
  const start = Date.parse(timer.startAt);
  assert.deepEqual(customPhase(timer, start), { state: '白天', expiry: start + 100 * 60000 });
  assert.deepEqual(customPhase(timer, start + 100 * 60000), { state: '夜晚', expiry: start + 150 * 60000 });
  assert.deepEqual(customPhase(timer, start + 150 * 60000), { state: '白天', expiry: start + 250 * 60000 });
  assert.deepEqual(customPhase({ ...timer, loop: false }, start + 150 * 60000), { state: '已結束', expiry: null });
});

test('世界狀態到期切換階段、每日重置為 UTC 午夜', () => {
  const expiry = '2026-10-03T01:00:00Z';
  const world = { cetusCycle: { expiry, isDay: true }, vallisCycle: { expiry, isWarm: true },
    cambionCycle: { expiry, active: 'fass' }, zarimanCycle: { expiry, state: 'Corpus' } };
  const now = Date.parse(expiry);
  const timers = builtInTimers(world, now);
  assert.equal(timers[0].state, '夜晚');
  assert.equal(timers[0].expiry, now + 50 * 60000);
  assert.equal(timers[1].state, '寒冷');
  assert.equal(timers[4].expiry, Date.parse('2026-10-04T00:00:00Z'));
});
