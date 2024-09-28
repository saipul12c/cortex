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

// Deteksi bahasa yang diperluas berdasarkan kata umum dan tidak umum
function detectLanguage(text) {
    const indonesianWords = [
        "dan", "yang", "di", "dari", "adalah", "kamu", "ini", "itu", "saya", "bisa", "dengan", "akan", "untuk", "kami",
        "tidak", "sudah", "pada", "jika", "sebagai", "atau", "lebih", "dalam", "karena", "tersebut", "berkata", "mereka",
        "hanya", "antara", "orang", "masih", "harus", "menjadi", "banyak", "kemudian", "belum", "setelah", "namun", "sekali",
        "tentang", "pernah", "dimana", "bagaimana", "mengapa", "apakah", "mungkin", "segera", "beberapa", "selalu", "terjadi",
        "menyebutkan", "mengatakan", "menyampaikan", "menjelaskan", "memahami", "menilai", "menghadapi", "menggunakan", "mempertimbangkan",
        "kerja", "tinggi", "pendidikan", "keluarga", "anak", "perusahaan", "proyek", "masyarakat", "buku", "internet", "komputer",
        "data", "belajar", "memutuskan", "kemajuan", "pengetahuan", "peluang", "tantangan", "manusia", "kebijakan", "usaha", 
        "penelitian", "produk", "penemuan", "perangkat", "jaringan", "sistem", "pengguna", "kebutuhan", "penilaian", "kualitas",
        "bisnis", "ekonomi", "budaya", "perubahan", "lingkungan", "teknologi", "informasi", "inovasi", "transportasi", "keamanan", 
        "kesehatan", "pendapatan", "pengembangan", "program", "penyedia", "layanan", "pengaruh", "pelaksanaan", "tujuan", "pengelolaan",
        "kehidupan", "pengalaman", "keputusan", "kepemimpinan", "manajemen", "strategi", "visi", "misi", "kesempatan", "kemitraan", 
        "pengamatan", "pengukuran", "penilaian", "kesulitan", "prestasi", "tantangan", "analisis", "kreativitas", "efisiensi", "kolaborasi"
    ];

    const englishWords = [
        "the", "is", "in", "of", "and", "you", "this", "that", "i", "can", "with", "will", "for", "we",
        "not", "are", "on", "to", "was", "but", "by", "from", "about", "would", "could", "there", "which", "their", "more", 
        "between", "after", "before", "still", "must", "many", "since", "until", "however", "always", "sometimes", "mention",
        "explain", "describe", "understand", "consider", "might", "should", "where", "how", "why", "because", "people", 
        "happen", "know", "face", "use", "refer", "address", "evaluate", "work", "high", "education", "family", "child", 
        "company", "project", "community", "book", "internet", "computer", "data", "study", "decide", "progress", "knowledge",
        "opportunity", "challenge", "human", "policy", "effort", "research", "product", "invention", "device", "network", 
        "system", "user", "need", "evaluation", "quality", "business", "economy", "culture", "change", "environment", "technology",
        "information", "innovation", "transportation", "security", "health", "income", "development", "program", "provider", 
        "service", "impact", "implementation", "goal", "management", "life", "experience", "decision", "leadership", "strategy", 
        "vision", "mission", "opportunity", "partnership", "observation", "measurement", "evaluation", "difficulty", "achievement",
        "analysis", "creativity", "efficiency", "collaboration"
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

// Fungsi untuk menghitung kemiripan menggunakan Jaccard Index
function jaccardSimilarity(question1, question2) {
    const set1 = new Set(question1.toLowerCase().split(" "));
    const set2 = new Set(question2.toLowerCase().split(" "));

    const intersection = [...set1].filter(word => set2.has(word)).length;
    const union = new Set([...set1, ...set2]).size;

    return union === 0 ? 0 : intersection / union; // Menghindari pembagian dengan nol
}

async function fetchAnswers(question) {
    const jsonFiles = ['db1.json', 'db2.json', 'db3.json', 'db4.json', 'db5.json'];
    const responses = [];
    let highestSimilarity = 0;
    let bestMatch = null;

    const fetchJsonFile = async (file) => {
        try {
            const response = await fetch(`/database/${file}`);
            if (!response.ok) {
                throw new Error(`Network response was not ok for ${file}: ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error fetching ${file}:`, error.message);
            return [];
        }
    };

    const fetchPromises = jsonFiles.map(fetchJsonFile);

    try {
        const allResponses = await Promise.all(fetchPromises);

        allResponses.forEach(response => {
            if (Array.isArray(response)) {
                responses.push(...response);
            } else {
                console.warn(`Expected array but got: ${typeof response}`);
            }
        });

    } catch (error) {
        console.error('Error fetching JSON files:', error);
    }

    // Mencari jawaban dengan kemiripan tertinggi
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
        // English version
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

    // Ambil jawaban dari database JSON berdasarkan kemiripan
    const foundAnswer = await fetchAnswers(question);

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

// Panggil saat halaman dimuat untuk mendapatkan lokasi dan info perangkat
window.onload = function () {
    getDeviceInfo();
    getLocation();
    updateCurrentTime(); // Memperbarui waktu saat halaman dimuat
};
