import { addKeyword, EVENTS } from "@builderbot/bot";
//import dateFlow from "./date.flow.js";
import { mainMenuFlow } from "./welcome.flow.js";

//import examenesPdfFlow from "./examenPdf.flow.js";

// Función para obtener el mensaje de recomendación
const getRecommendationMessage = (option) => {
    switch(option) {
        case '1':
            return "🩸 *RECOMENDACIONES PARA EXÁMENES DE SANGRE*\n\n" +
                "🕐 *Ayuno:*\n" +
                "• Si le indicaron ayuno, evite alimentos sólidos entre 8 y 12 horas antes.\n\n" +
                "💧 *Hidratación:*\n" +
                "• Puede tomar agua durante el ayuno\n" +
                "• Evite bebidas azucaradas o con cafeína";
                
        case '2':
            return "🧪 *RECOLECCIÓN DE MUESTRA DE ORINA*\n\n" +
                "🕐 *Cuándo recogerla:*\n" +
                "• Preferiblemente la primera orina de la mañana\n\n" +
                "🧼 *Preparación:*\n" +
                "1. Lávese bien las manos\n" +
                "2. Limpie la zona genital con agua y jabón\n" +
                "3. Enjuague y seque con toalla limpia\n\n" +
                "🧪 *Recolección:*\n" +
                "1. Orine un poco en el inodoro (descartar primer chorro)\n" +
                "2. Recoja el chorro medio en el frasco estéril\n" +
                "3. Llene ¾ del frasco\n" +
                "4. Entregue en menos de 2 horas o refrigere (máx. 4 horas)";
                
        case '3':
            return "💩 *RECOLECCIÓN DE MUESTRA DE HECES*\n\n" +
                "🧼 *Preparación:*\n" +
                "1. Lávese bien las manos\n" +
                "2. Orine antes de evacuar (evitar contaminación)\n\n" +
                "🧪 *Recolección:*\n" +
                "1. Defeque en recipiente limpio y seco\n" +
                "2. Tome muestra del tamaño de una nuez con la paleta\n" +
                "3. Incluya partes líquidas, mucosidad o sangre si las hay\n" +
                "4. Cierre bien el frasco\n" +
                "5. Entregue en 1-2 horas o refrigere (máx. 12 horas)\n\n" +
                "⚠️ *No mezcle con orina, agua ni papel higiénico*";
                
        case '4':
            return "💊 *RECOMENDACIONES SOBRE MEDICAMENTOS*\n\n" +
                "• Consulte con su médico si debe suspender algún medicamento\n" +
                "• Traiga lista completa de medicamentos actuales\n" +
                "• No suspenda medicamentos sin autorización médica";
                
        case '5':
            return "📄 *DOCUMENTOS NECESARIOS*\n\n" +
                "• Traiga su cédula de identidad\n" +
                "• Orden médica (si aplica)\n" +
                "• Carnet del seguro (si tiene)\n" +
                "• Resultados de exámenes anteriores (si es seguimiento)";
                
        default:
            return null;
    }
};

const recomendacionesFlow = addKeyword(EVENTS.ACTION)
    .addAnswer(
        "📋 *RECOMENDACIONES PARA EXÁMENES* 📋\n\n" +
        "Seleccione el tipo de recomendación que necesita:\n\n" +
        "*1* 🩸 Sangre\n" +
        "*2* 🧪 Orina\n" +
        "*3* 💩 Heces\n" +
        "*4* 💊 Medicamentos\n" +
        "*5* 📄 Documentos\n\n" +
        "Escriba el número de su opción:",
        { capture: true },
        async (ctx, ctxFn) => {
            const userResponse = ctx.body.trim();
            const responseMessage = getRecommendationMessage(userResponse);
            
            if (responseMessage) {
                await ctxFn.flowDynamic(responseMessage);
            } else {
                return ctxFn.flowDynamic(
                    "❌ Opción no válida. Por favor seleccione:\n\n" +
                    "*1* 🩸 Sangre\n" +
                    "*2* 🧪 Orina\n" +
                    "*3* 💩 Heces\n" +
                    "*4* 💊 Medicamentos\n" +
                    "*5* 📄 Documentos"
                );
            }
        }
    )
    .addAnswer(
        "\n¿Desea consultar otra recomendación?\n\n" +
        "*1* ✅ Sí, ver más recomendaciones\n" +
        "*2* ❌ No, ir al menú principal\n\n" +
        "Escriba su opción:",
        { capture: true },
        async (ctx, ctxFn) => {
            const userResponse = ctx.body.trim();
            
            if (userResponse === '1') {
                // Reiniciar el flujo de recomendaciones
                return ctxFn.gotoFlow(recomendacionesFlow);
            } else if (userResponse === '2') {
                return ctxFn.gotoFlow(mainMenuFlow);
            } else {
                return ctxFn.flowDynamic(
                    "❌ Opción no válida. Por favor escriba:\n" +
                    "*1* para ver más recomendaciones\n" +
                    "*2* para ir al menú principal"
                );
            }
        }
    );

export default recomendacionesFlow;