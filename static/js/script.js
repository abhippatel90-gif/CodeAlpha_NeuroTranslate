document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const sourceLangSelect = document.getElementById('source-lang');
    const targetLangSelect = document.getElementById('target-lang');
    const sourceText = document.getElementById('source-text');
    const targetText = document.getElementById('target-text');
    const translateBtn = document.getElementById('translate-btn');
    const swapBtn = document.getElementById('swap-lang');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const speakBtn = document.getElementById('speak-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const loader = document.getElementById('loader');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const audioPlayer = document.getElementById('audio-player');
    const charCount = document.getElementById('char-count');
    const currentYear = document.getElementById('current-year');
    const navbar = document.querySelector('.navbar');

    // --- Init ---
    if (currentYear) currentYear.textContent = new Date().getFullYear();
    
    // Only run translation initialization if the elements exist on the page
    const isAppPage = sourceLangSelect && targetLangSelect && translateBtn;
    if (isAppPage) {
        loadLanguages();
    }

    // --- Scroll Reveal Animations ---
    const reveals = document.querySelectorAll('.reveal');
    function revealOnScroll() {
        const windowHeight = window.innerHeight;
        const elementVisible = 100;
        
        reveals.forEach(reveal => {
            const elementTop = reveal.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add('active');
            }
        });
    }
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Trigger on load

    // --- Navbar Shrink on Scroll ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- Theme Toggle ---
    themeToggleBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        
        const icon = themeToggleBtn.querySelector('i');
        icon.className = newTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });

    // --- Character Count ---
    if (sourceText) {
        sourceText.addEventListener('input', () => {
            const len = sourceText.value.length;
            charCount.textContent = `${len} / 5000`;
            if (len > 5000) charCount.style.color = '#ef4444';
            else charCount.style.color = '';
        });
    }

    // --- Toast Notification ---
    function showToast(message, isError = false) {
        toastMessage.textContent = message;
        const icon = toast.querySelector('.toast-icon');
        const title = toast.querySelector('.toast-title');
        
        if (isError) {
            icon.style.background = '#ef4444';
            icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            title.textContent = 'Error';
        } else {
            icon.style.background = '#10b981';
            icon.innerHTML = '<i class="fa-solid fa-check"></i>';
            title.textContent = 'Success';
        }

        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // --- API Interactions ---
    async function loadLanguages() {
        try {
            const response = await fetch('/languages');
            const languages = await response.json();
            
            languages.forEach(lang => {
                const sourceOpt = new Option(lang.name, lang.code);
                const targetOpt = new Option(lang.name, lang.code);
                sourceLangSelect.add(sourceOpt);
                targetLangSelect.add(targetOpt);
            });
            targetLangSelect.value = 'es';
        } catch (error) {
            showToast('Failed to load languages.', true);
        }
    }

    async function translateText() {
        const text = sourceText.value.trim();
        if (!text) {
            showToast('Please enter text to translate.', true);
            return;
        }

        const source = sourceLangSelect.value;
        const target = targetLangSelect.value;

        if (source === target && source !== 'auto') {
            targetText.value = text;
            return;
        }

        loader.classList.add('active');

        try {
            const response = await fetch('/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, source, target })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Translation failed');

            targetText.value = data.translatedText;

            if (data.audioBase64) {
                audioPlayer.src = `data:audio/mp3;base64,${data.audioBase64}`;
            } else {
                audioPlayer.removeAttribute('src');
            }
        } catch (error) {
            showToast(error.message, true);
        } finally {
            loader.classList.remove('active');
        }
    }

    // --- Event Listeners ---
    if (isAppPage) {
        translateBtn.addEventListener('click', translateText);

        swapBtn.addEventListener('click', () => {
            if (sourceLangSelect.value !== 'auto') {
                const tempLang = sourceLangSelect.value;
                sourceLangSelect.value = targetLangSelect.value;
                targetLangSelect.value = tempLang;
            }
            const tempText = sourceText.value;
            sourceText.value = targetText.value;
            targetText.value = tempText;
        });

        clearBtn.addEventListener('click', () => {
            sourceText.value = '';
            targetText.value = '';
            charCount.textContent = '0 / 5000';
            audioPlayer.removeAttribute('src');
        });

        copyBtn.addEventListener('click', () => {
            if (!targetText.value) return;
            navigator.clipboard.writeText(targetText.value).then(() => {
                showToast('Translation copied to clipboard!');
            });
        });

        speakBtn.addEventListener('click', () => {
            if (audioPlayer.src) {
                audioPlayer.play();
            } else if (targetText.value) {
                const utterance = new SpeechSynthesisUtterance(targetText.value);
                utterance.lang = targetLangSelect.value;
                speechSynthesis.speak(utterance);
            }
        });
    }
});
