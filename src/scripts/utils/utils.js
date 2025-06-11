import { DateTime } from "luxon";
import { chatOpenAi } from "../gpt/openai/chatgpt.js";


export function iso2text(iso) {
    try {
        // Convertir la fecha a DateTime de Luxon
        const dateTime = DateTime.fromISO(iso, { zone: 'utc' }).setZone('America/Guayaquil');

        // Verificar si la fecha es válida
        if (!dateTime.isValid) {
            throw new Error('Fecha ISO inválida');
        }

        // Formatear la fecha
        const formattedDate = dateTime.toLocaleString({
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZoneName: 'short'
        }, { locale: 'es' }); // Especificar locale español

        return formattedDate;
    } catch (error) {
        console.error('Error al convertir la fecha:', error);
        return 'Formato de fecha no válido';
    }
}


export async function text2iso(text) {
    try {
        // Validar entrada
        if (!text || typeof text !== 'string') {
            return "false";
        }

        const currentDateTime = DateTime.now().setZone('America/Guayaquil');
        
        const prompt = `Tarea: Extrae la fecha y hora de un texto en lenguaje natural.

Fecha actual: ${currentDateTime.toFormat('yyyy-MM-dd HH:mm')} (Ecuador)

Reglas de conversión:
- Si se menciona "mañana", suma un día a la fecha actual
- Si no se especifica hora, usa las 10:00 AM por defecto
- Si se especifica hora, respétala (formatos: 10am, 10:30, 14:00, etc.)
- Identifica fechas en formatos como:
  * "mañana"
  * "el jueves 30 de mayo"
  * "este viernes"
  * "próximo martes"
  * "hoy a las 3pm"
- Si no puedes interpretar la fecha, responde exactamente "false"
- Responde SOLO con la fecha en formato ISO o "false"

Ejemplos:
- Entrada: "mañana a las 10am" 
  Salida: 2024-06-10T10:00:00.000-05:00
- Entrada: "el jueves 30 de mayo a las 12hs"
  Salida: 2024-05-30T12:00:00.000-05:00
- Entrada: "este viernes"
  Salida: 2024-06-14T10:00:00.000-05:00

Instrucciones:
- Usa el timezone America/Guayaquil (-05:00)
- Considera el contexto de la fecha actual
- Responde SOLO la fecha ISO o "false"

Texto a analizar: "${text}"`;

        const messages = [{ role: "user", content: prompt }];

        // Intentar parseo con IA
        const response = await chatOpenAi(prompt, messages);
        const trimmedResponse = response.trim();

        // Verificar si la IA devolvió una fecha ISO válida
        if (trimmedResponse !== "false") {
            const aiParsedDate = DateTime.fromISO(trimmedResponse);
            if (aiParsedDate.isValid) {
                return trimmedResponse;
            }
        }

        // Parseo manual como respaldo
        return parseTextManually(text, currentDateTime);

    } catch (error) {
        console.error('Error al parsear fecha:', error);
        return "false";
    }
}

function parseTextManually(text, currentDateTime) {
    const lowercaseText = text.toLowerCase().trim();
    let parsedDate;
    let hour = 10; // Hora por defecto
    let minute = 0;

    // Extraer hora si está presente
    const timePatterns = [
        /(\d{1,2}):(\d{2})\s*(am|pm|hs?)?/i,
        /(\d{1,2})\s*(am|pm|hs?)/i,
        /(\d{1,2})h(\d{2})?/i
    ];

    for (const pattern of timePatterns) {
        const match = lowercaseText.match(pattern);
        if (match) {
            let extractedHour = parseInt(match[1]);
            let extractedMinute = match[2] ? parseInt(match[2]) : 0;
            
            // Manejar formato 12 horas
            if (match[3] && match[3].toLowerCase().includes('pm') && extractedHour !== 12) {
                extractedHour += 12;
            } else if (match[3] && match[3].toLowerCase().includes('am') && extractedHour === 12) {
                extractedHour = 0;
            }
            
            if (extractedHour >= 0 && extractedHour <= 23 && extractedMinute >= 0 && extractedMinute <= 59) {
                hour = extractedHour;
                minute = extractedMinute;
            }
            break;
        }
    }

    // Manejar "hoy"
    if (lowercaseText.includes("hoy")) {
        parsedDate = currentDateTime.set({ hour, minute, second: 0, millisecond: 0 });
        return parsedDate.toISO();
    }

    // Manejar "mañana"
    if (lowercaseText.includes("mañana")) {
        parsedDate = currentDateTime
            .plus({ days: 1 })
            .set({ hour, minute, second: 0, millisecond: 0 });
        return parsedDate.toISO();
    }

    // Manejar días de la semana
    const weekdays = {
        'lunes': 1, 'martes': 2, 'miércoles': 3, 
        'jueves': 4, 'viernes': 5, 'sábado': 6, 
        'domingo': 7
    };

    for (const [dayName, dayNumber] of Object.entries(weekdays)) {
        if (lowercaseText.includes(dayName)) {
            let targetDate = currentDateTime;
            
            // Si es "próximo" o "siguiente", ir a la próxima semana
            if (lowercaseText.includes("próximo") || lowercaseText.includes("proximo") || 
                lowercaseText.includes("siguiente")) {
                targetDate = targetDate.plus({ weeks: 1 });
            }
            
            // Calcular días hasta el día objetivo
            const daysUntilTarget = (dayNumber - targetDate.weekday + 7) % 7;
            const finalDays = daysUntilTarget === 0 ? 7 : daysUntilTarget; // Si es hoy, ir al próximo
            
            parsedDate = targetDate
                .plus({ days: finalDays })
                .set({ hour, minute, second: 0, millisecond: 0 });
            return parsedDate.toISO();
        }
    }

    // Intentar parsear fechas específicas (ej: "30 de mayo", "15 de junio")
    const datePatterns = [
        /(\d{1,2})\s+de\s+(\w+)/i,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{1,2})-(\d{1,2})-(\d{4})/
    ];

    const months = {
        'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
        'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
        'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
    };

    for (const pattern of datePatterns) {
        const match = lowercaseText.match(pattern);
        if (match) {
            if (pattern.source.includes('de')) {
                // Formato "30 de mayo"
                const day = parseInt(match[1]);
                const monthName = match[2].toLowerCase();
                const monthNumber = months[monthName];
                
                if (monthNumber && day >= 1 && day <= 31) {
                    const year = currentDateTime.year;
                    parsedDate = DateTime.fromObject({
                        year,
                        month: monthNumber,
                        day,
                        hour,
                        minute,
                        second: 0,
                        millisecond: 0
                    }, { zone: 'America/Guayaquil' });
                    
                    // Si la fecha ya pasó este año, usar el próximo año
                    if (parsedDate < currentDateTime) {
                        parsedDate = parsedDate.plus({ years: 1 });
                    }
                    
                    if (parsedDate.isValid) {
                        return parsedDate.toISO();
                    }
                }
            }
            // Aquí podrías agregar más patrones de fecha si es necesario
        }
    }

    return "false";
}


