/**
 * Auth JavaScript logic for Login and Register
 */

async function handleLogin(event) {
  if (event) event.preventDefault();

  const tenDangNhap = document.getElementById('input-tenDangNhap').value.trim();
  const matKhau = document.getElementById('input-matKhau').value;
  const btnSubmit = document.getElementById('btn-login');

  if (!tenDangNhap || !matKhau) {
    showAlert('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!', 'warning');
    return;
  }

  if (btnSubmit) btnSubmit.disabled = true;

  try {
    const data = await api.post('/auth/login', {
      tenDangNhap,
      matKhau
    });

    // Lưu token và thông tin user vào localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('hoTen', data.hoTen || tenDangNhap);
    if (data.maKH) localStorage.setItem('maKH', data.maKH);

    showAlert('Đăng nhập thành công! Đang chuyển hướng...', 'success');

    setTimeout(() => {
      if (data.role === 'ADMIN') {
        window.location.href = '/pages/admin/dashboard.html';
      } else {
        window.location.href = '/pages/user/booking.html';
      }
    }, 1000);
  } catch (error) {
    showAlert(`Đăng nhập thất bại: ${error.message}`, 'danger');
    if (btnSubmit) btnSubmit.disabled = false;
  }
}

async function handleRegister(event) {
  if (event) event.preventDefault();

  const hoTen = document.getElementById('input-hoTen').value.trim();
  const sdt = document.getElementById('input-sdt').value.trim();
  const email = document.getElementById('input-email').value.trim() || null;
  const tenDangNhap = document.getElementById('input-tenDangNhap').value.trim();
  const matKhau = document.getElementById('input-matKhau').value;
  const btnSubmit = document.getElementById('btn-register');

  if (!hoTen || !sdt || !tenDangNhap || !matKhau) {
    showAlert('Vui lòng điền các trường bắt buộc!', 'warning');
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

    showAlert(res?.message || 'Đăng ký thành công! Đang chuyển đến trang đăng nhập...', 'success');
    setTimeout(() => {
      window.location.href = '/pages/auth/login.html';
    }, 1500);
  } catch (error) {
    showAlert(`Đăng ký thất bại: ${error.message}`, 'danger');
    if (btnSubmit) btnSubmit.disabled = false;
  }
}

