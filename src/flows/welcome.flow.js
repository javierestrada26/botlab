import { EVENTS, addKeyword } from "@builderbot/bot";
import dateFlow from "./date.flow.js";
import recomendacionesFlow from "./recomendaciones.flow.js";
//import examenesFlow from "./examenes.flow.js";
import examenesPdfFlow from "./examenPdf.flow.js";
import permisoPdfFlow from "./permisoPdf.flow.js";


export const mainMenuFlow = addKeyword(EVENTS.ACTION)
    .addAnswer(
        "🏥 *Bienvenido a Laboratorio Clínico K&J* 🏥\n\n" +
        "¿En qué podemos ayudarle hoy?\n\n" +
        "*1* 📅 Agendar Cita\n" +
        "*2* 🔬 Exámenes y Precios\n" +
        "*3* 📋 Recomendaciones\n" +
        "*4* 📄 Consentimiento Informado\n\n"  +
        "Por favor, escriba el *número* de la opción que desea:",
        { capture: true },
        async (ctx, ctxFn) => {
            const userResponse = ctx.body.trim();
            console.log("[Menú Principal] Usuario ingresó:", userResponse);

            switch (userResponse) {
                case '1':
                    console.log("Usuario eligió opción 1: Agendar Cita");
                    return ctxFn.gotoFlow(dateFlow);
                    

                case '2':
                    console.log("Usuario eligió opción 2: Exámenes y Precios");
                   return ctxFn.gotoFlow(examenesPdfFlow);
                   

                case '3':
                    console.log("Usuario eligió opción 3: Recomendaciones");
                    return ctxFn.gotoFlow(recomendacionesFlow);
                
                case '4':
                    console.log("Usuario eligió opción 4: Consentimiento Informado");
                    return ctxFn.gotoFlow(permisoPdfFlow);
                    
                default:
                    return ctxFn.flowDynamic(
                        "❌ Opción no válida. Por favor, seleccione:\n\n" +
                        "*1* 📅 Agendar Cita\n" +
                        "*2* 🔬 Exámenes y Precios\n" +
                        "*3* 📋 Recomendaciones"+
                        "*4*📄 Consentimiento Informado"
                    );
            }
        }
    );
