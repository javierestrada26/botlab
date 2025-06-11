import { addKeyword, EVENTS } from "@builderbot/bot";
import { createEvent } from "../scripts/calendar/calendar.js";

export const formFlow = addKeyword(EVENTS.ACTION)
    .addAnswer("Perfecto, gracias por confirmar la fecha. Te voy a pedir unos datos para agendar la cita. Primero, ¿Cuál es tu nombre?",{capture: true},
        async (ctx,ctxFn)=>{
            console.log("Entrando al formFlow...");
            await ctxFn.state.update({name: ctx.body}) // Guarda el nombre en el estado
           }
    )
    .addAnswer("Tipo de examen y un número de contacto porfavor",{capture: true},
        async (ctx,ctxFn)=>{
            await ctxFn.state.update({motive: ctx.body}) // Guarda el motivo en el estado
           }
    )
    .addAnswer("Excelente, Ya agendé la cita. Gracias por confiar en Laboratorio Clínico K&j. Te esperamos",null,
        async (ctx,ctxFn)=>{
            const userInfo =  await ctxFn.state.getMyState();
            const eventName =  userInfo.name;
            const description = userInfo.motive;
            const date = userInfo.date;
            const eventId = await createEvent(eventName,description,date);

            await ctxFn.flowDynamic(`🗓️ Tu cita fue registrada con el ID: ${eventId}`);
            await ctxFn.state.clear();
        }
    )

