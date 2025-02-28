// Mengambil elemen dari DOM
const navbarToggler = document.querySelector('.navbar-toggler'); // Tombol hamburger
const navbarCollapse = document.getElementById('navbarNav'); // Elemen menu dropdown

// Fungsi untuk toggle menu pada klik
if (navbarToggler) {
  navbarToggler.addEventListener('click', () => {
    navbarCollapse.classList.toggle('show');
  });
}

// Galeri: Mengganti gambar utama dengan gambar kecil
const mainImg = document.getElementById('MainImg');
const smallImgs = document.querySelectorAll('.small-img');

if (smallImgs && mainImg) {
  smallImgs.forEach((img, index) => {
    img.addEventListener('click', () => {
      mainImg.src = img.src;
    });
  });
}
