import { google } from "googleapis";

/*const auth = new google.auth.GoogleAuth({
    keyFile:'./santainescalendar.json',
    scopes: ['https://www.googleapis.com/auth/calendar']
});*/

const auth = new google.auth.GoogleAuth({
    credentials:{
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Reemplazar \n por saltos de línea
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_url: 'https://accounts.google.com/o/oauth2/auth',
        token_url: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
        universe_domain: 'googleapis.com'
    },
    scopes: ['https://www.googleapis.com/auth/calendar']
});



const calendar  =  google.calendar({version: 'v3'});

const calendarId = process.env.CALENDAR_ID;
const timeZone = 'America/Guayaquil'
const rangeLimit = {
    days:[1, 2, 3, 4, 5], // Lunes a Viernes
    startHour: 8,
    endHour: 18
};

const standardEventDuration = 1; // Duracion por defecto de la cita (1) hora
const dateLimit = 30; // Limite de dias para agendar una cita

export async function createEvent(eventName, description, date, duration = standardEventDuration) {
    try {
        // Auth
        const authClient = await auth.getClient();
        google.options({ auth: authClient });

        // Validar fecha
        if (typeof date === 'string') {
            date = new Date(date);
        }
        if (!(date instanceof Date) || isNaN(date)) {
            throw new Error('Formato de fecha inválido');
        }

        // Fecha y hora de inicio del evento
        const startDateTime = new Date(date);
        // Fecha y hora de fin del evento
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(startDateTime.getHours() + duration);

        const event = {
            summary: eventName,
            description: description,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: timeZone
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: timeZone
            },
            colorId: '2'
        };

        const response = await calendar.events.insert({
            calendarId: calendarId,
            resource: event
        });

        // Generar la URL para la cita
        const eventId = response.data.id;
        console.log(`Evento creado: ${eventId}`);
        return eventId;
    } catch (error) {
        console.error("Error en createEvent:", error);
        throw error; // Re-lanzar el error en lugar de retornar null
    }
}


export async function listAvailableSlots(startDate = new Date(), endDate) {
    try {
        const authClient = await auth.getClient();
        google.options({ auth: authClient });

        // Definir fecha de fin si no se proporciona
        if (!endDate) {
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + dateLimit);
        }

        const response = await calendar.events.list({
            calendarId: calendarId,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            timeZone: timeZone,
            singleEvents: true,
            orderBy: 'startTime'
        });

        const events = response.data.items || [];
        const slots = []; // Corregido: era "slost"
        let currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0); // Comenzar desde el inicio del día

        // Generar slots disponibles basados en el rango de horas
        while (currentDate < endDate) {
            const dayOfWeek = currentDate.getDay();
            if (rangeLimit.days.includes(dayOfWeek)) {
                for (let hour = rangeLimit.startHour; hour < rangeLimit.endHour; hour++) {
                    const slotStart = new Date(currentDate);
                    slotStart.setHours(hour, 0, 0, 0);
                    const slotEnd = new Date(slotStart);
                    slotEnd.setHours(hour + standardEventDuration);

                    const isBusy = events.some(event => {
                        const eventStart = new Date(event.start.dateTime || event.start.date);
                        const eventEnd = new Date(event.end.dateTime || event.end.date);
                        return (slotStart < eventEnd && slotEnd > eventStart);
                    });

                    if (!isBusy) {
                        slots.push({ start: slotStart, end: slotEnd });
                    }
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return slots;

    } catch (error) {
        console.error("Error en listAvailableSlots:", error);
        throw error;
    }
}

export async function getNextAvailableSlot(date) {
    try {
        // Verificar si 'date' es un string en formato ISO
        if (typeof date === 'string') {
            date = new Date(date);
        } else if (!(date instanceof Date) || isNaN(date)) {
            throw new Error('Formato de fecha inválido');
        }

        // Obtener el próximo slot disponible
        const availableSlots = await listAvailableSlots(date);

        // Filtrar slots disponibles que comiencen después de la fecha proporcionada
        const filteredSlots = availableSlots.filter(slot => new Date(slot.start) > date);

        // Ordenar los slots por su hora de inicio en orden ascendente
        const sortedSlots = filteredSlots.sort((a, b) => new Date(a.start) - new Date(b.start));

        // Tomar el primer slot de la lista resultante, que será el próximo slot disponible
        return sortedSlots.length > 0 ? sortedSlots[0] : null;
    } catch (error) {
        console.error("Error al obtener el próximo slot disponible:", error);
        throw error;
    }
}

export async function isDateAvailable(date) {
    try {
        // Validar entrada
        if (typeof date === 'string') {
            date = new Date(date);
        }
        if (!(date instanceof Date) || isNaN(date)) {
            throw new Error('Formato de fecha inválido');
        }

        // Validar que la fecha esté dentro del rango permitido
        const currentDate = new Date();
        const maxDate = new Date(currentDate);
        maxDate.setDate(currentDate.getDate() + dateLimit);

        if (date < currentDate || date > maxDate) {
            return false; // La fecha no está dentro del rango permitido
        }

        // Verificar que la fecha caiga en un día permitido 
        const dayOfWeek = date.getDay();
        if (!rangeLimit.days.includes(dayOfWeek)) {
            return false; // La fecha no está en un día permitido
        }

        // Verificar que la hora caiga en un rango permitido
        const hour = date.getHours();
        if (hour < rangeLimit.startHour || hour >= rangeLimit.endHour) {
            return false; // La hora no está dentro del rango permitido
        }

        // Obtener todos los slots disponibles desde la fecha actual hasta el límite
        const availableSlots = await listAvailableSlots(currentDate);

        // Verificar si hay slots disponibles en la fecha dada
        const isSlotsAvailable = availableSlots.some(slot => {
            const slotStart = new Date(slot.start);
            const expectedEnd = new Date(date.getTime() + standardEventDuration * 60 * 60 * 1000);
            
            return slotStart.getTime() === date.getTime() && 
                   new Date(slot.end).getTime() === expectedEnd.getTime();
        });

        return isSlotsAvailable;

    } catch (error) {
        console.error('Error al verificar disponibilidad de la fecha:', error);
        throw error;
    }
}