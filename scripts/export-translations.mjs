import {writeFile} from 'node:fs/promises';
import {LOCALES, translate} from '../src/i18n.js';
const keys=['native.updateChoose','native.updateCheck','native.updateTitle','native.updateDetail','native.restart','common.cancel'];
await writeFile(process.argv[2],JSON.stringify(Object.fromEntries(LOCALES.map(locale=>[locale,Object.fromEntries(keys.map(key=>[key,translate(locale,key)]))])),null,2));
