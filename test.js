// test.js

// Daftar kata terlarang (bisa diperluas)
const forbiddenWords = ["violence", "weapon", "drugs"];

// Status untuk memastikan apakah pengguna bisa mengirim pertanyaan baru
let canSubmit = true;

// Menyimpan data sesi
let sessionData = {
    location: null,
    deviceBrand: null,
    internetConnection: null,
    questions: [],
    currentTime: null // Menyimpan waktu saat ini
};

// Fungsi untuk mendapatkan waktu saat ini
function updateCurrentTime() {
    const now = new Date();
    sessionData.currentTime = now.toLocaleTimeString(); // Format waktu lokal
}

// Fungsi untuk menyimpan input pertanyaan ke dalam sesi
function storeQuestionInSession(question) {
    sessionData.questions.push(question);
}

// Deteksi bahasa yang diperluas berdasarkan kata umum dan tidak umum
function detectLanguage(text) {
    const indonesianWords = [
        "dan", "yang", "di", "dari", "adalah", "kamu", "ini", "itu", "saya", "bisa", "dengan", "akan", "untuk", "kami",
        // ... tambahkan kata lainnya
    ];

    const englishWords = [
        "the", "is", "in", "of", "and", "you", "this", "that", "i", "can", "with", "will", "for", "we",
        // ... tambahkan kata lainnya
    ];

    let indonesianCount = 0;
    let englishCount = 0;
    const words = text.toLowerCase().split(" ");

    words.forEach((word) => {
        if (indonesianWords.includes(word)) {
            indonesianCount++;
        } else if (englishWords.includes(word)) {
            englishCount++;
        }
    });

    return indonesianCount > englishCount ? "indonesian" : "english";
}

// Cek apakah input mengandung kata-kata terlarang
function checkForbiddenWords(input) {
    return forbiddenWords.some((word) => input.toLowerCase().includes(word.toLowerCase()));
}

// Fungsi untuk menampilkan hasil di terminal
function appendMessage(message, sender) {
    console.log(`${sender}: ${message}`);
}

// Menangani pengiriman pertanyaan
async function handleSubmit(question) {
    if (!canSubmit) return; // Jika tidak bisa mengirim, keluar
    canSubmit = false; // Mengunci input

    // Simpan pertanyaan ke sesi
    storeQuestionInSession(question);

    // Cek kata terlarang
    if (checkForbiddenWords(question)) {
        appendMessage("Pertanyaan Anda mengandung konten yang tidak pantas. Tolong ajukan pertanyaan lain.", "ai");
        canSubmit = true;
        return;
    }

    // Perbarui waktu saat ini
    updateCurrentTime();

    // Cek jika pertanyaan adalah tentang waktu
    if (question.toLowerCase().includes("jam berapa")) {
        appendMessage(`Saat ini adalah ${sessionData.currentTime}.`, "ai");
        canSubmit = true;
        return;
    }

    const language = detectLanguage(question);
    appendMessage(`Bahasa yang terdeteksi: ${language}`, "ai");

    // Simulasi pemrosesan pertanyaan
    setTimeout(() => {
        appendMessage(`Ini adalah respons AI untuk pertanyaan: "${question}"`, "ai");
        canSubmit = true;
    }, 2000);
}

// Uji coba fungsi dengan input dari terminal
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question('Masukkan pertanyaan: ', (question) => {
    handleSubmit(question).then(() => {
        readline.close();
    });
});
