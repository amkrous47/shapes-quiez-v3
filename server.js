// ==================== استيراد المكتبات ====================
const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// ==================== إنشاء تطبيق Express ====================
const app = express();

// ==================== Middleware ====================
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// ==================== إعدادات التخزين ====================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // تأكد من وجود المجلد
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads');
        }
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        // اسم الملف: تاريخ + اسم عشوائي
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// ==================== تصفية الملفات ====================
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('صيغة ملف غير مدعومة. استخدم JPG أو PNG أو GIF'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ==================== إعداد قاعدة البيانات ====================
// تأكد من وجود المجلد
if (!fs.existsSync('database')) {
    fs.mkdirSync('database');
}

let db = new sqlite3.Database('./database/shapes.db', (err) => {
    if (err) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err);
    } else {
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    }
});

// ==================== إنشاء جدول الأشكال ====================
db.run(`
    CREATE TABLE IF NOT EXISTS shapes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        image TEXT NOT NULL,
        hint TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error('❌ خطأ في إنشاء الجدول:', err);
    } else {
        console.log('✅ تم إعداد جدول الأشكال');
    }
});

// ==================== المسارات (Routes) ====================

/**
 * GET /api/shapes
 * الحصول على جميع الأشكال
 */
app.get('/api/shapes', (req, res) => {
    db.all('SELECT id, name, image, hint FROM shapes ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error('❌ خطأ في الاستعلام:', err);
            res.status(500).json({ error: 'فشل تحميل الأشكال' });
        } else {
            // تحويل مسار الصورة
            const shapes = rows.map(row => ({
                id: row.id,
                name: row.name,
                image: `/uploads/${path.basename(row.image)}`,
                hint: row.hint
            }));
            res.json(shapes);
        }
    });
});

/**
 * POST /api/shapes
 * إضافة شكل جديد
 */
app.post('/api/shapes', upload.single('image'), (req, res) => {
    try {
        const { name, hint } = req.body;

        // التحقق من المدخلات
        if (!name || !req.file) {
            return res.status(400).json({ 
                error: 'اسم الشكل والصورة مطلوبان' 
            });
        }

        const imagePath = req.file.path;

        // إدراج في قاعدة البيانات
        db.run(
            'INSERT INTO shapes (name, image, hint) VALUES (?, ?, ?)',
            [name.trim(), imagePath, hint || null],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        // حذف الصورة المرفوعة
                        fs.unlink(imagePath, () => {});
                        return res.status(400).json({ 
                            error: 'هذا الاسم موجود بالفعل. استخدم اسماً مختلفاً' 
                        });
                    } else {
                        console.error('❌ خطأ:', err);
                        fs.unlink(imagePath, () => {});
                        return res.status(500).json({ 
                            error: 'فشل إضافة الشكل' 
                        });
                    }
                }

                console.log(`✅ تم إضافة الشكل: ${name}`);
                res.json({ 
                    success: true, 
                    message: 'تم إضافة الشكل بنجاح',
                    id: this.lastID 
                });
            }
        );
    } catch (error) {
        console.error('❌ خطأ:', error);
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        res.status(500).json({ error: 'خطأ في معالجة الطلب' });
    }
});

/**
 * DELETE /api/shapes/:id
 * حذف شكل
 */
app.delete('/api/shapes/:id', (req, res) => {
    const { id } = req.params;

    // أولاً: احصل على بيانات الشكل
    db.get('SELECT image FROM shapes WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('❌ خطأ:', err);
            return res.status(500).json({ error: 'فشل حذف الشكل' });
        }

        if (!row) {
            return res.status(404).json({ error: 'الشكل غير موجود' });
        }

        // ثانياً: احذف من قاعدة البيانات
        db.run('DELETE FROM shapes WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('❌ خطأ:', err);
                return res.status(500).json({ error: 'فشل حذف الشكل' });
            }

            // ثالثاً: احذف الصورة
            if (row.image && fs.existsSync(row.image)) {
                fs.unlink(row.image, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('⚠️ تحذير: فشل حذف الصورة:', unlinkErr);
                    }
                });
            }

            console.log(`🗑️ تم حذف الشكل رقم: ${id}`);
            res.json({ success: true, message: 'تم حذف الشكل بنجاح' });
        });
    });
});

/**
 * GET /
 * الصفحة الرئيسية
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== معالجة الأخطاء ====================
app.use((err, req, res, next) => {
    console.error('❌ خطأ:', err);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                error: 'حجم الملف كبير جداً. الحد الأقصى 5MB' 
            });
        }
    }

    res.status(500).json({ 
        error: 'حدث خطأ في السيرفر' 
    });
});

// ==================== بدء السيرفر ====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║  🚀 السيرفر يعمل بنجاح!                 ║
║  الرابط: http://localhost:${PORT}        ║
║  اضغط Ctrl+C للإيقاف                  ║
╚════════════════════════════════════════╝
    `);
});
