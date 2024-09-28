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

// Fungsi untuk mendapatkan informasi perangkat pengguna
function getDeviceInfo() {
    try {
        const userAgent = navigator.userAgent;
        if (/Android/i.test(userAgent)) {
            sessionData.deviceBrand = "Android Device";
        } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
            sessionData.deviceBrand = "iOS Device";
        } else if (/Windows/i.test(userAgent)) {
            sessionData.deviceBrand = "Windows Device";
        } else if (/Mac/i.test(userAgent)) {
            sessionData.deviceBrand = "Mac Device";
        } else {
            sessionData.deviceBrand = "Unknown Device";
        }
        sessionData.internetConnection = navigator.connection ? navigator.connection.effectiveType : "Unknown Connection";
    } catch (error) {
        console.error("Error getting device info:", error);
        sessionData.deviceBrand = "Device Info Unavailable";
        sessionData.internetConnection = "Unknown Connection";
    }
}

// Fungsi untuk mendapatkan lokasi pengguna menggunakan Geolocation API
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                sessionData.location = `Lat: ${latitude}, Long: ${longitude}`;
            },
            (error) => {
                sessionData.location = "Location Unavailable";
                console.error("Error getting location:", error);
            }
        );
    } else {
        sessionData.location = "Geolocation Not Supported";
    }
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

// Menangani semua error
function handleErrors(callback) {
    try {
        callback();
    } catch (error) {
        console.error("An unexpected error occurred:", error);
        appendMessage("Oops, something went wrong! Please try again.", "ai");
    }
}

// Deteksi bahasa yang diperluas berdasarkan kata umum
function detectLanguage(text) {
    const indonesianWords = [
        "dan", "yang", "di", "dari", "adalah", "kamu", "ini", "itu", "saya", "bisa", "dengan", "akan", "untuk", "kami"
    ];
    const englishWords = [
        "the", "is", "in", "of", "and", "you", "this", "that", "i", "can", "with", "will", "for", "we"
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

// Fungsi untuk mengambil data dari file JSON
async function fetchAnswers() {
    const responses = [];
    const jsonFiles = ['db1.json', 'db2.json', 'db3.json', 'db4.json', 'db5.json'];

    for (const file of jsonFiles) {
        const response = await fetch(`/database/${file}`);
        const data = await response.json();
        responses.push(...data); // Menambahkan semua data dari setiap file
    }

    return responses;
}

// Menambahkan respon yang lebih manusiawi dan emosional
function generateHumanizedResponse(foundAnswer, language) {
    let response;

    if (language === "indonesian") {
        response = foundAnswer 
            ? `Jawaban saya: ${foundAnswer.answer}. Terima kasih sudah menunggu. Semoga ini bisa membantu kamu! 😊`
            : `Maaf, saya belum punya jawaban yang sesuai untuk pertanyaanmu saat ini. Saya akan mencoba lebih baik di kesempatan berikutnya. Jangan khawatir, saya terus belajar dari interaksi kita. 🙏`;
    } else {
        response = foundAnswer 
            ? `Here's my answer: ${foundAnswer.answer}. Thank you for your patience! I hope this helps you! 😊`
            : `I'm sorry, I couldn't find a suitable answer for your question at the moment. I'll do my best to improve next time. Don't worry, I'm learning from our interactions. 🙏`;
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

    let answers = await fetchAnswers(); // Ambil data dari database JSON

    if (answers.length === 0) {
        const errorMessage = language === "indonesian"
            ? "Terjadi kesalahan saat mengambil data. Silakan coba lagi nanti."
            : "An error occurred while fetching data. Please try again later.";
        appendMessage(errorMessage, "ai");
        canSubmit = true;
        return;
    }

    const foundAnswer = answers.find(item => item.question.toLowerCase() === question.toLowerCase());

    const aiResponse = generateHumanizedResponse(foundAnswer, language);
    appendMessage(aiResponse, "ai");

    hideLoading(); // Sembunyikan loading setelah jawaban muncul
    canSubmit = true; // Izinkan pengguna mengirim pertanyaan baru
});

// Panggil saat halaman dimuat untuk mendapatkan lokasi dan info perangkat
window.onload = function () {
    getDeviceInfo();
    getLocation();
    updateCurrentTime(); // Memperbarui waktu saat halaman dimuat
};
