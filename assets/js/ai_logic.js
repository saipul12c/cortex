// Daftar kata terlarang (bisa diperluas)
const forbiddenWords = ["violence", "weapon", "drugs"];

// Status untuk memastikan apakah pengguna bisa mengirim pertanyaan baru
let canSubmit = true;

// Menyimpan data sesi
let sessionData = {
    location: "Location Unavailable", // Default nilai lokasi
    deviceBrand: "Unknown Device", // Default nilai perangkat
    internetConnection: "Unknown Connection", // Default nilai koneksi
    questions: [],
    currentTime: null // Menyimpan waktu saat ini
};

// Fungsi untuk mendapatkan informasi perangkat pengguna
function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    if (/Android/i.test(userAgent)) {
        sessionData.deviceBrand = "Android Device";
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
        sessionData.deviceBrand = "iOS Device";
    } else if (/Windows/i.test(userAgent)) {
        sessionData.deviceBrand = "Windows Device";
    } else if (/Mac/i.test(userAgent)) {
        sessionData.deviceBrand = "Mac Device";
    }
    sessionData.internetConnection = navigator.connection ? navigator.connection.effectiveType : "Unknown Connection";
}

// Fungsi untuk mendapatkan waktu saat ini
function updateCurrentTime() {
    const now = new Date();
    sessionData.currentTime = now.toLocaleTimeString(); // Format waktu lokal
}

// Fungsi untuk mengatur cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); // Set selama 100 tahun (36500 hari)
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let c = cookies[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name + "=") === 0) {
            return c.substring((name + "=").length, c.length);
        }
    }
    return "";
}

// Fungsi untuk menyimpan sesi ke dalam cookies
function storeSessionInCookie() {
    const existingSessions = getCookie("user_sessions");
    let sessionList = existingSessions ? JSON.parse(existingSessions) : [];
    
    sessionList.push(sessionData);
    setCookie("user_sessions", JSON.stringify(sessionList), 36500); // Menyimpan selama 100 tahun
}

// Fungsi untuk menyimpan input pertanyaan ke dalam sesi
function storeQuestionInSession(question) {
    sessionData.questions.push(question);
}

// Fungsi untuk menangani semua error, termasuk yang asynchronous
function handleErrors(callback, errorHandler) {
    return async function (...args) {
        try {
            await callback(...args);  // Memastikan mendukung async function
        } catch (error) {
            console.error("An unexpected error occurred:", {
                message: error.message, // Pesan error
                stack: error.stack,     // Stack trace untuk debugging
                timestamp: new Date().toISOString() // Waktu error terjadi
            });

            // Jika ada custom error handler, gunakan itu, jika tidak, tampilkan pesan default
            if (errorHandler) {
                errorHandler(error);
            } else {
                appendMessage("Oops, something went wrong! Please try again.", "ai");
            }
        }
    };
}

// Fungsi untuk mendeteksi dan melakukan perhitungan matematika sederhana
function calculateMath(question) {
    const mathExpression = question.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
    if (mathExpression) {
        const num1 = parseFloat(mathExpression[1]);
        const operator = mathExpression[2];
        const num2 = parseFloat(mathExpression[3]);
        
        let result;
        switch (operator) {
            case '+':
                result = num1 + num2;
                break;
            case '-':
                result = num1 - num2;
                break;
            case '*':
                result = num1 * num2;
                break;
            case '/':
                result = num2 !== 0 ? num1 / num2 : "Error (division by zero)";
                break;
            default:
                return "Operator tidak dikenali.";
        }
        return `Hasil perhitungan adalah: ${result}`;
    }
    return null;
}

// Fungsi untuk menghitung ekspresi matematika dalam kalimat
function calculateSentenceMath(sentence) {
    const words = sentence.split(" ");
    let numbers = [];
    let operations = [];
    
    for (let i = 0; i < words.length; i++) {
        if (!isNaN(words[i])) {
            numbers.push(parseFloat(words[i]));
        } else if (['plus', '+'].includes(words[i])) {
            operations.push('+');
        } else if (['minus', '-'].includes(words[i])) {
            operations.push('-');
        } else if (['times', '*'].includes(words[i])) {
            operations.push('*');
        } else if (['divided', 'by'].includes(words[i])) {
            if (words[i + 1] === 'by') {
                operations.push('/');
                i++; // Lewati kata 'by'
            }
        }
    }

    if (numbers.length === 0 || operations.length === 0) {
        return null; // Tidak ada perhitungan yang valid
    }

    let result = numbers[0];
    for (let j = 0; j < operations.length; j++) {
        const nextNumber = numbers[j + 1];
        const operator = operations[j];
        
        switch (operator) {
            case '+':
                result += nextNumber;
                break;
            case '-':
                result -= nextNumber;
                break;
            case '*':
                result *= nextNumber;
                break;
            case '/':
                result = nextNumber !== 0 ? result / nextNumber : "Error (division by zero)";
                break;
            default:
                return "Operator tidak dikenali.";
        }
    }

    return `Hasil perhitungan adalah: ${result}`;
}

// Fungsi untuk menghitung kemiripan menggunakan Jaccard Index
function cleanText(text) {
    return text.toLowerCase().replace(/[^\w\s]/gi, ''); // Menghapus tanda baca
}

function jaccardSimilarity(str1, str2) {
    const set1 = new Set(cleanText(str1).split(' '));
    const set2 = new Set(cleanText(str2).split(' '));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
}

// Simulasi pengambilan jawaban dari database lokal
function fetchAnswers(question) {
    const responses = [
        { question: "Apa itu JavaScript?", answer: "JavaScript adalah bahasa pemrograman yang digunakan untuk pengembangan web." },
        { question: "Bagaimana cara belajar pemrograman?", answer: "Mulailah dengan memahami dasar-dasar dan praktik secara konsisten." },
        // Tambahkan lebih banyak jawaban sesuai kebutuhan
    ];

    let highestSimilarity = 0;
    let bestMatch = null;

    responses.forEach(answer => {
        const similarity = jaccardSimilarity(question, answer.question);
        if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            bestMatch = answer;
        }
    });

    return bestMatch; // Mengembalikan jawaban dengan kemiripan tertinggi
}

// Menambahkan respon yang lebih manusiawi dan emosional dengan lebih banyak variasi dan konteks
function generateHumanizedResponse(foundAnswer, language, feedback, userName = "", interactionCount = 1) {
    let response;

    const thankYouMessages = [
        "Terima kasih sudah menunggu!", 
        "Saya sangat menghargai kesabaranmu! 😊", 
        "Kamu luar biasa, terima kasih! 🙏",
        "Kesabaranmu membuat semuanya lebih mudah. Terima kasih! 🌟"
    ];

    const noAnswerMessages = [
        "Saya belum punya jawaban yang sesuai, tapi saya terus belajar! 💪",
        "Maaf, saya belum tahu jawabannya sekarang. Tapi jangan khawatir, saya akan lebih baik di waktu berikutnya! 🙏",
        "Hmm, saya harus mencari tahu lebih lanjut. Maaf atas ketidaknyamanannya!",
        "Saya mohon maaf belum bisa memberikan jawaban sekarang. Terima kasih atas pengertiannya!"
    ];

    // Fungsi acak untuk memberikan variasi pada respons
    function getRandomMessage(messages) {
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // Mendapatkan waktu salam
    function getTimeGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Selamat pagi";
        if (hour < 18) return "Selamat siang";
        return "Selamat malam";
    }

    // Menentukan respons berdasarkan bahasa, jawaban yang ditemukan, dan feedback

    if (language === "indonesian") {
        // Sapaan berdasarkan waktu dan nama pengguna
        let greeting = `${getTimeGreeting()}${userName ? `, ${userName}` : ""}! `;
        
        if (foundAnswer) {
            response = `${greeting}Jawaban saya: ${foundAnswer.answer}. ${getRandomMessage(thankYouMessages)}`;
        } else {
            response = `${greeting}${getRandomMessage(noAnswerMessages)} Saya akan mencoba memperbaikinya dari interaksi ini.`;
        }

        // Tambahkan respons berdasarkan feedback pengguna
        if (feedback === "like") {
            response += " Senang bisa membantu! 😊";
        } else if (feedback === "dislike") {
            response += " Saya akan bekerja lebih keras untuk memperbaikinya! 🙏";
        } else if (feedback === "suggestion") {
            response += " Terima kasih atas masukannya, ini sangat membantu saya untuk berkembang! 🤝";
        } else if (feedback === "neutral") {
            response += " Saya mengerti, terima kasih atas pendapatmu. Saya akan terus meningkatkan diri! 👍";
        }

        // Respons spesial setelah banyak interaksi
        if (interactionCount > 5) {
            response += " Terima kasih sudah sering berinteraksi dengan saya, saya merasa lebih baik setiap kali belajar dari kamu! 🙌";
        }

    } else {
        // Versi Bahasa Inggris
        let greeting = `${getTimeGreeting()}${userName ? `, ${userName}` : ""}! `;

        if (foundAnswer) {
            response = `${greeting}Here's my answer: ${foundAnswer.answer}. ${getRandomMessage(thankYouMessages)}`;
        } else {
            response = `${greeting}${getRandomMessage(noAnswerMessages)} I'll try to improve based on this interaction.`;
        }

        if (feedback === "like") {
            response += " I'm glad I could help! 😊";
        } else if (feedback === "dislike") {
            response += " I'll work harder to improve! 🙏";
        } else if (feedback === "suggestion") {
            response += " Thank you for your suggestion, it helps me grow! 🤝";
        } else if (feedback === "neutral") {
            response += " Thank you for your input, I'll continue improving! 👍";
        }

        if (interactionCount > 5) {
            response += " Thanks for interacting with me so often, I always learn something new from you! 🙌";
        }
    }

    return response;
}

// Fungsi untuk menambahkan pesan ke tampilan chat
function appendMessage(message, sender, callback) {
    const chatContainer = document.getElementById("chat-container");
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender);
    messageElement.innerText = message;
    
    // Animasi muncul
    messageElement.style.opacity = 0;
    chatContainer.appendChild(messageElement);
    setTimeout(() => {
        messageElement.style.opacity = 1;
        if (callback) callback();
    }, 100); // Durasi animasi
    
    chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll ke bawah
}

// Fungsi loading
function showLoading() {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'block';
}

function hideLoading() {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'none';
}

// Fungsi untuk menampilkan efek mengetik
function showTypingEffect() {
    return new Promise((resolve) => {
        appendMessage("...", "ai");
        setTimeout(() => {
            const messages = document.querySelectorAll('.message.ai');
            if (messages.length > 0) {
                messages[messages.length - 1].remove(); // Hapus efek mengetik
            }
            resolve();
        }, 2000); // Durasi efek mengetik
    });
}

// Cek apakah input mengandung kata-kata terlarang
function checkForbiddenWords(input) {
    return forbiddenWords.some((word) => input.toLowerCase().includes(word.toLowerCase()));
}

// Menangani pengiriman pertanyaan
document.getElementById("question-form").addEventListener("submit", async (event) => {
    event.preventDefault(); // Mencegah reload halaman
    const question = document.getElementById("question-input").value.trim();

    if (!canSubmit) return; // Jika tidak bisa mengirim, keluar
    canSubmit = false; // Mengunci input

    // Simpan pertanyaan ke sesi
    storeQuestionInSession(question);

    // Cek kata terlarang
    if (checkForbiddenWords(question)) {
        appendMessage("Pert anyaan Anda mengandung konten yang tidak pantas. Tolong ajukan pertanyaan lain.", "ai");
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

    // Cek jika pertanyaan adalah perhitungan dalam bentuk angka
    const mathResult = calculateMath(question);
    if (mathResult) {
        appendMessage(mathResult, "ai");
        canSubmit = true;
        return;
    }

    // Cek jika pertanyaan adalah perhitungan dalam bentuk kalimat
    const sentenceMathResult = calculateSentenceMath(question);
    if (sentenceMathResult) {
        appendMessage(sentenceMathResult, "ai");
        canSubmit = true;
        return;
    }

    showLoading(); // Tampilkan loading
    await showTypingEffect(); // Efek mengetik

    // Ambil jawaban dari database lokal berdasarkan kemiripan
    const foundAnswer = fetchAnswers(question);

    if (!foundAnswer) {
        const errorMessage = language === "indonesian"
            ? "Terjadi kesalahan saat mengambil data. Silakan coba lagi nanti."
            : "An error occurred while fetching data. Please try again later.";
        appendMessage(errorMessage, "ai");
        canSubmit = true;
        return;
    }

    const aiResponse = generateHumanizedResponse(foundAnswer, language);
    appendMessage(aiResponse, "ai");

    hideLoading(); // Sembunyikan loading setelah jawaban muncul
    canSubmit = true; // Izinkan pengguna mengirim pertanyaan baru
});

// Panggil saat halaman dimuat untuk mendapatkan info perangkat
window.onload = function () {
    getDeviceInfo();
    updateCurrentTime(); // Memperbarui waktu saat halaman dimuat
};