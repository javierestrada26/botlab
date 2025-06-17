
import { createBot, createProvider, createFlow, addKeyword, EVENTS, utils } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { mainMenuFlow } from './flows/welcome.flow.js'


import recomendacionesFlow from './flows/recomendaciones.flow.js'

import examenesPdfFlow from './flows/examenPdf.flow.js'

import permisosPdfFlow from './flows/permisoPdf.flow.js'
import dateFlow from './flows/date.flow.js'
import formFlow from './flows/form.flow.js'
import homeFlow from './flows/home.flow.js'










const PORT = process.env.PORT ?? 3008

/*const discordFlow = addKeyword('doc').addAnswer(
    ['You can see the documentation here', '📄 https://builderbot.app/docs \n', 'Do you want to continue? *yes*'].join(
        '\n'
    ),
    { capture: true },
    async (ctx, { gotoFlow, flowDynamic }) => {
        if (ctx.body.toLocaleLowerCase().includes('yes')) {
            return gotoFlow(registerFlow)
        }
        await flowDynamic('Thanks!')
        return
    }
)

const welcomeFlow = addKeyword(['hi', 'hello', 'hola'])
    .addAnswer(`🙌 Hello welcome to this *Chatbot*`)
    .addAnswer(
        [
            'I share with you the following links of interest about the project',
            '👉 *doc* to view the documentation',
        ].join('\n'),
        { delay: 800, capture: true },
        async (ctx, { fallBack }) => {
            if (!ctx.body.toLocaleLowerCase().includes('doc')) {
                return fallBack('You should type *doc*')
            }
            return
        },
        [discordFlow]
    )

const registerFlow = addKeyword(utils.setEvent('REGISTER_FLOW'))
    .addAnswer(`What is your name?`, { capture: true }, async (ctx, { state }) => {
        await state.update({ name: ctx.body })
    })
    .addAnswer('What is your age?', { capture: true }, async (ctx, { state }) => {
        await state.update({ age: ctx.body })
    })
    .addAction(async (_, { flowDynamic, state }) => {
        await flowDynamic(`${state.get('name')}, thanks for your information!: Your age: ${state.get('age')}`)
    })

const fullSamplesFlow = addKeyword(['samples', utils.setEvent('SAMPLES')])
    .addAnswer(`💪 I'll send you a lot files...`)
    .addAnswer(`Send image from Local`, { media: join(process.cwd(), 'assets', 'sample.png') })
    .addAnswer(`Send video from URL`, {
        media: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTJ0ZGdjd2syeXAwMjQ4aWdkcW04OWlqcXI3Ynh1ODkwZ25zZWZ1dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LCohAb657pSdHv0Q5h/giphy.mp4',
    })
    .addAnswer(`Send audio from URL`, { media: 'https://cdn.freesound.org/previews/728/728142_11861866-lq.mp3' })
    .addAnswer(`Send file from URL`, {
        media: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    })*/

// Flujo de consentimiento informado
const consentimientoFlow = addKeyword(utils.setEvent('CONSENTIMIENTO_FLOW'))
    .addAnswer(
        '🤖 ¡Hola! Bienvenido/a a nuestro sistema de atención.\n\n' +
        '📋 Antes de continuar, necesitamos informarte sobre el manejo de tus datos personales.\n\n' +
        '📄 *Consentimiento Informado*\n\n' +
        'Este documento es un acuerdo donde se detalla que la información del paciente, no será compartida ni usada para ningún otro propósito que no sea el de realizar los exámenes solicitados.',
        {
            media: 'https://javierestrada26.github.io/acuerdo/consentimiento_informado.pdf'
        }
    )
    .addAnswer(
        '\n¿Aceptas el manejo de tus datos de acuerdo al documento mostrado?\n\n' +
        '*1* ✅ Sí, acepto y deseo continuar\n' +
        '*2* ❌ No acepto\n\n' +
        'Por favor, escribe el número de tu respuesta:',
        { capture: true },
        async (ctx, ctxFn) => {
            const userResponse = ctx.body.trim();
            
            if (userResponse === '1') {
                // Usuario acepta, continuar al menú principal
                await ctxFn.flowDynamic('✅ ¡Perfecto! Has aceptado nuestros términos de manejo de datos.\n\n🎉 ¡Ahora puedes acceder a todos nuestros servicios!');
                return ctxFn.gotoFlow(mainMenuFlow);
            } else if (userResponse === '2') {
                // Usuario no acepta, terminar el flujo
                return ctxFn.flowDynamic(
                    '❌ Entendemos tu decisión.\n\n' +
                    '🙏 Gracias por considerar nuestros servicios. Si cambias de opinión en el futuro, estaremos aquí para ayudarte.\n\n' +
                    '👋 ¡Que tengas un excelente día!'
                );
            } else {
                // Opción inválida
                return ctxFn.flowDynamic(
                    '❌ Opción no válida. Por favor responde:\n\n' +
                    '*1* para ACEPTAR el manejo de datos\n' +
                    '*2* para NO ACEPTAR\n\n' +
                    'Escribe solo el número de tu opción:'
                );
            }
        }
    );

// Flujo principal que se activa con cualquier mensaje
const flowPrincipal = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, ctxFn) => {
        // Se activa con cualquier mensaje (sin importar el contenido)
        // Ir directamente al flujo de consentimiento
        return await ctxFn.gotoFlow(consentimientoFlow);
    });



const main = async () => {
    const adapterFlow = createFlow([flowPrincipal, mainMenuFlow, dateFlow, formFlow, recomendacionesFlow, examenesPdfFlow, permisosPdfFlow, consentimientoFlow,homeFlow])
    

    const adapterProvider = createProvider(Provider, {
        jwtToken: process.env.JWT_TOKEN,
        numberId: process.env.NUMBER_ID,
        verifyToken: process.env.VERIFY_TOKEN,
        version: 'v22.0'
    })
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/samples',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('SAMPLES', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )

    httpServer(+PORT)
}

main()
