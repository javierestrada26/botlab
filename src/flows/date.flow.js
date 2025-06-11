import { addKeyword, EVENTS } from "@builderbot/bot";

import { iso2text, text2iso } from "../scripts/utils/utils.js";
import { getNextAvailableSlot, isDateAvailable } from "../scripts/calendar/calendar.js";
import { chatOpenAi } from "../scripts/gpt/openai/chatgpt.js";
import { formFlow } from "./form.flow.js";




const promptBase = 
`Eres un asistente virtual diseñado para ayudar a los usuarios a agendar citas mediante una conversación.
 Tu objetivo es ayudar al usuario a elegir un horario y fecha para sacar turno.

Escenarios de respuesta:
1. Si la fecha solicitada está disponible:
   - Confirma disponibilidad
   - Indica fecha y hora exacta
   - Usa un tono amable y profesional

2. Si la fecha solicitada NO está disponible:
   - Ofrece una disculpa sincera
   - Explica que la fecha no está disponible
   - Propón la siguiente fecha disponible más cercana
   - Mantén un tono cordial y servicial

Instrucciones importantes:
- Siempre usa el español
- Sé preciso con las fechas y horas
- Evita hacer preguntas adicionales
- Mantén un tono empático y profesional
`;

const confirmationFlow = addKeyword(EVENTS.ACTION)
    .addAnswer("Confirmas la fecha propuesta? Responde unicamente con 'si' o 'no'", {capture: true}, 
        async (ctx, ctxFn) => {
            const userResponse = ctx.body.toLowerCase().trim();
            console.log(userResponse);
            
            if (userResponse === "si") {
                console.log("Usuario respondió 'si', navegando a formFlow...");
                return ctxFn.gotoFlow(formFlow);
            } else if (userResponse === "no") { 
                console.log("Usuario respondió 'no'.");
                return ctxFn.endFlow("Cita cancelada. Vuelve a solicitar una cita para elegir otra fecha");
            } else {
                // Repeat the confirmation question for invalid responses
                return ctxFn.flowDynamic("Por favor, responde solo con 'si' o 'no'.")
                    .then(() => ctxFn.gotoFlow(confirmationFlow));
            }
        }
);


const dateFlow =  addKeyword(EVENTS.ACTION)
    .addAnswer("Perfecto, que fecha quieres agendar?",{capture:true})
    .addAnswer("Revisando disponibilidad ...", null,
        async (ctx, ctxFn) => {
            const currentDate = new Date();
            const solicitedDate = await text2iso(ctx.body)
            console.log("Fecha solicitada: " + solicitedDate)

            if(solicitedDate.includes("false")){
                return ctxFn.endFlow("No se puede deducir una fecha. Por favor, intenta nuevamente.")
            }

            const startDate = new Date(solicitedDate);
            console.log("Fecha solicitada: " + startDate);

            let dateAvailable = await isDateAvailable(startDate)
            console.log("Disponibilidad de la fecha solicitada: " + dateAvailable)

            if(dateAvailable === false ){
                const nextdateAvailable = await getNextAvailableSlot(startDate)
                if (!nextdateAvailable) {
                    return ctxFn.endFlow("Lo siento, no hay fechas disponibles en este momento.");
                }

                console.log("Proxima fecha disponible: " + nextdateAvailable.start);
                const isoString = nextdateAvailable.start.toISOString();
                const dateText = await iso2text(isoString)
                console.log("Proxima fecha disponible: " + dateText);

                const messages = [{role:"user", content:`${ctx.body}`}];
                const response = await chatOpenAi(
                    promptBase + 
                    `\nHoy es el día: ${currentDate}` + 
                    `\nLa fecha solicitada es: ${solicitedDate}` + 
                    `\nLa disponibilidad de esa fecha es: false` + 
                    `\nEl próximo espacio disponible es: ${dateText}` + 
                    "\nResponde con un mensaje amable explicando que la fecha no está disponible y ofreciendo la siguiente.", 
                    messages
                )
                await ctxFn.flowDynamic(response)
                await ctxFn.state.update({date: nextdateAvailable.start});
                return ctxFn.gotoFlow(confirmationFlow)
            } else {
                const messages = [{role:"user", content:`${ctx.body}`}];
                const response = await chatOpenAi(
                    promptBase + 
                    `\nHoy es el día: ${currentDate}` + 
                    `\nLa fecha solicitada es: ${solicitedDate}` + 
                    `\nLa disponibilidad de esa fecha es: true` + 
                    "\nConfirma la disponibilidad de manera amable.", 
                    messages
                )
                await ctxFn.flowDynamic(response)
                await ctxFn.state.update({date: startDate});
                return ctxFn.gotoFlow(confirmationFlow)
            }


        }
);


export default dateFlow;




