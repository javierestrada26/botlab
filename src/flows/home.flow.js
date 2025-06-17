
// ========== home.flow.js - FLUJO PARA SERVICIOS A DOMICILIO ==========
import { addKeyword, utils } from "@builderbot/bot";
import { iso2text, text2iso } from "../scripts/utils/utils.js";
import { getNextAvailableSlot, isDateAvailable } from "../scripts/calendar/calendar.js";
import { createEvent } from "../scripts/calendar/calendar.js";
import { mainMenuFlow } from "./welcome.flow.js";

const homeFlow = addKeyword(utils.setEvent('HOME_FLOW'))
    // MENSAJE DE BIENVENIDA AL FLUJO A DOMICILIO
    .addAnswer("🏠 ¡Perfecto! Has elegido nuestro servicio a domicilio.\n\nTe visitaremos en la comodidad de tu hogar. 🚗", null,
        async (ctx, ctxFn) => {
            console.log("=== INICIO FLUJO DOMICILIO ===");
            console.log("Usuario:", ctx.from);
            
            // Establecer el tipo de servicio
            await ctxFn.state.update({
                serviceType: "domicilio",
                serviceLocation: "Servicio a domicilio"
            });
            
            console.log("✅ Tipo de servicio establecido: domicilio");
        }
    )
    // SOLICITAR FECHA Y HORA
    .addAnswer("¿Qué fecha y hora deseas agendar tu cita a domicilio? 📅", {capture: true})
    .addAnswer("🔍 Verificando disponibilidad para servicio a domicilio...", null,
        async (ctx, ctxFn) => {
            console.log("=== DEBUG DATE FLOW - DOMICILIO ===");
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
                console.log("¿Disponible para domicilio?:", dateAvailable);

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
                        return ctxFn.endFlow("😔 No hay fechas disponibles para servicio a domicilio.");
                    }
                    finalDate = nextAvailable.start;
                    dateText = await iso2text(nextAvailable.start.toISOString());
                    await ctxFn.state.update({date: nextAvailable.start});
                    await ctxFn.flowDynamic(`😔 Fecha no disponible. Disponible para domicilio: *${dateText}*`);
                } else {
                    dateText = await iso2text(startDate.toISOString());
                    await ctxFn.flowDynamic(`✅ Fecha *${dateText}* disponible para servicio a domicilio.`);
                }
                
                console.log("📅 Fecha final a confirmar (domicilio):", finalDate);
                
            } catch (error) {
                console.error("❌ Error en homeFlow:", error);
                return ctxFn.endFlow("Error al procesar la fecha para servicio a domicilio.");
            }
        }
    )
    // CONFIRMACIÓN
    .addAnswer("¿Confirmas esta fecha para tu cita a domicilio?\n\n1️⃣ - Sí, confirmar\n2️⃣ - No, cancelar", {capture: true}, 
        async (ctx, ctxFn) => {
            console.log("=== DEBUG CONFIRMATION - DOMICILIO ===");
            console.log("Usuario:", ctx.from);
            console.log("Respuesta:", ctx.body);
            
            const userResponse = ctx.body.trim();
            
            if (userResponse === "1") {
                console.log("✅ Usuario confirmó cita a domicilio");
            } else if (userResponse === "2") { 
                console.log("❌ Usuario canceló cita a domicilio");
                return ctxFn.endFlow("Entendido. Si deseas agendar una cita a domicilio en otra fecha, inicia el proceso nuevamente.");
            } else {
                return ctxFn.flowDynamic("Por favor, responde solo con '1' para confirmar o '2' para cancelar");
            }
        }
    )
    // FORMULARIO PARA DOMICILIO
    .addAnswer("🎉 ¡Excelente! Ahora necesito algunos datos para tu cita a domicilio.", null,
        async (ctx) => {
            console.log("=== FORMULARIO DOMICILIO INICIADO ===");
            console.log("Usuario:", ctx.from);
        }
    )
    .addAnswer("¿Cuál es tu nombre completo? 👤", {capture: true},
        async (ctx, ctxFn) => {
            console.log("Nombre ingresado (domicilio):", ctx.body);
            await ctxFn.state.update({name: ctx.body});
        }
    )
    .addAnswer("¿Qué tipo de examen necesitas y cuál es tu número de contacto? 📋📞", {capture: true},
        async (ctx, ctxFn) => {
            console.log("Motivo/contacto ingresado (domicilio):", ctx.body);
            await ctxFn.state.update({motive: ctx.body});
        }
    )
    // PREGUNTA ESPECÍFICA PARA DOMICILIO - DIRECCIÓN
    .addAnswer("¿Cuál es la dirección completa donde debemos visitarte? 📍🏠\n\n(Incluye calle, número, referencias importantes)", {capture: true},
        async (ctx, ctxFn) => {
            console.log("=== CAPTURA DIRECCIÓN DOMICILIO ===");
            console.log("Usuario:", ctx.from);
            console.log("Dirección ingresada:", ctx.body);
            
            await ctxFn.state.update({address: ctx.body});
            console.log("✅ Dirección guardada para servicio a domicilio");
        }
    )
    // PREGUNTA ADICIONAL PARA DOMICILIO - REFERENCIAS
    .addAnswer("¿Hay alguna referencia adicional o instrucciones especiales para llegar a tu domicilio? 🗺️\n\n(Ejemplo: color de casa, portón, intercomunicador, etc.)", {capture: true},
        async (ctx, ctxFn) => {
            console.log("=== CAPTURA REFERENCIAS DOMICILIO ===");
            console.log("Usuario:", ctx.from);
            console.log("Referencias ingresadas:", ctx.body);
            
            await ctxFn.state.update({references: ctx.body});
            console.log("✅ Referencias guardadas para servicio a domicilio");
        }
    )
    // PROCESAMIENTO FINAL PARA DOMICILIO
    .addAnswer("🎯 Procesando tu cita a domicilio...", null,
        async (ctx, ctxFn) => {
            console.log("=== CREANDO EVENTO DOMICILIO ===");
            
            try {
                const userInfo = await ctxFn.state.getMyState();
                console.log("Datos del usuario (domicilio):", JSON.stringify(userInfo, null, 2));
                
                if (!userInfo.date || !userInfo.name || !userInfo.address) {
                    return ctxFn.flowDynamic("❌ Error: Faltan datos para crear la cita a domicilio.");
                }
                
                // Preparar descripción detallada para servicio a domicilio
                let eventDescription = userInfo.motive || "Cita médica a domicilio";
                eventDescription += "\n🚗 Servicio a domicilio";
                eventDescription += `\n📍 Dirección: ${userInfo.address}`;
                if (userInfo.references && userInfo.references.trim() !== "") {
                    eventDescription += `\n🗺️ Referencias: ${userInfo.references}`;
                }
                eventDescription += "\n🏥 Laboratorio Clínico K&J";
                
                console.log("📅 Creando evento domicilio:", {
                    name: userInfo.name,
                    description: eventDescription,
                    date: userInfo.date,
                    address: userInfo.address,
                    references: userInfo.references
                });
                
                const eventId = await createEvent(userInfo.name, eventDescription, userInfo.date);
                console.log("✅ Evento a domicilio creado con ID:", eventId);
                
                const confirmationMessage = `✅ ¡Listo! Tu cita a domicilio ha sido agendada.\n🆔 ID de cita: ${eventId}\n\n🚗 Servicio a domicilio\n📍 Dirección: ${userInfo.address}\n${userInfo.references ? `🗺️ Referencias: ${userInfo.references}\n` : ""}\n🏥 El equipo de Laboratorio Clínico K&J llegará a tu domicilio en la fecha y hora acordada.\n\n📞 Te contactaremos antes de llegar para confirmar nuestra visita.`;
                
                await ctxFn.flowDynamic(confirmationMessage);
                await ctxFn.state.clear();
                console.log("🧹 Estado limpiado (domicilio)");
                
            } catch (error) {
                console.error("❌ Error creando evento domicilio:", error);
                await ctxFn.flowDynamic("❌ Hubo un error al crear tu cita a domicilio. Por favor intenta nuevamente.");
            }
        }
    )
    // PREGUNTA FINAL
    .addAnswer("¿Necesitas algo más?\n\n1️⃣ - Sí, ir al menú principal\n2️⃣ - No, finalizar", {capture: true},
        async (ctx, ctxFn) => {
            console.log("=== PREGUNTA FINAL DOMICILIO ===");
            console.log("Respuesta:", ctx.body);
            
            const userResponse = ctx.body.trim();
            
            if (userResponse === "1") {
                console.log("✅ Ir al menú principal desde domicilio");
                return ctxFn.gotoFlow(mainMenuFlow);
            } else if (userResponse === "2") {
                console.log("👋 Finalizar conversación desde domicilio");
                return ctxFn.endFlow("¡Gracias por elegir nuestro servicio a domicilio! 🏠😊\n\n🚗 Laboratorio Clínico K&J te visitará en la fecha acordada.\n\n💬 Puedes escribirnos cuando necesites agendar otra cita.");
            } else {
                return ctxFn.flowDynamic("Por favor, responde solo con:\n1️⃣ - Para ir al menú principal\n2️⃣ - Para finalizar");
            }
        }
    );

export default homeFlow;