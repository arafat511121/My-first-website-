// এই কোডটি কাজ করার জন্য আপনার HTML ফাইলে নিচের আইডি গুলো থাকতে হবে:
// <div id="emailAddress">...</div>
// <div id="inbox">...</div>
// <button id="genBtn">...</button>
// <button id="checkBtn">...</button>

let currentEmail = null;
let login = null;
let domain = null;

// HTML এলিমেন্টগুলো সিলেক্ট করা
const emailDiv = document.getElementById('emailAddress');
const inboxDiv = document.getElementById('inbox');
const genBtn = document.getElementById('genBtn');
const checkBtn = document.getElementById('checkBtn');

// ১. একটি নতুন র্যান্ডম ইমেইল জেনারেট করা
async function generateNewEmail() {
    emailDiv.textContent = '...জেনারেট হচ্ছে...';
    try {
        // 1secmail API থেকে র্যান্ডম মেইলবক্স জেনারেট করার অনুরোধ
        const response = await fetch('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1');
        const data = await response.json();
        
        currentEmail = data[0]; // যেমন: "login@domain.com"
        [login, domain] = currentEmail.split('@'); // ইমেইলকে ইউজারনেম (login) এবং ডোমেইনে ভাগ করা
        
        emailDiv.textContent = currentEmail; // নতুন ইমেইলটি পৃষ্ঠায় দেখানো
        checkBtn.style.display = 'block'; // 'ইনবক্স চেক করুন' বাটনটি দেখানো
        inboxDiv.innerHTML = '<p>ইনবক্স চেক করতে বাটন চাপুন...</p>';
    } catch (error) {
        emailDiv.textContent = 'ত্রুটি হয়েছে। আবার চেষ্টা করুন।';
        console.error('Error generating email:', error);
    }
}

// ২. নির্দিষ্ট ইমেইলের ইনবক্স চেক করা
async function checkInbox() {
    if (!login || !domain) return; // যদি কোনো ইমেইল জেনারেট না হয়ে থাকে, তবে ফাংশনটি থামিয়ে দেওয়া
    
    inboxDiv.innerHTML = '<p>...ইনবক্স লোড হচ্ছে...</p>';
    try {
        // 1secmail API থেকে মেসেজ (ইমেইল) লিস্ট পাওয়ার অনুরোধ
        const response = await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`);
        const data = await response.json();
        
        if (data.length === 0) {
            inboxDiv.innerHTML = '<p>আপনার ইনবক্সে কোনো মেইল নেই।</p>';
        } else {
            inboxDiv.innerHTML = ''; // ইনবক্স ক্লিয়ার করা
            
            // প্রতিটি মেসেজ বা ইমেইল লুপ করে ইনবক্সে দেখানো
            data.forEach(message => {
                const msgDiv = document.createElement('div');
                msgDiv.className = 'message'; // (CSS এ স্টাইল করার জন্য)
                msgDiv.innerHTML = `
                    <strong>From:</strong> ${message.from} <br>
                    <strong>Subject:</strong> ${message.subject} <br>
                    <strong>Date:</strong> ${message.date}
                `;
                inboxDiv.appendChild(msgDiv);
            });
        }
    } catch (error) {
        inboxDiv.innerHTML = '<p>ইনবক্স চেক করতে ত্রুটি হয়েছে।</p>';
        console.error('Error checking inbox:', error);
    }
}

// বাটন ইভেন্ট লিসেনার সেট করা
genBtn.addEventListener('click', generateNewEmail);
checkBtn.addEventListener('click', checkInbox);

// পেজ লোড হলে প্রথমবার একটি ইমেইল জেনারেট করা
generateNewEmail();

// প্রতি ১০ সেকেন্ড (10000 মিলিসেকেন্ড) পর পর অটোমেটিক ইনবক্স চেক করা
setInterval(checkInbox, 10000);
