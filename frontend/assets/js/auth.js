/**
 * Auth JavaScript logic for Login and Register
 * Standardized inline validation and modern alerts (parity with profile)
 */

const SVG_VALIDATION_ERROR = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
const SVG_EYE_OPEN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const SVG_EYE_CLOSED = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

// ==================== FORM VALIDATION UI HELPERS ====================

function setFieldError(fieldKey, message) {
  const input = document.getElementById(`input-${fieldKey}`);
  const wrap = document.getElementById(`wrap-${fieldKey}`);
  const errEl = document.getElementById(`error-${fieldKey}`);

  if (input) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
  }
  if (wrap) {
    wrap.classList.add('has-error');
    wrap.classList.remove('is-valid');
  }
  if (errEl) {
    errEl.innerHTML = `${SVG_VALIDATION_ERROR}<span>${message}</span>`;
    errEl.classList.add('visible');
  }
}

function clearFieldError(fieldKey, markValid = false) {
  const input = document.getElementById(`input-${fieldKey}`);
  const wrap = document.getElementById(`wrap-${fieldKey}`);
  const errEl = document.getElementById(`error-${fieldKey}`);

  if (input) {
    input.classList.remove('is-invalid');
    if (markValid) {
      input.classList.add('is-valid');
    } else {
      input.classList.remove('is-valid');
    }
  }
  if (wrap) {
    wrap.classList.remove('has-error');
    if (markValid) {
      wrap.classList.add('is-valid');
    } else {
      wrap.classList.remove('is-valid');
    }
  }
  if (errEl) {
    errEl.innerHTML = '';
    errEl.classList.remove('visible');
  }
}

// ==================== VALIDATOR FUNCTIONS ====================

// Họ và tên (không được để trống, không được ghi số, không ký tự đặc biệt, >= 2 ký tự)
function validateHoTen(value, showError = true) {
  const val = (value || '').trim();
  if (!val) {
    if (showError) setFieldError('hoTen', 'Họ và tên không được để trống');
    return false;
  }
  if (/\d/.test(val)) {
    if (showError) setFieldError('hoTen', 'Họ và tên không được chứa chữ số');
    return false;
  }
  if (val.length < 2) {
    if (showError) setFieldError('hoTen', 'Họ và tên tối thiểu từ 2 ký tự trở lên');
    return false;
  }
  const regexHoTen = /^[a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆĐÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ\s]+$/;
  if (!regexHoTen.test(val)) {
    if (showError) setFieldError('hoTen', 'Họ và tên chỉ được chứa chữ cái, không chứa ký tự đặc biệt');
    return false;
  }
  clearFieldError('hoTen', true);
  return true;
}

// Số điện thoại (không được để trống, không chứa khoảng trắng, không chứa chữ, đúng 10 số bắt đầu bằng 0)
function validateSdt(value, showError = true) {
  const raw = value || '';
  if (/\s/.test(raw)) {
    if (showError) setFieldError('sdt', 'Số điện thoại không được chứa khoảng trắng (dấu cách)');
    return false;
  }
  const val = raw.trim();
  if (!val) {
    if (showError) setFieldError('sdt', 'Số điện thoại không được để trống');
    return false;
  }
  if (/[^\d]/.test(val)) {
    if (showError) setFieldError('sdt', 'Số điện thoại chỉ được chứa chữ số, không được ghi chữ');
    return false;
  }
  if (!val.startsWith('0')) {
    if (showError) setFieldError('sdt', 'Số điện thoại phải bắt đầu bằng chữ số 0 (VD: 0901234567)');
    return false;
  }
  if (val.length !== 10) {
    if (showError) setFieldError('sdt', `Số điện thoại phải gồm đúng 10 chữ số (hiện có ${val.length}/10 số)`);
    return false;
  }
  clearFieldError('sdt', true);
  return true;
}

// Email (không được để trống, không chứa khoảng trắng, chuẩn đuôi @gmail.com)
function validateEmail(value, showError = true) {
  const raw = value || '';
  if (/\s/.test(raw)) {
    if (showError) setFieldError('email', 'Email không được chứa khoảng trắng');
    return false;
  }
  const val = raw.trim();
  if (!val) {
    if (showError) setFieldError('email', 'Địa chỉ email không được để trống');
    return false;
  }
  const regexGmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
  if (!regexGmail.test(val)) {
    if (!val.includes('@')) {
      if (showError) setFieldError('email', 'Email thiếu ký tự @ và phần mở rộng @gmail.com');
    } else if (!val.toLowerCase().endsWith('@gmail.com')) {
      if (showError) setFieldError('email', 'Email phải có đúng định dạng đuôi @gmail.com (VD: tenban@gmail.com)');
    } else {
      if (showError) setFieldError('email', 'Tên tài khoản email chứa ký tự không hợp lệ');
    }
    return false;
  }
  clearFieldError('email', true);
  return true;
}

// Tên đăng nhập (không được để trống, không chứa khoảng trắng, min 4 cho register / min 3 cho login, max 50) - Cho phép Email khi đăng nhập
function validateTenDangNhap(value, isRegister = false, showError = true) {
  const raw = value || '';
  if (/\s/.test(raw)) {
    if (showError) setFieldError('tenDangNhap', isRegister ? 'Tên đăng nhập không được chứa khoảng trắng' : 'Tên đăng nhập hoặc email không được chứa khoảng trắng');
    return false;
  }
  const val = raw.trim();
  if (!val) {
    if (showError) setFieldError('tenDangNhap', isRegister ? 'Tên đăng nhập không được để trống' : 'Vui lòng nhập tên đăng nhập hoặc email');
    return false;
  }

  // Khi đăng nhập: Cho phép nhập địa chỉ Email
  if (!isRegister && val.includes('@')) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(val)) {
      if (showError) setFieldError('tenDangNhap', 'Địa chỉ email chưa đúng định dạng (VD: tenban@gmail.com)');
      return false;
    }
    clearFieldError('tenDangNhap', true);
    return true;
  }

  const minLen = isRegister ? 4 : 3;
  if (val.length < minLen) {
    if (showError) setFieldError('tenDangNhap', isRegister ? `Tên đăng nhập tối thiểu từ ${minLen} ký tự trở lên` : `Tên đăng nhập tối thiểu từ ${minLen} ký tự`);
    return false;
  }
  if (val.length > 50) {
    if (showError) setFieldError('tenDangNhap', 'Độ dài tối đa không quá 50 ký tự');
    return false;
  }
  if (!/^[a-zA-Z0-9._]+$/.test(val)) {
    if (showError) setFieldError('tenDangNhap', isRegister ? 'Tên đăng nhập chỉ gồm chữ cái, chữ số, dấu gạch dưới hoặc dấu chấm' : 'Tên đăng nhập chỉ gồm chữ cái, chữ số, dấu gạch dưới, dấu chấm (hoặc nhập email hợp lệ)');
    return false;
  }
  clearFieldError('tenDangNhap', true);
  return true;
}

// Mật khẩu (không được để trống, tối thiểu 6 ký tự)
function validateMatKhau(value, showError = true) {
  const val = value || '';
  if (!val) {
    if (showError) setFieldError('matKhau', 'Mật khẩu không được để trống');
    return false;
  }
  if (val.length < 6) {
    if (showError) setFieldError('matKhau', 'Mật khẩu tối thiểu từ 6 ký tự trở lên');
    return false;
  }
  clearFieldError('matKhau', true);
  return true;
}

// Xác nhận mật khẩu (không được để trống, phải khớp với mật khẩu đã nhập)
function validateConfirmMatKhau(value, originalPass, showError = true) {
  const val = value || '';
  if (!val) {
    if (showError) setFieldError('confirmMatKhau', 'Vui lòng xác nhận lại mật khẩu, không được để trống');
    return false;
  }
  if (val !== originalPass) {
    if (showError) setFieldError('confirmMatKhau', 'Mật khẩu xác nhận không khớp với mật khẩu đã nhập');
    return false;
  }
  clearFieldError('confirmMatKhau', true);
  return true;
}

// ==================== REALTIME EVENT LISTENERS ====================

function setupLoginValidation() {
  const inputUser = document.getElementById('input-tenDangNhap');
  const inputPass = document.getElementById('input-matKhau');

  if (inputUser) {
    inputUser.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setFieldError('tenDangNhap', 'Tên đăng nhập hoặc email không được chứa khoảng trắng');
      }
    });

    inputUser.addEventListener('input', () => {
      const original = inputUser.value;
      const cleaned = original.replace(/\s+/g, '');
      if (original !== cleaned) inputUser.value = cleaned;
      if (cleaned.length === 0) {
        setFieldError('tenDangNhap', 'Vui lòng nhập tên đăng nhập hoặc email');
      } else {
        validateTenDangNhap(cleaned, false, false);
      }
    });

    inputUser.addEventListener('blur', () => {
      validateTenDangNhap(inputUser.value, false, true);
    });
  }

  if (inputPass) {
    inputPass.addEventListener('input', () => {
      const val = inputPass.value;
      if (!val) {
        setFieldError('matKhau', 'Mật khẩu không được để trống');
      } else if (val.length < 6) {
        clearFieldError('matKhau', false);
      } else {
        clearFieldError('matKhau', true);
      }
    });

    inputPass.addEventListener('blur', () => {
      validateMatKhau(inputPass.value, true);
    });
  }
}

function setupRegisterValidation() {
  const inputHoTen = document.getElementById('input-hoTen');
  const inputSdt = document.getElementById('input-sdt');
  const inputEmail = document.getElementById('input-email');
  const inputUser = document.getElementById('input-tenDangNhap');
  const inputPass = document.getElementById('input-matKhau');
  const inputConfirm = document.getElementById('input-confirmMatKhau');

  if (inputHoTen) {
    inputHoTen.addEventListener('keydown', (e) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setFieldError('hoTen', 'Họ và tên không được ghi số');
      }
    });

    inputHoTen.addEventListener('input', () => {
      const original = inputHoTen.value;
      const stripped = original.replace(/[0-9]/g, '');
      if (original !== stripped) {
        inputHoTen.value = stripped;
        setFieldError('hoTen', 'Họ và tên không được ghi số');
      } else if (stripped.trim().length === 0) {
        setFieldError('hoTen', 'Họ và tên không được để trống');
      } else {
        validateHoTen(stripped, false);
      }
    });

    inputHoTen.addEventListener('blur', () => {
      validateHoTen(inputHoTen.value, true);
    });
  }

  if (inputSdt) {
    inputSdt.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setFieldError('sdt', 'Số điện thoại không được chứa khoảng trắng (dấu cách)');
        return;
      }
      const allowedNav = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'];
      const isModifier = e.ctrlKey || e.metaKey;
      if (!allowedNav.includes(e.key) && !isModifier && !/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setFieldError('sdt', 'Số điện thoại chỉ được chứa chữ số, không được ghi chữ');
      }
    });

    inputSdt.addEventListener('input', () => {
      const original = inputSdt.value;
      const cleaned = original.replace(/\s+/g, '').replace(/\D/g, '').slice(0, 10);
      if (original !== cleaned) inputSdt.value = cleaned;
      if (cleaned.length === 0) {
        setFieldError('sdt', 'Số điện thoại không được để trống');
      } else if (!cleaned.startsWith('0')) {
        setFieldError('sdt', 'Số điện thoại phải bắt đầu bằng chữ số 0');
      } else if (cleaned.length === 10) {
        clearFieldError('sdt', true);
      } else {
        clearFieldError('sdt', false);
      }
    });

    inputSdt.addEventListener('blur', () => {
      validateSdt(inputSdt.value, true);
    });
  }

  if (inputEmail) {
    inputEmail.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setFieldError('email', 'Email không được chứa khoảng trắng');
      }
    });

    inputEmail.addEventListener('input', () => {
      const original = inputEmail.value;
      const cleaned = original.replace(/\s+/g, '');
      if (original !== cleaned) inputEmail.value = cleaned;
      const val = cleaned.trim();
      if (!val) {
        setFieldError('email', 'Địa chỉ email không được để trống');
      } else if (/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(val)) {
        clearFieldError('email', true);
      } else {
        clearFieldError('email', false);
      }
    });

    inputEmail.addEventListener('blur', () => {
      validateEmail(inputEmail.value, true);
    });
  }

  if (inputUser) {
    inputUser.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setFieldError('tenDangNhap', 'Tên đăng nhập không được chứa khoảng trắng');
      }
    });

    inputUser.addEventListener('input', () => {
      const original = inputUser.value;
      const cleaned = original.replace(/\s+/g, '');
      if (original !== cleaned) inputUser.value = cleaned;
      if (cleaned.length === 0) {
        setFieldError('tenDangNhap', 'Tên đăng nhập không được để trống');
      } else {
        validateTenDangNhap(cleaned, true, false);
      }
    });

    inputUser.addEventListener('blur', () => {
      validateTenDangNhap(inputUser.value, true, true);
    });
  }

  if (inputPass) {
    inputPass.addEventListener('input', () => {
      const val = inputPass.value;
      if (!val) {
        setFieldError('matKhau', 'Mật khẩu không được để trống');
      } else if (val.length < 6) {
        setFieldError('matKhau', `Mật khẩu tối thiểu từ 6 ký tự (hiện có ${val.length}/6)`);
      } else {
        clearFieldError('matKhau', true);
      }
      if (inputConfirm && inputConfirm.value) {
        validateConfirmMatKhau(inputConfirm.value, val, false);
      }
    });

    inputPass.addEventListener('blur', () => {
      validateMatKhau(inputPass.value, true);
    });
  }

  if (inputConfirm) {
    inputConfirm.addEventListener('input', () => {
      const val = inputConfirm.value;
      const originalPass = inputPass ? inputPass.value : '';
      if (!val) {
        setFieldError('confirmMatKhau', 'Vui lòng xác nhận lại mật khẩu, không được để trống');
      } else if (val !== originalPass) {
        setFieldError('confirmMatKhau', 'Mật khẩu xác nhận chưa khớp với mật khẩu đã nhập');
      } else {
        clearFieldError('confirmMatKhau', true);
      }
    });

    inputConfirm.addEventListener('blur', () => {
      const originalPass = inputPass ? inputPass.value : '';
      validateConfirmMatKhau(inputConfirm.value, originalPass, true);
    });
  }
}

// Auto-init on page load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('form-login')) {
    setupLoginValidation();
  }
  if (document.getElementById('form-register')) {
    setupRegisterValidation();
  }
});

// ==================== SUBMIT HANDLERS ====================

async function handleLogin(event) {
  if (event) event.preventDefault();

  const userInput = document.getElementById('input-tenDangNhap');
  const passInput = document.getElementById('input-matKhau');
  const btnSubmit = document.getElementById('btn-login');

  const tenDangNhap = (userInput ? userInput.value : '').trim();
  const matKhau = passInput ? passInput.value : '';

  const isUserValid = validateTenDangNhap(tenDangNhap, false, true);
  const isPassValid = validateMatKhau(matKhau, true);

  if (!isUserValid || !isPassValid) {
    showAlert('Thông tin đăng nhập chưa hợp lệ hoặc còn để trống. Vui lòng kiểm tra các ô báo lỗi màu đỏ!', 'danger');
    if (!isUserValid && userInput) userInput.focus();
    else if (!isPassValid && passInput) passInput.focus();
    return;
  }

  if (btnSubmit) btnSubmit.disabled = true;

  try {
    const data = await api.post('/auth/login', {
      tenDangNhap,
      matKhau
    });

    // Lưu token và thông tin user vào cả sessionStorage và localStorage để duy trì phiên ổn định
    const actualUsername = data.tenDangNhap || tenDangNhap;
    const userObj = {
      tenDangNhap: actualUsername,
      hoTen: data.hoTen || actualUsername,
      role: data.role,
      maKH: data.maKH || null
    };

    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('role', data.role);
    sessionStorage.setItem('hoTen', data.hoTen || actualUsername);
    sessionStorage.setItem('tenDangNhap', actualUsername);
    sessionStorage.setItem('user', JSON.stringify(userObj));
    if (data.maKH) sessionStorage.setItem('maKH', data.maKH);

    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('hoTen', data.hoTen || actualUsername);
    localStorage.setItem('tenDangNhap', actualUsername);
    localStorage.setItem('user', JSON.stringify(userObj));
    if (data.maKH) localStorage.setItem('maKH', data.maKH);

    showAlert('Đăng nhập thành công! Đang chuyển hướng...', 'success');

    setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect');

      if (data.role === 'ADMIN' || data.role === 'STAFF') {
        window.location.href = '/pages/admin/dashboard.html';
      } else if (redirectUrl && redirectUrl.startsWith('/pages/')) {
        window.location.href = redirectUrl;
      } else {
        window.location.href = '/pages/user/courts.html';
      }
    }, 1000);
  } catch (error) {
    const errorMsg = error.message || 'Tên đăng nhập hoặc mật khẩu không chính xác';
    const isLocked = errorMsg.toLowerCase().includes('khóa') || errorMsg.toLowerCase().includes('khoa');

    if (isLocked) {
      showAlert(errorMsg, 'danger');
      setFieldError('tenDangNhap', 'Tài khoản này hiện đang bị khóa');
      clearFieldError('matKhau', false);
    } else {
      showAlert(`Đăng nhập thất bại: ${errorMsg}`, 'danger');
      setFieldError('tenDangNhap', 'Tên đăng nhập/email hoặc mật khẩu không chính xác');
      setFieldError('matKhau', 'Vui lòng kiểm tra lại mật khẩu');
    }

    if (btnSubmit) btnSubmit.disabled = false;
  }
}

async function handleRegister(event) {
  if (event) event.preventDefault();

  const inputHoTen = document.getElementById('input-hoTen');
  const inputSdt = document.getElementById('input-sdt');
  const inputEmail = document.getElementById('input-email');
  const inputUser = document.getElementById('input-tenDangNhap');
  const inputPass = document.getElementById('input-matKhau');
  const inputConfirm = document.getElementById('input-confirmMatKhau');
  const btnSubmit = document.getElementById('btn-register');

  const hoTen = (inputHoTen ? inputHoTen.value : '').trim();
  const sdt = (inputSdt ? inputSdt.value : '').trim();
  const email = (inputEmail ? inputEmail.value : '').trim();
  const tenDangNhap = (inputUser ? inputUser.value : '').trim();
  const matKhau = inputPass ? inputPass.value : '';
  const confirmMatKhau = inputConfirm ? inputConfirm.value : '';

  const isHoTenValid = validateHoTen(hoTen, true);
  const isSdtValid = validateSdt(sdt, true);
  const isEmailValid = validateEmail(email, true);
  const isUserValid = validateTenDangNhap(tenDangNhap, true, true);
  const isPassValid = validateMatKhau(matKhau, true);
  const isConfirmValid = validateConfirmMatKhau(confirmMatKhau, matKhau, true);

  if (!isHoTenValid || !isSdtValid || !isEmailValid || !isUserValid || !isPassValid || !isConfirmValid) {
    showAlert('Tất cả thuộc tính đều không được để trống khi đăng ký! Vui lòng kiểm tra các ô báo lỗi màu đỏ.', 'danger');
    if (!isHoTenValid && inputHoTen) inputHoTen.focus();
    else if (!isSdtValid && inputSdt) inputSdt.focus();
    else if (!isEmailValid && inputEmail) inputEmail.focus();
    else if (!isUserValid && inputUser) inputUser.focus();
    else if (!isPassValid && inputPass) inputPass.focus();
    else if (!isConfirmValid && inputConfirm) inputConfirm.focus();
    return;
  }

  if (btnSubmit) btnSubmit.disabled = true;

  try {
    const res = await api.post('/auth/register', {
      hoTen,
      sdt,
      email,
      tenDangNhap,
      matKhau
    });

    showAlert(res?.message || 'Đăng ký tài khoản thành công! Đang chuyển hướng đến trang đăng nhập...', 'success');
    setTimeout(() => {
      window.location.href = '/pages/auth/login.html';
    }, 1500);
  } catch (error) {
    const errMsg = error.message || '';
    showAlert(`Đăng ký thất bại: ${errMsg}`, 'danger');
    if (errMsg.includes('Số điện thoại')) {
      setFieldError('sdt', 'Số điện thoại này đã được đăng ký');
      if (inputSdt) inputSdt.focus();
    } else if (errMsg.includes('Tên đăng nhập')) {
      setFieldError('tenDangNhap', 'Tên đăng nhập này đã tồn tại');
      if (inputUser) inputUser.focus();
    }
    if (btnSubmit) btnSubmit.disabled = false;
  }
}

/**
 * Ẩn / hiện mật khẩu với SVG Icon hiện đại
 */
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (btn) btn.innerHTML = SVG_EYE_CLOSED;
  } else {
    input.type = 'password';
    if (btn) btn.innerHTML = SVG_EYE_OPEN;
  }
}

/**
 * Tiện ích 1-Click điền tài khoản mẫu cho Đăng nhập
 */
function quickFillLogin(username, password) {
  const userInput = document.getElementById('input-tenDangNhap');
  const passInput = document.getElementById('input-matKhau');
  if (userInput) {
    userInput.value = username;
    clearFieldError('tenDangNhap', true);
  }
  if (passInput) {
    passInput.value = password;
    clearFieldError('matKhau', true);
  }
  
  showAlert(`Đã điền tài khoản mẫu: <strong>${username}</strong>`, 'success');
  const btnSubmit = document.getElementById('btn-login');
  if (btnSubmit) {
    btnSubmit.focus();
  }
}
