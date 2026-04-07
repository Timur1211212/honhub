const express = require("express");
const https = require('https');
const http = require('http');
const fs = require("fs");
const path = require("path");
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 80;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

// SSL сертификаты для продакшена
let sslOptions = null;

// Пути к сертификатам (можно переопределить через .env)
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/honhub.ru/privkey.pem';
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/honhub.ru/fullchain.pem';
const SSL_CA_PATH = process.env.SSL_CA_PATH || '/etc/letsencrypt/live/honhub.ru/chain.pem';

// Проверяем наличие сертификатов
if (fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH)) {
    try {
        sslOptions = {
            key: fs.readFileSync(SSL_KEY_PATH),
            cert: fs.readFileSync(SSL_CERT_PATH),
            ca: fs.existsSync(SSL_CA_PATH) ? fs.readFileSync(SSL_CA_PATH) : null
        };
        console.log('✅ SSL сертификаты загружены успешно');
    } catch (error) {
        console.error('❌ Ошибка при загрузке SSL сертификатов:', error.message);
        sslOptions = null;
    }
} else {
    console.log('⚠️ SSL сертификаты не найдены');
}

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'hon123';
const ADMIN_PATH = process.env.ADMIN_PATH || '/secure-panel-2024-internal-access';

let hashedPassword = '';
bcrypt.hash(ADMIN_PASSWORD, 12).then(hash => {
    hashedPassword = hash;
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Слишком много запросов, попробуйте позже',
});

const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Слишком много запросов, попробуйте через 15 минут',
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helmet для безопасности
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "https://mc.yandex.ru", "https://mc.yandex.com", "https://mc.yandex.md"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://mc.yandex.ru", "https://mc.yandex.com", "https://mc.yandex.md"],
            scriptSrcAttr: ["'unsafe-inline'"],
            connectSrc: ["'self'", "https://mc.yandex.ru", "https://mc.yandex.com", "https://mc.yandex.md", "wss://mc.yandex.com", "wss://mc.yandex.ru"],
            frameSrc: ["'self'", "https://mc.yandex.ru", "https://mc.yandex.com", "https://mc.yandex.md"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'", "https://example.com"],
        },
    },
    hsts: false
}));

app.use(compression());
app.use(morgan('combined'));
app.use(express.static("public"));

// Middleware для добавления метрики
app.use((req, res, next) => {
    const originalSend = res.send;
    const originalSendFile = res.sendFile;
    
    res.send = function(data) {
        if (typeof data === 'string' && data.includes('</body>') && !data.includes('ym(108215701')) {
            const metricaCode = `
<!-- Яндекс.Метрика -->
<script type="text/javascript" >
   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
   m[i].l=1*new Date();
   for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
   k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

   ym(108215701, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true
   });
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/108215701" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<!-- /Яндекс.Метрика -->`;
            data = data.replace('</body>', metricaCode + '</body>');
        }
        originalSend.call(this, data);
    };
    
    res.sendFile = function(filePath, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                if (callback) callback(err);
                return;
            }
            
            if (data.includes('</body>') && !data.includes('ym(108215701')) {
                const metricaCode = `
<!-- Яндекс.Метрика -->
<script type="text/javascript" >
   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
   m[i].l=1*new Date();
   for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
   k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

   ym(108215701, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true
   });
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/108215701" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<!-- /Яндекс.Метрика -->`;
                data = data.replace('</body>', metricaCode + '</body>');
            }
            
            res.send(data);
            if (callback) callback(null);
        });
    };
    
    next();
});

app.set('trust proxy', 1);

// ============= ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ =============

function findHeroFile(heroName) {
    const heroPath = path.join(__dirname, "public", "heroes");
    const possiblePaths = [
        path.join(heroPath, "legion", "intelligence", `${heroName}.html`),
        path.join(heroPath, "legion", "agility", `${heroName}.html`),
        path.join(heroPath, "legion", "strength", `${heroName}.html`),
        path.join(heroPath, "hellbourne", "intelligence", `${heroName}.html`),
        path.join(heroPath, "hellbourne", "agility", `${heroName}.html`),
        path.join(heroPath, "hellbourne", "strength", `${heroName}.html`)
    ];
    
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            return filePath;
        }
    }
    return null;
}

// Админ авторизация
const adminAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('Требуется авторизация');
    }
    
    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    
    if (username === ADMIN_LOGIN && hashedPassword) {
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (isMatch) {
            next();
        } else {
            res.status(401).send('Неверный логин или пароль');
        }
    } else {
        res.status(401).send('Неверный логин или пароль');
    }
};

// ============= МАРШРУТЫ =============

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "heroes-of-newerth.html"));
});

app.get("/heroes", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "heroes.html"));
});

app.get("/heroes/:hero", (req, res) => {
    const hero = req.params.hero;
    console.log(`Запрос героя: ${hero}`);
    
    const heroFilePath = findHeroFile(hero);
    if (heroFilePath) {
        return res.sendFile(heroFilePath);
    }
    
    res.status(404).sendFile(path.join(__dirname, "public", "hero-not-found.html"));
});

app.get("/dictionary", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dictionary-of-terms.html"));
});

app.get("/patch-notes", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "patch-notes.html"));
});

app.get("/guides", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "guides.html"));
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/privacy", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "privacy.html"));
});

app.get("/terms", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "terms.html"));
});

app.get("/items", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "items.html"));
});

app.get("/hero-not-found", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "hero-not-found.html"));
});

app.get("/sitemap.xml", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "sitemap.xml"));
});

app.get("/robots.txt", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "robots.txt"));
});

app.post("/submit-feedback", limiter, [
    body('name').trim().not().isEmpty().withMessage('Имя не может быть пустым'),
    body('email').trim().isEmail().withMessage('Некорректный email'),
    body('message').trim().not().isEmpty().withMessage('Сообщение не может быть пустым')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: "Ошибка валидации данных", 
            details: errors.array().map(error => error.msg)
        });
    }
    
    const { name, email, message } = req.body;
    const feedback = {
        id: Date.now(),
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        timestamp: new Date().toISOString(),
        status: "new"
    };
    
    let feedbacks = [];
    const feedbackFile = path.join(__dirname, "feedbacks.json");
    
    if (fs.existsSync(feedbackFile)) {
        feedbacks = JSON.parse(fs.readFileSync(feedbackFile, "utf8"));
    }
    
    feedbacks.push(feedback);
    fs.writeFileSync(feedbackFile, JSON.stringify(feedbacks, null, 2));
    
    res.json({ success: true, message: "Обращение отправлено" });
});

app.get(ADMIN_PATH, adminLimiter, adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "secure-panel-2024-internal-access.html"));
});

app.get("/api/feedbacks", adminLimiter, adminAuth, (req, res) => {
    const feedbackFile = path.join(__dirname, "feedbacks.json");
    
    if (fs.existsSync(feedbackFile)) {
        const feedbacks = JSON.parse(fs.readFileSync(feedbackFile, "utf8"));
        res.json(feedbacks);
    } else {
        res.json([]);
    }
});

app.put("/api/feedbacks/:id", adminLimiter, adminAuth, [
    body('status').isIn(['new', 'read', 'processed'])
], (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: "Ошибка валидации данных", 
            details: errors.array().map(error => error.msg)
        });
    }
    
    const feedbackFile = path.join(__dirname, "feedbacks.json");
    
    if (fs.existsSync(feedbackFile)) {
        let feedbacks = JSON.parse(fs.readFileSync(feedbackFile, "utf8"));
        const feedbackIndex = feedbacks.findIndex(f => f.id == id);
        
        if (feedbackIndex !== -1) {
            feedbacks[feedbackIndex].status = status;
            fs.writeFileSync(feedbackFile, JSON.stringify(feedbacks, null, 2));
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Обращение не найдено" });
        }
    } else {
        res.status(404).json({ error: "Файл обращений не найден" });
    }
});

app.delete("/api/feedbacks/:id", adminLimiter, adminAuth, (req, res) => {
    const { id } = req.params;
    const feedbackFile = path.join(__dirname, "feedbacks.json");
    
    if (fs.existsSync(feedbackFile)) {
        let feedbacks = JSON.parse(fs.readFileSync(feedbackFile, "utf8"));
        const feedbackIndex = feedbacks.findIndex(f => f.id == id);
        
        if (feedbackIndex !== -1) {
            feedbacks.splice(feedbackIndex, 1);
            fs.writeFileSync(feedbackFile, JSON.stringify(feedbacks, null, 2));
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Обращение не найдено" });
        }
    } else {
        res.status(404).json({ error: "Файл обращений не найден" });
    }
});

app.get("/:patch_notes", (req, res) => {
    const patch_notes = req.params.patch_notes;
    const excludedRoutes = ['admin', 'api', 'css', 'js', 'images', 'logo', 'favicon.ico'];

    if (excludedRoutes.includes(patch_notes)){
        return res.status(404).send("Страница не найдена");
    }

    const updatesPatch = path.join(__dirname, "public", "updates");
    const possiblePaths_1 = [
        path.join(updatesPatch, `${patch_notes}.html`),
        path.join(updatesPatch, `${patch_notes}/index.html`)
    ];

    for (const filePath_1 of possiblePaths_1){
        if (fs.existsSync(filePath_1)){
            return res.sendFile(filePath_1);
        }
    }

    res.status(404).send("Страница не найдена");
});

app.get("/:hero", (req, res) => {
    const hero = req.params.hero;
    
    const excludedRoutes = [
        'admin', 'api', 'css', 'js', 'images', 'logo', 'favicon.ico',
        'heroes', 'patch-notes', 'dictionary', 'guides', 'about', 
        'privacy', 'terms', 'items', 'hero-not-found', 'updates'
    ];
    
    if (excludedRoutes.includes(hero)) {
        return res.status(404).send("Страница не найдена");
    }
    
    const heroFilePath = findHeroFile(hero);
    if (heroFilePath) {
        return res.redirect(301, `/heroes/${hero}`);
    }
    
    res.status(404).sendFile(path.join(__dirname, "public", "hero-not-found.html"));
});

app.use((req, res) => {
    res.status(404).send("Страница не найдена");
});

// ============= ЗАПУСК СЕРВЕРА =============

if (sslOptions) {
    // HTTPS режим с редиректом HTTP → HTTPS
    const httpsServer = https.createServer(sslOptions, app);
    
    const httpApp = express();
    httpApp.use((req, res) => {
        const host = req.headers.host || 'honhub.ru';
        res.redirect(301, `https://${host}${req.url}`);
    });
    const httpServer = http.createServer(httpApp);
    
    httpsServer.listen(HTTPS_PORT, () => {
        console.log('\n=================================');
        console.log('🔒 HTTPS сервер запущен!');
        console.log('=================================');
        console.log(`📍 Адрес: https://honhub.ru`);
        console.log(`📁 Админ панель: https://honhub.ru${ADMIN_PATH}`);
        console.log(`\n🔐 Админ доступ:`);
        console.log(`   Логин: ${ADMIN_LOGIN}`);
        console.log(`   Пароль: ${ADMIN_PASSWORD}`);
        console.log('=================================\n');
    });
    
    httpServer.listen(HTTP_PORT, () => {
        console.log(`🔄 HTTP → HTTPS редирект на порту ${HTTP_PORT}`);
    });
} else {
    // HTTP режим (без SSL)
    app.listen(HTTP_PORT, () => {
        console.log('\n=================================');
        console.log('🚀 HTTP сервер запущен!');
        console.log('=================================');
        console.log(`📍 Адрес: http://honhub.ru:${HTTP_PORT}`);
        console.log(`📁 Админ панель: http://honhub.ru:${HTTP_PORT}${ADMIN_PATH}`);
        console.log(`\n🔐 Админ доступ:`);
        console.log(`   Логин: ${ADMIN_LOGIN}`);
        console.log(`   Пароль: ${ADMIN_PASSWORD}`);
        console.log('=================================\n');
    });
}