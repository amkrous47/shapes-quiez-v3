// ==================== تحميل البيانات عند فتح الصفحة ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 جاري تحميل قائمة الأشكال...');
    loadShapesList();
});

// ==================== معالجة إضافة شكل جديد ====================
document.getElementById('addShapeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('➕ جاري إضافة شكل جديد...');

    const formData = new FormData();
    formData.append('name', document.getElementById('shapeName').value);
    formData.append('image', document.getElementById('shapeImage').files[0]);
    formData.append('hint', document.getElementById('shapeHint').value);

    try {
        const response = await fetch('/api/shapes', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            showAlert('✅ تم إضافة الشكل بنجاح!', 'success');
            document.getElementById('addShapeForm').reset();
            document.getElementById('imagePreview').classList.add('d-none');
            loadShapesList();
        } else {
            const error = await response.json();
            showAlert(error.error || '❌ فشل إضافة الشكل', 'danger');
        }
    } catch (error) {
        console.error('خطأ:', error);
        showAlert('❌ خطأ في الاتصال بالسيرفر', 'danger');
    }
});

// ==================== معاينة الصورة ====================
document.getElementById('shapeImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = document.getElementById('imagePreview');
            const img = document.getElementById('previewImg');
            img.src = event.target.result;
            preview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    }
});

// ==================== تحميل قائمة الأشكال ====================
async function loadShapesList() {
    try {
        const response = await fetch('/api/shapes');
        
        if (!response.ok) {
            throw new Error('فشل تحميل الأشكال');
        }
        
        const shapes = await response.json();
        const list = document.getElementById('shapesList');
        const count = document.getElementById('shapesCount');

        count.textContent = shapes.length;

        if (shapes.length === 0) {
            list.innerHTML = `
                <div class="text-center py-5">
                    <p class="text-muted">
                        لا توجد أشكال حتى الآن. أضف شكلك الأول! 🎨
                    </p>
                </div>
            `;
            return;
        }

        list.innerHTML = shapes.map(shape => `
            <div class="card mb-3 border-start border-primary border-5 shadow-sm">
                <div class="row g-0">
                    <div class="col-md-4">
                        <img 
                            src="${shape.image}" 
                            class="img-fluid rounded-start h-100" 
                            alt="${shape.name}"
                            style="object-fit: cover; min-height: 120px;"
                        >
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h6 class="card-title mb-2">
                                <strong>📌 ${shape.name}</strong>
                            </h6>
                            <p class="card-text small text-muted mb-3">
                                ${shape.hint ? '💡 ' + shape.hint : 'بدون تلميح'}
                            </p>
                            <button 
                                class="btn btn-sm btn-danger" 
                                onclick="deleteShape(${shape.id})"
                            >
                                🗑️ حذف
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        console.log(`✅ تم تحميل ${shapes.length} شكل`);
    } catch (error) {
        console.error('❌ خطأ:', error);
        showAlert('❌ فشل تحميل الأشكال', 'danger');
    }
}

// ==================== حذف شكل ====================
async function deleteShape(id) {
    if (!confirm('هل تريد حذف هذا الشكل بفعل؟\nلا يمكن التراجع عن هذه العملية!')) {
        return;
    }

    console.log(`🗑️ جاري حذف الشكل رقم ${id}...`);

    try {
        const response = await fetch(`/api/shapes/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showAlert('✅ تم حذف الشكل بنجاح', 'success');
            loadShapesList();
        } else {
            showAlert('❌ فشل حذف الشكل', 'danger');
        }
    } catch (error) {
        console.error('❌ خطأ:', error);
        showAlert('❌ خطأ في الاتصال بالسيرفر', 'danger');
    }
}

// ==================== عرض رسائل التنبيه ====================
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    
    alertDiv.className = `alert alert-${type} alert-dismissible fade show shadow-lg`;
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // إزالة التنبيه تلقائياً بعد 4 ثوان
    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}
