import { addKeyword, utils } from "@builderbot/bot"
//import dateFlow from "./date.flow.js";
//import recomendacionesFlow from "./recomendaciones.flow.js";
//import examenesPdfFlow from "./examenPdf.flow.js";



const permisosPdfFlow = addKeyword(utils.setEvent('PERMISO_FLOW'))
    .addAnswer(
        '📄 *Consentimiento Informado*'+
        'Este documento es un acuerdo donde se detalla que la información del paciente, no será compartida ni usada para ningún otro propósito que no sea el de realizar los exámenes solicitados.',
        {
            media: 'https://javierestrada26.github.io/acuerdo/consentimiento_informado.pdf'
        }
    )
    .addAnswer(
        "\n En que más podemos ayudarle?",
        "\n🏥 *Laboratorio Clínico K&J* 🏥\n\n" +
        "*1* 📅 Agendar Cita\n" +
        "*2* 🔬 Exámenes y Precios\n" +
        "*3* 📋 Recomendaciones\n\n" +
        "Por favor, escriba el *número* de la opción que desea:",
        { capture: true },
        /*async (ctx, ctxFn) => {
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
                    
                default:
                    return ctxFn.flowDynamic(
                        "❌ Opción no válida. Por favor, seleccione:\n\n" +
                        "*1* 📅 Agendar Cita\n" +
                        "*2* 🔬 Exámenes y Precios\n" +
                        "*3* 📋 Recomendaciones"
                    );
            }
        }*/
    )

export default permisosPdfFlow;