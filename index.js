const { Telegraf, Markup } = require('telegraf');

// ⚠️ ضـع تـوكـن بـوتـك الـرئيسي هـنـا
const masterBot = new Telegraf('8594167014:AAGvlDzry3ZWtM4MOgIbSIPhDlYRezvJvq0');

const runningBots = {}; 
const userChoices = {};

masterBot.start((ctx) => {
    ctx.reply(`أهلاً بك يا علي في مصنع البوتات 🏭\nيوزر بوتك الحالي: @${ctx.botInfo.username}\n\nاختر نوع البوت الذي تريد تشغيله:`, 
    Markup.inlineKeyboard([
        [Markup.button.callback('📩 بوت تواصل', 'type_contact')],
        [Markup.button.callback('🎮 بوت ألعاب', 'type_games')]
    ]));
});

masterBot.on('callback_query', (ctx) => {
    userChoices[ctx.from.id] = ctx.callbackQuery.data;
    ctx.answerCbQuery();
    ctx.reply('✅ تم الاختيار! الآن أرسل "التوكن" لتفعيل البوت.');
});

masterBot.on('text', async (ctx) => {
    const token = ctx.message.text.trim();
    const selectedType = userChoices[ctx.from.id];
    const developerId = ctx.from.id; // حفظ آيدي الشخص اللي صنع البوت

    if (token.includes(':') && selectedType) {
        if (runningBots[token]) return ctx.reply('⚠️ هذا البوت يعمل بالفعل!');

        const loading = await ctx.reply('⏳ جاري ربط التوكن بالبرمجية...');

        try {
            const newUserBot = new Telegraf(token);

            // فحص التوكن
            const botInfo = await newUserBot.telegram.getMe().catch(() => null);
            if (!botInfo) return ctx.reply('❌ التوكن غير صحيح.');

            // --- 1. برمجة بوت التواصل (مستقل تماماً) ---
            if (selectedType === 'type_contact') {
                newUserBot.start((uCtx) => uCtx.reply('مرحباً بك في بوت التواصل! أرسل رسالتك وسيرد عليك المطور قريباً.'));
                
                newUserBot.on('message', (uCtx) => {
                    // إذا أرسل شخص (غير المطور) رسالة
                    if (uCtx.from.id !== developerId) {
                        // البوت يرسل الرسالة للمطور (أنت) داخل "بوت التواصل نفسه"
                        newUserBot.telegram.sendMessage(developerId, `📥 رسالة من: ${uCtx.from.first_name}\nالآيدي: ${uCtx.from.id}\n\n${uCtx.message.text || 'ملف/صورة'}\n\n-- للرد أرسل (رد + الآيدي + نص الرسالة) --`);
                        uCtx.reply('✅ تم إرسال رسالتك.');
                    } 
                    // إذا قام المطور بالرد باستخدام كلمة "رد"
                    else if (uCtx.message.text && uCtx.message.text.startsWith('رد')) {
                        const parts = uCtx.message.text.split(' ');
                        const targetId = parts[1];
                        const replyMsg = parts.slice(2).join(' ');
                        newUserBot.telegram.sendMessage(targetId, `💬 رد من المطور:\n\n${replyMsg}`);
                        uCtx.reply('✅ تم إرسال ردك بنجاح.');
                    }
                });
            }

            // --- 2. برمجة بوت الألعاب ---
            else if (selectedType === 'type_games') {
                newUserBot.start((uCtx) => uCtx.reply('بوت الألعاب جاهز! أرسل (تسلية)'));
                newUserBot.hears('تسلية', (uCtx) => uCtx.reply('أهلاً بك في الألعاب!'));
                newUserBot.hears('كت تويت', (uCtx) => uCtx.reply('ما هو هدفك القادم؟'));
            }

            newUserBot.launch();
            runningBots[token] = newUserBot;
            
            ctx.telegram.editMessageText(ctx.chat.id, loading.message_id, null, `🚀 تم التشغيل بنجاح!\nالبوت الجديد: @${botInfo.username}\n\nالآن اذهب إلى بوتك الجديد وجربه، لن يتدخل البوت الرئيسي بعد الآن.`);
            delete userChoices[ctx.from.id];

        } catch (e) {
            ctx.reply('❌ حدث خطأ في التشغيل.');
        }
    }
});

masterBot.launch();
