window.onload = function () {
    const today = new Date();
    const day = today.getDay();  // 0 = Sunday, 6 = Saturday

    // Jika hari adalah Sabtu (6) atau Minggu (0), tampilkan pesan dan alihkan
    if (day === 0 || day === 6) {
        // Menonaktifkan semua interaksi
        document.body.style.pointerEvents = 'none'; // Menonaktifkan semua interaksi dengan halaman
        
        // Buat elemen tampilan penutupan
        const closeMessage = document.createElement('div');
        closeMessage.className = 'fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50';
        closeMessage.innerHTML = `
            <div class="text-center bg-white rounded-lg p-6 shadow-lg transform transition-all duration-500 scale-100 opacity-0" id="close-message">
                <i class="fas fa-tools fa-3x text-red-600 mb-4"></i>
                <h1 class="text-2xl font-bold text-red-600">KAMI TUTUP DI AKHIR PEKAN!</h1>
                <p class="mt-2 text-gray-700">Maaf, kami tidak tersedia pada hari Sabtu dan Minggu.</p>
                <p class="mt-2 text-gray-700">Silakan kembali pada hari kerja.</p>
                <p class="mt-4 font-semibold">Progres perbaikan selesai pada:</p>
                <p class="font-bold text-blue-600">Senin, Jam 7 Pagi</p>
                <p class="mt-4 font-semibold">Terima kasih atas pengertian Anda!</p>
            </div>
        `;
        
        document.body.appendChild(closeMessage);

        // Munculkan pesan dengan transisi
        setTimeout(() => {
            const messageElement = document.getElementById('close-message');
            messageElement.classList.remove('opacity-0');
            messageElement.classList.add('opacity-100');
        }, 100);

        // Arahkan setelah 5 detik
        setTimeout(() => {
            const messageElement = document.getElementById('close-message');
            messageElement.classList.remove('opacity-100');
            messageElement.classList.add('opacity-0');
            setTimeout(() => {
                window.location.href = "perbaikan.html"; // Arahkan ke halaman perbaikan
            }, 1000);  // Tunggu 1 detik sebelum mengalihkan
        }, 5000);  // Redirect setelah 5 detik
    }
};
