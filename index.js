const { Telegraf, Markup } = require('telegraf');

// ⚠️ ضـع تـوكـن بـوتـك الـرئيسي هـنـا
const masterBot = new Telegraf('8594167014:AAGvlDzry3ZWtM4MOgIbSIPhDlYRezvJvq0');

const runningBots = {}; 
const userChoices = {};

// القائمة الرئيسية للبوت الأم
masterBot.start((ctx) => {
    ctx.reply(`أهلاً بك يا مبرمج علي في مصنع البوتات 🏭\n\nاختر نوع البوت الذي تريد إنشاؤه الآن:`, 
    Markup.inlineKeyboard([
        [Markup.button.callback('📩 بوت تواصل (Messages)', 'type_contact')],
        [Markup.button.callback('🛡️ بوت حماية (Admin)', 'type_admin')],
        [Markup.button.callback('🎮 بوت ألعاب (Games)', 'type_games')]
    ]));
});

// التعامل مع اختيار النوع
masterBot.on('callback_query', (ctx) => {
    const type = ctx.callbackQuery.data;
    userChoices[ctx.from.id] = type;
    ctx.answerCbQuery();
    ctx.reply('✅ اختيار ممتاز! الآن أرسل "التوكن" (Token) من @BotFather لتشغيل البوت.');
});

// استقبال التوكن وتشغيل البوت المختار
masterBot.on('text', async (ctx) => {
    const token = ctx.message.text;
    const selectedType = userChoices[ctx.from.id];

    if (token.includes(':') && selectedType) {
        if (runningBots[token]) return ctx.reply('⚠️ هذا البوت يعمل بالفعل على السيرفر!');

        const loading = await ctx.reply('⏳ جاري فحص التوكن وتنصيب البرمجية...');

        try {
            const newUserBot = new Telegraf(token);

            // --- 1. مود بوت التواصل ---
            if (selectedType === 'type_contact') {
                newUserBot.start((uCtx) => uCtx.reply('مرحباً! أرسل رسالتك هنا وسأوصلها للمطور.'));
                newUserBot.on('message', (uCtx) => {
                    if (uCtx.from.id !== ctx.from.id) {
                        masterBot.telegram.sendMessage(ctx.from.id, `📥 رسالة جديدة من: ${uCtx.from.first_name}\n\n${uCtx.message.text || 'أرسل ملف/صورة'}`);
                        uCtx.reply('✅ تم إرسال رسالتك بنجاح.');
                    }
                });
            } 
            
            // --- 2. مود بوت الحماية ---
            else if (selectedType === 'type_admin') {
                newUserBot.start((uCtx) => uCtx.reply('بوت الحماية يعمل! قم برفعه مشرفاً في الجروب.'));
                newUserBot.on('new_chat_members', (uCtx) => uCtx.reply('ممنوع دخول البوتات! سيتم طرد أي بوت غريب.'));
                newUserBot.hears('طرد', (uCtx) => {
                    if(uCtx.message.reply_to_message) uCtx.kickChatMember(uCtx.message.reply_to_message.from.id);
                });
            }

            // --- 3. مود بوت الألعاب (المتحجر) ---
            else if (selectedType === 'type_games') {
                newUserBot.start((uCtx) => uCtx.reply('بوت الألعاب جاهز! أرسل (تسلية) لرؤية القائمة.'));
                newUserBot.hears('تسلية', (uCtx) => uCtx.reply('اختر لعبة:', Markup.keyboard([['كت تويت', 'لو خيروك'], ['نسبة الحب', 'رمزيات']]).resize()));
                newUserBot.hears('كت تويت', (uCtx) => uCtx.reply('ما هو هدفك في الحياة؟ 🎤'));
                newUserBot.hears('لو خيروك', (uCtx) => uCtx.reply('لو خيروك بين: \n 🍱 أكل صيني \n 🍕 بيتزا إيطالية'));
            }

            await newUserBot.launch();
            runningBots[token] = newUserBot;
            
            const botInfo = await newUserBot.telegram.getMe();
            ctx.telegram.editMessageText(ctx.chat.id, loading.message_id, null, `🚀 مبروك يا علي!\nتم تشغيل بوتك بنجاح.\n\nنوع البوت: ${selectedType}\nيوزر البوت: @${botInfo.username}`);
            delete userChoices[ctx.from.id];

        } catch (e) {
            ctx.reply('❌ فشل! التوكن غير صحيح أو أن تليجرام يرفض الاتصال حالياً.');
        }
    }
});

masterBot.launch();
