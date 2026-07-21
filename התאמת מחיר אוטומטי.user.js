// ==UserScript==
// @name         התאמת מחיר אוטומטית בטמו (Temu)
// @namespace    http://tampermonkey.net/
// @version      3.4
// @description  אוטומציה מלאה לבדיקה ואיסוף החזרי הפרשי מחירים בטמו כולל ממשק שליטה חכם
// @author       HAKOL-MILEMALA
// @match        https://www.temu.com/bgt_order_detail.html*
// @match        https://www.temu.com/bgas_refund_difference.html*
// @match        https://www.temu.com/bgas_refund_detail.html*
// @updateURL    https://github.com/HAKOL-MILEMALA/temu-auto-price/raw/refs/heads/main/%D7%94%D7%AA%D7%90%D7%9E%D7%AA%20%D7%9E%D7%97%D7%99%D7%A8%20%D7%90%D7%95%D7%98%D7%95%D7%9E%D7%98%D7%99.user.js
// @downloadURL  https://github.com/HAKOL-MILEMALA/temu-auto-price/raw/refs/heads/main/%D7%94%D7%AA%D7%90%D7%9E%D7%AA%20%D7%9E%D7%97%D7%99%D7%A8%20%D7%90%D7%95%D7%98%D7%95%D7%9E%D7%98%D7%99.user.js
// @grant        window.close
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // משתנה גלובלי לשליטה על הרצת הסקריפט
    let isAborted = false;
    let statusTextNode = null;
    let container = null;

    // יצירת בועת הסטטוס על המסך - עיצוב חדש ומודרני
    function createStatusBubble() {
        container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: #ffffff;
            padding: 20px 28px;
            z-index: 999999;
            border-radius: 16px;
            box-shadow: 0 12px 36px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08);
            direction: rtl;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center;
            min-width: 340px;
            border-top: 4px solid #f97316;
            transition: opacity 0.4s ease, transform 0.4s ease;
        `;
        
        statusTextNode = document.createElement('div');
        statusTextNode.innerText = 'טוען סקריפט...';
        statusTextNode.style.cssText = 'margin-bottom: 16px; font-weight: 600; color: #374151; font-size: 17px; line-height: 1.5;';
        
        const stopBtn = document.createElement('button');
        stopBtn.innerText = 'עצור אוטומציה והישאר בעמוד';
        stopBtn.style.cssText = `
            background: #f97316;
            color: #ffffff;
            border: none;
            padding: 10px 24px;
            border-radius: 999px;
            cursor: pointer;
            font-weight: 600;
            font-size: 15px;
            width: 100%;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
        `;
        
        // אפקטים של אנימציה במעבר עכבר
        stopBtn.onmouseover = () => { 
            stopBtn.style.background = '#ea580c'; 
            stopBtn.style.transform = 'translateY(-1px)';
            stopBtn.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.4)';
        };
        stopBtn.onmouseout = () => { 
            stopBtn.style.background = '#f97316'; 
            stopBtn.style.transform = 'translateY(0)';
            stopBtn.style.boxShadow = '0 2px 8px rgba(249, 115, 22, 0.3)';
        };

        // פעולת הביטול בלחיצה + העלמת הבועה
        stopBtn.onclick = () => {
            isAborted = true;
            statusTextNode.innerText = 'הסקריפט נעצר לבקשתך.';
            statusTextNode.style.color = '#ef4444'; 
            stopBtn.style.display = 'none';

            // מנגנון העלמה (Fade Out) לאחר 2 שניות
            setTimeout(() => {
                container.style.opacity = '0';
                container.style.transform = 'translateX(-50%) translateY(-20px)';
                setTimeout(() => container.remove(), 400); // ממתין לסיום האנימציה ומסיר מה-DOM
            }, 2000);
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

    // פונקציה לסגירת העמוד עם ספירה לאחור של 3 שניות (עבור התאמה/דחייה)
    function closePageWithCountdown(baseMessage) {
        let timeLeft = 3;
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
                clearInterval(monitorInterval);
                closePageWithCountdown('לא נמצאה התאמת מחיר.');
            }
        }, 1000);
    }

    // טיפול בעמוד פרטי ההזמנה הראשי - עם ספירה לאחור של 5 שניות לפני לחיצה
    function handleOrderPage() {
        let waitTime = 5;
        updateStatus(`עמוד הזמנה: מחפש התאמת מחיר בעוד ${waitTime} שניות...`);

        const waitInterval = setInterval(() => {
            if (isAborted) {
                clearInterval(waitInterval);
                return;
            }
            
            waitTime--;
            if (waitTime > 0) {
                updateStatus(`עמוד הזמנה: מחפש התאמת מחיר בעוד ${waitTime} שניות...`);
            } else {
                // הזמן עבר, עוצרים את השעון ומנסים ללחוץ
                clearInterval(waitInterval);
                const found = findAndClickButton('התאמת מחיר');
                if (found) {
                    updateStatus('נלחץ "התאמת מחיר". ממתין לתוצאה...');
                } else {
                    updateStatus('כפתור "התאמת מחיר" לא זמין בעמוד זה.');
                    
                    // מעלים את הבועה אוטומטית אם לא רלוונטי
                    setTimeout(() => {
                        if (!isAborted) {
                            container.style.opacity = '0';
                            setTimeout(() => container.remove(), 400);
                        }
                    }, 3000);
                }
            }
        }, 1000);
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
