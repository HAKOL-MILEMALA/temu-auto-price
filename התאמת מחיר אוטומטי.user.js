// ==UserScript==
// @name         התאמת מחירים אוטומטית של טמו
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  אוטומציה להתאמת מחיר בטמו - עיצוב בולט יותר וזמן השהייה עם ספירה לאחור לפני סגירה
// @author       You
// @match        https://www.temu.com/bgt_order_detail.html*
// @match        https://www.temu.com/bgas_refund_difference.html*
// @match        https://www.temu.com/bgas_refund_detail.html*
// @grant        window.close
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/HAKOL-MILEMALA/temu-auto-price/main/התאמת מחיר אוטומטי.user.js
// @downloadURL  https://raw.githubusercontent.com/HAKOL-MILEMALA/temu-auto-price/main/התאמת מחיר אוטומטי.user.js
// ==/UserScript==

(function() {
    'use strict';

    // משתנה גלובלי לשליטה על הרצת הסקריפט
    let isAborted = false;
    let statusTextNode = null;

    // יצירת בועת הסטטוס על המסך - במיקום מרכזי ובולט יותר
    function createStatusBubble() {
        const container = document.createElement('div');
        // מיקום באמצע למעלה, עם הצללה חזקה וטקסט גדול יותר
        container.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#fff; border:3px solid #fb7701; padding:20px; z-index:999999; border-radius:12px; box-shadow:0 8px 25px rgba(0,0,0,0.4); direction:rtl; font-family:sans-serif; text-align:center; min-width:320px;';

        statusTextNode = document.createElement('div');
        statusTextNode.innerText = 'טוען סקריפט...';
        statusTextNode.style.cssText = 'margin-bottom:15px; font-weight:bold; color:#333; font-size:18px; line-height:1.4;';

        const stopBtn = document.createElement('button');
        stopBtn.innerText = 'עצור אוטומציה והישאר בעמוד';
        stopBtn.style.cssText = 'background:#fb7701; color:#fff; border:none; padding:12px 20px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; transition: background 0.3s; box-shadow:0 2px 6px rgba(0,0,0,0.2);';

        // אפקט מעבר עכבר לכפתור
        stopBtn.onmouseover = () => { stopBtn.style.background = '#e06a00'; };
        stopBtn.onmouseout = () => { stopBtn.style.background = '#fb7701'; };

        // פעולת הביטול בלחיצה
        stopBtn.onclick = () => {
            isAborted = true;
            statusTextNode.innerText = 'הסקריפט נעצר לבקשתך.';
            statusTextNode.style.color = 'red';
            stopBtn.style.display = 'none'; // הסתרת הכפתור כדי להראות שהפעולה נקלטה
        };

        container.appendChild(statusTextNode);
        container.appendChild(stopBtn);
        document.body.appendChild(container);
    }

    // עדכון טקסט הבועה
    function updateStatus(text) {
        if (statusTextNode && !isAborted) {
            statusTextNode.innerText = text;
        }
    }

    // פונקציה לסגירת העמוד עם ספירה לאחור של 3 שניות
    function closePageWithCountdown(baseMessage) {
        let timeLeft = 3; // 3 שניות המתנה
        updateStatus(`${baseMessage}\nנסגר בעוד ${timeLeft} שניות...`);

        const countdownInterval = setInterval(() => {
            if (isAborted) {
                clearInterval(countdownInterval);
                return;
            }

            timeLeft--;
            if (timeLeft > 0) {
                updateStatus(`${baseMessage}\nנסגר בעוד ${timeLeft} שניות...`);
            } else {
                clearInterval(countdownInterval);
                updateStatus('סוגר עמוד...');
                window.close();
            }
        }, 1000);
    }

    // פונקציית איתור ולחיצה לפי טקסט
    function findAndClickButton(exactText) {
        if (isAborted) return false;

        const buttons = document.querySelectorAll('div[role="button"], button');
        for (let btn of buttons) {
            if (btn.textContent && btn.textContent.trim() === exactText) {
                btn.click();
                return true;
            }
        }

        const spans = document.querySelectorAll('span');
        for (let span of spans) {
            if (span.textContent && span.textContent.trim() === exactText) {
                let targetButton = span.closest('[role="button"]');
                if (targetButton) {
                    targetButton.click();
                    return true;
                }
            }
        }
        return false;
    }

    // בדיקה לחלונית הסירוב "מצטערים..."
    function checkForSorryPopup() {
        const divs = document.querySelectorAll('div');
        for (let div of divs) {
            if (div.textContent && div.textContent.trim() === 'מצטערים, אין באפשרותך לבקש התאמת מחיר עבור הזמנה זו') {
                return true;
            }
        }
        return false;
    }

    // מוניטור גלובלי שרץ כל שנייה לחפש את הודעת הסירוב
    function startGlobalMonitor() {
        const monitorInterval = setInterval(() => {
            if (isAborted) {
                clearInterval(monitorInterval);
                return;
            }
            if (checkForSorryPopup()) {
                clearInterval(monitorInterval); // עוצר את הסריקה
                closePageWithCountdown('לא נמצאה התאמת מחיר.');
            }
        }, 1000);
    }

    // טיפול בעמוד פרטי ההזמנה הראשי
    function handleOrderPage() {
        updateStatus('עמוד הזמנה: ממתין לטעינת הכפתור...');
        setTimeout(() => {
            if (isAborted) return;
            const found = findAndClickButton('התאמת מחיר');
            if (found) {
                updateStatus('נלחץ "התאמת מחיר". ממתין לתוצאה...');
            } else {
                updateStatus('כפתור "התאמת מחיר" לא זמין בעמוד זה.');
            }
        }, 3000);
    }

    // טיפול בעמוד בקשת ההחזר
    function handleRefundPage() {
        updateStatus('עמוד בקשה: מתחיל תהליך אישור...');
        let currentStep = 1;
        let attempts = 0;
        const maxAttempts = 40;

        const processInterval = setInterval(() => {
            if (isAborted) {
                clearInterval(processInterval);
                return;
            }

            attempts++;
            if (attempts > maxAttempts) {
                updateStatus('חריגת זמן בפעולה. הסקריפט נעצר.');
                clearInterval(processInterval);
                return;
            }

            if (currentStep === 1) {
                if (findAndClickButton('לבקש התאמת מחיר')) {
                    updateStatus('נלחץ "לבקש התאמת מחיר". בוחר קרדיט...');
                    currentStep = 2;
                    attempts = 0;
                }
            }
            else if (currentStep === 2) {
                if (findAndClickButton('קבלה תוך שניות')) {
                    updateStatus('נבחר זיכוי מהיר. מאשר...');
                    currentStep = 3;
                    attempts = 0;
                }
            }
            else if (currentStep === 3) {
                if (findAndClickButton('שליחה')) {
                    updateStatus('הבקשה נשלחה! ממתין לעמוד אישור...');
                    clearInterval(processInterval);
                }
            }
        }, 500);
    }

    // טיפול בעמוד ההצלחה
    function handleSuccessPage() {
        closePageWithCountdown('התאמת המחיר בוצעה בהצלחה!');
    }

    // הפעלה מתוזמנת לאחר טעינה
    window.addEventListener('load', () => {
        createStatusBubble();
        startGlobalMonitor();

        setTimeout(() => {
            const currentUrl = window.location.href;

            if (currentUrl.includes('bgt_order_detail.html')) {
                handleOrderPage();
            } else if (currentUrl.includes('bgas_refund_difference.html')) {
                handleRefundPage();
            } else if (currentUrl.includes('bgas_refund_detail.html')) {
                handleSuccessPage();
            }
        }, 1000);
    });

})();
