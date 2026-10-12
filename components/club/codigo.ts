/** "4KD7PQ2M" → "4KD7 PQ2M". Sirve en servidor y cliente. */
export const codigoLegible = (c: string) => `${c.slice(0, 4)} ${c.slice(4)}`;
