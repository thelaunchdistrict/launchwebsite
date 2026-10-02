import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseInr, parseInrRange, parseAreaSqft, parseAcres, parseMonthYear, findPossession, parseBhk,
  sectorFrom, normalizeStatus, normalizeType, projectName, fixCompoundDashes,
} from './parse.mjs';

test('parseInr', () => {
  assert.equal(parseInr('₹3.5 Cr'), 35000000);
  assert.equal(parseInr('₹7.1 Crore Onwards'), 71000000);
  assert.equal(parseInr('₹85 Lakh'), 8500000);
  assert.equal(parseInr('₹ 1,25,00,000'), 12500000);
  assert.equal(parseInr('₹14,500/sq ft'), 14500);
  assert.equal(parseInr('Price on Request'), null);
  assert.equal(parseInr(null), null);
});

test('parseInrRange', () => {
  assert.deepEqual(parseInrRange('₹1.2 - 2.5 Cr'), { min: 12000000, max: 25000000 });
  assert.deepEqual(parseInrRange('₹95 Lakh – ₹1.6 Cr'), { min: 9500000, max: 16000000 });
});

test('areas', () => {
  assert.equal(parseAreaSqft('4,240 sq ft'), 4240);
  assert.equal(parseAreaSqft('200 sq yd'), 1800);
  assert.equal(parseAreaSqft('100 sq m'), 1076);
  assert.equal(parseAcres('31.28 Acres'), 31.28);
  assert.equal(parseAcres('10 hectares'), 24.71);
});

test('dates', () => {
  assert.equal(parseMonthYear('December 2028'), '2028-12');
  assert.equal(parseMonthYear('Q2 2027'), '2027-06');
  assert.equal(parseMonthYear('by 2030'), '2030');
  assert.equal(findPossession('The expected possession date is December 2028.').iso, '2028-12');
  assert.equal(findPossession('No dates here'), null);
});

test('compound dashes', () => {
  assert.equal(fixCompoundDashes('ultra – luxury homes, high – end amenities'), 'ultra-luxury homes, high-end amenities');
  assert.equal(fixCompoundDashes('state – of – the – art gym'), 'state-of-the-art gym');
  assert.equal(fixCompoundDashes('Goa’s 5 – Star Golf Township'), 'Goa’s 5-Star Golf Township');
  assert.equal(fixCompoundDashes('Sobha Aranya – Residential Development'), 'Sobha Aranya – Residential Development');
});

test('misc', () => {
  assert.equal(parseBhk('3BHK + SQ'), 3);
  assert.equal(parseBhk('Studio'), 0);
  assert.equal(sectorFrom('Sector 63A'), '63A');
  assert.equal(sectorFrom(null, 'smartworld-skyarc-sector-gurgaon-sector-69'), '69');
  assert.equal(normalizeStatus('UNDER_CONSTRUCTION'), 'under-construction');
  assert.equal(normalizeStatus('New Launch'), 'new-launch');
  assert.equal(normalizeType('RESIDENTIAL', null, ['Apartment']), 'residential');
  assert.equal(normalizeType('COMMERCIAL', null, ['SCO Plot']), 'sco');
  assert.equal(projectName({ aboutTitle: 'Project Overview – Sobha Aranya', title: 'x' }), 'Sobha Aranya');
  assert.equal(projectName({ title: 'M3M Crown – Residential Development in Sector 111' }), 'M3M Crown');
  assert.equal(projectName({ aboutTitle: 'Project Overview – Elan The Statement , Sector 49, Sohna Road Gurgaon' }), 'Elan The Statement');
  assert.equal(projectName({ aboutTitle: 'Project Overview – Aditya Birla Pravaah Sector 71' }), 'Aditya Birla Pravaah');
  assert.equal(projectName({ aboutTitle: 'Project Overview – Tarc Ishva Gurgaon' }), 'TARC Ishva');
  assert.equal(projectName({ aboutTitle: 'Project Overview – Club Arcade Dlf' }), 'Club Arcade DLF');
  assert.equal(projectName({ aboutTitle: 'Project Overview – The Oryza, Dwarka Expressway Gurgaon' }), 'The Oryza');
  assert.equal(projectName({ aboutTitle: 'Project Overview – Yugen Greens: Goa’s 5 – Star Golf Township' }), 'Yugen Greens');
});
