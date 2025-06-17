// ========== date.flow.js - VERSIÓN SIMPLIFICADA SOLO LABORATORIO ==========
import { addKeyword, utils } from "@builderbot/bot";
import { iso2text, text2iso } from "../scripts/utils/utils.js";
import { getNextAvailableSlot, isDateAvailable } from "../scripts/calendar/calendar.js";
import { createEvent } from "../scripts/calendar/calendar.js";
import { mainMenuFlow } from "./welcome.flow.js";
import homeFlow from "./home.flow.js"; // Importar el nuevo flujo

const dateFlow = addKeyword(utils.setEvent('DATE_FLOW'))
    // MENÚ PARA ELEGIR TIPO DE SERVICIO
    .addAnswer("¿Dónde deseas realizar tu examen? 🏥\n\n1️⃣ - En el laboratorio\n2️⃣ - A domicilio", {capture: true},
        async (ctx, ctxFn) => {
            console.log("=== DEBUG MENU SERVICIO ===");
            console.log("Usuario:", ctx.from);
            console.log("Opción seleccionada:", ctx.body);
            
            const userResponse = ctx.body.trim();
            
            switch (userResponse) {
                case "1":
                    console.log("✅ Usuario eligió laboratorio - Continuando en este flujo");
                    await ctxFn.state.update({
                        serviceType: "laboratorio",
                        serviceLocation: "Laboratorio Clínico K&J"
                    });
                    break;
                    
                case "2":
                    console.log("🏠 Usuario eligió domicilio - Redirigiendo a home.flow.js");
                    return ctxFn.gotoFlow(homeFlow);
                    
                    
                default:
                    console.log("⚠️ Opción inválida:", userResponse);
                    return ctxFn.flowDynamic("Por favor, responde solo con:\n1️⃣ - Para laboratorio\n2️⃣ - Para domicilio");
            }
        }
    )
    // RESTO DEL FLUJO SOLO PARA LABORATORIO
    .addAnswer("¿Qué fecha y hora deseas agendar tu cita? 📅", {capture: true})
    .addAnswer("🔍 Verificando disponibilidad...", null,
        async (ctx, ctxFn) => {
            console.log("=== DEBUG DATE FLOW - LABORATORIO ===");
            console.log("Usuario:", ctx.from);
            console.log("Texto ingresado:", ctx.body);
            
            try {
                const solicitedDate = await text2iso(ctx.body);
                console.log("Fecha ISO:", solicitedDate);

                if (solicitedDate.includes("false")) {
                    return ctxFn.endFlow("❌ No pude interpretar la fecha.");
                }

                const startDate = new Date(solicitedDate);
                const dateAvailable = await isDateAvailable(startDate);
                console.log("¿Disponible?:", dateAvailable);

                await ctxFn.state.update({
                    date: startDate,
                    dateIso: solicitedDate,
                    originalInput: ctx.body,
                    timestamp: new Date().toISOString()
                });

                let finalDate = startDate;
                let dateText = "";

                if (!dateAvailable) {
                    const nextAvailable = await getNextAvailableSlot(startDate);
                    if (!nextAvailable) {
                        return ctxFn.endFlow("😔 No hay fechas disponibles.");
                    }
                    finalDate = nextAvailable.start;
                    dateText = await iso2text(nextAvailable.start.toISOString());
                    await ctxFn.state.update({date: nextAvailable.start});
                    await ctxFn.flowDynamic(`😔 Fecha no disponible. Disponible: *${dateText}*`);
                } else {
                    dateText = await iso2text(startDate.toISOString());
                    await ctxFn.flowDynamic(`✅ Fecha *${dateText}* disponible.`);
                }
                
                console.log("📅 Fecha final a confirmar:", finalDate);
                
            } catch (error) {
                console.error("❌ Error en dateFlow:", error);
                return ctxFn.endFlow("Error al procesar la fecha.");
            }
        }
    )
    // CONFIRMACIÓN
    .addAnswer("¿Confirmas esta fecha?\n\n1️⃣ - Sí, confirmar\n2️⃣ - No, cancelar", {capture: true}, 
        async (ctx, ctxFn) => {
            console.log("=== DEBUG CONFIRMATION - LABORATORIO ===");
            console.log("Usuario:", ctx.from);
            console.log("Respuesta:", ctx.body);
            
            const userResponse = ctx.body.trim();
            
            if (userResponse === "1") {
                console.log("✅ Usuario confirmó - Continuando al formulario");
            } else if (userResponse === "2") { 
                console.log("❌ Usuario canceló");
                return ctxFn.endFlow("Entendido. Si deseas agendar otra fecha, inicia el proceso nuevamente.");
            } else {
                return ctxFn.flowDynamic("Por favor, responde solo con '1' para confirmar o '2' para cancelar");
            }
        }
    )
    // FORMULARIO PARA LABORATORIO
    .addAnswer("🎉 ¡Perfecto! Ahora necesito algunos datos para completar tu cita en el laboratorio.", null,
        async (ctx) => {
            console.log("=== FORMULARIO LABORATORIO INICIADO ===");
            console.log("Usuario:", ctx.from);
        }
    )
    .addAnswer("¿Cuál es tu nombre completo? 👤", {capture: true},
        async (ctx, ctxFn) => {
            console.log("Nombre ingresado:", ctx.body);
            await ctxFn.state.update({name: ctx.body});
        }
    )
    .addAnswer("¿Qué tipo de examen necesitas y cuál es tu número de contacto? 📋📞", {capture: true},
        async (ctx, ctxFn) => {
            console.log("Motivo/contacto ingresado:", ctx.body);
            await ctxFn.state.update({
                motive: ctx.body,
                address: "No aplica - Servicio en laboratorio"
            });
        }
    )
    // PROCESAMIENTO FINAL PARA LABORATORIO
    .addAnswer("🎯 Procesando tu cita en el laboratorio...", null,
        async (ctx, ctxFn) => {
            console.log("=== CREANDO EVENTO LABORATORIO ===");
            
            try {
                const userInfo = await ctxFn.state.getMyState();
                console.log("Datos del usuario:", JSON.stringify(userInfo, null, 2));
                
                if (!userInfo.date || !userInfo.name) {
                    return ctxFn.flowDynamic("❌ Error: Faltan datos para crear la cita.");
                }
                
                let eventDescription = userInfo.motive || "Cita médica";
                eventDescription += "\n🏥 Servicio en laboratorio";
                eventDescription += "\n📍 Laboratorio Clínico K&J";
                
                console.log("📅 Creando evento:", {
                    name: userInfo.name,
                    description: eventDescription,
                    date: userInfo.date
                });
                
                const eventId = await createEvent(userInfo.name, eventDescription, userInfo.date);
                console.log("✅ Evento creado con ID:", eventId);
                
                const confirmationMessage = `✅ ¡Listo! Tu cita ha sido agendada.\n🆔 ID de cita: ${eventId}\n\n🏥 Te esperamos en:\n📍 Laboratorio Clínico K&J\n\n⏰ En la fecha y hora acordada.`;
                
                await ctxFn.flowDynamic(confirmationMessage);
                await ctxFn.state.clear();
                
            } catch (error) {
                console.error("❌ Error creando evento:", error);
                await ctxFn.flowDynamic("❌ Hubo un error al crear tu cita. Por favor intenta nuevamente.");
            }
        }
    )
    // PREGUNTA FINAL
    .addAnswer("¿Necesitas algo más?\n\n1️⃣ - Sí, ir al menú principal\n2️⃣ - No, finalizar", {capture: true},
        async (ctx, ctxFn) => {
            console.log("=== PREGUNTA FINAL LABORATORIO ===");
            console.log("Respuesta:", ctx.body);
            
            const userResponse = ctx.body.trim();
            
            if (userResponse === "1") {
                console.log("✅ Ir al menú principal");
                return ctxFn.gotoFlow(mainMenuFlow);
            } else if (userResponse === "2") {
                console.log("👋 Finalizar conversación");
                return ctxFn.endFlow("¡Gracias por contactarnos! 😊\n\n🏥 Laboratorio Clínico K&J te desea un excelente día.\n\n💬 Puedes escribirnos cuando necesites agendar otra cita.");
            } else {
                return ctxFn.flowDynamic("Por favor, responde solo con:\n1️⃣ - Para ir al menú principal\n2️⃣ - Para finalizar");
            }
        }
    );

export default dateFlow;