// ==================== المتغيرات العامة ====================
let currentShapeIndex = 0;
let shapes = [];
let score = 0;
let hintShown = false;

// ==================== تحميل الأشكال ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 جاري تحميل الأشكال...');
    await loadShapes();
    
    if (shapes.length === 0) {
        showNoShapesMessage();
    } else {
        displayShape();
    }
});

// ==================== تحميل البيانات من السيرفر ====================
async function loadShapes() {
    try {
        const response = await fetch('/api/shapes');
        
        if (!response.ok) {
            throw new Error('فشل تحميل الأشكال');
        }
        
        shapes = await response.json();
        console.log(`✅ تم تحميل ${shapes.length} شكل`);
        
        document.getElementById('total').textContent = shapes.length;
    } catch (error) {
        console.error('❌ خطأ:', error);
        showError('فشل تحميل الأشكال. تأكد من أن السيرفر يعمل.');
    }
}

// ==================== عرض الشكل الحالي ====================
function displayShape() {
    // التحقق من انتهاء الاختبار
    if (currentShapeIndex >= shapes.length) {
        endQuiz();
        return;
    }

    const shape = shapes[currentShapeIndex];
    console.log(`📸 عرض الشكل: ${shape.name}`);

    // تحديث الصورة
    document.getElementById('shapeImage').src = shape.image;
    document.getElementById('shapeImage').alt = shape.name;
    
    // تحديث الموضع
    document.getElementById('current').textContent = currentShapeIndex + 1;
    
    // تحديث شريط التقدم
    updateProgressBar();
    
    // تنظيف حقل الإدخال
    const answerInput = document.getElementById('answerInput');
    answerInput.value = '';
    answerInput.focus();
    answerInput.classList.remove('is-invalid');
    
    // إخفاء الرسائل
    document.getElementById('errorMessage').classList.add('d-none');
    document.getElementById('successMessage').classList.add('d-none');
    document.getElementById('hintBox').classList.add('d-none');
    
    // إعادة تعيين التلميح
    hintShown = false;
    
    // تفعيل الزر
    document.getElementById('checkBtn').disabled = false;
}

// ==================== التحقق من الإجابة ====================
function checkAnswer() {
    const answer = document.getElementById('answerInput').value
        .trim()
        .toLowerCase();
    
    const correctAnswer = shapes[currentShapeIndex].name.toLowerCase();

    console.log(`🔍 التحقق: "${answer}" vs "${correctAnswer}"`);

    const errorMsg = document.getElementById('errorMessage');
    const successMsg = document.getElementById('successMessage');
    const answerInput = document.getElementById('answerInput');

    if (answer === correctAnswer) {
        // ✅ إجابة صحيحة
        successMsg.classList.remove('d-none');
        errorMsg.classList.add('d-none');
        answerInput.classList.remove('is-invalid');
        
        // إضافة نقطة
        score++;
        document.getElementById('score').textContent = score;
        console.log(`✅ إجابة صحيحة! النقاط: ${score}`);
        
        // تعطيل الزر
        document.getElementById('checkBtn').disabled = true;
        
        // الانتقال للشكل التالي
        setTimeout(() => {
            currentShapeIndex++;
            displayShape();
        }, 1500);
    } else {
        // ❌ إجابة خاطئة
        errorMsg.classList.remove('d-none');
        successMsg.classList.add('d-none');
        answerInput.classList.add('is-invalid');
        answerInput.select();
        
        console.log(`❌ إجابة خاطئة!`);
        
        // إزالة حالة الخطأ بعد 2 ثانية
        setTimeout(() => {
            answerInput.classList.remove('is-invalid');
        }, 2000);
    }
}

// ==================== عرض التلميح ====================
function showHint() {
    const hint = shapes[currentShapeIndex].hint;
    const hintBox = document.getElementById('hintBox');
    const hintText = document.getElementById('hintText');

    if (hint) {
        hintText.textContent = hint;
        hintBox.classList.remove('d-none');
        hintShown = true;
    } else {
        hintText.textContent = 'لا يوجد تلميح لهذا الشكل 😔';
        hintBox.classList.remove('d-none');
    }

    console.log('💡 تم عرض التلميح');
}

// ==================== تخطي الشكل ====================
function skipShape() {
    console.log(`⏭️ تخطي الشكل: ${shapes[currentShapeIndex].name}`);
    currentShapeIndex++;
    displayShape();
}

// ==================== تحديث شريط التقدم ====================
function updateProgressBar() {
    const percentage = ((currentShapeIndex) / shapes.length) * 100;
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    progressBar.style.width = percentage + '%';
    progressText.textContent = Math.round(percentage) + '%';
}

// ==================== إنهاء الاختبار ====================
function endQuiz() {
    console.log('🎉 انتهى الاختبار!');
    
    const percentage = (score / shapes.length) * 100;
    let message = '';
    let emoji = '';

    if (percentage === 100) {
        message = 'مثالي! لقد أجبت على جميع الأسئلة بشكل صحيح! 🏆';
        emoji = '🌟';
    } else if (percentage >= 80) {
        message = 'ممتاز جداً! أداء رائع جداً! 🎉';
        emoji = '⭐';
    } else if (percentage >= 60) {
        message = 'جيد! يمكنك تحسين النتيجة أكثر. 💪';
        emoji = '👍';
    } else {
        message = 'حاول مرة أخرى لتحسين نتيجتك! 📚';
        emoji = '🚀';
    }

    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-md-8">
                <div class="card text-center shadow-lg mt-5">
                    <div class="card-body py-5">
                        <h1 class="display-1 mb-3">${emoji}</h1>
                        <h2 class="card-title mb-4">انتهيت من الاختبار! 🎊</h2>
                        <h1 class="display-4 text-success fw-bold mb-3">
                            ${score}/${shapes.length}
                        </h1>
                        <h3 class="text-muted mb-4">${(percentage).toFixed(1)}%</h3>
                        <p class="lead mb-4">${message}</p>
                        
                        <div class="d-grid gap-2 d-sm-flex justify-content-center">
                            <button 
                                class="btn btn-primary btn-lg px-4" 
                                onclick="location.href='quiz.html'"
                            >
                                🔄 إعادة الاختبار
                            </button>
                            <button 
                                class="btn btn-secondary btn-lg px-4" 
                                onclick="location.href='index.html'"
                            >
                                🏠 الرئيسية
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==================== رسالة لا توجد أشكال ====================
function showNoShapesMessage() {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="row justify-content-center mt-5">
            <div class="col-12 col-md-8">
                <div class="card text-center shadow-lg">
                    <div class="card-body py-5">
                        <h1 class="display-4 mb-4">📭</h1>
                        <h2 class="card-title mb-3">لا توجد أشكال حتى الآن</h2>
                        <p class="lead text-muted mb-4">
                            يرجى إضافة بعض الأشكال من صفحة الإدارة للبدء باللعب
                        </p>
                        <button 
                            class="btn btn-primary btn-lg" 
                            onclick="location.href='admin.html'"
                        >
                            ➕ اذهب لإضافة أشكال
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==================== عرض رسائل الخطأ ====================
function showError(message) {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="row justify-content-center mt-5">
            <div class="col-12 col-md-8">
                <div class="alert alert-danger alert-lg" role="alert">
                    <h4 class="alert-heading">❌ خطأ</h4>
                    <p>${message}</p>
                    <button class="btn btn-secondary" onclick="location.reload()">
                        🔄 إعادة تحميل
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ==================== اختصارات لوحة المفاتيح ====================
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

// السماح بالأسهم للتنقل
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        currentShapeIndex++;
        displayShape();
    }
    if (e.key === 'ArrowLeft' && currentShapeIndex > 0) {
        currentShapeIndex--;
        displayShape();
    }
});
