/**
 * Parsea una cadena de texto LRC (Lyric Timed Format) en un array de objetos
 * con el tiempo en milisegundos y el texto de la línea.
 * @param lrcContent La cadena de texto LRC cruda.
 * @returns Un array de objetos { time: number; text: string; } ordenado por tiempo.
 */
export function parseLrc(lrcContent: string): { time: number; text: string }[] {
  if (!lrcContent) {
    return []; // Si no hay contenido, devuelve un array vacío
  }

  const lines = lrcContent.split('\n'); // Divide el contenido en líneas
  const parsedLyrics: { time: number; text: string }[] = [];

  // Expresión regular para encontrar las marcas de tiempo [MM:SS.mmm] o [MM:SS.mm]
  const timeTagRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const matches = Array.from(line.matchAll(timeTagRegex)); // Encuentra todas las marcas de tiempo en la línea
    if (matches.length > 0) {
      // Extrae el texto de la línea eliminando las marcas de tiempo
      const text = line.replace(timeTagRegex, '').trim();

      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        let milliseconds = parseInt(match[3], 10);

        // Si los milisegundos tienen 2 dígitos (ej: .12), multiplícalos por 10 para hacerlos de 3 (ej: .120)
        if (match[3].length === 2) {
          milliseconds *= 10;
        }

        // Calcula el tiempo total en milisegundos
        const time = minutes * 60 * 1000 + seconds * 1000 + milliseconds;
        parsedLyrics.push({ time, text });
      }
    }
    // Las líneas que no tienen marca de tiempo son ignoradas, ya que no se pueden sincronizar.
    // Si quisieras incluirlas como parte de la línea anterior, requeriría una lógica adicional.
  }

  // Ordena las líneas de la letra por su tiempo para asegurar la secuencia correcta
  parsedLyrics.sort((a, b) => a.time - b.time);

  return parsedLyrics;
}