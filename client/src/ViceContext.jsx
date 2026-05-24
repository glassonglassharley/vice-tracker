import { createContext, useContext } from 'react';

export const ViceContext = createContext(null);
export const useViceContext = () => useContext(ViceContext);

const NAME_COLORS = {
  beer:'#d4a04a', ale:'#d4a04a', lager:'#d4a04a', brew:'#d4a04a',
  cigarette:'#7a8392', cigarettes:'#7a8392', cigs:'#7a8392', smokes:'#7a8392', smoking:'#7a8392',
  coffee:'#8a5530', cafe:'#8a5530', espresso:'#8a5530',
  delivery:'#d04a3a', doordash:'#d04a3a', ubereats:'#d04a3a', grubhub:'#d04a3a',
  vape:'#8a6ac4', vaping:'#8a6ac4', pods:'#8a6ac4',
  weed:'#5ec48a', cannabis:'#5ec48a', marijuana:'#5ec48a',
  wine:'#9a4060', whiskey:'#c49a6c', alcohol:'#d4a04a',
  gambling:'#c49a6c', lottery:'#c49a6c',
};
const PALETTE = ['#d4a04a','#7a8392','#8a5530','#d04a3a','#8a6ac4','#5ec48a','#c49a6c','#6a92c4','#c4826a','#6ac4b8'];

export function getViceColor(vice, index) {
  for (const word of vice.name.toLowerCase().split(/\s+/)) {
    const c = NAME_COLORS[word.replace(/[^a-z]/g, '')];
    if (c) return c;
  }
  return PALETTE[index % PALETTE.length];
}
