window.onload = function () {
    const today = new Date();
    const day = today.getDay();  // 0 = Sunday, 6 = Saturday

    // Jika hari adalah Sabtu (6) atau Minggu (0), tampilkan pesan dan alihkan
    if (day === 0 || day === 6) {
        // Menonaktifkan semua interaksi
        document.body.style.pointerEvents = 'none'; // Menonaktifkan semua interaksi dengan halaman
        
        // Buat elemen tampilan penutupan
        const closeMessage = document.createElement('div');
        closeMessage.style.textAlign = 'center';
        closeMessage.style.marginTop = '50px';
        closeMessage.style.opacity = '0';
        closeMessage.style.transition = 'opacity 1s'; // Efek transisi
        closeMessage.style.position = 'absolute';
        closeMessage.style.top = '50%';
        closeMessage.style.left = '50%';
        closeMessage.style.transform = 'translate(-50%, -50%)';
        closeMessage.style.zIndex = '9999'; // Pastikan berada di atas semua elemen lain
        
        closeMessage.innerHTML = `
            <h1 style="color: #f44336;">KAMI TUTUP DI AKHIR PEKAN!</h1>
            <p>Maaf, kami tidak tersedia pada hari Sabtu dan Minggu.</p>
            <p>Silakan kembali pada hari kerja.</p>
            <p><strong>Terima kasih atas pengertian Anda!</strong></p>
        `;
        
        document.body.appendChild(closeMessage);

        // Munculkan pesan dengan transisi
        setTimeout(() => {
            closeMessage.style.opacity = '1'; // Tampilkan pesan
        }, 100);

        // Arahkan setelah 5 detik
        setTimeout(() => {
            // Tambahkan efek fade out sebelum pengalihan
            closeMessage.style.opacity = '0';
            setTimeout(() => {
                window.location.href = "perbaikan.html"; // Arahkan ke halaman perbaikan
            }, 1000);  // Tunggu 1 detik sebelum mengalihkan
        }, 5000);  // Redirect setelah 5 detik
    }
};
