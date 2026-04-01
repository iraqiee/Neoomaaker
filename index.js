const { Telegraf, Markup } = require('telegraf');

// ⚠️ ضع توكن بوتك الرئيسي هنا
const masterBot = new Telegraf('8594167014:AAGvlDzry3ZWtM4MOgIbSIPhDlYRezvJvq0');

const runningBots = {}; 
const userChoices = {};

masterBot.start((ctx) => {
    ctx.reply(`أهلاً بك يا علي في مصنع البوتات المطور 🏭\nيوزر بوتك: @${ctx.botInfo.username}\n\nاختر النوع الذي تريد تشغيله:`, 
    Markup.inlineKeyboard([
        [Markup.button.callback('📩 بوت تواصل', 'type_contact')],
        [Markup.button.callback('🛡️ بوت حماية', 'type_admin')],
        [Markup.button.callback('🎮 بوت ألعاب', 'type_games')]
    ]));
});

masterBot.on('callback_query', (ctx) => {
    userChoices[ctx.from.id] = ctx.callbackQuery.data;
    ctx.answerCbQuery();
    ctx.reply('✅ تم الاختيار! الآن أرسل "التوكن" من @BotFather.');
});

masterBot.on('text', async (ctx) => {
    const token = ctx.message.text.trim();
    const selectedType = userChoices[ctx.from.id];

    if (token.includes(':') && selectedType) {
        if (runningBots[token]) return ctx.reply('⚠️ هذا البوت يعمل بالفعل!');

        const loading = await ctx.reply('⏳ جاري فحص التوكن... (إذا استغرق الأمر أكثر من 10 ثوانٍ فالجهاز معلق)');

        try {
            const newUserBot = new Telegraf(token);

            // فحص التوكن قبل التشغيل (مهم جداً لعدم تعليق السيرفر)
            const botInfo = await newUserBot.telegram.getMe().catch(() => null);
            
            if (!botInfo) {
                return ctx.telegram.editMessageText(ctx.chat.id, loading.message_id, null, '❌ التوكن غير صحيح! تأكد منه من BotFather.');
            }

            // --- 1. مود التواصل ---
            if (selectedType === 'type_contact') {
                newUserBot.start((uCtx) => uCtx.reply('مرحباً! أرسل رسالتك وسأوصلها للمطور.'));
                newUserBot.on('message', (uCtx) => {
                    if (uCtx.from.id !== ctx.from.id) {
                        masterBot.telegram.sendMessage(ctx.from.id, `📥 من: ${uCtx.from.first_name}\n\n${uCtx.message.text || 'مستند/صورة'}`);
                        uCtx.reply('✅ تم الإرسال.');
                    }
                });
            } 
            // --- 2. مود الحماية ---
            else if (selectedType === 'type_admin') {
                newUserBot.start((uCtx) => uCtx.reply('بوت الحماية جاهز! ارفعني مشرفاً.'));
                newUserBot.on('new_chat_members', (uCtx) => uCtx.reply('ممنوع البوتات!'));
            }
            // --- 3. مود الألعاب ---
            else if (selectedType === 'type_games') {
                newUserBot.hears('تسلية', (uCtx) => uCtx.reply('أهلاً بك في عالم الألعاب!'));
                newUserBot.hears('كت تويت', (uCtx) => uCtx.reply('ما هو حلمك؟ 🎤'));
            }

            // تشغيل البوت بدون انتظار (Non-blocking)
            newUserBot.launch().catch(err => console.log("Error launching sub-bot:", err));
            runningBots[token] = newUserBot;
            
            ctx.telegram.editMessageText(ctx.chat.id, loading.message_id, null, `🚀 نجحنا يا علي!\nتم تشغيل @${botInfo.username}\nالنوع: ${selectedType}`);
            delete userChoices[ctx.from.id];

        } catch (e) {
            ctx.reply('❌ حدث خطأ تقني في تشغيل البوت.');
        }
    }
});

masterBot.launch();
