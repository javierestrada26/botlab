import { addKeyword, utils } from "@builderbot/bot"
import dateFlow from "./date.flow.js";
import recomendacionesFlow from "./recomendaciones.flow.js";
import permisoPdfFlow from "./permisoPdf.flow.js";




const examenesPdfFlow = addKeyword(utils.setEvent('EXAMENES_FLOW'))

    .addAnswer(
        '📄 *Catálogo de Exámenes y Precios*',
        {
            media: 'https://javierestrada26.github.io/listado/PRECIOS_LABORATORIO_KyJ.pdf'
        }
    )
    .addAnswer(
        "\n En que más podemos ayudarle?",
        "\n🏥 *Laboratorio Clínico K&J* 🏥\n\n" +
        "*1* 📅 Agendar Cita\n" +
        "*2* 📄 Permiso Consentido\n" +
        "*3* 📋 Recomendaciones\n\n" +
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
                    console.log("Usuario eligió opción 2: Permiso consentido");
                   return ctxFn.gotoFlow(permisoPdfFlow);
                   

                case '3':
                    console.log("Usuario eligió opción 3: Recomendaciones");
                    return ctxFn.gotoFlow(recomendacionesFlow);
                   
                default:
                    return ctxFn.flowDynamic(
                        "❌ Opción no válida. Por favor, seleccione:\n\n" +
                        "*1* 📅 Agendar Cita\n" +
                        "*2* 📄 Permiso Consentido\n" +
                        "*3* 📋 Recomendaciones"
                    );
            }
        }
    )

export default examenesPdfFlow;