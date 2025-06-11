
import { addKeyword, EVENTS } from "@builderbot/bot";
import { chatOpenAi } from "../scripts/gpt/openai/chatgpt.js";

// Base de datos de exámenes
const examenesDB = {
    "laboratorio": {
        nombre: "Exámenes de Laboratorio",
        examenes: [
            { nombre: "Hemograma Completo", precio: 25.00, codigo: "LAB001" },
            { nombre: "Glucosa en Sangre", precio: 15.00, codigo: "LAB002" },
            { nombre: "Perfil Lipídico", precio: 35.00, codigo: "LAB003" },
            { nombre: "Función Renal (Creatinina + Urea)", precio: 30.00, codigo: "LAB004" },
            { nombre: "Función Hepática", precio: 40.00, codigo: "LAB005" },
            { nombre: "Examen General de Orina", precio: 12.00, codigo: "LAB006" },
            { nombre: "TSH (Hormona Estimulante del Tiroides)", precio: 28.00, codigo: "LAB007" },
            { nombre: "Antígeno Prostático Específico (PSA)", precio: 45.00, codigo: "LAB008" }
        ]
    },
    "imagenologia": {
        nombre: "Exámenes de Imagenología",
        examenes: [
            { nombre: "Radiografía de Tórax", precio: 35.00, codigo: "IMG001" },
            { nombre: "Ecografía Abdominal", precio: 65.00, codigo: "IMG002" },
            { nombre: "Ecografía Pélvica", precio: 60.00, codigo: "IMG003" },
            { nombre: "Mamografía", precio: 80.00, codigo: "IMG004" },
            { nombre: "Tomografía de Cráneo", precio: 150.00, codigo: "IMG005" },
            { nombre: "Resonancia Magnética de Columna", precio: 280.00, codigo: "IMG006" },
            { nombre: "Ecocardiograma", precio: 95.00, codigo: "IMG007" }
        ]
    },
    "cardiologia": {
        nombre: "Exámenes Cardiológicos",
        examenes: [
            { nombre: "Electrocardiograma (ECG)", precio: 25.00, codigo: "CAR001" },
            { nombre: "Prueba de Esfuerzo", precio: 120.00, codigo: "CAR002" },
            { nombre: "Holter de 24 horas", precio: 180.00, codigo: "CAR003" },
            { nombre: "MAPA (Monitoreo Ambulatorio de Presión)", precio: 160.00, codigo: "CAR004" }
        ]
    },
    "endoscopia": {
        nombre: "Exámenes Endoscópicos",
        examenes: [
            { nombre: "Colonoscopia", precio: 250.00, codigo: "END001" },
            { nombre: "Endoscopia Digestiva Alta", precio: 200.00, codigo: "END002" },
            { nombre: "Gastroscopia", precio: 180.00, codigo: "END003" }
        ]
    }
};

// Prompt para el asistente de IA
const promptExamenes = 
`Eres un asistente especializado en información de exámenes médicos.
Tu objetivo es ayudar al usuario a encontrar información sobre exámenes disponibles.

Instrucciones:
- Siempre usa el español
- Sé claro y conciso
- Si el usuario pregunta por un examen específico, proporciona información detallada
- Si pregunta por una categoría, menciona los exámenes disponibles
- Siempre incluye precios cuando sea relevante
- Mantén un tono profesional y amigable
- Si no encuentras el examen exacto, sugiere alternativas similares
`;

// Función para mostrar el menú principal
function mostrarMenuPrincipal() {
    return `¡Hola! Te ayudo con información sobre nuestros exámenes médicos.

*Puedes elegir una opción:*

*1️⃣* Ver todas las categorías
*2️⃣* Buscar un examen específico
*3️⃣* Ver exámenes por categoría
*4️⃣* Agendar una cita
*0️⃣* Volver al menú principal

Escribe el *número* de la opción que deseas:`;
}

// Función para buscar exámenes
function buscarExamen(consulta) {
    const consultaLower = consulta.toLowerCase();
    const resultados = [];
    
    Object.keys(examenesDB).forEach(categoria => {
        examenesDB[categoria].examenes.forEach(examen => {
            if (examen.nombre.toLowerCase().includes(consultaLower) ||
                consultaLower.includes(examen.nombre.toLowerCase().split(' ')[0]) ||
                consultaLower.includes(examen.nombre.toLowerCase().split(' ')[1])) {
                resultados.push({
                    ...examen,
                    categoria: examenesDB[categoria].nombre
                });
            }
        });
    });
    
    return resultados;
}

// Función para obtener exámenes por categoría (mantenida para uso futuro)
/*function obtenerPorCategoria(categoria) {
    const categoriaKey = categoria.toLowerCase();
    
    // Mapeo de palabras clave a categorías
    const mapeoCategoria = {
        'laboratorio': 'laboratorio',
        'lab': 'laboratorio',
        'sangre': 'laboratorio',
        'orina': 'laboratorio',
        'imagen': 'imagenologia',
        'imagenologia': 'imagenologia',
        'radiografia': 'imagenologia',
        'ecografia': 'imagenologia',
        'tomografia': 'imagenologia',
        'resonancia': 'imagenologia',
        'corazon': 'cardiologia',
        'cardiologia': 'cardiologia',
        'electrocardiograma': 'cardiologia',
        'endoscopia': 'endoscopia',
        'colonoscopia': 'endoscopia',
        'gastroscopia': 'endoscopia'
    };
    
    for (const [key, value] of Object.entries(mapeoCategoria)) {
        if (categoriaKey.includes(key)) {
            return examenesDB[value] || null;
        }
    }
    
    return null;
}*/

// Función para formatear lista de exámenes
function formatearExamenes(examenes, incluirCategoria = false) {
    if (!examenes || examenes.length === 0) {
        return "No se encontraron exámenes que coincidan con tu búsqueda.";
    }
    
    let mensaje = "";
    examenes.forEach((examen, index) => {
        mensaje += `${index + 1}. *${examen.nombre}*\n`;
        if (incluirCategoria && examen.categoria) {
            mensaje += `   📋 Categoría: ${examen.categoria}\n`;
        }
        mensaje += `   💰 Precio: $${examen.precio.toFixed(2)}\n`;
        mensaje += `   🔢 Código: ${examen.codigo}\n\n`;
    });
    
    return mensaje;
}

// Función para mostrar todas las categorías con menú
function mostrarCategorias() {
    let mensaje = "*📋 CATEGORÍAS DE EXÁMENES DISPONIBLES:*\n\n";
    
    Object.keys(examenesDB).forEach((key, index) => {
        const categoria = examenesDB[key];
        mensaje += `*${index + 1}️⃣* ${categoria.nombre}\n`;
        mensaje += `   📊 ${categoria.examenes.length} exámenes disponibles\n\n`;
    });
    
    mensaje += "*Elige una opción:*\n";
    mensaje += "*1️⃣* Laboratorio\n";
    mensaje += "*2️⃣* Imagenología\n";
    mensaje += "*3️⃣* Cardiología\n";
    mensaje += "*4️⃣* Endoscopia\n";
    mensaje += "*0️⃣* Volver al menú principal\n\n";
    mensaje += "Escribe el *número* de la categoría que deseas ver:";
    
    return mensaje;
}

// Función para mostrar menú de categorías específicas
function mostrarMenuCategorias() {
    return `*🔍 SELECCIONA UNA CATEGORÍA:*

*1️⃣* Laboratorio
*2️⃣* Imagenología  
*3️⃣* Cardiología
*4️⃣* Endoscopia
*0️⃣* Volver al menú principal

Escribe el *número* de la categoría:`;
}

// Flujo principal de exámenes
const examenesFlow = addKeyword(['examenes', 'exámenes', 'lista examenes', 'que examenes', 'precios examenes'])
    .addAnswer(
        mostrarMenuPrincipal(),
        { capture: true },
        async (ctx, ctxFn) => {
            try {
                const opcion = ctx.body.trim();
                
                switch (opcion) {
                    case '1': {
                       
                        await ctxFn.flowDynamic(mostrarCategorias);
                        return ctxFn.gotoFlow(categoriasFlow);
                    }
                        
                    case '2': {
                        await ctxFn.flowDynamic(
                            "*🔍 BÚSQUEDA DE EXAMEN ESPECÍFICO*\n\n" +
                            "Escribe el nombre del examen que buscas.\n" +
                            "Ejemplo: 'hemograma', 'glucosa', 'ecografía'\n\n" +
                            "*0️⃣* Volver al menú principal"
                        );
                        return ctxFn.gotoFlow(busquedaFlow);
                    }
                        
                    case '3':
                        await ctxFn.flowDynamic(mostrarMenuCategorias);
                        return ctxFn.gotoFlow(categoriasFlow);
                        
                    case '4':
                        await ctxFn.flowDynamic("Te redirijo para agendar tu cita...");
                        return ctxFn.endFlow("Para agendar una cita, escribe 'quiero agendar una cita'.");
                        
                    case '0':
                        return ctxFn.endFlow("¡Perfecto! ¿En qué más puedo ayudarte?");
                        
                    default:
                        await ctxFn.flowDynamic(
                            "❌ *Opción no válida*\n\n" +
                            "Por favor, escribe solo el *número* de la opción que deseas.\n\n" +
                            mostrarMenuPrincipal()
                        );
                        return ctxFn.gotoFlow(examenesFlow);
                }
                
            } catch (error) {
                console.error("Error en examenesFlow:", error);
                await ctxFn.flowDynamic(
                    "❌ Ha ocurrido un error. Volvamos al menú principal:\n\n" +
                    mostrarMenuPrincipal()
                );
                return ctxFn.gotoFlow(examenesFlow);
            }
        }
    );

// Flujo para mostrar categorías
const categoriasFlow = addKeyword(EVENTS.ACTION)
    .addAnswer(
        "Procesando tu selección...",
        { capture: true },
        async (ctx, ctxFn) => {
            try {
                const opcion = ctx.body.trim();
                let respuesta = "";
                
                switch (opcion) {
                    case '1':
                        respuesta = `*${examenesDB.laboratorio.nombre.toUpperCase()}*\n\n`;
                        respuesta += formatearExamenes(examenesDB.laboratorio.examenes);
                        break;
                        
                    case '2':
                        respuesta = `*${examenesDB.imagenologia.nombre.toUpperCase()}*\n\n`;
                        respuesta += formatearExamenes(examenesDB.imagenologia.examenes);
                        break;
                        
                    case '3':
                        respuesta = `*${examenesDB.cardiologia.nombre.toUpperCase()}*\n\n`;
                        respuesta += formatearExamenes(examenesDB.cardiologia.examenes);
                        break;
                        
                    case '4':
                        respuesta = `*${examenesDB.endoscopia.nombre.toUpperCase()}*\n\n`;
                        respuesta += formatearExamenes(examenesDB.endoscopia.examenes);
                        break;
                        
                    case '0':
                        await ctxFn.flowDynamic(mostrarMenuPrincipal());
                        return ctxFn.gotoFlow(examenesFlow);
                        
                    default:
                        await ctxFn.flowDynamic(
                            "❌ *Opción no válida*\n\n" +
                            "Por favor, escribe solo el *número* de la categoría.\n\n" +
                            mostrarMenuCategorias()
                        );
                        return ctxFn.gotoFlow(categoriasFlow);
                }
                
                respuesta += "\n*¿Qué deseas hacer ahora?*\n\n";
                respuesta += "*1️⃣* Ver otra categoría\n";
                respuesta += "*2️⃣* Buscar un examen específico\n";
                respuesta += "*3️⃣* Agendar una cita\n";
                respuesta += "*0️⃣* Volver al menú principal\n\n";
                respuesta += "Escribe el *número* de tu opción:";
                
                await ctxFn.flowDynamic(respuesta);
                return ctxFn.gotoFlow(opcionesFlow);
                
            } catch (error) {
                console.error("Error en categoriasFlow:", error);
                await ctxFn.flowDynamic(
                    "❌ Ha ocurrido un error. Volvamos al menú principal:\n\n" +
                    mostrarMenuPrincipal()
                );
                return ctxFn.gotoFlow(examenesFlow);
            }
        }
    );

// Flujo para búsqueda específica
const busquedaFlow = addKeyword(EVENTS.ACTION)
    .addAnswer(
        "Escribe el nombre del examen:",
        { capture: true },
        async (ctx, ctxFn) => {
            try {
                const consulta = ctx.body.trim();
                
                if (consulta === '0') {
                    await ctxFn.flowDynamic(mostrarMenuPrincipal());
                    return ctxFn.gotoFlow(examenesFlow);
                }
                
                const resultados = buscarExamen(consulta);
                let respuesta = "";
                
                if (resultados.length > 0) {
                    respuesta = "*🔍 EXÁMENES ENCONTRADOS:*\n\n";
                    respuesta += formatearExamenes(resultados, true);
                } else {
                    // Usar IA para generar respuesta más inteligente
                    const messages = [{ role: "user", content: ctx.body }];
                    const aiResponse = await chatOpenAi(
                        promptExamenes + 
                        "\nEl usuario busca información sobre exámenes pero no se encontraron coincidencias exactas." +
                        "\nSugiere exámenes similares o pide más detalles de manera amigable." +
                        "\nNo inventes precios ni exámenes que no existan en la base de datos.",
                        messages
                    );
                    respuesta = aiResponse + "\n\n";
                }
                
                respuesta += "*¿Qué deseas hacer ahora?*\n\n";
                respuesta += "*1️⃣* Buscar otro examen\n";
                respuesta += "*2️⃣* Ver categorías\n";
                respuesta += "*3️⃣* Agendar una cita\n";
                respuesta += "*0️⃣* Volver al menú principal\n\n";
                respuesta += "Escribe el *número* de tu opción:";
                
                await ctxFn.flowDynamic(respuesta);
                return ctxFn.gotoFlow(opcionesFlow);
                
            } catch (error) {
                console.error("Error en busquedaFlow:", error);
                await ctxFn.flowDynamic(
                    "❌ Ha ocurrido un error en la búsqueda. Volvamos al menú principal:\n\n" +
                    mostrarMenuPrincipal()
                );
                return ctxFn.gotoFlow(examenesFlow);
            }
        }
    );

// Flujo de opciones generales
const opcionesFlow = addKeyword(EVENTS.ACTION)
    .addAnswer(
        "Procesando tu opción...",
        { capture: true },
        async (ctx, ctxFn) => {
            try {
                const opcion = ctx.body.trim();
                
                switch (opcion) {
                    case '1':
                        if (ctx.from === 'categorias') {
                            const menuCategorias = mostrarMenuCategorias();
                            await ctxFn.flowDynamic(menuCategorias);
                            return ctxFn.gotoFlow(categoriasFlow);
                        } else {
                            await ctxFn.flowDynamic(
                                "*🔍 BÚSQUEDA DE EXAMEN ESPECÍFICO*\n\n" +
                                "Escribe el nombre del examen que buscas.\n" +
                                "Ejemplo: 'hemograma', 'glucosa', 'ecografía'\n\n" +
                                "*0️⃣* Volver al menú principal"
                            );
                            return ctxFn.gotoFlow(busquedaFlow);
                        }
                        
                    case '2':
                        if (ctx.from === 'busqueda') {
                            const categorias = mostrarCategorias();
                            await ctxFn.flowDynamic(categorias);
                            return ctxFn.gotoFlow(categoriasFlow);
                        } else {
                            await ctxFn.flowDynamic(
                                "*🔍 BÚSQUEDA DE EXAMEN ESPECÍFICO*\n\n" +
                                "Escribe el nombre del examen que buscas.\n" +
                                "Ejemplo: 'hemograma', 'glucosa', 'ecografía'\n\n" +
                                "*0️⃣* Volver al menú principal"
                            );
                            return ctxFn.gotoFlow(busquedaFlow);
                        }
                        
                    case '3':
                        await ctxFn.flowDynamic("Te redirijo para agendar tu cita...");
                        return ctxFn.endFlow("Para agendar una cita, escribe 'quiero agendar una cita'.");
                        
                    case '0':
                        await ctxFn.flowDynamic(mostrarMenuPrincipal());
                        return ctxFn.gotoFlow(examenesFlow);
                        
                    default:
                        await ctxFn.flowDynamic(
                            "❌ *Opción no válida*\n\n" +
                            "Por favor, escribe solo el *número* de la opción que deseas.\n\n" +
                            mostrarMenuPrincipal()
                        );
                        return ctxFn.gotoFlow(examenesFlow);
                }
                
            } catch (error) {
                console.error("Error en opcionesFlow:", error);
                await ctxFn.flowDynamic(
                    "❌ Ha ocurrido un error. Volvamos al menú principal:\n\n" +
                    mostrarMenuPrincipal()
                );
                return ctxFn.gotoFlow(examenesFlow);
            }
        }
    );

export default examenesFlow;