// ========== form.flow.js - VERSION DEBUG MEJORADO ==========
import { addKeyword, utils } from "@builderbot/bot";
import { createEvent } from "../scripts/calendar/calendar.js";

const formFlow = addKeyword(utils.setEvent('FORM_FLOW'))
    .addAnswer("🎉 ¡Perfecto! Ahora necesito algunos datos para completar tu cita.", null,
        async (ctx, ctxFn) => {
            console.log("=== DEBUG FORM FLOW - INICIO ===");
            console.log("Usuario:", ctx.from);
            console.log("FORM FLOW INICIADO CORRECTAMENTE! 🎉");
            
            try {
                const currentState = await ctxFn.state.getMyState();
                console.log("Estado al iniciar formFlow:", JSON.stringify(currentState, null, 2));
                console.log("¿Tiene fecha guardada?:", !!currentState.date);
                console.log("Fecha guardada:", currentState.date);
            } catch (error) {
                console.error("Error obteniendo estado en formFlow:", error);
            }
        }
    )
    .addAnswer("¿Cuál es tu nombre completo? 👤", {capture: true},
        async (ctx, ctxFn) => {
            console.log("=== DEBUG FORM - NOMBRE ===");
            console.log("Usuario:", ctx.from);
            console.log("Nombre ingresado:", ctx.body);
            
            try {
                await ctxFn.state.update({name: ctx.body});
                
                const currentState = await ctxFn.state.getMyState();
                console.log("Estado después de guardar nombre:", JSON.stringify(currentState, null, 2));
            } catch (error) {
                console.error("Error guardando nombre:", error);
            }
        }
    )
    .addAnswer("¿Qué tipo de examen necesitas y cuál es tu número de contacto? 📋📞", {capture: true},
        async (ctx, ctxFn) => {
            console.log("=== DEBUG FORM - MOTIVO ===");
            console.log("Usuario:", ctx.from);
            console.log("Motivo/contacto ingresado:", ctx.body);
            
            try {
                await ctxFn.state.update({motive: ctx.body});
                
                const currentState = await ctxFn.state.getMyState();
                console.log("Estado final antes de crear evento:", JSON.stringify(currentState, null, 2));
            } catch (error) {
                console.error("Error guardando motivo:", error);
            }
        }
    )
    .addAnswer("🎯 Procesando tu cita...", null,
        async (ctx, ctxFn) => {
            console.log("=== DEBUG FORM - CREAR EVENTO ===");
            console.log("Usuario:", ctx.from);
            
            try {
                const userInfo = await ctxFn.state.getMyState();
                console.log("Datos para crear evento:", JSON.stringify(userInfo, null, 2));
                
                if (!userInfo.date) {
                    console.error("❌ No hay fecha en el estado");
                    return ctxFn.flowDynamic("Error: No se encontró la fecha de la cita.");
                }
                
                if (!userInfo.name) {
                    console.error("❌ No hay nombre en el estado");
                    return ctxFn.flowDynamic("Error: No se encontró el nombre.");
                }
                
                console.log("📅 Creando evento con:", {
                    name: userInfo.name,
                    motive: userInfo.motive || "Cita médica",
                    date: userInfo.date
                });
                
                const eventId = await createEvent(userInfo.name, userInfo.motive || "Cita médica", userInfo.date);
                console.log("✅ Evento creado con ID:", eventId);
                
                await ctxFn.flowDynamic(`✅ ¡Listo! Tu cita ha sido agendada.\n🆔 ID de cita: ${eventId}\n\n🏥 Te esperamos en Laboratorio Clínico K&J`);
                
                await ctxFn.state.clear();
                console.log("🧹 Estado limpiado");
                
            } catch (error) {
                console.error("❌ Error creando evento:", error);
                console.error("Stack trace:", error.stack);
                await ctxFn.flowDynamic("❌ Hubo un error al crear tu cita. Por favor intenta nuevamente.");
            }
        }
    );

export default formFlow;