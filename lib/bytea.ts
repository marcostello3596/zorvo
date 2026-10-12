/**
 * PostgREST devuelve bytea como texto hex con prefijo `\x`.
 * Contempla también base64 por si algún día cambia la representación.
 */
export function byteaABase64(valor: string): string {
  if (valor.startsWith("\\x")) {
    const hex = valor.slice(2);
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return btoa(String.fromCharCode(...bytes));
  }
  return valor;
}
