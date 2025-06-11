import { addKeyword, EVENTS } from "@builderbot/bot";
import dateFlow from "./date.flow.js";
import { mainMenuFlow } from "./welcome.flow.js";

import examenesPdfFlow from "./examenPdf.flow.js";

const recomendacionesFlow = addKeyword(EVENTS.ACTION)
    .addAnswer(
        "📋 *RECOMENDACIONES GENERALES* 📋\n\n" +
        "*ANTES DE SU VISITA:*\n\n" +
        "🕐 *Ayuno:*\n" +
        "• Si le indicaron ayuno, evite alimentos sólidos entre 8 y 12 horas antes.\n" +
        "💧 *Hidratación:*\n" +
        "• Puede tomar agua durante el ayuno\n" +
        "• Evite bebidas azucaradas o con cafeína\n\n" +
        "💊 *Medicamentos:*\n" +
        "• Consulte con su médico si debe suspender algún medicamento\n" +
        "• Traiga lista de medicamentos actuales\n\n" +
        "📄 *Documentos necesarios:*\n" +
        "• Traiga su cédula y orden médica (si aplica)\n" +
        "*¿Qué desea hacer ahora?*\n\n" +
        "*1* 📅 Agendar Cita\n" +
        "*2* 🔬 Ver Exámenes y Precios\n" +
        "*3* 🔙 Volver al Menú Principal\n\n" +
        "Escriba el número de su opción:",
        { capture: true },
        async (ctx, ctxFn) => {
            const userResponse = ctx.body.trim();
            
            switch(userResponse) {
                case '1':
                    return ctxFn.gotoFlow(dateFlow);
                    
                case '2':
                    return ctxFn.gotoFlow(examenesPdfFlow);
                    
                case '3':
                    return ctxFn.gotoFlow(mainMenuFlow);
                    
                default:
                    return ctxFn.flowDynamic(
                        "❌ Opción no válida. Por favor seleccione:\n\n" +
                        "*1* 📅 Agendar Cita\n" +
                        "*2* 🔬 Ver Exámenes y Precios\n" +
                        "*3* 🔙 Volver al Menú Principal"
                    );
            }
        }
    );

    export default recomendacionesFlow;